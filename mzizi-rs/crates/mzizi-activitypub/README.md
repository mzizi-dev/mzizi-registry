# mzizi-activitypub

The documents a read-only [ActivityPub](https://www.w3.org/TR/activitypub/) host serves,
from the [Mzizi](https://mzizi.dev) registry: **N11 discovery on the fediverse**. If
another server cannot look you up, you do not exist there.

```toml
[dependencies]
mzizi-activitypub = "0.2"
```

The registry's `publish-crates` workflow releases each new version to crates.io. Before
the first release, or to follow `main`, depend on it from git:

```toml
[dependencies]
mzizi-activitypub = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

It is also re-exported as `mzizi_roots_server::activitypub` behind that crate's
`activitypub` feature.

## What it gives a host

- `context(extensions)`: the `@context`, AS2 first, then the host's own terms.
- `wants_activity_json(accept)`: content negotiation. A browser always gets HTML.
- `escape_html`, `text_to_html`, `encode`, `property_value`.
- WebFinger: `webfinger_user(resource, host, actor_prefix)` parses `acct:` and URL
  resources; `jrd`, `self_link` and `profile_page_link` build the answer.
- `host_meta`, `nodeinfo_links` and `nodeinfo(&NodeInfo { … })`.
- `ordered_collection`, `ordered_collection_page`, `page_id` and `public_activity` for
  outboxes and the activities in them.

Sans-IO: pure functions returning `serde_json::Value`, for native hosts and
`wasm32-unknown-unknown` Workers alike. The actors (a circle's `Group`, an entity's
`Organization`) are the host's own; this crate is the protocol around them.

## Who uses it

- circles.mukoko.com (`mukoko-dev/mukoko-circles`), whose `ap.rs` it was extracted from.
- kweli.mukoko.com's profile Worker (`mukoko-dev/kweli`, `workers/kweli-profiles`).

The design both follow is nyuchi/api-gateway `docs/architecture/activitypub.md`. Phase 2
(HTTP signatures, the inbox, delivery) is built here, so both hosts get it at once.

## Authored in place

Registry components live under `components/registry/n<N>-<label>/` beside a TypeScript
sibling, and their crates carry a generated copy. This crate has no TypeScript sibling and
no UI, so, like `mzizi-roots-server`, its source is the crate itself.
