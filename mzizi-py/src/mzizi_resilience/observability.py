# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n8-assurance/observability.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Observability (N8 assurance, #472): structured, redacting logs with injectable sinks.

Python build of the assurance node's ``observability``; behaviour matches the Rust and
TypeScript builds, and the shared fixtures under ``__tests__/fixtures/resilience/`` are the
arbiter.

Every log line is one JSON-shaped event ``{ts, level, module, msg, traceId?, data?}``
handed to each sink. Before any sink sees it:

- a ``data`` key matching :data:`REDACT_KEYS` (passwords, secrets, tokens, authorisation,
  cookies, API keys, email, phone, SSN, card) has its value replaced by ``"[redacted]"``, at
  any depth;
- an exception anywhere in ``data`` (and the ``error=`` argument) is reduced to
  ``{name, code}``: never its message or traceback, which can carry personal data.

Sinks are resolved when an event is emitted, not when a logger is made, so tests and hosts
can swap them at any time (:func:`set_default_sinks`). The default sink hands events to the
standard :mod:`logging` module (logger ``mzizi.<module>``, message prefixed
``[mzizi:<module>]``); :func:`console_sink` prints the same prefix to stderr.
"""

from __future__ import annotations

import inspect
import json
import logging
import re
import sys
import time
from collections.abc import Awaitable, Callable, Mapping, Sequence
from typing import Any, Literal, NotRequired, TypedDict, TypeVar

__all__ = [
    "REDACTED",
    "REDACT_KEYS",
    "LogEvent",
    "LogLevel",
    "Logger",
    "Sink",
    "console_sink",
    "create_logger",
    "default_sinks",
    "log",
    "logging_sink",
    "measure",
    "memory_sink",
    "redact",
    "set_default_sinks",
    "track_error",
]

T = TypeVar("T")

LogLevel = Literal["debug", "info", "warn", "error"]

#: Keys whose values never reach a sink.
REDACT_KEYS = re.compile(
    r"pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card",
    re.IGNORECASE,
)
REDACTED = "[redacted]"
_MAX_DEPTH = 8


class LogEvent(TypedDict):
    """One structured log event, the same shape in every build."""

    ts: int
    level: LogLevel
    module: str
    msg: str
    traceId: NotRequired[str]
    data: NotRequired[dict[str, Any]]


Sink = Callable[[LogEvent], None]


def _error_summary(err: BaseException) -> dict[str, str]:
    code = getattr(err, "code", None)
    name = type(err).__name__
    return {"name": name, "code": code if isinstance(code, str) and code else name}


def redact(value: Any, _depth: int = 0) -> Any:
    """``value`` with sensitive keys masked and exceptions reduced to ``{name, code}``."""
    if isinstance(value, BaseException):
        return _error_summary(value)
    if _depth >= _MAX_DEPTH:
        return "[truncated]"
    if isinstance(value, Mapping):
        out: dict[str, Any] = {}
        for key, item in value.items():
            k = str(key)
            out[k] = REDACTED if REDACT_KEYS.search(k) else redact(item, _depth + 1)
        return out
    if isinstance(value, (list, tuple)):
        return [redact(item, _depth + 1) for item in value]
    return value


# ---------------------------------------------------------------------------
# Sinks
# ---------------------------------------------------------------------------

_LOGGING_LEVELS: dict[LogLevel, int] = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
}


def _prefix(module: str) -> str:
    return f"[mzizi:{module}]" if module else "[mzizi]"


def _line(event: LogEvent) -> str:
    parts = [f"{_prefix(event['module'])} {event['level'].upper()} {event['msg']}"]
    if "traceId" in event:
        parts.append(f"[trace:{event['traceId']}]")
    if "data" in event:
        parts.append(json.dumps(event["data"], default=str, sort_keys=True))
    return " ".join(parts)


def logging_sink(event: LogEvent) -> None:
    """Hand the event to :mod:`logging` (logger ``mzizi.<module>``); the event rides as ``extra``."""
    name = f"mzizi.{event['module']}" if event["module"] else "mzizi"
    logging.getLogger(name).log(
        _LOGGING_LEVELS[event["level"]], _line(event), extra={"mzizi_event": event}
    )


def console_sink(event: LogEvent) -> None:
    """Print ``[mzizi:<module>] LEVEL msg …`` to stderr."""
    print(_line(event), file=sys.stderr)


def memory_sink() -> tuple[Sink, list[LogEvent]]:
    """A sink that keeps events in a list (tests). Returns the sink and the list."""
    events: list[LogEvent] = []
    return events.append, events


_default_sinks: list[Sink] = [logging_sink]


def default_sinks() -> list[Sink]:
    """The sinks a logger without its own uses (a copy)."""
    return list(_default_sinks)


def set_default_sinks(sinks: Sequence[Sink]) -> None:
    """Replace the default sinks. Takes effect for every logger's next event."""
    _default_sinks[:] = list(sinks)


# ---------------------------------------------------------------------------
# Loggers
# ---------------------------------------------------------------------------


def _now_ms() -> int:
    return time.time_ns() // 1_000_000


class Logger:
    """A logger bound to one module. ``sinks=None`` follows :func:`set_default_sinks`."""

    def __init__(
        self,
        module: str = "",
        *,
        sinks: Sequence[Sink] | None = None,
        now: Callable[[], int] | None = None,
    ) -> None:
        self.module = module
        self.sinks = list(sinks) if sinks is not None else None
        self._now = now if now is not None else _now_ms

    def event(
        self,
        level: LogLevel,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: BaseException | None = None,
        trace_id: str | None = None,
    ) -> LogEvent:
        """Build (and redact) the event without emitting it."""
        event: LogEvent = {"ts": self._now(), "level": level, "module": self.module, "msg": msg}
        if trace_id:
            event["traceId"] = trace_id
        payload: dict[str, Any] = dict(data) if data is not None else {}
        if error is not None:
            payload["error"] = error
        if payload:
            event["data"] = redact(payload)
        return event

    def emit(
        self,
        level: LogLevel,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: BaseException | None = None,
        trace_id: str | None = None,
    ) -> LogEvent:
        event = self.event(level, msg, data=data, error=error, trace_id=trace_id)
        for sink in self.sinks if self.sinks is not None else _default_sinks:
            try:
                sink(event)
            except Exception:  # noqa: BLE001 - a broken sink must never break the caller
                pass
        return event

    def debug(self, msg: str, **ctx: Any) -> LogEvent:
        return self.emit("debug", msg, **ctx)

    def info(self, msg: str, **ctx: Any) -> LogEvent:
        return self.emit("info", msg, **ctx)

    def warn(self, msg: str, **ctx: Any) -> LogEvent:
        return self.emit("warn", msg, **ctx)

    warning = warn

    def error(self, msg: str, **ctx: Any) -> LogEvent:
        return self.emit("error", msg, **ctx)


def create_logger(
    module: str, *, sinks: Sequence[Sink] | None = None, now: Callable[[], int] | None = None
) -> Logger:
    """A logger for ``module``: events carry ``module`` and print as ``[mzizi:<module>]``."""
    return Logger(module, sinks=sinks, now=now)


#: The unscoped logger (``[mzizi]``).
log = Logger()


async def measure(
    label: str,
    fn: Callable[[], Awaitable[T] | T],
    *,
    logger: Logger | None = None,
    data: Mapping[str, Any] | None = None,
    trace_id: str | None = None,
) -> T:
    """Run ``fn`` (sync or async) and log how long it took, as ``info`` or, if it raised, ``error``."""
    target = logger if logger is not None else create_logger("perf")
    start = time.perf_counter_ns()
    try:
        result = fn()
        if inspect.isawaitable(result):
            result = await result
    except BaseException as err:
        duration = (time.perf_counter_ns() - start) // 1_000_000
        target.error(
            f"{label} failed after {duration}ms",
            data={**(data or {}), "duration": duration, "label": label},
            error=err,
            trace_id=trace_id,
        )
        raise
    duration = (time.perf_counter_ns() - start) // 1_000_000
    target.info(
        f"{label} completed in {duration}ms",
        data={**(data or {}), "duration": duration, "label": label},
        trace_id=trace_id,
    )
    return result


def track_error(
    error: BaseException,
    *,
    logger: Logger | None = None,
    data: Mapping[str, Any] | None = None,
    trace_id: str | None = None,
) -> LogEvent:
    """Log an error without raising it. The message is the error's code, never its text."""
    target = logger if logger is not None else log
    summary = _error_summary(error)
    return target.error(summary["code"], data=data, error=error, trace_id=trace_id)
