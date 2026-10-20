# mzizi-harness

One harness, the same for the UI, the language and every server component.

The UI harness (`useMziziHarness`) gives a component three things: a scoped `log`, a `motion` configuration that honours reduced motion, and `announce` for a screen reader. This crate is that harness as a Rust trait, so a Dioxus component, a Mzizi language program and a Cloudflare Worker client all report to, and take their configuration from, the same thing.

```toml
[dependencies]
mzizi-harness = "0.3"
```

| Item             | What it is                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| `Harness`        | `event` (log), `motion`, `announce`. Only `event` is required.           |
| `Event`, `Level` | One thing that happened, with a static name and static-keyed fields.     |
| `Value`          | `Str(&'static str)`, `Int(i64)` or `Bool(bool)`. Never a runtime string. |
| `Motion`         | Reduced flag and durations: `STILL` and `STANDARD`.                      |
| `Noop`, `noop()` | The harness that does nothing, and the default.                          |
| `Shared`         | `Rc<dyn Harness>`, how a component holds one.                            |

## Plug in, adapt, remove

- **Plug in.** Give a component a `Shared` harness (`Connection::with_harness` in `mzizi-mongodb`).
- **Adapt.** Implement `Harness` to forward to `console.log`, OpenTelemetry or a test recorder.
- **Remove.** The default is `Noop`, so a component costs nothing without one.

## A log that cannot leak

A server has no screen, so a server component only logs: its `motion` is `Motion::STILL` and it never calls `announce`. The log path cannot carry a secret by type. An `Event`'s name, field keys and string values are `&'static str`, so no connection string, password, name or document can be formatted into one. Only integers and flags vary. `announce` is the one method that takes a runtime string, because a live region reads prose.

## Who plugs in

`mzizi-mongodb` today. The other server crates and the Roots UI crates are follow-ups; the Roots UI crates currently take props such as `prefers_reduced_motion`.

## Licence

Apache-2.0, like the rest of the registry.
