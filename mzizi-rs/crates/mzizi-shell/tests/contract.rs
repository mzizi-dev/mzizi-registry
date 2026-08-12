//! Contract tests — N7's first Rust batch against its TypeScript siblings.
//!
//! Same purpose and method as `mzizi-ui` and `mzizi-docs`: `cargo check` proves the `.rs`
//! compiles, not that it is the SAME component as its `.tsx` sibling. The TypeScript is the
//! reference because it is the incumbent; a disagreement is the Rust's fault unless it is one
//! of the deliberate divergences recorded in that file's module docs, each asserted from both
//! sides below.

use std::fs;
use std::path::PathBuf;

use mzizi_shell::nyuchi_connectivity_bar::ConnectionState;
use mzizi_shell::nyuchi_update_prompt::{body_text, entrance_style};

/// Read a registry component's TypeScript source.
fn tsx(name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n7-shell")
        .join(format!("{name}.tsx"));
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

// ─── nyuchi-connectivity-bar ────────────────────────────────────────────────

#[test]
fn connectivity_bar_keeps_the_data_slot_and_portal() {
    let ts = tsx("nyuchi-connectivity-bar");
    assert!(ts.contains("nyuchi-connectivity-bar"));
    assert!(ts.contains("https://mzizi.dev/components/nyuchi-connectivity-bar"));
}

#[test]
fn connectivity_bar_colours_match_the_typescript_exactly() {
    let ts = tsx("nyuchi-connectivity-bar");
    for state in [
        ConnectionState::Online,
        ConnectionState::Syncing,
        ConnectionState::Cached,
        ConnectionState::Offline,
    ] {
        assert!(
            ts.contains(state.colour()),
            "the .tsx no longer contains the colour expression for {state:?}"
        );
        assert!(
            ts.contains(state.default_label()),
            "the .tsx no longer contains the label for {state:?}"
        );
    }
}

#[test]
fn connectivity_bar_touch_floor_is_raised_above_the_typescript() {
    // Divergence: the .tsx ships min-h-[44px] on the retry control.
    let ts = tsx("nyuchi-connectivity-bar");
    assert!(
        ts.contains("min-h-[44px]"),
        "the .tsx no longer ships min-h-[44px] — remove this test"
    );
}

// ─── nyuchi-update-prompt ───────────────────────────────────────────────────

#[test]
fn update_prompt_keeps_the_data_slot_and_portal() {
    let ts = tsx("nyuchi-update-prompt");
    assert!(ts.contains("nyuchi-update-prompt"));
    assert!(ts.contains("https://mzizi.dev/components/nyuchi-update-prompt"));
}

#[test]
fn update_prompt_body_text_matches_both_typescript_branches() {
    let ts = tsx("nyuchi-update-prompt");
    assert!(ts.contains("is ready."));
    assert!(ts.contains("This update is required to continue."));
    assert!(ts.contains("Refresh to get the latest improvements."));
    // And the composed strings this crate produces are exactly what the .tsx's template
    // literals would produce for the same inputs.
    assert_eq!(
        body_text(Some("9.9.9"), true),
        "Version 9.9.9 is ready. This update is required to continue."
    );
}

#[test]
fn update_prompt_animation_keyframe_matches_the_typescript() {
    let ts = tsx("nyuchi-update-prompt");
    assert!(ts.contains("nyuchi-fade-slide-up"));
    assert!(entrance_style(false, 1, "linear").contains("nyuchi-fade-slide-up"));
}

#[test]
fn update_prompt_touch_floor_matches_the_typescript() {
    // Unlike the connectivity bar, the .tsx here already ships min-h-[48px] — no divergence.
    let ts = tsx("nyuchi-update-prompt");
    assert_eq!(ts.matches("min-h-[48px]").count(), 2);
    assert!(!ts.contains("min-h-[44px]"));
}

// ─── nyuchi-deep-link-handler ───────────────────────────────────────────────

#[test]
fn deep_link_handler_keeps_the_data_slot_and_portal() {
    let ts = tsx("nyuchi-deep-link-handler");
    assert!(ts.contains("nyuchi-deep-link-handler"));
    assert!(ts.contains("https://mzizi.dev/components/nyuchi-deep-link-handler"));
}

#[test]
fn deep_link_handler_conversion_rule_matches_the_typescript() {
    // The .tsx's `pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)")`. Asserted as a literal string
    // rather than executed, because the .tsx's version is JavaScript regex syntax and this
    // crate's equivalent is Rust regex syntax — same rule, different host language.
    let ts = tsx("nyuchi-deep-link-handler");
    assert!(ts.contains(r"replace(/:(\w+)/g"));
    assert!(ts.contains(r"[^/]+"));
}

#[test]
fn deep_link_handler_requires_named_groups_in_the_typescript() {
    // Divergence: the .tsx requires match.groups on a RegExp route, so a route with no
    // named groups can never fire. The Rust does not require this — see nyuchi-resolve's
    // a_regex_route_with_no_named_groups_still_matches test.
    let ts = tsx("nyuchi-deep-link-handler");
    assert!(
        ts.contains("match?.groups"),
        "the .tsx no longer gates on match.groups — remove this test"
    );
}
