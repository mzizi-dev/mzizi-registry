"""Every shared fixture under ``__tests__/fixtures/resilience/``, case by case (#472).

The fixtures are the arbiter between the builds: vitest runs them against TypeScript,
``cargo test`` against Rust, and this file against the installed Python package. Every file in
the directory must have a runner here, so a new fixture cannot be skipped silently.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

import mzizi_resilience as mr

FIXTURES = Path(__file__).resolve().parents[2] / "__tests__" / "fixtures" / "resilience"

Case = dict[str, Any]
Runner = Callable[[str, Case], None]


def load(file: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads((FIXTURES / file).read_text(encoding="utf-8"))
    return data


# ---------------------------------------------------------------------------
# chaos.cases.json
# ---------------------------------------------------------------------------


def chaos_config(raw: dict[str, Any]) -> mr.ChaosConfig:
    faults = None
    if "faults" in raw:
        faults = [
            mr.FaultSpec(f["kind"], f["rate"], f.get("minMs", 0), f.get("maxMs", 0))
            for f in raw["faults"]
        ]
    schedule = None
    if "schedule" in raw:
        schedule = [None if e is None else mr.Fault(e["kind"], e.get("ms")) for e in raw["schedule"]]
    latency = raw.get("latencyMs")
    return mr.ChaosConfig(
        enabled=raw.get("enabled", False),
        seed=raw.get("seed"),
        faults=faults,
        schedule=schedule,
        environment=raw.get("environment"),
        error_rate=raw.get("errorRate"),
        latency_ms=None if latency is None else (latency[0], latency[1]),
    )


def fault_json(fault: mr.Fault | None) -> dict[str, Any] | None:
    return None if fault is None else fault.to_json()


def spec_json(spec: mr.FaultSpec) -> dict[str, Any]:
    out: dict[str, Any] = {"kind": spec.kind, "rate": spec.rate}
    if spec.kind == "latency":
        out.update(minMs=spec.min_ms, maxMs=spec.max_ms)
    return out


def run_chaos(section: str, case: Case) -> None:
    if section == "decisions":
        engine = mr.ChaosEngine(chaos_config(case["config"]))
        got = [fault_json(engine.decide()) for _ in range(case["invocations"])]
        assert got == case["expected"]
    elif section == "legacyMapping":
        assert [spec_json(s) for s in mr.resolve_faults(chaos_config(case["config"]))] == case[
            "faults"
        ]
    elif section == "validation":
        assert case["error"] == "config"
        with pytest.raises(mr.ResilienceConfigError):
            mr.ChaosEngine(chaos_config(case["config"]))
    elif section == "productionGuard":
        if case["error"] == "chaos-forbidden":
            with pytest.raises(mr.ChaosForbiddenError) as info:
                mr.ChaosEngine(chaos_config(case["config"]))
            assert info.value.code == "chaos-forbidden"
        else:
            assert case["error"] == "none"
            engine = mr.ChaosEngine(chaos_config(case["config"]))
            assert fault_json(engine.decide()) == case["first"]
    elif section == "truncate":
        assert mr.truncate_value(case["input"]) == case["expected"]
    elif section == "malformedMarker":
        assert mr.MALFORMED_MARKER == case["value"]
    else:
        raise AssertionError(f"chaos.cases.json: no runner for section {section!r}")


# ---------------------------------------------------------------------------
# observability.cases.json
# ---------------------------------------------------------------------------


def materialise(value: Any, messages: list[str]) -> Any:
    """Turn the fixture's ``{"$error": {name, code?, message?}}`` stand-ins into exceptions."""
    if isinstance(value, dict):
        if set(value) == {"$error"}:
            spec = value["$error"]
            cls = type(spec["name"], (Exception,), {})
            err = cls(spec.get("message", ""))
            if "code" in spec:
                err.code = spec["code"]
            if spec.get("message"):
                messages.append(spec["message"])
            return err
        return {k: materialise(v, messages) for k, v in value.items()}
    if isinstance(value, list):
        return [materialise(v, messages) for v in value]
    return value


def run_observability(section: str, case: Case) -> None:
    messages: list[str] = []
    if section == "sensitiveKeys":
        assert mr.is_sensitive_key(case["key"]) is case["sensitive"]
        return
    if section == "redaction":
        out = mr.redact(materialise(case["input"], messages))
        assert out == case["expected"]
        rendered = json.dumps(out)
    elif section == "events":
        ctx = case.get("ctx", {})
        event = mr.build_event(
            case["level"],
            case["msg"],
            module=ctx.get("module"),
            data=materialise(ctx["data"], messages) if "data" in ctx else None,
            error=materialise(ctx["error"], messages) if "error" in ctx else None,
            trace_id=ctx.get("traceId"),
            at=case["at"],
        )
        assert event == case["expected"]
        assert mr.to_json(event) == case["json"]
        assert mr.format_line(event) == case["line"]
        rendered = mr.to_json(event)
    else:
        raise AssertionError(f"observability.cases.json: no runner for section {section!r}")
    # An error's message never reaches the output (checked for messages long enough to be
    # distinctive; the fixtures also use one-letter messages that collide with module names).
    for message in messages:
        if len(message) > 3:
            assert message not in rendered


# ---------------------------------------------------------------------------
# Collection
# ---------------------------------------------------------------------------

RUNNERS: dict[str, Runner] = {
    "chaos.cases.json": run_chaos,
    "observability.cases.json": run_observability,
}

# Top-level keys that are metadata, not case lists.
META = {"$comment", "$schema", "version", "description"}


def collect() -> list[Any]:
    params = []
    for path in sorted(FIXTURES.glob("*.json")):
        data = load(path.name)
        for section, cases in data.items():
            if section in META:
                continue
            if not isinstance(cases, list):
                cases = [{"value": cases}]
            for index, case in enumerate(cases):
                label = case.get("name", index) if isinstance(case, dict) else index
                params.append(
                    pytest.param(path.name, section, case, id=f"{path.stem}/{section}/{label}")
                )
    return params


def test_the_fixture_directory_exists() -> None:
    assert FIXTURES.is_dir(), FIXTURES


def test_every_fixture_file_has_a_python_runner() -> None:
    files = sorted(p.name for p in FIXTURES.glob("*.json"))
    assert files, "no shared fixtures found"
    missing = [f for f in files if f not in RUNNERS]
    assert not missing, f"no Python runner for {missing}"


@pytest.mark.parametrize(("file", "section", "case"), collect())
def test_fixture_case(file: str, section: str, case: Case) -> None:
    RUNNERS[file](section, case)
