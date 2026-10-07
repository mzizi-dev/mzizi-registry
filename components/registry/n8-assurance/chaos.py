"""Chaos (N8 assurance, #472): seeded, scheduled fault injection for resilience tests.

Python build of the assurance node's ``chaos``; behaviour matches the Rust and TypeScript
builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the arbiter.

Faults: ``error``, ``latency`` (``min_ms``..``max_ms``), ``timeout`` (hangs until
cancelled), ``drop`` (connection dropped), ``truncate`` (strings, bytes and sequences cut to
half their length) and ``malformed`` (the result replaced by :data:`MALFORMED_MARKER`, or a
``mutate`` hook's output).

Every decision is deterministic: an explicit ``schedule`` is consumed first (entry ``i`` is
the fault for invocation ``i``; ``None`` is no fault), then one ``mulberry32`` draw ``u``
walks the faults' cumulative thresholds ``floor(cum_rate * 2**32)`` and the first with
``u < threshold`` wins. A latency fault takes a second draw:
``ms = min_ms + next_u32() % (max_ms - min_ms + 1)``.

PRODUCTION GUARD (hard): enabling chaos in production raises :class:`ChaosForbiddenError`
at construction, and every entry point is a pass-through there. Production is
``MZIZI_ENV``, ``ENVIRONMENT`` or ``ENV`` set to ``production`` or ``prod``, or
``environment="production"`` passed in. There is no override.
"""

from __future__ import annotations

import asyncio
import math
import os
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass, field
from typing import Any, Literal, ParamSpec, TypeVar, cast

from .resilience_errors import (
    ChaosError,
    ChaosForbiddenError,
    Mulberry32,
    Random,
    ResilienceConfigError,
    Sleep,
    _ms,
    _rate,
    asyncio_sleep,
    probability_threshold,
)

__all__ = [
    "MALFORMED_MARKER",
    "ChaosConfig",
    "ChaosDecision",
    "ChaosEngine",
    "ChaosError",
    "ChaosForbiddenError",
    "Fault",
    "FaultKind",
    "chaos_middleware",
    "chaos_wrap",
    "create_chaos",
    "is_production_environment",
    "with_chaos",
]

T = TypeVar("T")
P = ParamSpec("P")

FaultKind = Literal["error", "latency", "timeout", "drop", "truncate", "malformed"]
_KINDS: frozenset[str] = frozenset(("error", "latency", "timeout", "drop", "truncate", "malformed"))

#: What a ``malformed`` fault returns when it has no ``mutate`` hook: a JSON document cut off.
MALFORMED_MARKER = '{"mzizi-chaos":'

_PRODUCTION = frozenset(("production", "prod"))
_ENV_VARS = ("MZIZI_ENV", "ENVIRONMENT", "ENV")


def is_production_environment(environment: str | None = None) -> bool:
    """Production when ``environment`` says so, or ``MZIZI_ENV`` / ``ENVIRONMENT`` / ``ENV`` do.

    An explicit non-production ``environment`` does not override a production variable: there
    is no way to turn the guard off.
    """
    if environment is not None and environment.strip().lower() in _PRODUCTION:
        return True
    return any(os.environ.get(name, "").strip().lower() in _PRODUCTION for name in _ENV_VARS)


@dataclass(frozen=True)
class Fault:
    """One fault and the share of invocations it hits (``rate`` in [0, 1])."""

    kind: FaultKind
    rate: float = 0.0
    min_ms: int = 0
    max_ms: int = 0
    mutate: Callable[[Any], Any] | None = field(default=None, compare=False)

    def __post_init__(self) -> None:
        if self.kind not in _KINDS:
            raise ResilienceConfigError(f"unknown chaos fault kind {self.kind!r}")
        object.__setattr__(self, "rate", _rate(f"{self.kind}.rate", self.rate))
        lo = _ms(f"{self.kind}.min_ms", self.min_ms)
        hi = _ms(f"{self.kind}.max_ms", self.max_ms)
        if lo > hi:
            raise ResilienceConfigError(f"{self.kind}.min_ms must not exceed max_ms")
        object.__setattr__(self, "min_ms", lo)
        object.__setattr__(self, "max_ms", hi)


@dataclass(frozen=True)
class ChaosDecision:
    """The fault for one invocation. ``ms`` is the latency to add (``latency`` only)."""

    fault: Fault
    ms: int = 0

    @property
    def kind(self) -> FaultKind:
        return self.fault.kind


@dataclass(frozen=True)
class ChaosConfig:
    """Chaos settings. Validated at construction (``ResilienceConfigError``).

    The older ``error_rate`` + ``latency_ms`` form still works when ``faults`` is empty: it
    becomes ``[Fault("error", error_rate), Fault("latency", 1 - error_rate, *latency_ms)]``,
    which is the old behaviour (latency on every call that did not error).
    """

    enabled: bool = False
    seed: int = 0
    faults: Sequence[Fault] = ()
    schedule: Sequence[Fault | None] | None = None
    error_rate: float | None = None
    latency_ms: tuple[int, int] | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.enabled, bool):
            raise ResilienceConfigError("enabled must be a boolean")
        if (
            isinstance(self.seed, bool)
            or not isinstance(self.seed, int)
            or not 0 <= self.seed <= 0xFFFFFFFF
        ):
            raise ResilienceConfigError("seed must be an unsigned 32-bit integer")
        faults = tuple(self.faults)
        if not faults and (self.error_rate is not None or self.latency_ms is not None):
            error_rate = _rate("error_rate", 0.3 if self.error_rate is None else self.error_rate)
            lo, hi = self.latency_ms if self.latency_ms is not None else (100, 500)
            faults = (
                Fault("error", error_rate),
                Fault("latency", 1 - error_rate, lo, hi),
            )
        total = math.fsum(f.rate for f in faults)
        if total > 1 + 1e-12:
            raise ResilienceConfigError("fault rates must not sum to more than 1")
        object.__setattr__(self, "faults", faults)
        if self.schedule is not None:
            object.__setattr__(self, "schedule", tuple(self.schedule))


class ChaosEngine:
    """Decides, invocation by invocation, which fault (if any) to inject."""

    def __init__(
        self,
        config: ChaosConfig | None = None,
        *,
        random: Random | None = None,
        environment: str | None = None,
    ) -> None:
        self.config = config if config is not None else ChaosConfig()
        self.environment = environment
        if self.config.enabled and is_production_environment(environment):
            raise ChaosForbiddenError()
        self.random: Random = random if random is not None else Mulberry32(self.config.seed)
        self.invocation = 0
        self._thresholds: list[tuple[Fault, int | None]] = []
        cumulative = 0.0
        for fault in self.config.faults:
            cumulative += fault.rate
            self._thresholds.append((fault, probability_threshold(cumulative)))

    @property
    def active(self) -> bool:
        """Enabled, and not in production (re-checked on every call)."""
        return self.config.enabled and not is_production_environment(self.environment)

    def _latency(self, fault: Fault) -> int:
        span = fault.max_ms - fault.min_ms + 1
        return fault.min_ms + self.random.next_u32() % span

    def decide(self) -> ChaosDecision | None:
        """The fault for the next invocation, or ``None``. Draws nothing when inactive."""
        if not self.active:
            return None
        i = self.invocation
        self.invocation += 1
        schedule = self.config.schedule
        if schedule is not None and i < len(schedule):
            scheduled = schedule[i]
            if scheduled is None:
                return None
            ms = self._latency(scheduled) if scheduled.kind == "latency" else 0
            return ChaosDecision(scheduled, ms)
        if not self._thresholds:
            return None
        u = self.random.next_u32()
        for fault, threshold in self._thresholds:
            if threshold is None or u < threshold:
                ms = self._latency(fault) if fault.kind == "latency" else 0
                return ChaosDecision(fault, ms)
        return None

    async def run(self, fn: Callable[[], Awaitable[T]], *, sleep: Sleep | None = None) -> T:
        """Await ``fn()`` with this invocation's fault applied."""
        decision = self.decide()
        if decision is None:
            return await fn()
        kind = decision.kind
        if kind == "error":
            raise ChaosError("error")
        if kind == "drop":
            raise ChaosError("drop", "chaos: connection dropped")
        if kind == "timeout":
            # Hang until cancelled (a timeout around this call does that).
            await asyncio.get_running_loop().create_future()
            raise AssertionError("unreachable")  # pragma: no cover
        if kind == "latency":
            await (sleep if sleep is not None else asyncio_sleep).sleep(decision.ms)
            return await fn()
        result = await fn()
        mutate = decision.fault.mutate
        if kind == "malformed":
            return cast(T, mutate(result) if mutate is not None else MALFORMED_MARKER)
        # truncate
        if isinstance(result, (str, bytes, bytearray, list, tuple)):
            return cast(T, result[: len(result) // 2])
        if mutate is not None:
            return cast(T, mutate(result))
        raise ChaosError("truncate", "chaos: result truncated")


def create_chaos(
    config: ChaosConfig | None = None,
    *,
    random: Random | None = None,
    environment: str | None = None,
) -> ChaosEngine:
    """A :class:`ChaosEngine`. Raises :class:`ChaosForbiddenError` if enabled in production."""
    return ChaosEngine(config, random=random, environment=environment)


def _engine(chaos: ChaosEngine | ChaosConfig | None) -> ChaosEngine:
    return chaos if isinstance(chaos, ChaosEngine) else ChaosEngine(chaos)


async def with_chaos(
    fn: Callable[[], Awaitable[T]],
    chaos: ChaosEngine | ChaosConfig | None = None,
    *,
    sleep: Sleep | None = None,
) -> T:
    """Await ``fn()`` with chaos. A pass-through when chaos is disabled or in production.

    Pass a :class:`ChaosEngine` to keep one seeded sequence across calls; a
    :class:`ChaosConfig` starts a fresh engine (and so a fresh sequence) per call.
    """
    return await _engine(chaos).run(fn, sleep=sleep)


def chaos_middleware(
    chaos: ChaosEngine | ChaosConfig | None = None, *, sleep: Sleep | None = None
) -> Callable[[Callable[[], Awaitable[T]]], Awaitable[T]]:
    """A function that applies one engine's chaos to each operation it is given."""
    engine = _engine(chaos)

    def apply(fn: Callable[[], Awaitable[T]]) -> Awaitable[T]:
        return engine.run(fn, sleep=sleep)

    return apply


def chaos_wrap(
    fn: Callable[P, Awaitable[T]],
    chaos: ChaosEngine | ChaosConfig | None = None,
    *,
    sleep: Sleep | None = None,
) -> Callable[P, Awaitable[T]]:
    """``fn`` with chaos injected on every call, same signature."""
    engine = _engine(chaos)

    async def wrapped(*args: P.args, **kwargs: P.kwargs) -> T:
        return await engine.run(lambda: fn(*args, **kwargs), sleep=sleep)

    return wrapped
