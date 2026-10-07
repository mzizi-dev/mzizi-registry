"""Retry (N5, #472): try again, with capped exponential backoff and bounded jitter.

Python build of the resilience node's ``retry``; behaviour matches the Rust and TypeScript
builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the arbiter.

The delay before retry ``k`` (``k = 1`` for the first retry) is
``capped = min(base_delay_ms * 2**(k-1), max_delay_ms)``; with ``jitter="half"`` it is
``min(max_delay_ms, capped + next_u32() % (capped // 2 + 1))`` (one draw per retry), with
``jitter="none"`` it is ``capped``. A delay never exceeds ``max_delay_ms``.

A non-retryable error is raised as it is. By default every error is retryable except a
rejection (circuit open, bulkhead, rate limit) and ``ResilienceConfigError``. When every
attempt fails, :class:`RetriesExhaustedError` carries the attempt count and the last error.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Literal, TypeVar

from .resilience_errors import (
    Random,
    ResilienceConfigError,
    RetriesExhaustedError,
    Sleep,
    SystemRandom,
    _at_least,
    _ms,
    asyncio_sleep,
    is_rejection,
)

__all__ = ["Jitter", "RetryConfig", "default_retry_if", "retry", "retry_delay"]

T = TypeVar("T")
Jitter = Literal["none", "half"]


def default_retry_if(err: BaseException, attempt: int) -> bool:
    """Retry anything except a rejection or a configuration error."""
    del attempt
    return not (is_rejection(err) or isinstance(err, ResilienceConfigError))


@dataclass(frozen=True)
class RetryConfig:
    """Retry settings. Validated at construction (``ResilienceConfigError``).

    ``jitter`` also accepts ``True`` / ``False`` (``"half"`` / ``"none"``), as the
    TypeScript build does.
    """

    max_attempts: int = 3
    base_delay_ms: int = 1000
    max_delay_ms: int = 30_000
    jitter: Jitter | bool = "half"
    retry_if: Callable[[BaseException, int], bool] = field(
        default=default_retry_if, compare=False
    )
    on_retry: Callable[[BaseException, int, int], None] | None = field(
        default=None, compare=False
    )

    def __post_init__(self) -> None:
        object.__setattr__(self, "max_attempts", _at_least("max_attempts", self.max_attempts, 1))
        object.__setattr__(self, "base_delay_ms", _ms("base_delay_ms", self.base_delay_ms))
        object.__setattr__(self, "max_delay_ms", _ms("max_delay_ms", self.max_delay_ms))
        jitter = self.jitter
        if jitter is True:
            jitter = "half"
        elif jitter is False:
            jitter = "none"
        if jitter not in ("none", "half"):
            raise ResilienceConfigError('jitter must be "none" or "half"')
        object.__setattr__(self, "jitter", jitter)


def retry_delay(retry_number: int, config: RetryConfig, rng: Random | None = None) -> int:
    """The delay in ms before retry ``retry_number`` (1 for the first retry).

    Draws once from ``rng`` when jitter is ``"half"``, never otherwise.
    """
    exp = config.base_delay_ms * (1 << (retry_number - 1))
    capped = min(exp, config.max_delay_ms)
    if config.jitter == "none":
        return capped
    source = rng if rng is not None else SystemRandom()
    return min(config.max_delay_ms, capped + source.next_u32() % (capped // 2 + 1))


async def retry(
    fn: Callable[[], Awaitable[T]],
    config: RetryConfig | None = None,
    *,
    sleep: Sleep | None = None,
    random: Random | None = None,
) -> T:
    """Await ``fn()`` up to ``config.max_attempts`` times, sleeping between attempts.

    Cancellation (:class:`asyncio.CancelledError`) is never retried: it is not an
    ``Exception``.
    """
    cfg = config if config is not None else RetryConfig()
    sleeper = sleep if sleep is not None else asyncio_sleep
    rng = random if random is not None else SystemRandom()
    attempt = 1
    while True:
        try:
            return await fn()
        except Exception as err:
            if not cfg.retry_if(err, attempt):
                raise
            if attempt >= cfg.max_attempts:
                raise RetriesExhaustedError(attempt, err) from err
            delay = retry_delay(attempt, cfg, rng)
            if cfg.on_retry is not None:
                cfg.on_retry(err, attempt, delay)
            await sleeper.sleep(delay)
            attempt += 1
