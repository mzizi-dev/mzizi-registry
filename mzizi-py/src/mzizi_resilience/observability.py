# GENERATED — DO NOT EDIT.
#
# Copied verbatim from components/registry/n8-assurance/observability.py by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with `pnpm py:generate`. CI runs `pnpm py:generate:check`,
# which fails if this copy and its source have drifted.

"""Observability (N8 assurance, #472): structured log events, injectable sinks, redaction.

Python build of the assurance node's ``observability``, held to
``contracts/lib/observability.contract.json`` and to
``__tests__/fixtures/resilience/observability.cases.json`` with the TypeScript and Rust
builds: the same event, the same JSON line and the same readable line.

Every event is ``{ts, level, module, msg, traceId?, data?}`` (``ts`` an ISO-8601 UTC string
with milliseconds), handed to each sink in turn. The N8 covenant (never store personal data)
is enforced here, not left to callers:

- ``data`` is redacted before any sink sees it: a key matching :data:`REDACT_KEY` (any case,
  anywhere in the key) has its value replaced by ``"[redacted]"``, at any depth;
- an exception is reduced to ``{name, code}``. Its message and traceback never reach a sink,
  because a message is where user input ends up.

The default sink hands each event to the standard :mod:`logging` module (logger
``mzizi.<module>``, message ``[mzizi:<module>] LEVEL msg …``), which is where a Python host
already routes its logs; :func:`console_sink` writes the same line to stderr and
:func:`json_sink` one JSON line per event, for log drains. A host swaps or adds sinks with
:func:`configure_observability` / :func:`add_sink`. Sinks are looked up per event, never
captured at import, so a test or host that swaps them later still sees every line.
"""

from __future__ import annotations

import datetime as _dt
import inspect
import json
import logging
import math
import re
import sys
import time
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, Literal, NotRequired, TypedDict, TypeVar

__all__ = [
    "DEFAULT_MODULE",
    "MAX_DEPTH",
    "REDACTED",
    "REDACT_KEY",
    "ErrorSummary",
    "LogEvent",
    "LogLevel",
    "LogSink",
    "Logger",
    "add_sink",
    "build_event",
    "configure_observability",
    "console_sink",
    "create_logger",
    "error_summary",
    "format_line",
    "format_prefix",
    "is_sensitive_key",
    "json_sink",
    "log",
    "logging_sink",
    "measure",
    "memory_sink",
    "redact",
    "reset_observability",
    "to_json",
    "track_error",
]

T = TypeVar("T")

LogLevel = Literal["debug", "info", "warn", "error"]

#: The value a redacted key's value is replaced with.
REDACTED = "[redacted]"
#: The module an event carries when the caller named none.
DEFAULT_MODULE = "mzizi"
#: Keys whose values are replaced by :data:`REDACTED`, at any depth.
REDACT_KEY = re.compile(
    r"pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card",
    re.IGNORECASE,
)
#: How deep :func:`redact` walks before it stops; deeper containers become ``"[depth]"``.
MAX_DEPTH = 8


class _ErrorSummaryBase(TypedDict):
    name: str


class ErrorSummary(_ErrorSummaryBase, total=False):
    """What an error becomes in an event: its type name and, if it has one, its code."""

    code: str


class LogEvent(TypedDict):
    """One structured event, as every sink receives it (the same shape in every build)."""

    ts: str
    level: LogLevel
    module: str
    msg: str
    traceId: NotRequired[str]
    data: NotRequired[dict[str, Any]]


LogSink = Callable[[LogEvent], None]

_LEVEL_RANK: dict[LogLevel, int] = {"debug": 0, "info": 1, "warn": 2, "error": 3}


def is_sensitive_key(key: str) -> bool:
    """True when a key's value must never be logged."""
    return REDACT_KEY.search(key) is not None


def error_summary(error: object) -> ErrorSummary:
    """Reduce an error (or anything raised) to ``{name, code}``. Never the message.

    ``code`` is the error's ``code`` attribute when it is a string or a number.
    """
    if isinstance(error, BaseException):
        summary: ErrorSummary = {"name": type(error).__name__ or "Error"}
        code = getattr(error, "code", None)
        if isinstance(code, str) or (
            isinstance(code, (int, float)) and not isinstance(code, bool)
        ):
            summary["code"] = str(code)
        return summary
    return {"name": "Error" if isinstance(error, str) else type(error).__name__}


_EPOCH = _dt.datetime(1970, 1, 1, tzinfo=_dt.timezone.utc)


def _iso(at_ms: int) -> str:
    moment = _EPOCH + _dt.timedelta(milliseconds=at_ms)
    return (
        f"{moment.year:04d}-{moment.month:02d}-{moment.day:02d}T"
        f"{moment.hour:02d}:{moment.minute:02d}:{moment.second:02d}."
        f"{moment.microsecond // 1000:03d}Z"
    )


_DROP = object()


def _redact(value: Any, depth: int, seen: set[int]) -> Any:
    if value is None or isinstance(value, (bool, str)):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, BaseException):
        return error_summary(value)
    if isinstance(value, _dt.datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=_dt.timezone.utc)
        return _iso((value - _EPOCH) // _dt.timedelta(milliseconds=1))
    if callable(value) and not isinstance(value, type):
        return _DROP
    if depth >= MAX_DEPTH:
        return "[depth]"
    if id(value) in seen:
        return "[circular]"
    seen.add(id(value))
    try:
        if isinstance(value, (list, tuple)):
            out_list = []
            for item in value:
                red = _redact(item, depth + 1, seen)
                out_list.append(None if red is _DROP else red)
            return out_list
        if isinstance(value, Mapping):
            out: dict[str, Any] = {}
            for key, item in value.items():
                k = str(key)
                if is_sensitive_key(k):
                    out[k] = REDACTED
                    continue
                red = _redact(item, depth + 1, seen)
                if red is not _DROP:
                    out[k] = red
            return out
        # A class instance (a dataclass, a socket, a request) is not data we can vouch for.
        name = type(value).__name__
        return f"[{name or 'object'}]"
    finally:
        seen.discard(id(value))


def redact(value: Any) -> Any:
    """Redact a value for logging. The input is never mutated.

    Sensitive keys become ``"[redacted]"``; exceptions ``{name, code}``; datetimes ISO strings;
    cycles ``"[circular]"``; containers past :data:`MAX_DEPTH` ``"[depth]"``; other objects
    ``"[ClassName]"``. Functions are dropped (list slots become ``None``), non-finite floats
    become ``None``. Tuples become lists.
    """
    out = _redact(value, 0, set())
    return None if out is _DROP else out


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------


def format_prefix(level: LogLevel, module: str | None = None) -> str:
    """``[mzizi:<module>] LEVEL``, or ``[mzizi] LEVEL`` for the default module."""
    tag = f"[mzizi:{module}]" if module and module != DEFAULT_MODULE else "[mzizi]"
    return f"{tag} {level.upper()}"


def format_line(event: LogEvent) -> str:
    """The readable line for an event, without its data: ``[mzizi:api] INFO msg [trace:id]``."""
    line = f"{format_prefix(event['level'], event['module'])} {event['msg']}"
    return f"{line} [trace:{event['traceId']}]" if "traceId" in event else line


def to_json(event: LogEvent) -> str:
    """The JSON line, keys in the order ``ts, level, module, msg, traceId, data``.

    Compact and escaped exactly as JavaScript's ``JSON.stringify`` does.
    """
    ordered: dict[str, Any] = {
        "ts": event["ts"],
        "level": event["level"],
        "module": event["module"],
        "msg": event["msg"],
    }
    if "traceId" in event:
        ordered["traceId"] = event["traceId"]
    if "data" in event:
        ordered["data"] = event["data"]
    return json.dumps(ordered, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


# ---------------------------------------------------------------------------
# Sinks
# ---------------------------------------------------------------------------

_LOGGING_LEVELS: dict[LogLevel, int] = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
}


def _readable(event: LogEvent) -> str:
    line = format_line(event)
    if "data" in event:
        line += " " + json.dumps(event["data"], ensure_ascii=False, separators=(",", ":"))
    return line


def logging_sink(event: LogEvent) -> None:
    """Hand the event to :mod:`logging`: logger ``mzizi.<module>``, the event in ``extra``."""
    name = "mzizi" if event["module"] == DEFAULT_MODULE else f"mzizi.{event['module']}"
    logging.getLogger(name).log(
        _LOGGING_LEVELS[event["level"]], _readable(event), extra={"mzizi_event": event}
    )


def console_sink(event: LogEvent) -> None:
    """Write ``[mzizi:<module>] LEVEL msg [trace:id]`` and the (redacted) data to stderr."""
    print(_readable(event), file=sys.stderr)


def json_sink(event: LogEvent) -> None:
    """Write one JSON line per event to stdout, for log drains."""
    print(to_json(event), file=sys.stdout)


class _MemorySink:
    """A sink that keeps events in memory (tests, and hosts that batch)."""

    def __init__(self) -> None:
        self.events: list[LogEvent] = []

    def __call__(self, event: LogEvent) -> None:
        self.events.append(event)


def memory_sink() -> _MemorySink:
    """A sink that keeps events in ``.events``."""
    return _MemorySink()


def _epoch_ms() -> int:
    return time.time_ns() // 1_000_000


_sinks: list[LogSink] = [logging_sink]
_now: Callable[[], int] = _epoch_ms
_min_level: LogLevel = "debug"


def configure_observability(
    *,
    sinks: list[LogSink] | None = None,
    now: Callable[[], int] | None = None,
    min_level: LogLevel | None = None,
) -> None:
    """Configure the process-wide sinks, clock (epoch ms) and level. Unset arguments are kept."""
    global _sinks, _now, _min_level
    if sinks is not None:
        _sinks = list(sinks)
    if now is not None:
        _now = now
    if min_level is not None:
        _min_level = min_level


def add_sink(sink: LogSink) -> Callable[[], None]:
    """Add a sink; returns a function that removes it again."""
    global _sinks
    _sinks = [*_sinks, sink]

    def remove() -> None:
        global _sinks
        _sinks = [s for s in _sinks if s is not sink]

    return remove


def reset_observability() -> None:
    """Back to the defaults: the logging sink, the system clock, every level."""
    configure_observability(sinks=[logging_sink], now=_epoch_ms, min_level="debug")


# ---------------------------------------------------------------------------
# Events and loggers
# ---------------------------------------------------------------------------


def build_event(
    level: LogLevel,
    msg: str,
    *,
    module: str | None = None,
    data: Mapping[str, Any] | None = None,
    error: object = None,
    trace_id: str | None = None,
    at: int | None = None,
) -> LogEvent:
    """The event a log call would emit, without emitting it. Pure apart from the clock."""
    event: LogEvent = {
        "ts": _iso(at if at is not None else _now()),
        "level": level,
        "module": module or DEFAULT_MODULE,
        "msg": msg,
    }
    if trace_id:
        event["traceId"] = trace_id
    payload: dict[str, Any] | None = redact(data) if data is not None else None
    if error is not None:
        payload = {**(payload or {}), "error": error_summary(error)}
    if payload is not None:
        event["data"] = payload
    return event


def _emit(
    level: LogLevel,
    msg: str,
    module: str | None,
    data: Mapping[str, Any] | None,
    error: object,
    trace_id: str | None,
) -> None:
    if _LEVEL_RANK[level] < _LEVEL_RANK[_min_level]:
        return
    try:
        event = build_event(level, msg, module=module, data=data, error=error, trace_id=trace_id)
    except Exception:  # noqa: BLE001 - logging never raises
        return
    for sink in list(_sinks):
        try:
            sink(event)
        except Exception:  # noqa: BLE001 - a broken sink must not break the caller or the others
            pass


class Logger:
    """A logger bound to one module: ``create_logger("registry").info(...)``."""

    def __init__(self, module: str | None = None) -> None:
        self.module = module

    def debug(
        self,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: object = None,
        trace_id: str | None = None,
    ) -> None:
        _emit("debug", msg, self.module, data, error, trace_id)

    def info(
        self,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: object = None,
        trace_id: str | None = None,
    ) -> None:
        _emit("info", msg, self.module, data, error, trace_id)

    def warn(
        self,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: object = None,
        trace_id: str | None = None,
    ) -> None:
        _emit("warn", msg, self.module, data, error, trace_id)

    warning = warn

    def error(
        self,
        msg: str,
        *,
        data: Mapping[str, Any] | None = None,
        error: object = None,
        trace_id: str | None = None,
    ) -> None:
        _emit("error", msg, self.module, data, error, trace_id)


def create_logger(module: str) -> Logger:
    """A logger bound to ``module``: its lines read ``[mzizi:<module>] LEVEL …``."""
    return Logger(module)


#: The unscoped logger (module ``mzizi``, lines ``[mzizi] LEVEL …``).
log = Logger()


async def measure(
    label: str,
    fn: Callable[[], Awaitable[T] | T],
    *,
    module: str | None = None,
    data: Mapping[str, Any] | None = None,
    trace_id: str | None = None,
) -> T:
    """Run ``fn`` (sync or async) and log ``<label> completed in <n>ms`` or ``<label> failed after <n>ms``.

    Returns or re-raises exactly what ``fn`` did. The module defaults to ``perf``.
    """
    target = Logger(module or "perf")
    started = _now()
    try:
        result = fn()
        if inspect.isawaitable(result):
            result = await result
    except BaseException as err:
        duration = round(_now() - started)
        target.error(
            f"{label} failed after {duration}ms",
            data={**(data or {}), "duration": duration, "label": label},
            error=err,
            trace_id=trace_id,
        )
        raise
    duration = round(_now() - started)
    target.info(
        f"{label} completed in {duration}ms",
        data={**(data or {}), "duration": duration, "label": label},
        trace_id=trace_id,
    )
    return result


def track_error(
    error: object,
    *,
    module: str | None = None,
    data: Mapping[str, Any] | None = None,
    trace_id: str | None = None,
) -> None:
    """Record an error without raising. The message is the error's name (and code), never its text."""
    summary = error_summary(error)
    msg = f"{summary['name']} ({summary['code']})" if "code" in summary else summary["name"]
    Logger(module).error(msg, data=data, error=error, trace_id=trace_id)

