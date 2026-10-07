"""Rate limiter (N5, #472): an integer token bucket.

Python build of the resilience node's ``rate-limiter``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the
arbiter.

The level is an integer in units of ``1 / window_ms`` token: one token is ``window_ms``
units, the capacity is ``(limit + burst_allowance) * window_ms``, and the bucket starts
full. Each millisecond adds ``limit`` units, so the sustained rate is ``limit`` per window
and ``burst_allowance`` only raises the ceiling. Integer arithmetic throughout.

With ``queue_excess``, a call that would wait at most ``max_wait_ms`` reserves its token
(the level may go negative) and waits; otherwise it is rejected with ``retry_after_ms``.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TypeVar

from .resilience_errors import (
    Clock,
    RateLimitExceededError,
    ResilienceConfigError,
    Sleep,
    SystemClock,
    _at_least,
    _ms,
    asyncio_sleep,
)

__all__ = ["RateLimitAcquire", "RateLimiter", "RateLimiterConfig", "RateLimiterCore"]

T = TypeVar("T")


@dataclass(frozen=True)
class RateLimiterConfig:
    """Rate limiter settings. Validated at construction (``ResilienceConfigError``)."""

    name: str = "default"
    limit: int = 100
    window_ms: int = 60_000
    burst_allowance: int = 0
    queue_excess: bool = False
    max_wait_ms: int = 5000

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name:
            raise ResilienceConfigError("name must be a non-empty string")
        object.__setattr__(self, "limit", _at_least("limit", self.limit, 1))
        window = _ms("window_ms", self.window_ms)
        if window < 1:
            raise ResilienceConfigError("window_ms must be at least 1")
        object.__setattr__(self, "window_ms", window)
        object.__setattr__(
            self, "burst_allowance", _at_least("burst_allowance", self.burst_allowance, 0)
        )
        object.__setattr__(self, "max_wait_ms", _ms("max_wait_ms", self.max_wait_ms))
        if not isinstance(self.queue_excess, bool):
            raise ResilienceConfigError("queue_excess must be a boolean")


@dataclass(frozen=True)
class RateLimitAcquire:
    """``ok`` with ``wait_ms`` to sleep first (0 when a token was there), or a rejection."""

    ok: bool
    wait_ms: int = 0
    retry_after_ms: int = 0


class RateLimiterCore:
    """The sans-IO token bucket: pass ``now`` (integer ms) to every call."""

    def __init__(self, config: RateLimiterConfig | None = None) -> None:
        self.config = config if config is not None else RateLimiterConfig()
        self.capacity = (self.config.limit + self.config.burst_allowance) * self.config.window_ms
        self.level = self.capacity
        self._last: int | None = None

    def _refill(self, now: int) -> None:
        if self._last is None:
            self._last = now
            return
        elapsed = now - self._last
        if elapsed > 0:
            self.level = min(self.capacity, self.level + elapsed * self.config.limit)
            self._last = now

    def try_acquire(self, now: int) -> RateLimitAcquire:
        """Take a token at ``now``, reserve one (``queue_excess``), or reject."""
        self._refill(now)
        window = self.config.window_ms
        if self.level >= window:
            self.level -= window
            return RateLimitAcquire(True, 0)
        wait = -(-(window - self.level) // self.config.limit)  # ceil, integers only
        if self.config.queue_excess and wait <= self.config.max_wait_ms:
            self.level -= window
            return RateLimitAcquire(True, wait)
        return RateLimitAcquire(False, retry_after_ms=wait)

    def remaining(self, now: int) -> int:
        """Whole tokens available at ``now``."""
        self._refill(now)
        return max(self.level, 0) // self.config.window_ms


class RateLimiter:
    """The async rate limiter: :meth:`execute` waits for (or is refused) a token."""

    def __init__(
        self,
        config: RateLimiterConfig | None = None,
        *,
        clock: Clock | None = None,
        sleep: Sleep | None = None,
    ) -> None:
        self.core = RateLimiterCore(config)
        self.clock: Clock = clock if clock is not None else SystemClock()
        self.sleep: Sleep = sleep if sleep is not None else asyncio_sleep

    @property
    def config(self) -> RateLimiterConfig:
        return self.core.config

    def remaining(self) -> int:
        return self.core.remaining(self.clock.now_ms())

    async def execute(self, fn: Callable[[], Awaitable[T]]) -> T:
        """Run ``fn()`` once a token is available; raise :class:`RateLimitExceededError` if not."""
        got = self.core.try_acquire(self.clock.now_ms())
        if not got.ok:
            cfg = self.config
            raise RateLimitExceededError(cfg.name, cfg.limit, cfg.window_ms, got.retry_after_ms)
        if got.wait_ms > 0:
            await self.sleep.sleep(got.wait_ms)
        return await fn()
