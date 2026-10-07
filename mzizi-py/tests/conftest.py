"""Shared test setup: a clean environment for the production guard, and clean global state."""

from __future__ import annotations

from collections.abc import Iterator

import pytest

import mzizi_resilience as mr


@pytest.fixture(autouse=True)
def _isolated(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    # The production guard reads these; a developer's shell must not change the results.
    for name in ("MZIZI_ENV", "ENVIRONMENT", "ENV"):
        monkeypatch.delenv(name, raising=False)
    mr.reset_observability()
    mr.reset_breakers()
    yield
    mr.reset_observability()
    mr.reset_breakers()
