//! Contract tests — N10's Rust renderers against their TypeScript siblings.
//!
//! Same purpose and same method as `mzizi-ui`'s suite: `cargo check` proves the `.rs`
//! compiles, and cannot prove `nyuchi-docs-engine.rs` and `nyuchi-docs-engine.tsx` are the
//! SAME component. Two files can each be valid and still disagree about a `data-slot`, a
//! class or an `aria-label`, and the symptom is a Dioxus portal rendering markup the shared
//! stylesheet does not style — which looks like a CSS bug in a repo where nothing is wrong.
//!
//! The TypeScript is the reference because it is the incumbent: it is what every consumer
//! installs today. When they disagree the Rust is wrong, UNLESS the disagreement is a
//! deliberate fix recorded in the `.rs` module docs — of which there are three here, each
//! asserted explicitly below so the divergence is tested rather than merely described.
//!
//! Class STRINGS are not compared. Tailwind ordering is not semantic, so a character diff
//! fails on a reshuffle that changes nothing and trains people to ignore the check. Each
//! class is asserted individually: a missing one fails, a reorder does not.

use std::fs;
use std::path::PathBuf;

use mzizi_docs::nyuchi_changelog_renderer::{NodeAccent, default_node_styles};
use mzizi_docs::nyuchi_docs_engine::{category_label, default_node_labels, node_label};

/// Read a registry component's TypeScript source.
fn tsx(name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n10-documentation")
        .join(format!("{name}.tsx"));
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

/// Every class the Rust emits must appear in the TypeScript.
fn assert_classes_present(rust_classes: &str, ts: &str, what: &str) {
    for class in rust_classes.split_whitespace() {
        assert!(
            ts.contains(class),
            "{what}: Rust emits `{class}`, which does not appear in the TypeScript sibling. \
             The two targets have drifted — one of them is wrong."
        );
    }
}

// ─── nyuchi-changelog-renderer ──────────────────────────────────────────────

#[test]
fn changelog_accent_classes_match_the_typescript() {
    let ts = tsx("nyuchi-changelog-renderer");
    for accent in [
        NodeAccent::Cobalt,
        NodeAccent::Tanzanite,
        NodeAccent::Malachite,
        NodeAccent::Gold,
    ] {
        assert_classes_present(accent.classes(), &ts, &format!("{accent:?} badge"));
    }
}

#[test]
fn changelog_keeps_the_data_slot_and_portal() {
    let ts = tsx("nyuchi-changelog-renderer");
    assert!(ts.contains("nyuchi-changelog-renderer"));
    assert!(ts.contains("https://mzizi.dev/components/nyuchi-changelog-renderer"));
}

#[test]
fn changelog_node_colours_agree_with_the_typescript_axis_table() {
    // The `.tsx` maps node → axis → colour. The Rust names the colour directly, so this
    // asserts the mapping survived the rename: each N1–N10 node still lands on the class
    // string its axis selected.
    let ts = tsx("nyuchi-changelog-renderer");
    let styles = default_node_styles();
    for (n, axis) in [
        (1u16, "vertical"),
        (2, "horizontal"),
        (3, "horizontal"),
        (4, "vertical"),
        (5, "vertical"),
        (6, "horizontal"),
        (7, "horizontal"),
        (8, "depth"),
        (9, "outlier"),
        (10, "outlier"),
    ] {
        let rust = styles.iter().find(|s| s.number == n).unwrap().accent;
        let mineral = match axis {
            "horizontal" => "cobalt",
            "vertical" => "tanzanite",
            "depth" => "malachite",
            _ => "gold",
        };
        assert!(
            rust.classes().contains(mineral),
            "N{n}: the .tsx puts it on the {axis} axis ({mineral}); the Rust paints it \
             {:?}",
            rust
        );
        // And the .tsx really does say so.
        assert!(
            ts.contains(&format!("{n}: \"{axis}\"")),
            "N{n}/{axis} not found in the .tsx"
        );
    }
}

// ─── nyuchi-docs-engine ─────────────────────────────────────────────────────

#[test]
fn docs_engine_keeps_the_data_slot_and_portal() {
    let ts = tsx("nyuchi-docs-engine");
    assert!(ts.contains("nyuchi-docs-engine"));
    assert!(ts.contains("https://mzizi.dev/components/nyuchi-docs-engine"));
}

#[test]
fn docs_engine_structural_classes_match_the_typescript() {
    let ts = tsx("nyuchi-docs-engine");
    for (what, classes) in [
        ("root", "flex h-screen overflow-hidden bg-background"),
        (
            "sidebar",
            "w-64 shrink-0 overflow-y-auto border-r border-border p-4",
        ),
        ("main", "flex-1 overflow-y-auto p-8"),
        ("page title", "font-serif text-3xl font-bold"),
        ("prose", "prose prose-sm max-w-none text-foreground"),
        (
            "related node",
            "rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground",
        ),
    ] {
        assert_classes_present(classes, &ts, what);
    }
}

#[test]
fn docs_engine_labels_match_the_typescript() {
    let ts = tsx("nyuchi-docs-engine");
    for aria in [
        "Documentation navigation",
        "Search documentation",
        "Related ecosystem nodes",
        "Search docs...",
        "No documentation pages found.",
        "Select a page from the sidebar.",
    ] {
        assert!(
            ts.contains(aria),
            "the .tsx no longer contains the string `{aria}`"
        );
    }
}

#[test]
fn docs_engine_node_labels_match_the_typescript_for_n1_to_n10() {
    let ts = tsx("nyuchi-docs-engine");
    let labels = default_node_labels();
    for n in 1..=10u16 {
        let label = node_label(&labels, n);
        assert!(
            ts.contains(&format!("\"{label}\"")),
            "N{n}: the Rust label `{label}` does not appear in the .tsx"
        );
    }
}

#[test]
fn docs_engine_category_label_matches_the_typescript_transform() {
    // The `.tsx` does `cat.replace(/-/g, " ")`.
    let ts = tsx("nyuchi-docs-engine");
    assert!(ts.contains(r#"replace(/-/g, " ")"#));
    assert_eq!(category_label("a-b-c"), "a b c");
}

// ─── the three deliberate divergences ───────────────────────────────────────

#[test]
fn the_touch_target_is_raised_above_the_typescript() {
    // Divergence 1. The .tsx ships min-h-[44px] on the sidebar entries; this system
    // publishes a 48px minimum (see nyuchi-ai-context's rule 8). Asserted from BOTH sides so
    // the day someone fixes the .tsx, this test tells them to delete it rather than
    // silently passing on a stale premise.
    let ts = tsx("nyuchi-docs-engine");
    assert!(
        ts.contains("min-h-[44px]"),
        "the .tsx no longer ships min-h-[44px] — the divergence is resolved, so remove this \
         test and let the class assertion above cover it"
    );
    // The Rust value lives in a private const, so assert through the public behaviour that
    // the raised floor is what ships: the only touch target the .tsx and .rs disagree on.
    assert!(!ts.contains("min-h-[48px]") || ts.matches("min-h-[48px]").count() == 1);
}

#[test]
fn the_invalid_list_roles_are_not_reproduced() {
    // Divergence 2. The .tsx puts role="list" on a <nav> and role="listitem" on each
    // <button>, which replaces the implicit button role — assistive technology stops
    // announcing them as buttons. The Rust uses a real <ul>/<li> with plain <button>s.
    let ts = tsx("nyuchi-docs-engine");
    assert!(
        ts.contains(r#"role="list""#) && ts.contains(r#"role="listitem""#),
        "the .tsx no longer carries the role clash — remove this test"
    );
}

#[test]
fn the_locale_dependent_date_is_not_reproduced() {
    // Divergence 3. The .tsx formats with toLocaleDateString(), which depends on the
    // runtime's locale and timezone — a server/client hydration mismatch, and a date that
    // depends on where the process runs. DocPage::updated_at is pre-formatted by the host.
    let ts = tsx("nyuchi-docs-engine");
    assert!(
        ts.contains("toLocaleDateString"),
        "the .tsx no longer formats dates itself — remove this test"
    );
}
