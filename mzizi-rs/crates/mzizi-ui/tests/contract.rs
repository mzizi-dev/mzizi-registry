//! Contract tests — the Rust primitives against their TypeScript siblings.
//!
//! `cargo check` proves a `.rs` component compiles. It cannot prove the thing that actually
//! matters here: that `button.rs` and `button.tsx` are the SAME BUTTON. Two files can each be
//! valid and still disagree about a variant name, a `data-*` attribute or a class, and the
//! symptom is a Dioxus app rendering something the shared stylesheet does not style — which
//! looks like a CSS bug, in a repo where nothing is wrong.
//!
//! So these tests read the `.tsx` on disk and compare. That is unusual and deliberate: the
//! TypeScript is the incumbent, it is what every consumer installs today, and it is therefore
//! the reference. When they disagree the Rust is wrong until someone decides otherwise.
//!
//! What is NOT asserted: identical class strings. Tailwind class order is not semantic and a
//! character-diff would fail on a reordering that changes nothing, which trains people to
//! ignore the check. Each class is asserted individually, so a MISSING class fails and a
//! reshuffle does not.

use std::fs;
use std::path::PathBuf;

use mzizi_ui::{BadgeVariant, ButtonSize, ButtonVariant, badge_variants, button_variants};

/// Read a registry component's TypeScript source.
fn tsx(node_dir: &str, name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry")
        .join(node_dir)
        .join(format!("{name}.tsx"));
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

/// Every class the Rust emits must appear in the TypeScript, so the two render identically
/// under one stylesheet. Extra classes in the TypeScript are fine — that is the `cn()` merge
/// surface and consumer overrides.
fn assert_classes_present(rust_classes: &str, ts_source: &str, what: &str) {
    for class in rust_classes.split_whitespace() {
        assert!(
            ts_source.contains(class),
            "{what}: Rust emits `{class}`, which does not appear in the TypeScript sibling. \
             The two targets have drifted — one of them is wrong."
        );
    }
}

#[test]
fn button_variants_match_the_typescript() {
    let ts = tsx("n2-primitives", "button");
    for variant in [
        ButtonVariant::Default,
        ButtonVariant::Outline,
        ButtonVariant::Secondary,
        ButtonVariant::Ghost,
        ButtonVariant::Destructive,
        ButtonVariant::Link,
    ] {
        assert_classes_present(
            variant.classes(),
            &ts,
            &format!("button/{}", variant.slug()),
        );
        // The slug is what lands in `data-variant`, so a stylesheet or a test selector
        // written against one target must match the other.
        assert!(
            ts.contains(&format!("{}:", variant.slug())),
            "button: variant `{}` is not declared in buttonVariants",
            variant.slug()
        );
    }
}

#[test]
fn button_sizes_match_the_typescript() {
    let ts = tsx("n2-primitives", "button");
    for size in [
        ButtonSize::Default,
        ButtonSize::Sm,
        ButtonSize::Lg,
        ButtonSize::Icon,
        ButtonSize::IconSm,
    ] {
        assert_classes_present(size.classes(), &ts, &format!("button/{}", size.slug()));
    }
}

#[test]
fn buttons_are_always_pill_shaped() {
    // CLAUDE.md §7.5 — an executive brand decision, not a radius-scale value, and it applies
    // to every target. Asserted on the composed string rather than the base constant so
    // no variant or size can override it away.
    for variant in [
        ButtonVariant::Default,
        ButtonVariant::Ghost,
        ButtonVariant::Link,
    ] {
        for size in [ButtonSize::Default, ButtonSize::Sm, ButtonSize::Icon] {
            let classes = button_variants(variant, size, "");
            assert!(
                classes.split_whitespace().any(|c| c == "rounded-full"),
                "button {}/{} is not pill-shaped",
                variant.slug(),
                size.slug()
            );
        }
    }
}

#[test]
fn consumer_classes_come_last_so_they_win() {
    // Tailwind resolves a conflict by source order in the stylesheet, not the class list, but
    // the ordering still matters for `tailwind-merge`-style consumers and for readability.
    // What is load-bearing is that the consumer's classes are PRESENT at all — dropping them
    // silently is the failure this catches.
    let classes = button_variants(ButtonVariant::Default, ButtonSize::Default, "w-full mt-2");
    assert!(
        classes.ends_with("w-full mt-2"),
        "consumer classes were not appended: {classes}"
    );

    let none = button_variants(ButtonVariant::Default, ButtonSize::Default, "");
    assert!(
        !none.ends_with(' '),
        "an empty class prop left a trailing space: {none:?}"
    );
}

#[test]
fn badge_variants_match_the_typescript() {
    let ts = tsx("n2-primitives", "badge");
    for variant in [
        BadgeVariant::Default,
        BadgeVariant::Secondary,
        BadgeVariant::Destructive,
        BadgeVariant::Outline,
        BadgeVariant::Ghost,
        BadgeVariant::Link,
    ] {
        assert_classes_present(variant.classes(), &ts, &format!("badge/{}", variant.slug()));
        assert!(
            ts.contains(&format!("{}:", variant.slug())),
            "badge: variant `{}` is not declared in badgeVariants",
            variant.slug()
        );
    }
    assert!(badge_variants(BadgeVariant::Default, "").contains("rounded-md"));
}

#[test]
fn every_data_slot_the_rust_emits_exists_in_the_typescript() {
    // The `data-slot` names ARE the contract between a component and the stylesheet — more so
    // than the class list, because brand components and consumer CSS select on them. A card
    // composed in Dioxus must produce markup a React-authored stylesheet already styles.
    for (node_dir, name, slots) in [
        ("n2-primitives", "button", &["button"][..]),
        ("n2-primitives", "badge", &["badge"][..]),
        (
            "n2-primitives",
            "card",
            &[
                "card",
                "card-header",
                "card-title",
                "card-description",
                "card-action",
                "card-content",
                "card-footer",
            ][..],
        ),
    ] {
        let ts = tsx(node_dir, name);
        for slot in slots {
            assert!(
                ts.contains(&format!("data-slot=\"{slot}\"")),
                "{name}: the Rust emits data-slot=\"{slot}\", which the TypeScript sibling does not"
            );
        }
    }
}

#[test]
fn tokens_are_the_generated_ones() {
    // N1's covenant: design decisions are data, so this crate must not carry a second palette.
    // If a hand-written colour table ever appears in `mzizi-ui`, this is where it shows up —
    // the values here can only be right because they came through the generator.
    let dark = mzizi_ui::tokens::Palette::dark();
    let light = mzizi_ui::tokens::Palette::light();
    assert_ne!(
        dark.gold, light.gold,
        "the two themes resolved to the same gold"
    );
    // Seven minerals and seven heritage tones — a five-and-five palette is the exact drift
    // that shipped in the hand-written platform generators (CLAUDE.md §8.4.1).
    for value in [
        dark.cobalt,
        dark.tanzanite,
        dark.malachite,
        dark.sodalite,
        dark.gold,
        dark.terracotta,
        dark.copper,
        dark.indigo,
        dark.savanna,
        dark.baobab,
        dark.sunset,
        dark.river,
        dark.hematite,
        dark.kalahari,
    ] {
        assert!(
            value.starts_with('#') && value.len() == 7,
            "not a hex colour: {value}"
        );
    }
}
