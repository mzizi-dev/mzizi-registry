# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n5-resilience/fallback-chain.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Fallback chain (N5, #472): try stages in order; the first success wins.

Python build of the resilience node's ``fallback-chain``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the
arbiter.

:func:`with_fallback_result` reports which stage served (``stage``, ``index``), which is how
health tells "served by the primary" from "degraded". When every stage fails,
:class:`AllStagesFailedError` lists each stage with its error ``code``, never the message.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass
from typing import Generic, TypeVar

from .resilience_errors import (
    AllStagesFailedError,
    ResilienceConfigError,
    Sleep,
    StageError,
    _ms,
    error_code,
)
from .timeout import with_timeout

__all__ = ["FallbackResult", "Stage", "with_fallback", "with_fallback_result"]

T = TypeVar("T")


@dataclass(frozen=True)
class Stage(Generic[T]):
    """One way to get the value. ``timeout_ms`` bounds this stage alone."""

    name: str
    execute: Callable[[], Awaitable[T]]
    timeout_ms: int | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name:
            raise ResilienceConfigError("a stage needs a non-empty name")
        if self.timeout_ms is not None:
            object.__setattr__(self, "timeout_ms", _ms("timeout_ms", self.timeout_ms))


@dataclass(frozen=True)
class FallbackResult(Generic[T]):
    """The value and the stage that served it."""

    value: T
    stage: str
    index: int


async def with_fallback_result(
    stages: Sequence[Stage[T]], *, sleep: Sleep | None = None
) -> FallbackResult[T]:
    """Run the stages in order and return the first success with the stage that served it.

    ``sleep`` drives the stages' timeouts on simulated time (see ``with_timeout``).
    """
    if len(stages) == 0:
        raise ResilienceConfigError("a fallback chain needs at least one stage")
    failures: list[StageError] = []
    for index, stage in enumerate(stages):
        try:
            if stage.timeout_ms is None:
                value = await stage.execute()
            else:
                value = await with_timeout(
                    stage.execute, stage.timeout_ms, label=stage.name, sleep=sleep
                )
        except Exception as err:
            failures.append(StageError(stage.name, error_code(err)))
            continue
        return FallbackResult(value, stage.name, index)
    raise AllStagesFailedError(failures)


async def with_fallback(stages: Sequence[Stage[T]], *, sleep: Sleep | None = None) -> T:
    """Run the stages in order and return the first success's value."""
    return (await with_fallback_result(stages, sleep=sleep)).value
