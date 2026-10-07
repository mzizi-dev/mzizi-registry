"""Circuit breaker (N5, #472): stop calling a dependency that keeps failing.

Python build of the resilience node's ``circuit-breaker`` (Resilience4j-style; the core is
harvested from mukoko-weather's ``weather-core/src/breaker.rs`` and its Python breaker).
Behaviour matches the Rust and TypeScript builds; the shared fixtures under
``__tests__/fixtures/resilience/`` are the arbiter.

Two layers:

- :class:`CircuitBreakerCore` is sans-IO: every method takes ``now`` (integer ms), nothing
  sleeps, reads a clock or logs. It is the state machine the fixtures drive.
- :class:`CircuitBreaker` wraps it for ``async`` code with an injected clock.

State machine:

- CLOSED: calls go through. A failure is recorded; failures older than ``window_ms`` are
  dropped; at ``failure_threshold`` failures the circuit opens.
- OPEN: calls are rejected with ``retry_after_ms``. Once ``cooldown_ms`` has passed, the
  next observation reports HALF_OPEN.
- HALF_OPEN: up to ``half_open_max_calls`` probes go through. A success closes the circuit,
  a failure opens it again.
- An outcome reported while OPEN (a call admitted before the circuit opened) is ignored.

Breaker state can live at module level so it survives warm starts of a serverless
function (the idea mukoko-weather's breaker proved): that is opt-in, through
:func:`get_breaker`, never hidden global state.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import TypeVar

from .resilience_errors import (
    CircuitOpenError,
    Clock,
    ResilienceConfigError,
    SystemClock,
    _at_least,
    _ms,
    is_rejection,
)

__all__ = [
    "Acquire",
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitBreakerCore",
    "CircuitState",
    "Transition",
    "breakers",
    "get_breaker",
    "reset_breakers",
]

T = TypeVar("T")


class CircuitState(str, Enum):
    """The three states. Serialised as ``closed``, ``open`` and ``half_open``."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

    def __str__(self) -> str:
        return self.value


def _default_is_failure(err: BaseException) -> bool:
    return not is_rejection(err)


@dataclass(frozen=True)
class CircuitBreakerConfig:
    """Breaker settings. Validated at construction (``ResilienceConfigError``).

    ``is_failure(err)`` decides whether an error counts against the dependency; by default
    every error except a rejection (circuit open, bulkhead, rate limit) does. An error that
    does not count is reported as a success: the dependency answered.
    """

    name: str = "default"
    failure_threshold: int = 3
    window_ms: int = 60_000
    cooldown_ms: int = 30_000
    half_open_max_calls: int = 1
    is_failure: Callable[[BaseException], bool] = field(default=_default_is_failure, compare=False)

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name:
            raise ResilienceConfigError("name must be a non-empty string")
        object.__setattr__(
            self, "failure_threshold", _at_least("failure_threshold", self.failure_threshold, 1)
        )
        object.__setattr__(self, "window_ms", _ms("window_ms", self.window_ms))
        object.__setattr__(self, "cooldown_ms", _ms("cooldown_ms", self.cooldown_ms))
        object.__setattr__(
            self,
            "half_open_max_calls",
            _at_least("half_open_max_calls", self.half_open_max_calls, 1),
        )


@dataclass(frozen=True)
class Transition:
    """A state change, recorded when it is first observed (``at`` is that ``now``)."""

    from_state: CircuitState
    to_state: CircuitState
    at: int


@dataclass(frozen=True)
class Acquire:
    """The answer to :meth:`CircuitBreakerCore.try_acquire`."""

    ok: bool
    retry_after_ms: int = 0


class CircuitBreakerCore:
    """The sans-IO breaker: pass ``now`` (integer ms) to every call."""

    def __init__(self, config: CircuitBreakerConfig | None = None) -> None:
        self.config = config if config is not None else CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failures: list[int] = []
        self._opened_at = 0
        self._probes = 0
        self.transitions: list[Transition] = []

    def _move(self, to: CircuitState, now: int) -> None:
        if to is self._state:
            return
        self.transitions.append(Transition(self._state, to, now))
        self._state = to

    def state(self, now: int) -> CircuitState:
        """The state at ``now``. An open circuit whose cooldown has passed becomes half-open here."""
        if (
            self._state is CircuitState.OPEN
            and now - self._opened_at >= self.config.cooldown_ms
        ):
            self._probes = 0
            self._move(CircuitState.HALF_OPEN, now)
        return self._state

    def try_acquire(self, now: int) -> Acquire:
        """May a call go through at ``now``? A half-open admission takes a probe slot."""
        state = self.state(now)
        if state is CircuitState.CLOSED:
            return Acquire(True)
        if state is CircuitState.OPEN:
            return Acquire(False, self.config.cooldown_ms - (now - self._opened_at))
        if self._probes < self.config.half_open_max_calls:
            self._probes += 1
            return Acquire(True)
        return Acquire(False, 0)

    def on_success(self, now: int) -> None:
        """Report a success. Closes a half-open circuit; ignored while open."""
        if self.state(now) is CircuitState.HALF_OPEN:
            self._failures.clear()
            self._probes = 0
            self._move(CircuitState.CLOSED, now)

    def on_failure(self, now: int) -> None:
        """Report a failure. May open the circuit; ignored while open."""
        state = self.state(now)
        if state is CircuitState.OPEN:
            return
        if state is CircuitState.HALF_OPEN:
            self._open(now)
            return
        window = self.config.window_ms
        self._failures = [t for t in self._failures if now - t < window]
        self._failures.append(now)
        if len(self._failures) >= self.config.failure_threshold:
            self._open(now)

    def on_cancelled(self, now: int) -> None:
        """A call admitted at ``now`` was cancelled before it had an outcome.

        Python-specific (``asyncio.CancelledError`` is neither success nor failure): a
        half-open probe gives its slot back, so a cancelled probe cannot hold the circuit
        half-open for ever.
        """
        if self.state(now) is CircuitState.HALF_OPEN and self._probes > 0:
            self._probes -= 1

    def _open(self, now: int) -> None:
        self._opened_at = now
        self._failures.clear()
        self._probes = 0
        self._move(CircuitState.OPEN, now)

    def failure_count(self, now: int) -> int:
        """Failures recorded within the window ending at ``now``."""
        return sum(1 for t in self._failures if now - t < self.config.window_ms)

    def reset(self) -> None:
        """Back to CLOSED with no failures (manual recovery). Not recorded as a transition."""
        self._state = CircuitState.CLOSED
        self._failures.clear()
        self._opened_at = 0
        self._probes = 0


class CircuitBreaker:
    """The async breaker: :meth:`execute` runs a coroutine through a :class:`CircuitBreakerCore`."""

    def __init__(
        self,
        config: CircuitBreakerConfig | None = None,
        *,
        clock: Clock | None = None,
    ) -> None:
        self.core = CircuitBreakerCore(config)
        self.clock: Clock = clock if clock is not None else SystemClock()

    @property
    def config(self) -> CircuitBreakerConfig:
        return self.core.config

    @property
    def name(self) -> str:
        return self.core.config.name

    @property
    def state(self) -> CircuitState:
        return self.core.state(self.clock.now_ms())

    @property
    def transitions(self) -> list[Transition]:
        return self.core.transitions

    def failure_count(self) -> int:
        return self.core.failure_count(self.clock.now_ms())

    def reset(self) -> None:
        self.core.reset()

    async def execute(self, fn: Callable[[], Awaitable[T]]) -> T:
        """Run ``fn()`` if the circuit allows it, and report the outcome.

        Raises :class:`CircuitOpenError` without calling ``fn`` when the circuit is open.
        """
        admitted = self.core.try_acquire(self.clock.now_ms())
        if not admitted.ok:
            raise CircuitOpenError(self.name, admitted.retry_after_ms)
        try:
            result = await fn()
        except asyncio.CancelledError:
            self.core.on_cancelled(self.clock.now_ms())
            raise
        except Exception as err:
            if self.config.is_failure(err):
                self.core.on_failure(self.clock.now_ms())
            else:
                self.core.on_success(self.clock.now_ms())
            raise
        self.core.on_success(self.clock.now_ms())
        return result


# ---------------------------------------------------------------------------
# Opt-in module-level registry (survives warm starts)
# ---------------------------------------------------------------------------

_BREAKERS: dict[str, CircuitBreaker] = {}


def get_breaker(
    name: str,
    config: CircuitBreakerConfig | None = None,
    *,
    clock: Clock | None = None,
) -> CircuitBreaker:
    """The process-wide breaker called ``name``, created on first use.

    Module-level state outlives one request: on a serverless platform that reuses a warm
    process, a dependency that failed a minute ago is still known to be failing. Opt in by
    calling this; a :class:`CircuitBreaker` you construct yourself is never shared.

    Asking again with a different ``config`` raises ``ResilienceConfigError``: two callers
    disagreeing about one dependency's thresholds is a bug.
    """
    existing = _BREAKERS.get(name)
    if existing is not None:
        if config is not None and config != existing.config:
            raise ResilienceConfigError(
                f"breaker {name} already exists with a different configuration"
            )
        return existing
    if config is None:
        config = CircuitBreakerConfig(name=name)
    elif config.name != name:
        raise ResilienceConfigError(f"config.name {config.name!r} does not match {name!r}")
    breaker = CircuitBreaker(config, clock=clock)
    _BREAKERS[name] = breaker
    return breaker


def breakers() -> dict[str, CircuitBreaker]:
    """A snapshot of the registered breakers, by name (for health pages)."""
    return dict(_BREAKERS)


def reset_breakers() -> None:
    """Forget every registered breaker (tests, or a deliberate full recovery)."""
    _BREAKERS.clear()
