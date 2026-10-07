# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n8-assurance/chaos.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Chaos (N8 assurance, #472): seeded, scheduled fault injection that cannot run in production.

Python build of the assurance node's ``chaos``, held to ``contracts/lib/chaos.contract.json``
and to ``__tests__/fixtures/resilience/chaos.cases.json`` with the TypeScript and Rust builds:
the same configuration gives the same decisions in every build.

:class:`ChaosEngine` decides, per invocation, whether an operation gets a fault and which:
``error``, ``latency``, ``timeout`` (hangs until cancelled), ``drop``, ``truncate`` or
``malformed``. A remaining ``schedule`` entry wins (and draws nothing); otherwise one
``mulberry32`` draw ``u`` walks the faults' cumulative thresholds ``floor(cum_rate * 2**32)``
(a cumulative rate of 1 always fires) and the first with ``u < threshold`` wins. A latency
fault draws once more: ``ms = min_ms + next_u32() % (max_ms - min_ms + 1)``. No fault, no
second draw. A disabled engine decides ``None`` without drawing.

THE PRODUCTION GUARD IS HARD. Enabling chaos in production raises
:class:`ChaosForbiddenError` when the engine (or a wrapper's engine) is built, before the
rest of the configuration is read, and :meth:`ChaosEngine.decide` re-checks on every call.
Production is ``MZIZI_ENV``, ``ENVIRONMENT`` or ``ENV`` set to ``production`` or ``prod``
(any case), or ``environment="production"`` / ``"prod"`` passed in. An explicit
non-production ``environment`` does not override the variables: there is no override.

Kept from the n2 TypeScript version: ``with_chaos``, ``chaos_middleware``, ``chaos_wrap``,
:class:`ChaosError`, and the ``error_rate`` / ``latency_ms`` configuration, which maps to
``[FaultSpec("error", error_rate), FaultSpec("latency", 1 - error_rate, min_ms, max_ms)]``.
"""

from __future__ import annotations

import asyncio
import math
import os
import random as _random
import weakref
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass
from typing import Any, Literal, ParamSpec, Protocol, TypeVar, cast

from .observability import create_logger
from .resilience_errors import (
    ChaosError,
    ChaosForbiddenError,
    Mulberry32,
    Random,
    ResilienceConfigError,
    Sleep,
    asyncio_sleep,
)

__all__ = [
    "LEGACY_ERROR_RATE",
    "LEGACY_LATENCY_MS",
    "MALFORMED_MARKER",
    "ChaosConfig",
    "ChaosEngine",
    "ChaosMutate",
    "Fault",
    "FaultInjector",
    "FaultKind",
    "FaultSpec",
    "apply_fault",
    "chaos_middleware",
    "chaos_wrap",
    "create_chaos",
    "is_production_environment",
    "resolve_faults",
    "truncate_value",
    "validate_chaos_config",
    "with_chaos",
]

T = TypeVar("T")
P = ParamSpec("P")

FaultKind = Literal["error", "latency", "timeout", "drop", "truncate", "malformed"]
_KINDS: tuple[str, ...] = ("error", "latency", "timeout", "drop", "truncate", "malformed")

#: What a ``malformed`` fault returns when there is no ``mutate`` hook: a JSON document cut off.
MALFORMED_MARKER = '{"mzizi-chaos":'

#: The n2 defaults, used when ``faults`` is not given.
LEGACY_ERROR_RATE = 0.3
LEGACY_LATENCY_MS = (100, 500)

_TWO_POW_32 = 4294967296
_PRODUCTION = frozenset(("production", "prod"))
_ENV_VARS = ("MZIZI_ENV", "ENVIRONMENT", "ENV")

_logger = create_logger("chaos")


def is_production_environment(environment: str | None = None) -> bool:
    """Production when ``environment`` says so, or ``MZIZI_ENV`` / ``ENVIRONMENT`` / ``ENV`` do.

    ``production`` or ``prod``, any case. An explicit non-production ``environment`` does not
    override a production variable.
    """
    if environment is not None and environment.strip().lower() in _PRODUCTION:
        return True
    return any(os.environ.get(name, "").strip().lower() in _PRODUCTION for name in _ENV_VARS)


@dataclass(frozen=True)
class Fault:
    """One decision: the fault to inject. ``ms`` is set for ``latency`` only."""

    kind: FaultKind
    ms: int | None = None

    def to_json(self) -> dict[str, Any]:
        """``{"kind": …}``, plus ``"ms"`` for latency: the shape the fixtures use."""
        return {"kind": self.kind} if self.ms is None else {"kind": self.kind, "ms": self.ms}


@dataclass(frozen=True)
class FaultSpec:
    """A fault and how often it fires. ``min_ms`` / ``max_ms`` are for ``latency`` only."""

    kind: FaultKind
    rate: float
    min_ms: int = 0
    max_ms: int = 0


class FaultInjector(Protocol):
    """Anything that decides, per invocation, whether to inject a fault."""

    def decide(self) -> Fault | None: ...


ChaosMutate = Callable[[Any, Literal["truncate", "malformed"]], Any]


@dataclass(eq=False)
class ChaosConfig:
    """Chaos settings. Validated when an engine is built (``ResilienceConfigError``).

    ``faults=None`` means the n2 mapping of ``error_rate`` / ``latency_ms`` (defaults 0.3 and
    ``(100, 500)``); giving ``faults`` together with either is a configuration error.
    ``seed=None`` is 0 for an engine and a random seed for the n2 wrappers.
    """

    enabled: bool = False
    seed: int | None = None
    faults: Sequence[FaultSpec] | None = None
    schedule: Sequence[Fault | None] | None = None
    environment: str | None = None
    mutate: ChaosMutate | None = None
    error_rate: float | None = None
    latency_ms: tuple[int, int] | None = None


def _is_ms(value: object) -> bool:
    if isinstance(value, bool):
        return False
    if isinstance(value, float):
        return math.isfinite(value) and value.is_integer() and value >= 0
    return isinstance(value, int) and value >= 0


def _is_rate(value: object) -> bool:
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float))
        and math.isfinite(value)
        and 0 <= value <= 1
    )


def resolve_faults(config: ChaosConfig) -> list[FaultSpec]:
    """The faults a configuration means: ``faults`` as given, or the n2 mapping."""
    if config.faults is not None:
        return list(config.faults)
    error_rate = LEGACY_ERROR_RATE if config.error_rate is None else config.error_rate
    lo, hi = LEGACY_LATENCY_MS if config.latency_ms is None else config.latency_ms
    return [FaultSpec("error", error_rate), FaultSpec("latency", 1 - error_rate, lo, hi)]


def _validate_fault(fault: object, where: str) -> None:
    if fault is None:
        return
    if not isinstance(fault, Fault) or fault.kind not in _KINDS:
        raise ResilienceConfigError(f"{where}: unknown fault kind")
    if fault.kind == "latency" and not _is_ms(fault.ms):
        raise ResilienceConfigError(f"{where}: latency ms must be a non-negative integer")


def validate_chaos_config(config: ChaosConfig) -> None:
    """Raise ``ResilienceConfigError`` naming the first problem in ``config``."""
    seed = config.seed
    if seed is not None and (
        isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed < _TWO_POW_32
    ):
        raise ResilienceConfigError("seed must be an unsigned 32-bit integer")
    if config.faults is not None and (
        config.error_rate is not None or config.latency_ms is not None
    ):
        raise ResilienceConfigError("give faults, or error_rate/latency_ms, not both")
    if config.faults is None and config.error_rate is not None and not _is_rate(config.error_rate):
        raise ResilienceConfigError("error_rate must be in [0, 1]")
    total = 0.0
    for i, fault in enumerate(resolve_faults(config)):
        if not isinstance(fault, FaultSpec) or fault.kind not in _KINDS:
            raise ResilienceConfigError(f"faults[{i}]: unknown fault kind")
        if not _is_rate(fault.rate):
            raise ResilienceConfigError(f"faults[{i}]: rate must be in [0, 1]")
        if fault.kind == "latency":
            if not _is_ms(fault.min_ms) or not _is_ms(fault.max_ms):
                raise ResilienceConfigError(
                    f"faults[{i}]: min_ms and max_ms must be non-negative integers"
                )
            if fault.min_ms > fault.max_ms:
                raise ResilienceConfigError(f"faults[{i}]: min_ms is above max_ms")
        total += fault.rate
    if total > 1 + 1e-9:
        raise ResilienceConfigError("fault rates sum to more than 1")
    for i, entry in enumerate(config.schedule or ()):
        _validate_fault(entry, f"schedule[{i}]")


def _threshold(p: float) -> int:
    """``floor(p * 2**32)``, capped at ``2**32`` so a cumulative rate of 1 always fires."""
    return min(math.floor(p * _TWO_POW_32), _TWO_POW_32)


class ChaosEngine:
    """Decides faults, one invocation at a time. The same config gives the same sequence in every build."""

    def __init__(self, config: ChaosConfig | None = None, *, random: Random | None = None) -> None:
        cfg = config if config is not None else ChaosConfig()
        self.enabled = cfg.enabled is True
        self.environment = cfg.environment
        if self.enabled and is_production_environment(cfg.environment):
            raise ChaosForbiddenError()
        validate_chaos_config(cfg)
        self.config = cfg
        self.seed = int(cfg.seed) if cfg.seed is not None else 0
        self._faults = resolve_faults(cfg)
        self._schedule = list(cfg.schedule or ())
        self._thresholds: list[int] = []
        cumulative = 0.0
        for fault in self._faults:
            cumulative += fault.rate
            self._thresholds.append(_threshold(cumulative))
        self.random: Random = random if random is not None else Mulberry32(self.seed)
        self._position = 0

    @property
    def invocations(self) -> int:
        """How many decisions this engine has made."""
        return self._position

    @property
    def faults(self) -> list[FaultSpec]:
        """The resolved faults (``faults``, or the n2 mapping)."""
        return list(self._faults)

    def decide(self) -> Fault | None:
        """The fault for the next invocation, or ``None``."""
        if not self.enabled:
            return None
        # The guard again, per call: an environment that turned production after the engine
        # was built still gets nothing injected.
        if is_production_environment(self.environment):
            return None
        i = self._position
        self._position += 1
        if i < len(self._schedule):
            return self._schedule[i]
        if not self._faults:
            return None
        u = self.random.next_u32()
        for fault, limit in zip(self._faults, self._thresholds, strict=True):
            if u >= limit:
                continue
            if fault.kind == "latency":
                span = int(fault.max_ms) - int(fault.min_ms) + 1
                return Fault("latency", int(fault.min_ms) + self.random.next_u32() % span)
            return Fault(fault.kind)
        return None


def create_chaos(config: ChaosConfig | None = None, *, random: Random | None = None) -> ChaosEngine:
    """Build an engine. Same as ``ChaosEngine(config)``."""
    return ChaosEngine(config, random=random)


# ---------------------------------------------------------------------------
# Applying a fault
# ---------------------------------------------------------------------------


def truncate_value(value: Any, mutate: ChaosMutate | None = None) -> Any:
    """Half a string (by code point), bytes, list or tuple; else ``mutate``, else ``ChaosError``."""
    if isinstance(value, (str, bytes, bytearray, list, tuple)):
        return value[: len(value) // 2]
    if mutate is not None:
        return mutate(value, "truncate")
    raise ChaosError("truncate")


async def apply_fault(
    fault: Fault | None,
    op: Callable[[], Awaitable[T]],
    *,
    sleep: Sleep | None = None,
    mutate: ChaosMutate | None = None,
) -> T:
    """Run ``op`` under ``fault``.

    ``None`` runs it untouched. ``error`` and ``drop`` raise :class:`ChaosError` without
    running ``op``; ``latency`` waits, then runs it; ``timeout`` never finishes until the task
    is cancelled; ``truncate`` halves the result (see :func:`truncate_value`); ``malformed``
    replaces it with ``mutate``'s output, or :data:`MALFORMED_MARKER`.
    """
    if fault is None:
        return await op()
    kind = fault.kind
    if kind == "error":
        raise ChaosError("error")
    if kind == "drop":
        raise ChaosError("drop", "Chaos: connection dropped")
    if kind == "latency":
        if fault.ms:
            await (sleep if sleep is not None else asyncio_sleep).sleep(fault.ms)
        return await op()
    if kind == "timeout":
        await asyncio.get_running_loop().create_future()  # a hang: only cancellation ends it
        raise ChaosError("timeout")  # pragma: no cover - the future never completes
    value = await op()
    if kind == "truncate":
        return cast(T, truncate_value(value, mutate))
    return cast(T, mutate(value, "malformed") if mutate is not None else MALFORMED_MARKER)


# ---------------------------------------------------------------------------
# The n2 entry points
# ---------------------------------------------------------------------------

_engines: weakref.WeakKeyDictionary[ChaosConfig, ChaosEngine] = weakref.WeakKeyDictionary()


def _engine_for(config: ChaosConfig) -> ChaosEngine:
    """The engine for a wrapper's config, kept per config object so one object is one sequence.

    An unseeded wrapper gets a random seed, as the n2 wrappers drew from ``Math.random``.
    """
    engine = _engines.get(config)
    if engine is None:
        if config.seed is None:
            seeded = ChaosConfig(**{**config.__dict__, "seed": _random.getrandbits(32)})
            engine = ChaosEngine(seeded)
        else:
            engine = ChaosEngine(config)
        _engines[config] = engine
    return engine


async def _run(
    engine: FaultInjector,
    fn: Callable[[], Awaitable[T]],
    sleep: Sleep | None,
    mutate: ChaosMutate | None,
) -> T:
    fault = engine.decide()
    if fault is not None:
        _logger.warn(f"Injecting {fault.kind}", data=fault.to_json())
    return await apply_fault(fault, fn, sleep=sleep, mutate=mutate)


async def with_chaos(
    fn: Callable[[], Awaitable[T]],
    config: ChaosConfig | ChaosEngine | None = None,
    *,
    sleep: Sleep | None = None,
) -> T:
    """Await ``fn()`` with chaos.

    Disabled (the default), ``fn`` runs untouched and nothing is validated. Enabled, one
    decision is taken from the engine for this config object (or from ``config`` itself when it
    is an engine) and applied. Raises :class:`ChaosForbiddenError` when enabled in production.
    """
    if isinstance(config, ChaosEngine):
        return await _run(config, fn, sleep, config.config.mutate)
    if config is None or config.enabled is not True:
        return await fn()
    return await _run(_engine_for(config), fn, sleep, config.mutate)


def chaos_middleware(
    config: ChaosConfig | None = None, *, sleep: Sleep | None = None
) -> Callable[[Callable[[], Awaitable[T]]], Awaitable[T]]:
    """One engine for every call it wraps, so a seeded middleware replays one sequence.

    Raises :class:`ChaosForbiddenError` here, at creation, when enabled in production.
    """
    if config is None or config.enabled is not True:

        def passthrough(fn: Callable[[], Awaitable[T]]) -> Awaitable[T]:
            return fn()

        return passthrough
    engine = _engine_for(ChaosConfig(**config.__dict__))
    mutate = config.mutate

    def apply(fn: Callable[[], Awaitable[T]]) -> Awaitable[T]:
        return _run(engine, fn, sleep, mutate)

    return apply


def chaos_wrap(
    fn: Callable[P, Awaitable[T]],
    config: ChaosConfig | None = None,
    *,
    sleep: Sleep | None = None,
) -> Callable[P, Awaitable[T]]:
    """``fn`` with chaos on every call, one engine for all of them; same signature.

    Raises :class:`ChaosForbiddenError` here, at creation, when enabled in production.
    """
    middleware: Callable[[Callable[[], Awaitable[T]]], Awaitable[T]] = chaos_middleware(
        config, sleep=sleep
    )

    async def wrapped(*args: P.args, **kwargs: P.kwargs) -> T:
        return await middleware(lambda: fn(*args, **kwargs))

    return wrapped
