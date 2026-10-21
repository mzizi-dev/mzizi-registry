# mzizi-resilience

The Python build of [Mzizi](https://mzizi.dev)'s resilience node (N5) and its chaos and
observability primitives (N8): circuit breaker, retry, timeout, bulkhead, rate limiter,
fallback chain, a health monitor and their composition, a seeded chaos engine and a
redacting structured logger. Async-first (`asyncio`), typed, with no runtime dependencies.
Python 3.11 or later.

```bash
pip install mzizi-resilience
```

It is one of several builds of the same components (Rust, TypeScript, Python) held to one
behaviour spec and one set of shared fixtures in
[mzizi-dev/mzizi-registry](https://github.com/mzizi-dev/mzizi-registry) (#472): every
build runs every case and must give identical results.

## Where the code lives

The modules in this package are generated copies of
`components/registry/n5-resilience/*.py` and `components/registry/n8-assurance/*.py` in
the registry (`pnpm py:generate`). Edit those files, never the copies here. Each component's
source is also served at `https://api.mzizi.dev/v1/py/<name>`.

## Licence

Apache-2.0.
