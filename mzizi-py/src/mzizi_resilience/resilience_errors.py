# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n5-resilience/resilience-errors.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Typed errors and runtime seams shared by every Mzizi resilience module (N5, #472).

Python build of the resilience node. Behaviour is identical to the Rust and TypeScript
builds; the shared fixtures under ``__tests__/fixtures/resilience/`` are the arbiter.

Errors share names and a stable ``code`` (their kebab-name) with the other builds.
``code`` is what health and telemetry record: never an error's message, which can carry
personal data (the N8 covenant).

Time is integer milliseconds. Cores take ``now`` explicitly; async wrappers take an
injected :class:`Clock` and :class:`Sleep` (real ones by default) and, where they draw
randomness, a :class:`Random` (``mulberry32`` in tests and chaos).
"""

from __future__ import annotations

import asyncio
import builtins
import math
import random as _random
import time
from collections.abc import Sequence
from dataclasses import dataclass
from typing import ClassVar, Protocol, runtime_checkable

__all__ = [
    "AllStagesFailedError",
    "BulkheadFullError",
    "BulkheadQueueTimeoutError",
    "ChaosError",
    "ChaosForbiddenError",
    "CircuitOpenError",
    "Clock",
    "MalformedPayloadError",
    "Mulberry32",
    "Random",
    "RateLimitExceededError",
    "ResilienceConfigError",
    "ResilienceError",
    "RetriesExhaustedError",
    "Sleep",
    "StageError",
    "SystemClock",
    "SystemRandom",
    "TimeoutError",
    "VirtualClock",
    "asyncio_sleep",
    "error_code",
    "is_rejection",
    "mulberry32",
    "probability_threshold",
]

U32 = 0xFFFFFFFF
TWO_POW_32 = 4294967296


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class ResilienceError(Exception):
    """Base of every error the resilience modules raise. ``code`` is stable across builds."""

    code: ClassVar[str] = "resilience"


class ResilienceConfigError(ResilienceError, ValueError):
    """A configuration value is out of range. Raised at construction, never later."""

    code: ClassVar[str] = "config"


class TimeoutError(ResilienceError, builtins.TimeoutError):  # noqa: A001 - shared name
    """The deadline passed before the operation finished.

    Also a :class:`builtins.TimeoutError`, so ``except TimeoutError`` catches it whichever
    name is in scope.
    """

    code: ClassVar[str] = "timeout"

    def __init__(self, duration_ms: int, label: str | None = None) -> None:
        self.duration_ms = duration_ms
        self.label = label
        what = f"{label} " if label else ""
        super().__init__(f"{what}timed out after {duration_ms}ms")


class CircuitOpenError(ResilienceError):
    """The circuit is open (or its half-open probes are taken): the call was not made."""

    code: ClassVar[str] = "circuit-open"

    def __init__(self, name: str, retry_after_ms: int) -> None:
        self.name = name
        self.retry_after_ms = retry_after_ms
        super().__init__(f"circuit {name} is open; retry after {retry_after_ms}ms")


class RetriesExhaustedError(ResilienceError):
    """Every attempt failed with a retryable error. ``last_error`` is the final one."""

    code: ClassVar[str] = "retries-exhausted"

    def __init__(self, attempts: int, last_error: BaseException) -> None:
        self.attempts = attempts
        self.last_error = last_error
        super().__init__(f"gave up after {attempts} attempts ({error_code(last_error)})")


class BulkheadFullError(ResilienceError):
    """Every slot and every queue place is taken: the call was not made."""

    code: ClassVar[str] = "bulkhead-full"

    def __init__(self, name: str, concurrent: int, queued: int) -> None:
        self.name = name
        self.concurrent = concurrent
        self.queued = queued
        super().__init__(f"bulkhead {name} is full ({concurrent} running, {queued} queued)")


class BulkheadQueueTimeoutError(ResilienceError):
    """The call waited in the bulkhead's queue for ``max_queue_wait_ms`` and never ran."""

    code: ClassVar[str] = "bulkhead-queue-timeout"

    def __init__(self, name: str, waited_ms: int) -> None:
        self.name = name
        self.waited_ms = waited_ms
        super().__init__(f"bulkhead {name}: no slot after waiting {waited_ms}ms")


class RateLimitExceededError(ResilienceError):
    """No token is available (and queueing is off, or the wait would be too long)."""

    code: ClassVar[str] = "rate-limited"

    def __init__(self, name: str, limit: int, window_ms: int, retry_after_ms: int) -> None:
        self.name = name
        self.limit = limit
        self.window_ms = window_ms
        self.retry_after_ms = retry_after_ms
        super().__init__(
            f"rate limit {name} ({limit} per {window_ms}ms) exceeded; "
            f"retry after {retry_after_ms}ms"
        )


@dataclass(frozen=True)
class StageError:
    """One failed fallback stage: its name and the error's ``code`` (never its message)."""

    stage: str
    code: str


class AllStagesFailedError(ResilienceError):
    """Every stage of a fallback chain failed."""

    code: ClassVar[str] = "all-stages-failed"

    def __init__(self, stage_errors: Sequence[StageError]) -> None:
        self.stage_errors = list(stage_errors)
        summary = ", ".join(f"{e.stage}: {e.code}" for e in self.stage_errors)
        super().__init__(f"all {len(self.stage_errors)} stages failed ({summary})")


class MalformedPayloadError(ResilienceError):
    """A value failed the pipeline's ``validate``: counted as a failure, and retryable."""

    code: ClassVar[str] = "malformed"

    def __init__(self, detail: str = "the value failed validation") -> None:
        super().__init__(detail)


class ChaosError(ResilienceError):
    """A fault injected by chaos testing (N8). ``kind`` names the fault."""

    code: ClassVar[str] = "chaos"

    def __init__(self, kind: str, detail: str | None = None) -> None:
        self.kind = kind
        super().__init__(detail or f"chaos {kind} injected")


class ChaosForbiddenError(ResilienceError):
    """Chaos was enabled in production. There is no override."""

    code: ClassVar[str] = "chaos-forbidden"

    def __init__(self) -> None:
        super().__init__("chaos cannot be enabled in production")


_REJECTIONS = (CircuitOpenError, BulkheadFullError, BulkheadQueueTimeoutError, RateLimitExceededError)


def is_rejection(err: BaseException) -> bool:
    """A rejection: the protection refused the call (circuit open, bulkhead, rate limit).

    Rejections never count as failures of the dependency and are never retried.
    """
    return isinstance(err, _REJECTIONS)


def error_code(err: BaseException) -> str:
    """The stable code to record for ``err``: its ``code`` when it is a string, else its type name.

    Never the message: messages can carry personal data.
    """
    code = getattr(err, "code", None)
    if isinstance(code, str) and code:
        return code
    return type(err).__name__


# ---------------------------------------------------------------------------
# Validation (construction time)
# ---------------------------------------------------------------------------


def _ms(field: str, value: object) -> int:
    """A non-negative, finite, integral number of milliseconds, or ResilienceConfigError."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ResilienceConfigError(f"{field} must be a number of milliseconds")
    if isinstance(value, float) and (not math.isfinite(value) or not value.is_integer()):
        raise ResilienceConfigError(f"{field} must be a finite whole number of milliseconds")
    if value < 0:
        raise ResilienceConfigError(f"{field} must not be negative")
    return int(value)


def _at_least(field: str, value: object, minimum: int) -> int:
    """An integer >= ``minimum``, or ResilienceConfigError."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ResilienceConfigError(f"{field} must be an integer")
    if isinstance(value, float) and (not math.isfinite(value) or not value.is_integer()):
        raise ResilienceConfigError(f"{field} must be a finite integer")
    if value < minimum:
        raise ResilienceConfigError(f"{field} must be at least {minimum}")
    return int(value)


def _rate(field: str, value: object) -> float:
    """A probability in [0, 1], or ResilienceConfigError."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ResilienceConfigError(f"{field} must be a number in [0, 1]")
    if not math.isfinite(value) or value < 0 or value > 1:
        raise ResilienceConfigError(f"{field} must be in [0, 1]")
    return float(value)


def probability_threshold(p: float) -> int | None:
    """``p`` as a u32 threshold ``floor(p * 2**32)``: a draw ``u`` hits when ``u < threshold``.

    ``None`` means "always" (``p >= 1``), the one case a u32 threshold cannot express.
    """
    if p >= 1:
        return None
    return math.floor(p * TWO_POW_32)


# ---------------------------------------------------------------------------
# Runtime seams: clock, sleep, randomness
# ---------------------------------------------------------------------------


@runtime_checkable
class Clock(Protocol):
    """Integer milliseconds since an arbitrary, monotonic epoch."""

    def now_ms(self) -> int: ...


@runtime_checkable
class Sleep(Protocol):
    """Suspend for ``ms`` milliseconds. Cancellable."""

    async def sleep(self, ms: int) -> None: ...


@runtime_checkable
class Random(Protocol):
    """A source of uniformly distributed unsigned 32-bit integers."""

    def next_u32(self) -> int: ...


class SystemClock:
    """The default clock: ``time.monotonic_ns`` in whole milliseconds."""

    def now_ms(self) -> int:
        return time.monotonic_ns() // 1_000_000


class _AsyncioSleep:
    """The default sleep: ``asyncio.sleep``."""

    async def sleep(self, ms: int) -> None:
        await asyncio.sleep(ms / 1000)


asyncio_sleep: Sleep = _AsyncioSleep()


class SystemRandom:
    """Default randomness for production jitter. Tests and chaos use :class:`Mulberry32`."""

    def __init__(self) -> None:
        self._rng = _random.Random()

    def next_u32(self) -> int:
        return self._rng.getrandbits(32)


def _imul32(a: int, b: int) -> int:
    return (a * b) & U32


class Mulberry32:
    """The mulberry32 PRNG, bit-for-bit identical to the Rust and TypeScript builds.

    ``prng.cases.json`` pins its first outputs for several seeds.
    """

    def __init__(self, seed: int = 0) -> None:
        self.state = seed & U32

    def next_u32(self) -> int:
        self.state = (self.state + 0x6D2B79F5) & U32
        t = self.state
        t = _imul32(t ^ (t >> 15), t | 1)
        t = ((t + _imul32(t ^ (t >> 7), t | 61)) & U32) ^ t
        return (t ^ (t >> 14)) & U32


def mulberry32(seed: int = 0) -> Mulberry32:
    """A seeded :class:`Mulberry32`."""
    return Mulberry32(seed)


class VirtualClock:
    """A clock and sleep for tests and simulations: time moves only when told to.

    ``sleep(ms)`` advances the clock by ``ms`` and returns at once (after yielding to the
    event loop), so a test of a two-minute cooldown takes no wall time.
    """

    def __init__(self, start_ms: int = 0) -> None:
        self.now = start_ms

    def now_ms(self) -> int:
        return self.now

    def advance(self, ms: int) -> None:
        self.now += ms

    async def sleep(self, ms: int) -> None:
        self.now += ms
        await asyncio.sleep(0)
