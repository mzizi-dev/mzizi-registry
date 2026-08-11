//! Mzizi N10 documentation — the read layer over published documentation.
//!
//! The Rust implementation of `nyuchi-docs-api`. Routing and response shaping;
//! the host owns the data source and the credential.
//!
//! # Two security defects in the TypeScript, both structurally impossible here
//!
//! **1. Filter-structure injection.** The `.ts` builds a PostgREST filter by
//! string interpolation from a URL path segment:
//!
//! ```text
//! .or(`name.eq.${identifier},target.eq.${identifier}`)
//! ```
//!
//! `identifier` is `rest[0]` — whatever the caller put in the path, unescaped.
//! PostgREST reads `,` as a disjunction separator and `.` as the operator
//! separator, so `/ai-instructions/x,status.eq.draft` does not look up `x`; it
//! adds a condition. The `.eq("status", "active")` above is a separate `and`
//! term, so what the injected clause widens is which rows the `or` matches, and
//! a caller can enumerate rows the route was written to keep hidden. This is the
//! same class `lib/db`'s `searchComponents` carries a comment about having
//! removed — "the old implementation had to strip PostgREST-significant
//! characters to avoid filter-structure injection" — so the app fixed it and the
//! published component did not.
//!
//! Here the identifier never becomes filter syntax. [`Route::AiInstruction`]
//! carries it as a value, and [`DocsStore::ai_instruction_by_name_or_target`]
//! receives it as a parameter for the host to bind. There is no string to
//! restructure.
//!
//! **2. A service-role credential in a publicly installable component.** The
//! `.ts` reads `SUPABASE_SERVICE_ROLE_KEY`, so anyone who runs `shadcn add` on
//! this item installs a function that bypasses RLS — over a read layer for
//! *published* documentation, which needs no such thing. Its own header says as
//! much and calls it out of scope.
//!
//! It is in scope for this port, and the fix is structural rather than a swapped
//! constant: this module holds no client and reads no environment. The host
//! implements [`DocsStore`] with whatever identity it judges correct, and an
//! anon client under RLS satisfies the trait completely.
//!
//! **The `.ts` sibling still has both.** Neither is fixed by this file.
//!
//! # What this owns
//!
//! Parsing a path into a [`Route`], asking a [`DocsStore`], and shaping the
//! answer into an [`ApiResponse`] with the right status and headers. It does not
//! serve — `Deno.serve` has no Rust equivalent worth pretending to, and the same
//! division holds as in N8, which builds an OTLP request and lets the host send
//! it.

use std::collections::BTreeMap;

/// CORS headers, matching the `.ts`.
#[must_use]
pub fn cors_headers() -> Vec<(&'static str, &'static str)> {
    vec![
        ("Access-Control-Allow-Origin", "*"),
        (
            "Access-Control-Allow-Headers",
            "authorization, x-client-info, apikey, content-type",
        ),
        ("Access-Control-Allow-Methods", "GET, OPTIONS"),
    ]
}

/// Cache headers, matching the `.ts`.
#[must_use]
pub fn cache_headers() -> Vec<(&'static str, &'static str)> {
    vec![(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
    )]
}

/// A route this API answers.
///
/// An enum rather than nested string comparisons, so an unhandled combination is
/// a compile error in the host's `match` instead of a fallthrough to 404.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Route {
    /// `OPTIONS *` — CORS preflight.
    Preflight,
    /// `GET /counts`
    Counts,
    /// `GET /docs`
    DocsList,
    /// `GET /docs/:slug`
    Doc(String),
    /// `GET /docs/category/:category`
    DocsByCategory(String),
    /// `GET /ai-instructions`
    AiInstructionsList,
    /// `GET /ai-instructions/:identifier` — matched against name OR target.
    AiInstruction(String),
    /// `GET /architecture`
    Architecture,
    /// `GET /architecture/nodes`
    ArchitectureNodes,
    /// `GET /architecture/axes`
    ///
    /// Retained because the `.ts` exposes it, but see [`Route::ARCHITECTURE_AXES_IS_RETIRED`].
    ArchitectureAxes,
    /// `GET /changelog?limit=&offset=`
    Changelog {
        /// Clamped to 100, as in the `.ts`.
        limit: u32,
        /// Clamped to at least 0 — unsigned here, so that is free.
        offset: u32,
    },
    /// `GET /changelog/:version`
    ChangelogEntry(String),
    /// Anything else.
    NotFound,
    /// A method other than GET or OPTIONS.
    MethodNotAllowed,
}

impl Route {
    /// `/architecture/axes` describes the retired layer-and-axis model.
    ///
    /// `mzizi.dev/api/v1/architecture/axes` answers `410 Gone` today. The route
    /// is kept here so a host serving the `.ts`'s published surface can decide
    /// deliberately — answer it, or return 410 to match production — rather than
    /// discovering the discrepancy from a consumer.
    pub const ARCHITECTURE_AXES_IS_RETIRED: bool = true;

    /// Default page size for `/changelog`, matching the `.ts`.
    pub const CHANGELOG_DEFAULT_LIMIT: u32 = 20;
    /// Hard cap on `/changelog` page size, matching the `.ts` `Math.min(limit, 100)`.
    pub const CHANGELOG_MAX_LIMIT: u32 = 100;
}

/// Parse a query string into its pairs. Last value wins, as `URLSearchParams.get` does.
fn query_pairs(query: &str) -> BTreeMap<&str, &str> {
    let mut out = BTreeMap::new();
    for pair in query.split('&').filter(|p| !p.is_empty()) {
        let (k, v) = pair.split_once('=').unwrap_or((pair, ""));
        out.insert(k, v);
    }
    out
}

/// Read a `u32` query param, falling back when absent or unparseable.
///
/// The `.ts` uses `parseInt`, which yields `NaN` for `?limit=abc`; `Math.min(NaN,
/// 100)` is `NaN`, and `NaN` then goes to the database as the page size. Here an
/// unparseable value takes the default, which is what the caller meant and what
/// the database can act on.
fn u32_param(params: &BTreeMap<&str, &str>, key: &str, default: u32) -> u32 {
    params
        .get(key)
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

/// Route a request.
///
/// `method` is compared case-sensitively against `GET`/`OPTIONS`, as the `.ts`
/// compares `req.method`.
#[must_use]
pub fn route(method: &str, path: &str, query: &str) -> Route {
    if method == "OPTIONS" {
        return Route::Preflight;
    }
    if method != "GET" {
        return Route::MethodNotAllowed;
    }

    let segments: Vec<&str> = path
        .trim_start_matches('/')
        .split('/')
        .filter(|s| !s.is_empty())
        .collect();

    match segments.as_slice() {
        ["counts"] => Route::Counts,

        ["docs"] => Route::DocsList,
        ["docs", "category"] => Route::NotFound,
        ["docs", "category", category] => Route::DocsByCategory((*category).to_owned()),
        ["docs", slug] => Route::Doc((*slug).to_owned()),

        ["ai-instructions"] => Route::AiInstructionsList,
        ["ai-instructions", id] => Route::AiInstruction((*id).to_owned()),

        ["architecture"] => Route::Architecture,
        ["architecture", "nodes"] => Route::ArchitectureNodes,
        ["architecture", "axes"] => Route::ArchitectureAxes,

        ["changelog"] => {
            let params = query_pairs(query);
            Route::Changelog {
                limit: u32_param(&params, "limit", Route::CHANGELOG_DEFAULT_LIMIT)
                    .min(Route::CHANGELOG_MAX_LIMIT),
                offset: u32_param(&params, "offset", 0),
            }
        }
        ["changelog", version] => Route::ChangelogEntry((*version).to_owned()),

        _ => Route::NotFound,
    }
}

/// What a store hands back: a JSON document, already serialised.
///
/// An opaque `String` rather than a parsed value, because this module reshapes
/// nothing — the `.ts` passes rows through untouched and so does this. Keeping it
/// opaque also means no JSON dependency, matching N8, N9 and N11.
pub type JsonDoc = String;

/// Why a store could not answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StoreError {
    /// The row does not exist. Becomes 404.
    NotFound,
    /// Anything else. Becomes 500, and the message is NOT returned to the caller.
    Backend(String),
}

/// The data the routes need.
///
/// A trait, so this component holds no client and no credential. Every method
/// takes its filter values as PARAMETERS — never as a fragment of query syntax —
/// which is what makes the `.ts`'s `or(...)` injection unrepresentable here.
///
/// An implementation backed by an anon Supabase client under RLS satisfies this
/// completely; nothing in the contract needs service-role.
pub trait DocsStore {
    /// `get_system_counts()`.
    fn system_counts(&self) -> Result<JsonDoc, StoreError>;
    /// Published pages, metadata only, ordered by category then sort order.
    fn docs_list(&self) -> Result<JsonDoc, StoreError>;
    /// One published page by slug, with its content.
    fn doc_by_slug(&self, slug: &str) -> Result<JsonDoc, StoreError>;
    /// Published pages in one category, ordered by sort order.
    fn docs_by_category(&self, category: &str) -> Result<JsonDoc, StoreError>;
    /// Active instruction sets, metadata only.
    fn ai_instructions_list(&self) -> Result<JsonDoc, StoreError>;
    /// The latest active instruction set whose NAME or TARGET equals `identifier`.
    ///
    /// Two bound parameters and a disjunction the implementation writes itself.
    /// The identifier is a value here and can never become filter structure.
    fn ai_instruction_by_name_or_target(&self, identifier: &str) -> Result<JsonDoc, StoreError>;
    /// `get_architecture()`.
    fn architecture(&self) -> Result<JsonDoc, StoreError>;
    /// `get_node_counts()`.
    fn architecture_nodes(&self) -> Result<JsonDoc, StoreError>;
    /// `get_axes_summary()`. See [`Route::ARCHITECTURE_AXES_IS_RETIRED`].
    fn architecture_axes(&self) -> Result<JsonDoc, StoreError>;
    /// `list_changelog(limit, offset)`.
    fn changelog(&self, limit: u32, offset: u32) -> Result<JsonDoc, StoreError>;
    /// `get_changelog_entry(version)`.
    fn changelog_entry(&self, version: &str) -> Result<JsonDoc, StoreError>;
}

/// A response for the host to send.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApiResponse {
    /// HTTP status.
    pub status: u16,
    /// Headers, including CORS.
    pub headers: Vec<(String, String)>,
    /// Body. Empty for a preflight.
    pub body: String,
}

fn respond(status: u16, body: String, cache: bool) -> ApiResponse {
    let mut headers: Vec<(String, String)> =
        vec![("Content-Type".to_owned(), "application/json".to_owned())];
    headers.extend(
        cors_headers()
            .into_iter()
            .map(|(k, v)| (k.to_owned(), v.to_owned())),
    );
    if cache {
        headers.extend(
            cache_headers()
                .into_iter()
                .map(|(k, v)| (k.to_owned(), v.to_owned())),
        );
    }
    ApiResponse {
        status,
        headers,
        body,
    }
}

/// An error body. The message is a fixed string chosen here, never the backend's.
///
/// The `.ts` returns `err.message` from PostgREST with a 500 — which leaks table
/// names, column names and constraint text to any caller who can provoke an
/// error. [`StoreError::Backend`] carries the detail for the host to log; the
/// caller gets the status and nothing else.
fn error_response(status: u16, message: &str) -> ApiResponse {
    let mut body = String::from("{\"error\":\"");
    for c in message.chars() {
        match c {
            '"' => body.push_str("\\\""),
            '\\' => body.push_str("\\\\"),
            '\n' => body.push_str("\\n"),
            c if (c as u32) < 0x20 => body.push(' '),
            c => body.push(c),
        }
    }
    body.push_str("\"}");
    respond(status, body, false)
}

/// Answer a route from a store.
///
/// Returns the response, plus any backend detail the host should log rather than
/// send. Splitting them is what stops the `.ts`'s habit of returning
/// `err.message` to the caller.
pub fn handle<S: DocsStore + ?Sized>(route: &Route, store: &S) -> (ApiResponse, Option<String>) {
    let result = match route {
        Route::Preflight => {
            let headers = cors_headers()
                .into_iter()
                .map(|(k, v)| (k.to_owned(), v.to_owned()))
                .collect();
            return (
                ApiResponse {
                    status: 204,
                    headers,
                    body: String::new(),
                },
                None,
            );
        }
        Route::MethodNotAllowed => {
            return (error_response(405, "Method not allowed"), None);
        }
        Route::NotFound => return (error_response(404, "Not found"), None),

        Route::Counts => store.system_counts(),
        Route::DocsList => store.docs_list(),
        Route::Doc(slug) => store.doc_by_slug(slug),
        Route::DocsByCategory(c) => store.docs_by_category(c),
        Route::AiInstructionsList => store.ai_instructions_list(),
        Route::AiInstruction(id) => store.ai_instruction_by_name_or_target(id),
        Route::Architecture => store.architecture(),
        Route::ArchitectureNodes => store.architecture_nodes(),
        Route::ArchitectureAxes => store.architecture_axes(),
        Route::Changelog { limit, offset } => store.changelog(*limit, *offset),
        Route::ChangelogEntry(v) => store.changelog_entry(v),
    };

    match result {
        Ok(body) => (respond(200, body, true), None),
        Err(StoreError::NotFound) => (error_response(404, "Not found"), None),
        Err(StoreError::Backend(detail)) => {
            (error_response(500, "Internal server error"), Some(detail))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Spy {
        last_identifier: std::cell::RefCell<Option<String>>,
    }

    impl Spy {
        fn new() -> Self {
            Self {
                last_identifier: std::cell::RefCell::new(None),
            }
        }
    }

    macro_rules! ok {
        ($v:expr) => {
            Ok($v.to_owned())
        };
    }

    impl DocsStore for Spy {
        fn system_counts(&self) -> Result<JsonDoc, StoreError> {
            ok!("{\"components\":575}")
        }
        fn docs_list(&self) -> Result<JsonDoc, StoreError> {
            ok!("[]")
        }
        fn doc_by_slug(&self, slug: &str) -> Result<JsonDoc, StoreError> {
            if slug == "missing" {
                Err(StoreError::NotFound)
            } else {
                ok!(format!("{{\"slug\":\"{slug}\"}}"))
            }
        }
        fn docs_by_category(&self, _: &str) -> Result<JsonDoc, StoreError> {
            ok!("[]")
        }
        fn ai_instructions_list(&self) -> Result<JsonDoc, StoreError> {
            ok!("[]")
        }
        fn ai_instruction_by_name_or_target(&self, id: &str) -> Result<JsonDoc, StoreError> {
            *self.last_identifier.borrow_mut() = Some(id.to_owned());
            ok!("{}")
        }
        fn architecture(&self) -> Result<JsonDoc, StoreError> {
            ok!("{}")
        }
        fn architecture_nodes(&self) -> Result<JsonDoc, StoreError> {
            ok!("[]")
        }
        fn architecture_axes(&self) -> Result<JsonDoc, StoreError> {
            ok!("[]")
        }
        fn changelog(&self, limit: u32, offset: u32) -> Result<JsonDoc, StoreError> {
            ok!(format!("{{\"limit\":{limit},\"offset\":{offset}}}"))
        }
        fn changelog_entry(&self, _: &str) -> Result<JsonDoc, StoreError> {
            Err(StoreError::Backend(
                "relation \"changelog\" does not exist".to_owned(),
            ))
        }
    }

    #[test]
    fn routes_match_the_documented_surface() {
        assert_eq!(route("GET", "/counts", ""), Route::Counts);
        assert_eq!(route("GET", "/docs", ""), Route::DocsList);
        assert_eq!(route("GET", "/docs/intro", ""), Route::Doc("intro".into()));
        assert_eq!(
            route("GET", "/docs/category/guides", ""),
            Route::DocsByCategory("guides".into())
        );
        assert_eq!(
            route("GET", "/ai-instructions", ""),
            Route::AiInstructionsList
        );
        assert_eq!(
            route("GET", "/architecture/nodes", ""),
            Route::ArchitectureNodes
        );
        assert_eq!(route("GET", "/nope", ""), Route::NotFound);
    }

    #[test]
    fn a_bare_category_path_is_not_a_slug_called_category() {
        // The .ts checks `sub !== "category"` to avoid exactly this.
        assert_eq!(route("GET", "/docs/category", ""), Route::NotFound);
    }

    #[test]
    fn method_handling_matches() {
        assert_eq!(route("OPTIONS", "/docs", ""), Route::Preflight);
        assert_eq!(route("POST", "/docs", ""), Route::MethodNotAllowed);
        let (r, _) = handle(&Route::MethodNotAllowed, &Spy::new());
        assert_eq!(r.status, 405);
    }

    #[test]
    fn changelog_paging_clamps_like_the_typescript() {
        assert_eq!(
            route("GET", "/changelog", "limit=500"),
            Route::Changelog {
                limit: 100,
                offset: 0
            }
        );
        assert_eq!(
            route("GET", "/changelog", "limit=5&offset=10"),
            Route::Changelog {
                limit: 5,
                offset: 10
            }
        );
    }

    #[test]
    fn an_unparseable_limit_takes_the_default_not_nan() {
        // parseInt("abc") is NaN in the .ts, and NaN reaches the database.
        assert_eq!(
            route("GET", "/changelog", "limit=abc"),
            Route::Changelog {
                limit: 20,
                offset: 0
            }
        );
    }

    #[test]
    fn a_negative_offset_cannot_be_expressed() {
        // The .ts needs Math.max(offset, 0); u32 makes it unrepresentable.
        assert_eq!(
            route("GET", "/changelog", "offset=-5"),
            Route::Changelog {
                limit: 20,
                offset: 0
            }
        );
    }

    #[test]
    fn an_injection_attempt_stays_one_opaque_value() {
        // The .ts interpolates this into `or(name.eq.${id},target.eq.${id})`,
        // where the comma and dots are filter STRUCTURE.
        let hostile = "x,status.eq.draft";
        let r = route("GET", &format!("/ai-instructions/{hostile}"), "");
        assert_eq!(r, Route::AiInstruction(hostile.to_owned()));

        let spy = Spy::new();
        let (resp, _) = handle(&r, &spy);
        assert_eq!(resp.status, 200);
        // It reached the store as ONE parameter, intact and unsplit — there is no
        // filter string for it to be part of.
        assert_eq!(spy.last_identifier.borrow().as_deref(), Some(hostile));
    }

    #[test]
    fn backend_detail_is_logged_not_returned() {
        let (resp, log) = handle(&Route::ChangelogEntry("4.0.0".into()), &Spy::new());
        assert_eq!(resp.status, 500);
        assert!(resp.body.contains("Internal server error"));
        // The .ts returns err.message, which names the relation.
        assert!(!resp.body.contains("relation"));
        assert!(log.unwrap().contains("relation"));
    }

    #[test]
    fn not_found_from_the_store_becomes_404() {
        let (resp, log) = handle(&Route::Doc("missing".into()), &Spy::new());
        assert_eq!(resp.status, 404);
        assert!(log.is_none());
    }

    #[test]
    fn successful_responses_carry_cors_and_cache() {
        let (resp, _) = handle(&Route::Counts, &Spy::new());
        assert_eq!(resp.status, 200);
        let names: Vec<&str> = resp.headers.iter().map(|(k, _)| k.as_str()).collect();
        assert!(names.contains(&"Access-Control-Allow-Origin"));
        assert!(names.contains(&"Cache-Control"));
    }

    #[test]
    fn errors_carry_cors_but_not_cache() {
        let (resp, _) = handle(&Route::NotFound, &Spy::new());
        let names: Vec<&str> = resp.headers.iter().map(|(k, _)| k.as_str()).collect();
        assert!(names.contains(&"Access-Control-Allow-Origin"));
        assert!(
            !names.contains(&"Cache-Control"),
            "a 404 must not be cached for 60s"
        );
    }

    #[test]
    fn preflight_has_no_body() {
        let (resp, _) = handle(&Route::Preflight, &Spy::new());
        assert_eq!(resp.status, 204);
        assert!(resp.body.is_empty());
    }

    #[test]
    fn error_bodies_escape_their_message() {
        let r = error_response(400, "bad \"quoted\" thing");
        assert!(r.body.contains("\\\"quoted\\\""));
    }
}
