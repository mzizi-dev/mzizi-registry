# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n5-resilience/mzizi-resilience.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Mzizi resilience (N5, #472): the composed pipeline and the health monitor.

Python build of the resilience node's ``mzizi-resilience``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the
arbiter (the composed chaos fixture drives this whole pipeline on a virtual clock).

Order, outermost first::

    FallbackChain( Retry( CircuitBreaker( RateLimiter( Timeout( Bulkhead( Chaos( operation )))))))

The primary stage is the whole inner pipeline; later fallback stages run plain (with their
own optional timeout). Retry treats rejections (circuit open, rate limited, bulkhead full)
as non-retryable, so an open circuit goes straight to the fallback. ``validate(value)``
makes a bad value a failure inside the pipeline (:class:`MalformedPayloadError`, code
``malformed``): it counts for the breaker and is retried.

:class:`HealthMonitor` keeps one report per protected section or dependency: ``healthy``
(the primary served), ``degraded`` (a fallback served, or the circuit is not closed),
``error`` (nothing served) or ``loading``. System health is the worst of them
(error > degraded > loading > healthy; no reports is ``loading``). Reports carry error codes,
never messages.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass, field, replace
from typing import Any, Generic, Literal, TypeVar

from .bulkhead import Bulkhead, BulkheadConfig
from .chaos import ChaosConfig, ChaosEngine, apply_fault
from .circuit_breaker import CircuitBreaker, CircuitBreakerConfig, CircuitState
from .fallback_chain import Stage, with_fallback_result
from .rate_limiter import RateLimiter, RateLimiterConfig
from .resilience_errors import (
    AllStagesFailedError,
    Clock,
    MalformedPayloadError,
    Random,
    ResilienceConfigError,
    Sleep,
    SystemClock,
    _ms,
    asyncio_sleep,
    error_code,
)
from .retry import RetryConfig, retry
from .timeout import with_timeout

__all__ = [
    "HealthMonitor",
    "HealthReport",
    "HealthStatus",
    "Resilience",
    "ResilienceConfig",
    "ResilienceResult",
    "Source",
    "health_monitor",
    "system_health",
]

T = TypeVar("T")

HealthStatus = Literal["healthy", "degraded", "error", "loading"]
Source = str  # "primary", a fallback stage's name, or "none"

_SEVERITY: dict[HealthStatus, int] = {"healthy": 0, "loading": 1, "degraded": 2, "error": 3}


@dataclass(frozen=True)
class HealthReport:
    """One section's or dependency's health. ``last_error_code`` is a code, never a message."""

    name: str
    status: HealthStatus
    error_count: int = 0
    last_error_code: str | None = None
    circuit_state: CircuitState = CircuitState.CLOSED
    source: Source = "none"
    updated_at: int = 0

    def to_json(self) -> dict[str, Any]:
        """The report in the shape every build serialises (camelCase keys)."""
        return {
            "name": self.name,
            "status": self.status,
            "errorCount": self.error_count,
            "lastErrorCode": self.last_error_code,
            "circuitState": self.circuit_state.value,
            "source": self.source,
            "updatedAt": self.updated_at,
        }


def system_health(reports: Sequence[HealthReport]) -> HealthStatus:
    """The worst status among ``reports``; ``loading`` when there are none."""
    if not reports:
        return "loading"
    return max((r.status for r in reports), key=lambda s: _SEVERITY[s])


class HealthMonitor:
    """Health reports by name, with change listeners."""

    def __init__(self) -> None:
        self._reports: dict[str, HealthReport] = {}
        self._listeners: list[Callable[[HealthReport], None]] = []

    def report(
        self,
        name: str,
        status: HealthStatus,
        *,
        error_code: str | None = None,
        circuit_state: CircuitState = CircuitState.CLOSED,
        source: Source = "none",
        now: int = 0,
    ) -> HealthReport:
        """Record ``name``'s status. An ``error_code`` adds one to its error count."""
        previous = self._reports.get(name)
        errors = previous.error_count if previous is not None else 0
        last = previous.last_error_code if previous is not None else None
        if error_code is not None:
            errors += 1
            last = error_code
        report = HealthReport(name, status, errors, last, circuit_state, source, now)
        self._reports[name] = report
        for listener in list(self._listeners):
            listener(report)
        return report

    def get(self, name: str) -> HealthReport | None:
        return self._reports.get(name)

    def reports(self) -> list[HealthReport]:
        return list(self._reports.values())

    def system(self) -> HealthStatus:
        return system_health(self.reports())

    def subscribe(self, listener: Callable[[HealthReport], None]) -> Callable[[], None]:
        """Call ``listener`` on every report. Returns the unsubscribe function."""
        self._listeners.append(listener)

        def unsubscribe() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return unsubscribe

    def clear(self) -> None:
        self._reports.clear()


#: A process-wide monitor for hosts that want one (opt in by using it).
health_monitor = HealthMonitor()


@dataclass(frozen=True)
class ResilienceConfig(Generic[T]):
    """The pipeline. Leave a layer out (``None``) to skip it; ``name`` names the health report.

    ``fallbacks`` are tried in order after the primary pipeline fails.
    """

    name: str
    breaker: CircuitBreakerConfig | None = None
    retry: RetryConfig | None = None
    rate_limiter: RateLimiterConfig | None = None
    timeout_ms: int | None = None
    bulkhead: BulkheadConfig | None = None
    chaos: ChaosConfig | ChaosEngine | None = None
    fallbacks: Sequence[Stage[T]] = ()
    validate: Callable[[T], bool] | None = field(default=None, compare=False)

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name:
            raise ResilienceConfigError("name must be a non-empty string")
        if self.timeout_ms is not None:
            object.__setattr__(self, "timeout_ms", _ms("timeout_ms", self.timeout_ms))
        object.__setattr__(self, "fallbacks", tuple(self.fallbacks))
        names = [s.name for s in self.fallbacks]
        if "primary" in names or "none" in names or len(set(names)) != len(names):
            raise ResilienceConfigError(
                'fallback stage names must be unique and not "primary" or "none"'
            )


@dataclass(frozen=True)
class ResilienceResult(Generic[T]):
    """What served the call, how many primary attempts it took, and the health it left."""

    value: T
    source: Source
    attempts: int
    health: HealthReport


class Resilience(Generic[T]):
    """One protected dependency: the composed pipeline plus its health report."""

    def __init__(
        self,
        config: ResilienceConfig[T],
        *,
        clock: Clock | None = None,
        sleep: Sleep | None = None,
        random: Random | None = None,
        monitor: HealthMonitor | None = None,
        breaker: CircuitBreaker | None = None,
    ) -> None:
        self.config = config
        self.clock: Clock = clock if clock is not None else SystemClock()
        self.sleep: Sleep = sleep if sleep is not None else asyncio_sleep
        self.random = random
        self.monitor = monitor if monitor is not None else HealthMonitor()
        if breaker is not None:
            self.breaker: CircuitBreaker | None = breaker
        elif config.breaker is not None:
            breaker_config = config.breaker
            if breaker_config.name == "default":
                breaker_config = replace(breaker_config, name=config.name)
            self.breaker = CircuitBreaker(breaker_config, clock=self.clock)
        else:
            self.breaker = None
        self.limiter = (
            RateLimiter(config.rate_limiter, clock=self.clock, sleep=self.sleep)
            if config.rate_limiter is not None
            else None
        )
        self.bulkhead = (
            Bulkhead(config.bulkhead, sleep=self.sleep) if config.bulkhead is not None else None
        )
        if isinstance(config.chaos, ChaosEngine):
            self.chaos: ChaosEngine | None = config.chaos
        elif config.chaos is not None:
            self.chaos = ChaosEngine(config.chaos, random=None)
        else:
            self.chaos = None
        self.monitor.report(config.name, "loading", now=self.clock.now_ms())

    def circuit_state(self) -> CircuitState:
        return self.breaker.state if self.breaker is not None else CircuitState.CLOSED

    async def _primary(self, operation: Callable[[], Awaitable[T]]) -> T:
        validate = self.config.validate
        chaos = self.chaos

        async def validated() -> T:
            if chaos is None:
                value = await operation()
            else:
                value = await apply_fault(
                    chaos.decide(), operation, sleep=self.sleep, mutate=chaos.config.mutate
                )
            if validate is not None and not validate(value):
                raise MalformedPayloadError()
            return value

        layer: Callable[[], Awaitable[T]] = validated
        if self.bulkhead is not None:
            layer = _bind(self.bulkhead.execute, layer)
        if self.config.timeout_ms is not None:
            ms, inner = self.config.timeout_ms, layer

            def timed() -> Awaitable[T]:
                return with_timeout(inner, ms, label=self.config.name, sleep=self.sleep)

            layer = timed
        if self.limiter is not None:
            layer = _bind(self.limiter.execute, layer)
        if self.breaker is not None:
            layer = _bind(self.breaker.execute, layer)
        return await layer()

    async def execute(self, operation: Callable[[], Awaitable[T]]) -> ResilienceResult[T]:
        """Run ``operation`` through the pipeline. Raises :class:`AllStagesFailedError` when nothing served."""
        attempts = 0

        async def attempt() -> T:
            nonlocal attempts
            attempts += 1
            return await self._primary(operation)

        retry_config = self.config.retry

        primary_error: str | None = None

        async def primary() -> T:
            nonlocal primary_error
            try:
                if retry_config is None:
                    return await attempt()
                return await retry(attempt, retry_config, sleep=self.sleep, random=self.random)
            except Exception as err:
                primary_error = error_code(err)
                raise

        stages: list[Stage[T]] = [Stage("primary", primary), *self.config.fallbacks]
        try:
            served = await with_fallback_result(stages, sleep=self.sleep)
        except AllStagesFailedError as err:
            first = err.stage_errors[0].code if err.stage_errors else err.code
            self.monitor.report(
                self.config.name,
                "error",
                error_code=first,
                circuit_state=self.circuit_state(),
                source="none",
                now=self.clock.now_ms(),
            )
            raise
        state = self.circuit_state()
        healthy = served.index == 0 and state is CircuitState.CLOSED
        report = self.monitor.report(
            self.config.name,
            "healthy" if healthy else "degraded",
            error_code=primary_error,
            circuit_state=state,
            source=served.stage,
            now=self.clock.now_ms(),
        )
        return ResilienceResult(served.value, served.stage, attempts, report)


def _bind(
    wrapper: Callable[[Callable[[], Awaitable[T]]], Awaitable[T]],
    inner: Callable[[], Awaitable[T]],
) -> Callable[[], Awaitable[T]]:
    def call() -> Awaitable[T]:
        return wrapper(inner)

    return call

