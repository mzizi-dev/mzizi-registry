"""Bulkhead (N5, #472): cap how many calls run at once, with a bounded FIFO queue.

Python build of the resilience node's ``bulkhead``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the
arbiter.

The sans-IO :class:`BulkheadCore` admits, queues or rejects; :meth:`BulkheadCore.release`
hands the freed slot to the oldest queued ticket. A queued call whose wait runs out is
removed and gets :class:`BulkheadQueueTimeoutError` (distinct from
:class:`BulkheadFullError`, the answer when slots and queue are both full).
"""

from __future__ import annotations

import asyncio
from collections import deque
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Literal, TypeVar

from .resilience_errors import (
    BulkheadFullError,
    BulkheadQueueTimeoutError,
    ResilienceConfigError,
    Sleep,
    _at_least,
    _ms,
    asyncio_sleep,
)

__all__ = [
    "Bulkhead",
    "BulkheadConfig",
    "BulkheadCore",
    "BulkheadMetrics",
    "Entry",
]

T = TypeVar("T")


@dataclass(frozen=True)
class BulkheadConfig:
    """Bulkhead settings. Validated at construction (``ResilienceConfigError``)."""

    name: str = "default"
    max_concurrent: int = 10
    max_queue: int = 0
    max_queue_wait_ms: int = 5000

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name:
            raise ResilienceConfigError("name must be a non-empty string")
        object.__setattr__(
            self, "max_concurrent", _at_least("max_concurrent", self.max_concurrent, 1)
        )
        object.__setattr__(self, "max_queue", _at_least("max_queue", self.max_queue, 0))
        object.__setattr__(
            self, "max_queue_wait_ms", _ms("max_queue_wait_ms", self.max_queue_wait_ms)
        )


@dataclass(frozen=True)
class Entry:
    """The answer to :meth:`BulkheadCore.try_enter`. ``ticket`` is set when ``queued``."""

    outcome: Literal["admitted", "queued", "rejected"]
    ticket: int | None = None


@dataclass(frozen=True)
class BulkheadMetrics:
    """Counts only; utilisation is the caller's to compute (``max_concurrent`` is never 0)."""

    concurrent: int
    queued: int
    max_concurrent: int
    max_queue: int


class BulkheadCore:
    """The sans-IO bulkhead: slots, a FIFO queue of tickets, and nothing that waits."""

    def __init__(self, config: BulkheadConfig | None = None) -> None:
        self.config = config if config is not None else BulkheadConfig()
        self.concurrent = 0
        self._queue: deque[int] = deque()
        self._next_ticket = 1

    @property
    def queued(self) -> int:
        return len(self._queue)

    def try_enter(self) -> Entry:
        """Take a slot, join the queue, or be rejected."""
        if self.concurrent < self.config.max_concurrent:
            self.concurrent += 1
            return Entry("admitted")
        if len(self._queue) < self.config.max_queue:
            ticket = self._next_ticket
            self._next_ticket += 1
            self._queue.append(ticket)
            return Entry("queued", ticket)
        return Entry("rejected")

    def release(self) -> int | None:
        """Give a slot back. Returns the ticket now admitted (counted active), if any."""
        if self._queue:
            return self._queue.popleft()  # the slot passes straight to the next ticket
        if self.concurrent > 0:
            self.concurrent -= 1
        return None

    def expire(self, ticket: int) -> bool:
        """The ticket's queue wait ran out. ``False`` if it was already admitted."""
        try:
            self._queue.remove(ticket)
        except ValueError:
            return False
        return True

    def metrics(self) -> BulkheadMetrics:
        return BulkheadMetrics(
            self.concurrent, len(self._queue), self.config.max_concurrent, self.config.max_queue
        )


class Bulkhead:
    """The async bulkhead: :meth:`execute` runs ``fn()`` in a slot, waiting in the queue if allowed."""

    def __init__(self, config: BulkheadConfig | None = None, *, sleep: Sleep | None = None) -> None:
        self.core = BulkheadCore(config)
        self.sleep: Sleep = sleep if sleep is not None else asyncio_sleep
        self._waiters: dict[int, asyncio.Future[None]] = {}

    @property
    def config(self) -> BulkheadConfig:
        return self.core.config

    def metrics(self) -> BulkheadMetrics:
        return self.core.metrics()

    def _release(self) -> None:
        ticket = self.core.release()
        if ticket is not None:
            waiter = self._waiters.pop(ticket, None)
            if waiter is not None and not waiter.done():
                waiter.set_result(None)

    async def _wait_for_slot(self, ticket: int) -> None:
        loop = asyncio.get_running_loop()
        admitted: asyncio.Future[None] = loop.create_future()
        self._waiters[ticket] = admitted
        timer = asyncio.ensure_future(self.sleep.sleep(self.config.max_queue_wait_ms))
        try:
            await asyncio.wait({admitted, timer}, return_when=asyncio.FIRST_COMPLETED)
        except BaseException:
            # Cancelled while queued: leave the queue, or pass on a slot already handed over.
            timer.cancel()
            self._waiters.pop(ticket, None)
            if not self.core.expire(ticket):
                self._release()
            raise
        timer.cancel()
        if admitted.done():
            return
        self._waiters.pop(ticket, None)
        if self.core.expire(ticket):
            raise BulkheadQueueTimeoutError(self.config.name, self.config.max_queue_wait_ms)
        # Admitted in the same instant the wait ran out: the slot is ours.

    async def execute(self, fn: Callable[[], Awaitable[T]]) -> T:
        """Run ``fn()`` within the concurrency cap."""
        entry = self.core.try_enter()
        if entry.outcome == "rejected":
            raise BulkheadFullError(self.config.name, self.core.concurrent, self.core.queued)
        if entry.outcome == "queued":
            assert entry.ticket is not None
            await self._wait_for_slot(entry.ticket)
        try:
            return await fn()
        finally:
            self._release()
