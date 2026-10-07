"""Mzizi resilience for Python (mzizi-dev/mzizi-registry#472).

The public API: everything each module lists in ``__all__``. The modules beside this file are
GENERATED copies of the registry's ``components/registry/n5-resilience/*.py`` and
``n8-assurance/*.py``; this file is the one hand-written module and only re-exports them.
``tests/test_package.py`` fails if two modules export one name differently.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

from . import bulkhead as _bulkhead
from . import chaos as _chaos
from . import circuit_breaker as _circuit_breaker
from . import fallback_chain as _fallback_chain
from . import mzizi_resilience as _mzizi_resilience
from . import observability as _observability
from . import rate_limiter as _rate_limiter
from . import resilience_errors as _resilience_errors
from . import retry as _retry
from . import timeout as _timeout
from .bulkhead import *  # noqa: F403
from .chaos import *  # noqa: F403
from .circuit_breaker import *  # noqa: F403
from .fallback_chain import *  # noqa: F403
from .mzizi_resilience import *  # noqa: F403
from .observability import *  # noqa: F403
from .rate_limiter import *  # noqa: F403
from .resilience_errors import *  # noqa: F403
from .retry import *  # noqa: F403
from .timeout import *  # noqa: F403

try:
    __version__ = version("mzizi-resilience")
except PackageNotFoundError:  # running from a source checkout that is not installed
    __version__ = "0.0.0"

__all__ = sorted(
    {
        "__version__",
        *_bulkhead.__all__,
        *_chaos.__all__,
        *_circuit_breaker.__all__,
        *_fallback_chain.__all__,
        *_mzizi_resilience.__all__,
        *_observability.__all__,
        *_rate_limiter.__all__,
        *_resilience_errors.__all__,
        *_retry.__all__,
        *_timeout.__all__,
    }
)
