//! NYUCHI DEEP LINK HANDLER — N7 shell, Dioxus.
//!
//! The Rust sibling of `nyuchi-deep-link-handler.tsx`: match an incoming URL against a list
//! of routes and dispatch the first one that fits.
//!
//! # What is actually being ported
//!
//! The `.tsx` component is thin — `<div>{children}</div>` plus two `useEffect`s wiring
//! `window.addEventListener` for `popstate`/a custom event and the initial URL. Browser event
//! wiring is not something a registry crate can usefully abstract across Dioxus's web/desktop/
//! mobile targets without guessing which one the consumer is building for. What is genuinely
//! portable, and what this actually ports, is the MATCHING ALGORITHM: given a URL and a route
//! table, which handler fires and with what captured parameters. [`resolve`] is that function,
//! fully unit-testable with no DOM. The `#[component]` wrapper renders the same
//! `data-slot`/`data-portal` div and takes the resolved outcome as a prop, so a host wires
//! its own event source (`window.addEventListener`, a router's location, a deep-link intent
//! on mobile) and calls [`resolve`] itself.
//!
//! # A silent-failure mode in the TypeScript, not reproduced
//!
//! For a `RegExp` route (as opposed to a `":param"` string pattern), the `.tsx` requires
//! `match.groups` to be truthy before calling the handler:
//!
//! ```text
//! const match = url.match(route.pattern)
//! if (match?.groups) { route.handler(match.groups); return }
//! ```
//!
//! A plain `RegExp` with no named capture groups — `/^\/settings$/`, say — matches the URL
//! but produces `groups: undefined`, so the condition is false and the route is treated as
//! not matching at all. A route with a literal pattern and no params can never fire, and
//! nothing says why: it falls through to `onUnmatched` exactly as if the URL were unrelated.
//!
//! [`RoutePattern::Regex`] does not require named groups: a bare match is enough, and
//! [`Captures`] is empty when there are none. A route with no params behaves like a route
//! with no params, not like a route that silently does not exist.
//!
//! **The `.tsx` sibling still has this.**

use std::collections::BTreeMap;

use dioxus::prelude::*;
use regex::Regex;

/// Named parameters captured out of a URL by a matching route.
pub type Captures = BTreeMap<String, String>;

/// How a route's pattern is expressed.
#[derive(Debug, Clone)]
pub enum RoutePattern {
    /// A path template with `:name` segments, e.g. `/users/:id`. Converted to an anchored
    /// regex with one named capture group per segment, exactly as the `.tsx`'s
    /// `pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)")` does.
    Template(String),
    /// A raw, pre-anchored regex. Unlike the `.tsx`, a match with no named groups is not
    /// treated as a non-match — see the module docs.
    Regex(Regex),
}

/// One deep-link route: a pattern and an identifier the host resolves to a handler.
///
/// The `.tsx`'s `handler` is a closure held on the route; here `id` is a plain value and the
/// host looks up its own handler after [`resolve`] returns, keeping this module free of
/// `Box<dyn Fn>` and the lifetime questions that come with it.
#[derive(Debug, Clone)]
pub struct Route {
    /// The pattern to match.
    pub pattern: RoutePattern,
    /// Opaque identifier the host maps back to a handler.
    pub id: String,
}

impl Route {
    /// A route from a `:param` template.
    #[must_use]
    pub fn template(pattern: &str, id: &str) -> Self {
        Self {
            pattern: RoutePattern::Template(pattern.to_owned()),
            id: id.to_owned(),
        }
    }

    /// A route from a raw regex.
    #[must_use]
    pub fn regex(pattern: Regex, id: &str) -> Self {
        Self {
            pattern: RoutePattern::Regex(pattern),
            id: id.to_owned(),
        }
    }

    fn compiled(&self) -> Option<Regex> {
        match &self.pattern {
            RoutePattern::Regex(r) => Some(r.clone()),
            RoutePattern::Template(t) => {
                // `:name` → `(?P<name>[^/]+)`, anchored — the Rust equivalent of the `.tsx`'s
                // `"^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"`.
                let mut out = String::from("^");
                let mut chars = t.chars().peekable();
                while let Some(c) = chars.next() {
                    if c == ':' {
                        let mut name = String::new();
                        while let Some(&n) = chars.peek() {
                            if n.is_alphanumeric() || n == '_' {
                                name.push(n);
                                chars.next();
                            } else {
                                break;
                            }
                        }
                        out.push_str(&format!("(?P<{name}>[^/]+)"));
                    } else {
                        // Escape regex metacharacters from the literal segments, which a
                        // template author does not expect to need escaping in a path.
                        if "\\.+*?()|[]{}^$".contains(c) {
                            out.push('\\');
                        }
                        out.push(c);
                    }
                }
                out.push('$');
                Regex::new(&out).ok()
            }
        }
    }
}

/// What matching a URL against a route table produced.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveOutcome {
    /// A route matched. Carries the winning route's `id` and its captures.
    Matched {
        /// The matching route's [`Route::id`].
        id: String,
        /// Named captures, empty for a route with no params.
        captures: Captures,
    },
    /// No route matched.
    Unmatched,
}

/// Match a URL against a route table, first match wins — same order-dependence as the `.tsx`'s
/// `for (const route of routes)` loop.
#[must_use]
pub fn resolve(routes: &[Route], url: &str) -> ResolveOutcome {
    for route in routes {
        let Some(re) = route.compiled() else { continue };
        let Some(caps) = re.captures(url) else {
            continue;
        };
        let mut captures = Captures::new();
        for name in re.capture_names().flatten() {
            if let Some(m) = caps.name(name) {
                captures.insert(name.to_owned(), m.as_str().to_owned());
            }
        }
        return ResolveOutcome::Matched {
            id: route.id.clone(),
            captures,
        };
    }
    ResolveOutcome::Unmatched
}

/// Props for [`DeepLinkHandler`].
///
/// Deliberately thin: this component renders the wrapper div. The host performs its own
/// event wiring (`popstate`, a custom event, a mobile deep-link intent) and calls [`resolve`]
/// itself — see the module docs.
#[derive(Props, Clone, PartialEq)]
pub struct DeepLinkHandlerProps {
    /// Wrapped content.
    pub children: Element,
}

/// The wrapper a deep-link-aware app renders its content inside.
#[component]
pub fn DeepLinkHandler(props: DeepLinkHandlerProps) -> Element {
    rsx! {
        div {
            "data-slot": "nyuchi-deep-link-handler",
            "data-portal": "https://mzizi.dev/components/nyuchi-deep-link-handler",
            {props.children}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_template_route_captures_named_params() {
        let routes = vec![Route::template("/users/:id", "user")];
        let ResolveOutcome::Matched { id, captures } = resolve(&routes, "/users/42") else {
            panic!("expected a match")
        };
        assert_eq!(id, "user");
        assert_eq!(captures.get("id"), Some(&"42".to_owned()));
    }

    #[test]
    fn a_template_route_with_two_params_captures_both() {
        let routes = vec![Route::template("/orgs/:org/repos/:repo", "repo")];
        let ResolveOutcome::Matched { captures, .. } = resolve(&routes, "/orgs/nyuchi/repos/mzizi")
        else {
            panic!("expected a match")
        };
        assert_eq!(captures.get("org"), Some(&"nyuchi".to_owned()));
        assert_eq!(captures.get("repo"), Some(&"mzizi".to_owned()));
    }

    #[test]
    fn first_matching_route_wins() {
        let routes = vec![
            Route::template("/users/:id", "user"),
            Route::template("/:anything", "catchall"),
        ];
        let ResolveOutcome::Matched { id, .. } = resolve(&routes, "/users/1") else {
            panic!("expected a match")
        };
        assert_eq!(id, "user");
    }

    #[test]
    fn no_route_matches_is_unmatched() {
        let routes = vec![Route::template("/users/:id", "user")];
        assert_eq!(resolve(&routes, "/settings"), ResolveOutcome::Unmatched);
    }

    #[test]
    fn a_regex_route_with_no_named_groups_still_matches() {
        // The defect this fixes: the .tsx requires match.groups to be truthy, so a route
        // with no params can never fire and silently falls through to unmatched.
        let routes = vec![Route::regex(Regex::new("^/settings$").unwrap(), "settings")];
        let ResolveOutcome::Matched { id, captures } = resolve(&routes, "/settings") else {
            panic!("a route with no named groups must still be able to match")
        };
        assert_eq!(id, "settings");
        assert!(captures.is_empty());
    }

    #[test]
    fn a_regex_route_with_named_groups_captures_them() {
        let routes = vec![Route::regex(
            Regex::new(r"^/legacy/(?P<slug>[^/]+)$").unwrap(),
            "legacy",
        )];
        let ResolveOutcome::Matched { captures, .. } = resolve(&routes, "/legacy/old-page") else {
            panic!("expected a match")
        };
        assert_eq!(captures.get("slug"), Some(&"old-page".to_owned()));
    }

    #[test]
    fn literal_characters_in_a_template_are_escaped() {
        // A path segment containing a regex metacharacter must be matched literally.
        let routes = vec![Route::template("/v1.0/:id", "versioned")];
        assert_eq!(resolve(&routes, "/v1x0/5"), ResolveOutcome::Unmatched);
        let ResolveOutcome::Matched { captures, .. } = resolve(&routes, "/v1.0/5") else {
            panic!("the literal dot must match a literal dot")
        };
        assert_eq!(captures.get("id"), Some(&"5".to_owned()));
    }
}
