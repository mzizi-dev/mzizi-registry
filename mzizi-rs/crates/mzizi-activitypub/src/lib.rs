//! Mzizi ActivityPub — the documents a read-only ActivityPub host serves.
//!
//! N11 discovery says that if the machine cannot see it, it does not exist. On the
//! fediverse, the machine is another server: it looks an account up with WebFinger,
//! fetches the actor, reads the outbox, and asks NodeInfo what kind of server this is.
//! This crate builds those documents, so every Mukoko host that federates (circles.mukoko.com
//! for circles, kweli.mukoko.com for entities) answers the same way.
//!
//! # Sans-IO
//!
//! Every function is a pure function of its arguments and returns a `serde_json::Value`
//! (or a `String`). No HTTP, no clock, no store: the host routes the request, reads its
//! data, calls in here and sends the response. The crate builds for
//! `wasm32-unknown-unknown`, which is how both Workers run it.
//!
//! # What is here, and what is not
//!
//! The protocol plumbing every host repeats: the JSON-LD context, content negotiation,
//! HTML-safe text, WebFinger (parsing `resource` and building the JRD), host-meta,
//! NodeInfo, `OrderedCollection` outboxes and their pages, single activities and
//! `PropertyValue` profile fields.
//!
//! The actors themselves are the host's. A circle is a `Group`, an entity an
//! `Organization`; their ids, names, attachments and which items they announce are domain
//! decisions, so the host builds the actor `Value` (with [`context`] as its `@context`) and
//! this crate stays free of any one product's model.
//!
//! Phase 2 (HTTP signatures, the inbox, delivery) grows here too, as the signer and the
//! verifier, so both hosts get them at once.
//!
//! # Why this crate is authored in place
//!
//! The registry's components live under `components/registry/n<N>-<label>/` beside their
//! TypeScript siblings, and each crate carries a generated copy. This one has no
//! TypeScript sibling and no UI: it is server protocol code, used only by Rust Workers.
//! So, like `mzizi-roots` and `mzizi-roots-server`, its source is the crate itself.
//!
//! ```
//! use mzizi_activitypub as ap;
//! use serde_json::json;
//!
//! // A browser gets HTML; a federating server gets the actor.
//! assert!(!ap::wants_activity_json(Some("text/html,*/*;q=0.8")));
//! assert!(ap::wants_activity_json(Some("application/activity+json")));
//!
//! // WebFinger: `acct:{user}@{host}`, or the actor URL itself.
//! let user = ap::webfinger_user(Some("acct:HarareArts@kweli.mukoko.com"), "kweli.mukoko.com", "e/");
//! assert_eq!(user, Ok("hararearts".to_string()));
//!
//! let actor = "https://kweli.mukoko.com/e/hararearts";
//! let jrd = ap::jrd(
//!     "acct:HarareArts@kweli.mukoko.com",
//!     &[actor],
//!     vec![ap::self_link(actor)],
//! );
//! assert_eq!(jrd["links"][0]["type"], ap::ACTIVITY_JSON);
//!
//! // An actor's @context: AS2 first, then the host's own terms.
//! let ctx = ap::context(json!({ "toot": "http://joinmastodon.org/ns#" }));
//! assert_eq!(ctx[0], ap::AS_CONTEXT);
//! ```

use serde_json::{Map, Value, json};

/// The ActivityStreams public collection: address an activity `to` it to make it public.
pub const AS_PUBLIC: &str = "https://www.w3.org/ns/activitystreams#Public";
/// The ActivityStreams 2.0 JSON-LD context, always the first entry of `@context`.
pub const AS_CONTEXT: &str = "https://www.w3.org/ns/activitystreams";
/// The ActivityPub media type.
pub const ACTIVITY_JSON: &str = "application/activity+json";
/// The WebFinger (JRD) media type.
pub const JRD_JSON: &str = "application/jrd+json";
/// The NodeInfo 2.1 schema, the `rel` of the link `/.well-known/nodeinfo` serves.
pub const NODEINFO_PROFILE: &str = "http://nodeinfo.diaspora.software/ns/schema/2.1";
/// The `Content-Type` of a NodeInfo 2.1 document.
pub const NODEINFO_JSON: &str =
    "application/json; profile=\"http://nodeinfo.diaspora.software/ns/schema/2.1#\"";
/// XML Schema's integer, for typed terms such as `bundu:verificationTier`.
pub const XSD_INTEGER: &str = "http://www.w3.org/2001/XMLSchema#integer";
/// The WebFinger `rel` for a person-facing page.
pub const PROFILE_PAGE_REL: &str = "http://webfinger.net/rel/profile-page";

// --- JSON-LD ------------------------------------------------------------------------

/// The `@context` for a document: AS2 first, then `extensions`, the host's own terms (an
/// object mapping each term to its IRI or to an expanded definition). A term every
/// processor would otherwise drop must be declared here to survive expansion.
///
/// An empty or non-object `extensions` gives the bare AS2 context.
pub fn context(extensions: Value) -> Value {
    match extensions {
        Value::Object(m) if !m.is_empty() => json!([AS_CONTEXT, m]),
        _ => json!(AS_CONTEXT),
    }
}

/// `document` with `context` set as its `@context` (replacing any it had).
pub fn with_context(mut document: Value, context: Value) -> Value {
    if let Some(o) = document.as_object_mut() {
        o.insert("@context".into(), context);
    }
    document
}

/// `document` without its `@context`, for embedding it inside another (an object inside
/// an activity, an activity inside a collection page).
pub fn without_context(mut document: Value) -> Value {
    if let Some(o) = document.as_object_mut() {
        o.remove("@context");
    }
    document
}

// --- Content negotiation -----------------------------------------------------------------

/// Does this `Accept` header ask for ActivityPub rather than a web page?
///
/// Only an explicit ActivityPub media type counts (`application/activity+json`, or
/// `application/ld+json` with the AS2 profile or no profile); `*/*` never does, so a
/// browser, which sends `text/html,…,*/*;q=0.8`, always gets HTML. When both are named,
/// the higher `q` wins, and a tie goes to ActivityPub, which is what a federating server
/// that lists both means.
pub fn wants_activity_json(accept: Option<&str>) -> bool {
    let Some(accept) = accept else { return false };
    let mut ap_q: f32 = 0.0;
    let mut html_q: f32 = 0.0;
    for range in accept.split(',') {
        let mut parts = range.split(';').map(str::trim);
        let media = parts.next().unwrap_or("").to_ascii_lowercase();
        let mut q: f32 = 1.0;
        let mut profile: Option<String> = None;
        for p in parts {
            if let Some((k, v)) = p.split_once('=') {
                let k = k.trim().to_ascii_lowercase();
                let v = v.trim().trim_matches('"');
                if k == "q" {
                    q = v.parse().unwrap_or(0.0);
                } else if k == "profile" {
                    profile = Some(v.to_string());
                }
            }
        }
        let is_ap = media == ACTIVITY_JSON
            || (media == "application/ld+json"
                && profile
                    .as_deref()
                    .is_none_or(|p| p.split(' ').any(|x| x == AS_CONTEXT)));
        if is_ap {
            ap_q = ap_q.max(q);
        } else if matches!(
            media.as_str(),
            "text/html" | "application/xhtml+xml" | "text/*" | "*/*"
        ) {
            html_q = html_q.max(q);
        }
    }
    ap_q > 0.0 && ap_q >= html_q
}

// --- Text -------------------------------------------------------------------------------

/// Escape text for HTML: `&`, `<`, `>`, `"` and `'`. Safe in element content and in a
/// quoted attribute.
pub fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 8);
    for ch in s.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(ch),
        }
    }
    out
}

/// Plain text to the small HTML subset ActivityPub `content` and `summary` carry: escaped,
/// a `<p>` per blank-line-separated paragraph, `<br>` for a single line break.
pub fn text_to_html(text: &str) -> String {
    text.split("\n\n")
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(|p| format!("<p>{}</p>", escape_html(p).replace('\n', "<br>")))
        .collect()
}

/// Percent-encode a query value (a cursor in a collection page id, say).
pub fn encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

/// A profile field, the `PropertyValue` attachment Mastodon and others render as a row
/// on the profile. `value` may hold a little HTML (a link); escape anything else first.
/// The document's `@context` must map `PropertyValue` and `value` (to Schema.org).
pub fn property_value(name: &str, value: &str) -> Value {
    json!({ "type": "PropertyValue", "name": name, "value": value })
}

// --- WebFinger -----------------------------------------------------------------------------

/// Why a WebFinger lookup failed.
#[derive(Debug, PartialEq, Eq)]
pub enum WebfingerError {
    /// No `resource`, or one that cannot be parsed: answer 400.
    BadRequest(&'static str),
    /// A well-formed resource on another host, or not an actor path here: answer 404.
    NotFound,
}

/// The user part of a WebFinger `resource` on `host`, lower-cased.
///
/// Accepts `acct:{user}@{host}` (the `acct:` is optional, and so is a leading `@`, since
/// some clients send either) and an actor or page URL, `https://{host}/{actor_prefix}{user}`
/// (`actor_prefix` is, for example, `"c/"` or `"e/"`). The host compares
/// case-insensitively. The result is **not** validated: check it against the host's own
/// rule (a slug, a handle) before using it, and answer [`WebfingerError::NotFound`] if it
/// fails.
pub fn webfinger_user(
    resource: Option<&str>,
    host: &str,
    actor_prefix: &str,
) -> Result<String, WebfingerError> {
    let r = resource
        .map(str::trim)
        .filter(|r| !r.is_empty())
        .ok_or(WebfingerError::BadRequest(
            "the resource parameter is required",
        ))?;
    let user = if let Some(rest) = r.strip_prefix("https://") {
        let (h, path) = rest.split_once('/').unwrap_or((rest, ""));
        if !h.eq_ignore_ascii_case(host) {
            return Err(WebfingerError::NotFound);
        }
        path.strip_prefix(actor_prefix)
            .ok_or(WebfingerError::NotFound)?
            .to_string()
    } else {
        let acct = r.strip_prefix("acct:").unwrap_or(r);
        let acct = acct.strip_prefix('@').unwrap_or(acct);
        let (user, h) = acct
            .rsplit_once('@')
            .ok_or(WebfingerError::BadRequest("expected acct:{name}@{host}"))?;
        if !h.eq_ignore_ascii_case(host) {
            return Err(WebfingerError::NotFound);
        }
        user.to_string()
    };
    Ok(user.to_ascii_lowercase())
}

/// A JRD (RFC 7033): `subject`, `aliases` and `links`.
pub fn jrd(subject: &str, aliases: &[&str], links: Vec<Value>) -> Value {
    json!({ "subject": subject, "aliases": aliases, "links": links })
}

/// The JRD link to the actor document.
pub fn self_link(actor: &str) -> Value {
    json!({ "rel": "self", "type": ACTIVITY_JSON, "href": actor })
}

/// The JRD link to the page a person reads.
pub fn profile_page_link(page: &str) -> Value {
    json!({ "rel": PROFILE_PAGE_REL, "type": "text/html", "href": page })
}

/// `/.well-known/host-meta` (XRD): where this host's WebFinger lives. Serve it as
/// `application/xrd+xml`. `site_url` has no trailing slash.
pub fn host_meta(site_url: &str) -> String {
    format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<XRD xmlns=\"http://docs.oasis-open.org/ns/xri/xrd-1.0\">\n  <Link rel=\"lrdd\" type=\"application/jrd+json\" template=\"{}/.well-known/webfinger?resource={{uri}}\"/>\n</XRD>\n",
        site_url.trim_end_matches('/')
    )
}

// --- NodeInfo ---------------------------------------------------------------------------------

/// `/.well-known/nodeinfo`: where the NodeInfo 2.1 document lives (`{site_url}/nodeinfo/2.1`).
pub fn nodeinfo_links(site_url: &str) -> Value {
    json!({
        "links": [
            { "rel": NODEINFO_PROFILE, "href": format!("{}/nodeinfo/2.1", site_url.trim_end_matches('/')) }
        ]
    })
}

/// What a host says about itself in NodeInfo.
#[derive(Clone, Debug)]
pub struct NodeInfo<'a> {
    /// `software.name`, lower case with hyphens (`mukoko-circles`, `mukoko-kweli`).
    pub software: &'a str,
    /// `software.version`.
    pub version: &'a str,
    /// `software.repository`.
    pub repository: &'a str,
    /// `software.homepage`, the site.
    pub homepage: &'a str,
    /// `metadata`: anything else (`nodeName`, `nodeDescription`, counts).
    pub metadata: Value,
}

/// NodeInfo 2.1 for a read-only host whose actors are not user accounts: `activitypub`
/// only, registrations closed (people sign up in the Mukoko app), no user counts.
/// Serve it with [`NODEINFO_JSON`].
pub fn nodeinfo(info: &NodeInfo<'_>) -> Value {
    json!({
        "version": "2.1",
        "software": {
            "name": info.software,
            "version": info.version,
            "repository": info.repository,
            "homepage": info.homepage
        },
        "protocols": ["activitypub"],
        "services": { "inbound": [], "outbound": [] },
        "openRegistrations": false,
        "usage": { "users": {} },
        "metadata": info.metadata
    })
}

// --- Collections and activities ------------------------------------------------------------------

/// An outbox (or any `OrderedCollection`) that points at its first page,
/// `{id}?page=true`.
pub fn ordered_collection(context: Value, id: &str, total_items: u64) -> Value {
    json!({
        "@context": context,
        "id": id,
        "type": "OrderedCollection",
        "totalItems": total_items,
        "first": format!("{id}?page=true"),
    })
}

/// The id of a collection page: `{collection}?page=true`, plus `&cursor=` (percent-encoded)
/// when there is one.
pub fn page_id(collection: &str, cursor: Option<&str>) -> String {
    match cursor {
        Some(c) => format!("{collection}?page=true&cursor={}", encode(c)),
        None => format!("{collection}?page=true"),
    }
}

/// One `OrderedCollectionPage` of `collection`: `items` newest first (each without its own
/// `@context`), and `next` when another page follows (its cursor).
pub fn ordered_collection_page(
    context: Value,
    collection: &str,
    cursor: Option<&str>,
    items: Vec<Value>,
    next: Option<&str>,
) -> Value {
    let mut v = json!({
        "@context": context,
        "id": page_id(collection, cursor),
        "type": "OrderedCollectionPage",
        "partOf": collection,
        "orderedItems": items.into_iter().map(without_context).collect::<Vec<_>>(),
    });
    if let Some(n) = next {
        v["next"] = json!(page_id(collection, Some(n)));
    }
    v
}

/// An activity addressed to the public and to `cc` (the actor's followers, say), with its
/// `published` date when known. `object` is embedded without its `@context`, or is an id.
pub fn public_activity(
    kind: &str,
    id: &str,
    actor: &str,
    object: Value,
    cc: &[&str],
    published: Option<&str>,
) -> Value {
    let mut v = Map::new();
    v.insert("id".into(), json!(id));
    v.insert("type".into(), json!(kind));
    v.insert("actor".into(), json!(actor));
    v.insert("to".into(), json!([AS_PUBLIC]));
    v.insert("cc".into(), json!(cc));
    if let Some(p) = published {
        v.insert("published".into(), json!(p));
    }
    v.insert("object".into(), without_context(object));
    Value::Object(v)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conneg() {
        let browser = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
        assert!(!wants_activity_json(Some(browser)));
        assert!(!wants_activity_json(None));
        assert!(!wants_activity_json(Some("*/*")));
        assert!(wants_activity_json(Some("application/activity+json")));
        assert!(wants_activity_json(Some(
            r#"application/ld+json; profile="https://www.w3.org/ns/activitystreams""#
        )));
        assert!(!wants_activity_json(Some(
            r#"application/ld+json; profile="https://example.org/other""#
        )));
        assert!(!wants_activity_json(Some(
            "text/html, application/activity+json;q=0.5"
        )));
        assert!(wants_activity_json(Some(
            "text/html;q=0.5, application/activity+json"
        )));
    }

    #[test]
    fn text() {
        assert_eq!(
            escape_html(r#"<a href="x">'&'</a>"#),
            "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
        );
        assert_eq!(
            text_to_html("one\ntwo\n\n<three>"),
            "<p>one<br>two</p><p>&lt;three&gt;</p>"
        );
        assert_eq!(text_to_html("  \n\n "), "");
        assert_eq!(encode("a b&c"), "a+b%26c");
    }

    #[test]
    fn contexts() {
        assert_eq!(context(json!({})), json!(AS_CONTEXT));
        assert_eq!(context(Value::Null), json!(AS_CONTEXT));
        let c = context(json!({ "toot": "http://joinmastodon.org/ns#" }));
        assert_eq!(c[0], AS_CONTEXT);
        assert_eq!(c[1]["toot"], "http://joinmastodon.org/ns#");
        let d = with_context(json!({ "id": "x" }), c.clone());
        assert_eq!(d["@context"], c);
        assert!(without_context(d).get("@context").is_none());
    }

    #[test]
    fn webfinger_parsing() {
        let h = "kweli.mukoko.com";
        assert_eq!(
            webfinger_user(Some("acct:HarareArts@kweli.mukoko.com"), h, "e/"),
            Ok("hararearts".into())
        );
        assert_eq!(
            webfinger_user(Some("@a_b@KWELI.mukoko.com"), h, "e/"),
            Ok("a_b".into())
        );
        assert_eq!(
            webfinger_user(Some("a_b@kweli.mukoko.com"), h, "e/"),
            Ok("a_b".into())
        );
        assert_eq!(
            webfinger_user(Some("https://kweli.mukoko.com/e/Abc"), h, "e/"),
            Ok("abc".into())
        );
        assert_eq!(
            webfinger_user(Some("https://kweli.mukoko.com/c/abc"), h, "e/"),
            Err(WebfingerError::NotFound)
        );
        assert_eq!(
            webfinger_user(Some("acct:abc@circles.mukoko.com"), h, "e/"),
            Err(WebfingerError::NotFound)
        );
        assert_eq!(
            webfinger_user(Some("https://evil.example/e/abc"), h, "e/"),
            Err(WebfingerError::NotFound)
        );
        assert!(matches!(
            webfinger_user(None, h, "e/"),
            Err(WebfingerError::BadRequest(_))
        ));
        assert!(matches!(
            webfinger_user(Some("  "), h, "e/"),
            Err(WebfingerError::BadRequest(_))
        ));
        assert!(matches!(
            webfinger_user(Some("acct:nohost"), h, "e/"),
            Err(WebfingerError::BadRequest(_))
        ));
        // Unvalidated by design: the host applies its own rule.
        assert_eq!(
            webfinger_user(Some("acct:../x@kweli.mukoko.com"), h, "e/"),
            Ok("../x".into())
        );
    }

    #[test]
    fn jrd_and_discovery() {
        let actor = "https://kweli.mukoko.com/e/a_b";
        let j = jrd(
            "acct:A_B@kweli.mukoko.com",
            &[actor],
            vec![self_link(actor), profile_page_link(actor)],
        );
        assert_eq!(j["subject"], "acct:A_B@kweli.mukoko.com");
        assert_eq!(j["aliases"][0], actor);
        assert_eq!(j["links"][0]["rel"], "self");
        assert_eq!(j["links"][1]["rel"], PROFILE_PAGE_REL);
        assert!(
            host_meta("https://kweli.mukoko.com/")
                .contains("https://kweli.mukoko.com/.well-known/webfinger?resource={uri}")
        );
        assert_eq!(
            nodeinfo_links("https://kweli.mukoko.com")["links"][0]["href"],
            "https://kweli.mukoko.com/nodeinfo/2.1"
        );
        let n = nodeinfo(&NodeInfo {
            software: "mukoko-kweli",
            version: "0.1.0",
            repository: "https://github.com/mukoko-dev/kweli",
            homepage: "https://kweli.mukoko.com",
            metadata: json!({ "nodeName": "Mukoko Kweli" }),
        });
        assert_eq!(n["software"]["name"], "mukoko-kweli");
        assert_eq!(n["openRegistrations"], false);
        assert_eq!(n["protocols"][0], "activitypub");
        assert_eq!(n["metadata"]["nodeName"], "Mukoko Kweli");
    }

    #[test]
    fn collections() {
        let outbox = "https://circles.mukoko.com/c/a/outbox";
        let c = ordered_collection(context(json!({})), outbox, 3);
        assert_eq!(c["first"], format!("{outbox}?page=true"));
        assert_eq!(c["totalItems"], 3);
        let item = json!({ "@context": AS_CONTEXT, "id": "x", "type": "Create" });
        let p = ordered_collection_page(
            context(json!({})),
            outbox,
            Some("a b"),
            vec![item],
            Some("9"),
        );
        assert_eq!(p["id"], format!("{outbox}?page=true&cursor=a+b"));
        assert_eq!(p["next"], format!("{outbox}?page=true&cursor=9"));
        assert_eq!(p["partOf"], outbox);
        assert!(p["orderedItems"][0].get("@context").is_none());
        let last = ordered_collection_page(context(json!({})), outbox, None, vec![], None);
        assert!(last.get("next").is_none());
    }

    #[test]
    fn activities() {
        let a = public_activity(
            "Announce",
            "https://k/e/a/activities/post-1",
            "https://k/e/a",
            json!("https://c/c/x/posts/1"),
            &["https://k/e/a/followers"],
            Some("2026-10-04T10:00:00Z"),
        );
        assert_eq!(a["to"][0], AS_PUBLIC);
        assert_eq!(a["cc"][0], "https://k/e/a/followers");
        assert_eq!(a["object"], "https://c/c/x/posts/1");
        assert_eq!(a["published"], "2026-10-04T10:00:00Z");
        let b = public_activity(
            "Create",
            "i",
            "a",
            json!({ "@context": AS_CONTEXT, "id": "n" }),
            &[],
            None,
        );
        assert!(b["object"].get("@context").is_none());
        assert!(b.get("published").is_none());
        assert_eq!(
            property_value("Verified", "Tier 2")["type"],
            "PropertyValue"
        );
    }
}
