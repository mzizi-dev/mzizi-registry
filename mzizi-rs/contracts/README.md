# Server-component contracts

The registry's UI contracts (`../../contracts/`) describe rendered markup: states, density, accessibility. A server component renders none of that, so it has its own contract format, `schema/server-contract.schema.json`, with one file per component in `server/`.

Mzizi is written for machine authorship, so a machine must be able to read what a server component promises and check it. A server contract states:

| Field        | What it holds                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `surface`    | Every public item a caller may depend on, by its exact declaration and file. Removing or narrowing one is a major version.      |
| `limits`     | The numbers it enforces, each read back from its `pub const`.                                                                   |
| `guarantees` | What always holds, each naming the `#[test]` functions that prove it.                                                           |
| `refusals`   | The inputs it refuses rather than handles, each with its test.                                                                  |
| `harness`    | The server harness: the default (`Noop`), whether it can be removed, every event with its fields, and how secrets are excluded. |
| `gaps`       | Where the build falls short of the standard, recorded rather than hidden.                                                       |

## The server harness

The UI harness (`useMziziHarness`) gives a component `log`, `motion` and `announce`. A server component has no screen, so only `log` carries over: `mzizi_data::harness::{Harness, Event, Noop}`. A client reports each step to whatever harness it was given. It can be plugged in (`with_harness`), adapted (implement `Harness` to forward to OpenTelemetry, `console.log` or a test recorder) or removed (the default is `Noop`, so there is no cost without one). An `Event` carries only `&'static str` names, keys and string values, so no secret, name or document can be formatted into one.

## How a contract is checked

Each crate's `tests/contract.rs` reads its contract and fails when it and the crate disagree: a field the schema requires is missing, a surface item is no longer declared, a limit's value differs from the source, a guarantee or refusal names a test that does not exist, or a harness event is never emitted. `cargo test -p <crate>` runs it, in the workspace `Rust` CI job.

## Coverage

| Contract               | Crate           | Node | Version |
| ---------------------- | --------------- | ---- | ------- |
| `server/mzizi-data`    | `mzizi-data`    | none | 1.0.0   |
| `server/mzizi-mongodb` | `mzizi-mongodb` | none | 1.0.0   |

The node crates (`mzizi-assurance`, `mzizi-fundi`, `mzizi-docs`, `mzizi-discovery`) and `mzizi-activitypub` have no server contract yet.
