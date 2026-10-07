"""Python-specific behaviour the shared fixtures cannot express.

Real asyncio timers, cancellation, the async wrappers' bookkeeping, configuration
validation, the opt-in breaker registry, the production guard and log redaction. The
language-neutral behaviour is in ``test_fixtures.py``.
"""

from __future__ import annotations

import asyncio
import builtins
import functools
import itertools
import logging
from collections.abc import Awaitable, Callable
from typing import Any

import pytest

import mzizi_resilience as mr


def state(breaker: mr.CircuitBreaker) -> mr.CircuitState:
    """Read the state through a call, so mypy does not narrow it between observations."""
    return breaker.state


def run(coro: Awaitable[Any]) -> Any:
    async def main() -> Any:
        return await coro

    return asyncio.run(main())


async def ok(value: Any = "ok") -> Any:
    return value


def failing(err: BaseException) -> Callable[[], Awaitable[Any]]:
    async def fn() -> Any:
        raise err

    return fn


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


def test_error_codes_are_the_kebab_names() -> None:
    assert mr.TimeoutError(5).code == "timeout"
    assert mr.CircuitOpenError("x", 1).code == "circuit-open"
    assert mr.RetriesExhaustedError(3, ValueError()).code == "retries-exhausted"
    assert mr.BulkheadFullError("x", 1, 0).code == "bulkhead-full"
    assert mr.BulkheadQueueTimeoutError("x", 1).code == "bulkhead-queue-timeout"
    assert mr.RateLimitExceededError("x", 1, 1, 1).code == "rate-limited"
    assert mr.AllStagesFailedError([]).code == "all-stages-failed"
    assert mr.ChaosError("drop").code == "chaos"
    assert mr.ChaosForbiddenError().code == "chaos-forbidden"
    assert mr.ResilienceConfigError("x").code == "config"
    assert mr.MalformedPayloadError().code == "malformed"


def test_config_error_is_a_value_error_and_timeout_a_builtin_timeout() -> None:
    assert issubclass(mr.ResilienceConfigError, ValueError)
    assert issubclass(mr.TimeoutError, builtins.TimeoutError)


def test_rejections() -> None:
    assert mr.is_rejection(mr.CircuitOpenError("x", 0))
    assert mr.is_rejection(mr.RateLimitExceededError("x", 1, 1, 0))
    assert mr.is_rejection(mr.BulkheadFullError("x", 1, 0))
    assert mr.is_rejection(mr.BulkheadQueueTimeoutError("x", 0))
    assert not mr.is_rejection(mr.TimeoutError(1))
    assert not mr.is_rejection(ValueError())


def test_error_code_never_uses_the_message() -> None:
    assert mr.error_code(ValueError("alice@example.com")) == "ValueError"
    assert mr.error_code(mr.TimeoutError(10, "secret-label")) == "timeout"


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "build",
    [
        lambda: mr.CircuitBreakerConfig(failure_threshold=0),
        lambda: mr.CircuitBreakerConfig(window_ms=-1),
        lambda: mr.CircuitBreakerConfig(cooldown_ms=1.5),  # type: ignore[arg-type]
        lambda: mr.CircuitBreakerConfig(cooldown_ms=float("inf")),  # type: ignore[arg-type]
        lambda: mr.CircuitBreakerConfig(half_open_max_calls=0),
        lambda: mr.CircuitBreakerConfig(name=""),
        lambda: mr.RetryConfig(max_attempts=0),
        lambda: mr.RetryConfig(base_delay_ms=float("nan")),  # type: ignore[arg-type]
        lambda: mr.RetryConfig(jitter="full"),  # type: ignore[arg-type]
        lambda: mr.RateLimiterConfig(limit=0),
        lambda: mr.RateLimiterConfig(window_ms=0),
        lambda: mr.RateLimiterConfig(burst_allowance=-1),
        lambda: mr.BulkheadConfig(max_concurrent=0),
        lambda: mr.BulkheadConfig(max_queue=-1),
        lambda: mr.BulkheadConfig(max_queue_wait_ms=True),
        lambda: mr.ChaosEngine(mr.ChaosConfig(faults=[mr.FaultSpec("error", 1.5)])),
        lambda: mr.ChaosEngine(mr.ChaosConfig(faults=[mr.FaultSpec("latency", 0.5, 10, 5)])),
        lambda: mr.ChaosEngine(mr.ChaosConfig(seed=-1)),
        lambda: mr.Stage("", ok),
    ],
)
def test_invalid_configuration_raises_at_construction(build: Callable[[], object]) -> None:
    with pytest.raises(mr.ResilienceConfigError):
        build()


def test_retry_accepts_boolean_jitter() -> None:
    assert mr.RetryConfig(jitter=True).jitter == "half"
    assert mr.RetryConfig(jitter=False).jitter == "none"


def test_empty_fallback_chain_is_a_config_error() -> None:
    with pytest.raises(mr.ResilienceConfigError):
        run(mr.with_fallback([]))


# ---------------------------------------------------------------------------
# Timeout: real asyncio timers and cancellation
# ---------------------------------------------------------------------------


def test_timeout_cancels_the_operation_on_real_time() -> None:
    cancelled = asyncio.Event()

    async def slow() -> str:
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            cancelled.set()
            raise
        return "late"

    async def main() -> None:
        with pytest.raises(mr.TimeoutError) as info:
            await mr.with_timeout(slow, 20, label="slow")
        assert info.value.duration_ms == 20
        assert info.value.label == "slow"
        assert cancelled.is_set()

    asyncio.run(main())


def test_timeout_passes_results_and_errors_through() -> None:
    assert run(mr.with_timeout(lambda: ok(7), 1000)) == 7
    with pytest.raises(KeyError):
        run(mr.with_timeout(failing(KeyError("k")), 1000))


def test_a_timeout_error_raised_by_the_operation_is_not_ours() -> None:
    with pytest.raises(builtins.TimeoutError) as info:
        run(mr.with_timeout(failing(builtins.TimeoutError("inner")), 1000))
    assert not isinstance(info.value, mr.TimeoutError)


def test_timeout_on_a_virtual_clock_cancels_a_hang() -> None:
    clock = mr.VirtualClock()

    async def hang() -> None:
        await asyncio.get_running_loop().create_future()

    async def main() -> None:
        with pytest.raises(mr.TimeoutError):
            await mr.with_timeout(hang, 5000, sleep=clock)
        assert clock.now == 5000

    asyncio.run(main())


def test_outer_cancellation_propagates_through_timeout() -> None:
    async def main() -> None:
        task = asyncio.ensure_future(mr.with_timeout(lambda: asyncio.sleep(10), 5000))
        await asyncio.sleep(0.01)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(main())


def test_timeout_validates_ms() -> None:
    with pytest.raises(mr.ResilienceConfigError):
        run(mr.with_timeout(ok, -1))


# ---------------------------------------------------------------------------
# Circuit breaker
# ---------------------------------------------------------------------------


def test_breaker_opens_rejects_and_recovers_on_a_virtual_clock() -> None:
    clock = mr.VirtualClock()
    breaker = mr.CircuitBreaker(
        mr.CircuitBreakerConfig(name="dep", failure_threshold=2, cooldown_ms=1000), clock=clock
    )

    async def main() -> None:
        for _ in range(2):
            with pytest.raises(RuntimeError):
                await breaker.execute(failing(RuntimeError()))
        assert state(breaker) is mr.CircuitState.OPEN
        called = False

        async def probe() -> str:
            nonlocal called
            called = True
            return "up"

        with pytest.raises(mr.CircuitOpenError) as info:
            await breaker.execute(probe)
        assert not called
        assert info.value.retry_after_ms == 1000
        clock.advance(1000)
        assert await breaker.execute(probe) == "up"
        assert state(breaker) is mr.CircuitState.CLOSED

    asyncio.run(main())


def test_rejections_do_not_count_against_the_breaker() -> None:
    breaker = mr.CircuitBreaker(mr.CircuitBreakerConfig(failure_threshold=1), clock=mr.VirtualClock())

    async def main() -> None:
        with pytest.raises(mr.RateLimitExceededError):
            await breaker.execute(failing(mr.RateLimitExceededError("x", 1, 1, 1)))
        assert state(breaker) is mr.CircuitState.CLOSED

    asyncio.run(main())


def test_a_cancelled_half_open_probe_gives_its_slot_back() -> None:
    clock = mr.VirtualClock()
    breaker = mr.CircuitBreaker(
        mr.CircuitBreakerConfig(failure_threshold=1, cooldown_ms=10), clock=clock
    )

    async def main() -> None:
        with pytest.raises(RuntimeError):
            await breaker.execute(failing(RuntimeError()))
        clock.advance(10)
        task = asyncio.ensure_future(breaker.execute(lambda: asyncio.sleep(10)))
        await asyncio.sleep(0)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert state(breaker) is mr.CircuitState.HALF_OPEN
        assert await breaker.execute(ok) == "ok"
        assert state(breaker) is mr.CircuitState.CLOSED

    asyncio.run(main())


def test_get_breaker_is_an_opt_in_shared_registry() -> None:
    mr.reset_breakers()
    try:
        a = mr.get_breaker("tomorrow", mr.CircuitBreakerConfig(name="tomorrow", failure_threshold=3))
        assert mr.get_breaker("tomorrow") is a
        assert mr.get_breaker("tomorrow", a.config) is a
        assert mr.breakers() == {"tomorrow": a}
        with pytest.raises(mr.ResilienceConfigError):
            mr.get_breaker("tomorrow", mr.CircuitBreakerConfig(name="tomorrow", failure_threshold=5))
        with pytest.raises(mr.ResilienceConfigError):
            mr.get_breaker("other", mr.CircuitBreakerConfig(name="mismatch"))
        # A breaker constructed directly is never shared.
        assert mr.CircuitBreaker(mr.CircuitBreakerConfig(name="tomorrow")) is not a
    finally:
        mr.reset_breakers()
    assert mr.breakers() == {}


# ---------------------------------------------------------------------------
# Retry
# ---------------------------------------------------------------------------


def test_retry_never_retries_cancellation() -> None:
    calls = 0

    async def fn() -> None:
        nonlocal calls
        calls += 1
        raise asyncio.CancelledError

    with pytest.raises(asyncio.CancelledError):
        run(mr.retry(fn, mr.RetryConfig(max_attempts=5, jitter="none"), sleep=mr.VirtualClock()))
    assert calls == 1


def test_retry_exhausted_keeps_the_last_error_and_chains_it() -> None:
    clock = mr.VirtualClock()
    delays: list[int] = []
    cfg = mr.RetryConfig(
        max_attempts=3,
        base_delay_ms=100,
        jitter="none",
        on_retry=lambda _e, _a, d: delays.append(d),
    )
    with pytest.raises(mr.RetriesExhaustedError) as info:
        run(mr.retry(failing(OSError("boom")), cfg, sleep=clock))
    assert info.value.attempts == 3
    assert isinstance(info.value.last_error, OSError)
    assert info.value.__cause__ is info.value.last_error
    assert delays == [100, 200]
    assert clock.now == 300


def test_retry_rethrows_rejections_as_they_are() -> None:
    err = mr.CircuitOpenError("x", 5)
    with pytest.raises(mr.CircuitOpenError):
        run(mr.retry(failing(err), mr.RetryConfig(max_attempts=3), sleep=mr.VirtualClock()))


def test_jitter_never_exceeds_max_delay() -> None:
    cfg = mr.RetryConfig(base_delay_ms=1000, max_delay_ms=1200, jitter="half")
    rng = mr.mulberry32(7)
    for k in range(1, 12):
        assert mr.retry_delay(k, cfg, rng) <= 1200


# ---------------------------------------------------------------------------
# Bulkhead: real concurrency
# ---------------------------------------------------------------------------


def test_bulkhead_caps_concurrency_and_queues_fifo() -> None:
    bulkhead = mr.Bulkhead(mr.BulkheadConfig(name="db", max_concurrent=2, max_queue=2))
    order: list[int] = []
    running = 0
    peak = 0

    async def job(i: int) -> int:
        nonlocal running, peak
        running += 1
        peak = max(peak, running)
        order.append(i)
        await asyncio.sleep(0.01)
        running -= 1
        return i

    async def main() -> None:
        tasks = [asyncio.ensure_future(bulkhead.execute(functools.partial(job, i))) for i in range(4)]
        await asyncio.sleep(0)
        with pytest.raises(mr.BulkheadFullError) as info:
            await bulkhead.execute(lambda: job(99))
        assert (info.value.concurrent, info.value.queued) == (2, 2)
        assert await asyncio.gather(*tasks) == [0, 1, 2, 3]
        assert bulkhead.metrics() == mr.BulkheadMetrics(0, 0, 2, 2)

    asyncio.run(main())
    assert peak == 2
    assert order == [0, 1, 2, 3]


def test_bulkhead_queue_wait_expires_with_its_own_error() -> None:
    bulkhead = mr.Bulkhead(
        mr.BulkheadConfig(max_concurrent=1, max_queue=1, max_queue_wait_ms=20)
    )

    async def main() -> None:
        first = asyncio.ensure_future(bulkhead.execute(lambda: asyncio.sleep(0.2)))
        await asyncio.sleep(0)
        with pytest.raises(mr.BulkheadQueueTimeoutError):
            await bulkhead.execute(ok)
        assert bulkhead.metrics().queued == 0
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first
        assert bulkhead.metrics().concurrent == 0

    asyncio.run(main())


def test_a_cancelled_queued_call_leaves_the_queue() -> None:
    bulkhead = mr.Bulkhead(mr.BulkheadConfig(max_concurrent=1, max_queue=1))

    async def main() -> None:
        gate = asyncio.Event()
        first = asyncio.ensure_future(bulkhead.execute(gate.wait))
        await asyncio.sleep(0)
        queued = asyncio.ensure_future(bulkhead.execute(ok))
        await asyncio.sleep(0)
        assert bulkhead.metrics().queued == 1
        queued.cancel()
        with pytest.raises(asyncio.CancelledError):
            await queued
        assert bulkhead.metrics().queued == 0
        gate.set()
        await first
        assert bulkhead.metrics().concurrent == 0

    asyncio.run(main())


# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------


def test_rate_limiter_queues_within_max_wait_on_a_virtual_clock() -> None:
    clock = mr.VirtualClock()
    config = mr.RateLimiterConfig(
        name="api", limit=1, window_ms=1000, queue_excess=True, max_wait_ms=1500
    )
    limiter = mr.RateLimiter(config, clock=clock, sleep=clock)

    async def main() -> None:
        assert await limiter.execute(ok) == "ok"
        assert await limiter.execute(ok) == "ok"  # waited for the refill
        assert clock.now == 1000

    asyncio.run(main())

    core = mr.RateLimiterCore(config)
    assert core.try_acquire(0) == mr.RateLimitAcquire(True, 0)
    assert core.try_acquire(0) == mr.RateLimitAcquire(True, 1000)  # reserved
    assert core.try_acquire(0) == mr.RateLimitAcquire(False, retry_after_ms=2000)

    rejecting = mr.RateLimiter(mr.RateLimiterConfig(limit=1, window_ms=1000), clock=clock)

    async def refused() -> None:
        await rejecting.execute(ok)
        with pytest.raises(mr.RateLimitExceededError) as info:
            await rejecting.execute(ok)
        assert info.value.retry_after_ms == 1000

    asyncio.run(refused())


# ---------------------------------------------------------------------------
# Chaos: production guard, applying faults
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("var", ["MZIZI_ENV", "ENVIRONMENT", "ENV"])
@pytest.mark.parametrize("value", ["production", "prod", "PRODUCTION", " Prod "])
def test_chaos_is_forbidden_in_production(
    monkeypatch: pytest.MonkeyPatch, var: str, value: str
) -> None:
    monkeypatch.setenv(var, value)
    assert mr.is_production_environment()
    always = [mr.FaultSpec("error", 1)]
    with pytest.raises(mr.ChaosForbiddenError):
        mr.create_chaos(mr.ChaosConfig(enabled=True, faults=always))
    # No override: an explicit non-production environment does not lift the guard.
    with pytest.raises(mr.ChaosForbiddenError):
        mr.ChaosEngine(mr.ChaosConfig(enabled=True, environment="development"))
    # The wrappers: with_chaos raises without calling fn; middleware and wrap at creation.
    called = False

    async def fn() -> str:
        nonlocal called
        called = True
        return "ran"

    with pytest.raises(mr.ChaosForbiddenError):
        run(mr.with_chaos(fn, mr.ChaosConfig(enabled=True, faults=always)))
    assert not called
    with pytest.raises(mr.ChaosForbiddenError):
        mr.chaos_middleware(mr.ChaosConfig(enabled=True))
    with pytest.raises(mr.ChaosForbiddenError):
        mr.chaos_wrap(fn, mr.ChaosConfig(enabled=True))
    # Disabled chaos is allowed and inert in production.
    assert mr.create_chaos(mr.ChaosConfig(enabled=False, faults=always)).decide() is None
    assert run(mr.with_chaos(fn, mr.ChaosConfig(enabled=False, faults=always))) == "ran"


def test_chaos_entry_points_are_a_pass_through_once_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    engine = mr.create_chaos(mr.ChaosConfig(enabled=True, faults=[mr.FaultSpec("error", 1)]))
    with pytest.raises(mr.ChaosError) as info:
        run(mr.with_chaos(ok, engine))
    assert info.value.injected is True
    assert info.value.chaos_type == "error"
    monkeypatch.setenv("MZIZI_ENV", "production")
    assert engine.decide() is None
    assert run(mr.with_chaos(ok, engine)) == "ok"


def test_a_seeded_middleware_replays_one_sequence() -> None:
    config = mr.ChaosConfig(enabled=True, seed=3, faults=[mr.FaultSpec("error", 0.5)])
    middleware = mr.chaos_middleware(config)

    async def outcomes() -> list[str]:
        out = []
        for _ in range(6):
            try:
                out.append(await middleware(ok))
            except mr.ChaosError:
                out.append("error")
        return out

    # chaos.cases.json: seed 3, error 50% → [none, error, error, error, none, error]
    assert run(outcomes()) == ["ok", "error", "error", "error", "ok", "error"]


def test_an_unseeded_wrapper_draws_a_random_seed() -> None:
    config = mr.ChaosConfig(enabled=True, faults=[mr.FaultSpec("error", 0.5)])
    wrapped = mr.chaos_wrap(lambda v: ok(v), config)
    for _ in range(4):
        try:
            assert run(wrapped("v")) == "v"
        except mr.ChaosError:
            pass


def test_chaos_hang_is_cancelled_by_a_timeout() -> None:
    engine = mr.create_chaos(mr.ChaosConfig(enabled=True, faults=[mr.FaultSpec("timeout", 1)]))
    with pytest.raises(mr.TimeoutError):
        run(mr.with_timeout(lambda: mr.with_chaos(ok, engine), 20))


def test_latency_waits_on_the_injected_sleep() -> None:
    clock = mr.VirtualClock()
    engine = mr.create_chaos(
        mr.ChaosConfig(enabled=True, schedule=[mr.Fault("latency", 250)], faults=[])
    )
    assert run(mr.with_chaos(ok, engine, sleep=clock)) == "ok"
    assert clock.now == 250


def test_apply_fault() -> None:
    assert run(mr.apply_fault(None, ok)) == "ok"
    for kind in ("error", "drop"):
        with pytest.raises(mr.ChaosError) as info:
            run(mr.apply_fault(mr.Fault(kind), ok))
        assert info.value.kind == kind
    assert run(mr.apply_fault(mr.Fault("truncate"), lambda: ok("abcdef"))) == "abc"
    assert run(mr.apply_fault(mr.Fault("truncate"), lambda: ok(b"abcde"))) == b"ab"
    with pytest.raises(mr.ChaosError) as info:
        run(mr.apply_fault(mr.Fault("truncate"), lambda: ok({"a": 1})))
    assert info.value.kind == "truncate"
    mutated = run(
        mr.apply_fault(mr.Fault("truncate"), lambda: ok({"a": 1}), mutate=lambda v, k: {"k": k})
    )
    assert mutated == {"k": "truncate"}
    assert run(mr.apply_fault(mr.Fault("malformed"), lambda: ok("x"))) == mr.MALFORMED_MARKER
    assert run(mr.apply_fault(mr.Fault("malformed"), lambda: ok("x"), mutate=lambda v, k: k)) == (
        "malformed"
    )


def test_disabled_chaos_draws_nothing() -> None:
    rng = mr.mulberry32(1)
    engine = mr.ChaosEngine(mr.ChaosConfig(faults=[mr.FaultSpec("error", 1)]), random=rng)
    assert engine.decide() is None
    assert engine.invocations == 0
    assert rng.state == 1


# ---------------------------------------------------------------------------
# Observability (Python-specific: logging integration, Python values)
# ---------------------------------------------------------------------------


def test_logging_sink_uses_the_mzizi_prefix(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.DEBUG, logger="mzizi")
    mr.create_logger("registry").info("served", data={"name": "button", "token": "t"})
    mr.log.warn("bare")
    first, second = caplog.records
    assert first.name == "mzizi.registry"
    assert first.getMessage() == '[mzizi:registry] INFO served {"name":"button","token":"[redacted]"}'
    assert getattr(first, "mzizi_event")["module"] == "registry"
    assert (second.name, second.levelno, second.getMessage()) == (
        "mzizi",
        logging.WARNING,
        "[mzizi] WARN bare",
    )


def test_sinks_are_resolved_at_emit_time_and_min_level_applies() -> None:
    logger = mr.create_logger("late")
    sink = mr.memory_sink()
    mr.configure_observability(sinks=[sink], now=lambda: 0, min_level="info")
    logger.debug("dropped")
    logger.warn("seen")
    remove = mr.add_sink(lambda _e: None)
    remove()
    assert [e["msg"] for e in sink.events] == ["seen"]


def test_a_broken_sink_never_breaks_the_caller_or_starves_the_others() -> None:
    def broken(_event: mr.LogEvent) -> None:
        raise RuntimeError("sink down")

    sink = mr.memory_sink()
    mr.configure_observability(sinks=[broken, sink])
    mr.create_logger("x").error("still fine")
    assert len(sink.events) == 1


def test_redact_python_values() -> None:
    import datetime as dt
    from dataclasses import dataclass

    @dataclass
    class Point:
        x: int

    cyclic: dict[str, Any] = {"a": 1}
    cyclic["self"] = cyclic
    out = mr.redact(
        {
            "when": dt.datetime(2025, 10, 7, tzinfo=dt.timezone.utc),
            "point": Point(1),
            "fn": len,
            "items": (1, print, float("nan")),
            "cyclic": cyclic,
            7: "int key",
        }
    )
    assert out == {
        "when": "2025-10-07T00:00:00.000Z",
        "point": "[Point]",
        "items": [1, None, None],
        "cyclic": {"a": 1, "self": "[circular]"},
        "7": "int key",
    }


def test_track_error_logs_the_name_and_code_not_the_message() -> None:
    sink = mr.memory_sink()
    mr.configure_observability(sinks=[sink])
    mr.track_error(ValueError("alice@example.com"), module="c")
    mr.track_error(mr.TimeoutError(5))
    assert [e["msg"] for e in sink.events] == ["ValueError", "TimeoutError (timeout)"]
    assert "alice" not in repr(sink.events)


def test_measure_logs_duration_and_reraises() -> None:
    sink = mr.memory_sink()
    ticks = itertools.count(0, 5)  # every clock read (start, end, the event's ts) moves 5ms
    mr.configure_observability(sinks=[sink], now=lambda: next(ticks))
    assert run(mr.measure("sync", lambda: 3)) == 3
    with pytest.raises(KeyError):
        run(mr.measure("boom", failing(KeyError("secret"))))
    assert [(e["level"], e["msg"], e["module"]) for e in sink.events] == [
        ("info", "sync completed in 5ms", "perf"),
        ("error", "boom failed after 5ms", "perf"),
    ]
    assert sink.events[1]["data"] == {"duration": 5, "label": "boom", "error": {"name": "KeyError"}}


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------


def test_open_circuit_short_circuits_to_the_fallback_and_health_degrades() -> None:
    clock = mr.VirtualClock()
    monitor = mr.HealthMonitor()

    async def cached() -> str:
        return "cached"

    pipeline: mr.Resilience[str] = mr.Resilience(
        mr.ResilienceConfig(
            name="weather",
            breaker=mr.CircuitBreakerConfig(failure_threshold=1, cooldown_ms=1000),
            retry=mr.RetryConfig(max_attempts=3, base_delay_ms=10, jitter="none"),
            fallbacks=[mr.Stage("cache", cached)],
        ),
        clock=clock,
        sleep=clock,
        monitor=monitor,
    )

    async def main() -> None:
        first = await pipeline.execute(failing(OSError()))
        # One attempt failed and opened the circuit; the retry's second attempt was rejected
        # (non-retryable), so the fallback served.
        assert (first.source, first.attempts, first.value) == ("cache", 2, "cached")
        assert first.health.status == "degraded"
        assert first.health.circuit_state is mr.CircuitState.OPEN
        assert monitor.system() == "degraded"
        clock.advance(1000)
        second = await pipeline.execute(lambda: ok("fresh"))
        assert (second.source, second.value, second.health.status) == ("primary", "fresh", "healthy")
        assert monitor.system() == "healthy"

    asyncio.run(main())


def test_validate_makes_a_bad_value_a_retryable_failure() -> None:
    clock = mr.VirtualClock()
    values = iter(["", "good"])

    async def fetch() -> str:
        return next(values)

    pipeline: mr.Resilience[str] = mr.Resilience(
        mr.ResilienceConfig(
            name="feed",
            retry=mr.RetryConfig(max_attempts=2, base_delay_ms=1, jitter="none"),
            validate=bool,
        ),
        clock=clock,
        sleep=clock,
    )
    result = run(pipeline.execute(fetch))
    assert (result.value, result.attempts) == ("good", 2)


def test_nothing_served_is_error_health() -> None:
    clock = mr.VirtualClock()
    pipeline: mr.Resilience[str] = mr.Resilience(
        mr.ResilienceConfig(name="dep"), clock=clock, sleep=clock
    )
    with pytest.raises(mr.AllStagesFailedError) as info:
        run(pipeline.execute(failing(OSError("private detail"))))
    assert info.value.stage_errors == [mr.StageError("primary", "OSError")]
    report = pipeline.monitor.get("dep")
    assert report is not None
    assert report.to_json() == {
        "name": "dep",
        "status": "error",
        "errorCount": 1,
        "lastErrorCode": "OSError",
        "circuitState": "closed",
        "source": "none",
        "updatedAt": 0,
    }


def test_system_health_is_the_worst() -> None:
    def report(status: mr.HealthStatus) -> mr.HealthReport:
        return mr.HealthReport("x", status)

    assert mr.system_health([]) == "loading"
    assert mr.system_health([report("healthy"), report("loading")]) == "loading"
    assert mr.system_health([report("healthy"), report("degraded"), report("loading")]) == "degraded"
    assert mr.system_health([report("error"), report("degraded")]) == "error"
