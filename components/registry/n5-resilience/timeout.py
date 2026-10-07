"""Timeout (N5, #472): run an operation under a deadline.

Python build of the resilience node's ``timeout``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are
the arbiter.

The operation is cancelled when the deadline passes (``asyncio.timeout`` by default), and
:class:`~mzizi_resilience.resilience_errors.TimeoutError` is raised with the duration and
the label. The deadline is always cleared, also when the operation raises at once.

Simulation rule (the fixtures): an operation of duration ``d`` under timeout ``t`` times out
iff ``d >= t``; the clock then advances by ``t``, else by ``d``.
"""

from __future__ import annotations

import asyncio
import builtins
from collections.abc import Awaitable, Callable
from typing import TypeVar

from .resilience_errors import Sleep, TimeoutError, _ms

__all__ = ["simulate_timeout", "with_timeout"]

T = TypeVar("T")


async def with_timeout(
    fn: Callable[[], Awaitable[T]],
    ms: int,
    *,
    label: str | None = None,
    sleep: Sleep | None = None,
) -> T:
    """Await ``fn()``; cancel it and raise ``TimeoutError(ms, label)`` if ``ms`` passes first.

    ``sleep`` is the deadline's timer. Leave it out for real time (``asyncio.timeout``); pass a
    virtual one (for example :class:`~mzizi_resilience.resilience_errors.VirtualClock`) to run
    the deadline on simulated time. Either way the operation's task is cancelled at the
    deadline, so it must not swallow :class:`asyncio.CancelledError`.
    """
    duration = _ms("ms", ms)
    if sleep is None:
        deadline = asyncio.timeout(duration / 1000)
        try:
            async with deadline:
                return await fn()
        except builtins.TimeoutError:
            if deadline.expired():
                raise TimeoutError(duration, label) from None
            raise
    return await _race(fn, duration, label, sleep)


async def _race(
    fn: Callable[[], Awaitable[T]], duration: int, label: str | None, sleep: Sleep
) -> T:
    async def run() -> T:
        return await fn()

    work: asyncio.Task[T] = asyncio.ensure_future(run())
    timer: asyncio.Task[None] = asyncio.ensure_future(sleep.sleep(duration))
    try:
        await asyncio.wait({work, timer}, return_when=asyncio.FIRST_COMPLETED)
    except BaseException:
        work.cancel()
        timer.cancel()
        raise
    if work.done():
        timer.cancel()
        return work.result()
    work.cancel()
    # Wait for the cancellation to land (asyncio.wait never raises the work's own error, and
    # still propagates a cancellation of this task), then mark the outcome retrieved.
    await asyncio.wait({work})
    if not work.cancelled():
        work.exception()
    raise TimeoutError(duration, label)


def simulate_timeout(duration_ms: int, timeout_ms: int) -> tuple[bool, int]:
    """The fixtures' rule: ``(timed_out, elapsed_ms)`` for an operation of ``duration_ms``."""
    if duration_ms >= timeout_ms:
        return True, timeout_ms
    return False, duration_ms
