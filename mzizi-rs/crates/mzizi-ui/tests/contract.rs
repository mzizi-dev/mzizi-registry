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

use mzizi_ui::{
    AvatarSize, BadgeVariant, ButtonSize, ButtonVariant, SeparatorOrientation, avatar_variants,
    badge_variants, button_variants, chart_loading_variants, chart_variants, input_variants,
    label_variants, progress_variants, separator_variants,
};
use mzizi_ui::{STATUS_BADGE_STATUSES, status_badge_variants};

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
        ("n2-primitives", "separator", &["separator"][..]),
        ("n2-primitives", "label", &["label"][..]),
        ("n2-primitives", "input", &["input"][..]),
        (
            "n2-primitives",
            "progress",
            &["progress", "progress-indicator"][..],
        ),
        (
            "n2-primitives",
            "avatar",
            &[
                "avatar",
                "avatar-image",
                "avatar-fallback",
                "avatar-badge",
                "avatar-group",
                "avatar-group-count",
            ][..],
        ),
        ("n2-primitives", "chart", &["chart"][..]),
        (
            "n2-primitives",
            "safe-area-frame",
            &["safe-area-frame", "safe-area-frame-canvas"][..],
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

#[test]
fn separator_orientations_match_the_typescript() {
    let ts = tsx("n2-primitives", "separator");
    for orientation in [
        SeparatorOrientation::Horizontal,
        SeparatorOrientation::Vertical,
    ] {
        assert_classes_present(
            orientation.classes(),
            &ts,
            &format!("separator/{}", orientation.slug()),
        );
    }
    assert!(
        separator_variants(SeparatorOrientation::Horizontal, "").contains("bg-border"),
        "separator base class missing"
    );
}

#[test]
fn label_classes_match_the_typescript() {
    let ts = tsx("n2-primitives", "label");
    assert_classes_present(&label_variants(""), &ts, "label");
    // The two external-state selectors are the actual contract here — nothing else in
    // this component varies.
    assert!(ts.contains("group-data-[disabled=true]:opacity-50"));
    assert!(ts.contains("peer-disabled:opacity-50"));
}

#[test]
fn input_classes_match_the_typescript() {
    let ts = tsx("n2-primitives", "input");
    assert_classes_present(&input_variants(""), &ts, "input");
    // The two token-compliance facts the module doc calls out.
    assert!(
        input_variants("")
            .split_whitespace()
            .any(|c| c == "rounded-full"),
        "input is not pill-shaped"
    );
    assert!(
        input_variants("").split_whitespace().any(|c| c == "h-12"),
        "input is not at the 48px touch-target floor"
    );
}

#[test]
fn progress_classes_match_the_typescript() {
    let ts = tsx("n2-primitives", "progress");
    assert_classes_present(&progress_variants(""), &ts, "progress/track");
    // The indicator's classes are on a separate constant in the .rs, so this compares them
    // by hand rather than via `progress_variants`, which only composes the track.
    for class in ["size-full", "flex-1", "bg-primary", "transition-all"] {
        assert!(
            ts.contains(class),
            "progress/indicator: Rust emits `{class}`, which does not appear in the TypeScript"
        );
    }
}

#[test]
fn avatar_sizes_match_the_typescript() {
    let ts = tsx("n2-primitives", "avatar");
    // `data-[size=lg]:size-10 data-[size=sm]:size-6` in the TypeScript — Default has no
    // dedicated class (size-8 lives in the always-on base), so only Sm/Lg have something
    // to assert against a `data-[size=…]` selector here.
    for (size, needle) in [(AvatarSize::Sm, "size-6"), (AvatarSize::Lg, "size-10")] {
        let classes = avatar_variants(size, "");
        assert!(
            classes.split_whitespace().any(|c| c == needle),
            "avatar/{needle} missing from composed classes: {classes}"
        );
        assert!(
            ts.contains(needle),
            "avatar: Rust emits `{needle}`, which does not appear in the TypeScript"
        );
    }
    assert!(
        avatar_variants(AvatarSize::Default, "")
            .split_whitespace()
            .any(|c| c == "size-8"),
        "avatar default size missing"
    );
}

#[test]
fn avatar_fallback_and_badge_classes_match_the_typescript() {
    let ts = tsx("n2-primitives", "avatar");
    for class in [
        "flex",
        "size-full",
        "items-center",
        "justify-center",
        "rounded-full",
        "bg-muted",
    ] {
        assert!(
            ts.contains(class),
            "avatar-fallback: `{class}` missing from the TypeScript sibling"
        );
    }
    assert!(ts.contains("group-data-[size=sm]/avatar:size-2"));
    assert!(ts.contains("group-has-data-[size=lg]/avatar-group:size-10"));
}

#[test]
fn chart_classes_match_the_typescript() {
    let ts = tsx("n2-primitives", "chart");
    assert_classes_present(&chart_variants(""), &ts, "chart/container");
    assert_classes_present(&chart_loading_variants(""), &ts, "chart/loading");
    // The `data-portal` attribute is on the loading branch only in the TypeScript — an
    // asymmetry already present there, not something to reconcile quietly (rule 1: match
    // the contract, not a guess at what it "should" be).
    assert!(ts.contains("data-portal=\"https://mzizi.dev/components/chart\""));
}

#[test]
fn status_badge_matches_the_typescript() {
    // The React build composes `Badge` (outline) with its own classes, so the Rust's classes
    // are checked against the two files together.
    let ts = tsx("n2-primitives", "status-badge") + &tsx("n2-primitives", "badge");
    for status in STATUS_BADGE_STATUSES {
        assert_classes_present(
            &status_badge_variants(status, ""),
            &ts,
            &format!("status-badge/{}", status.slug()),
        );
        assert!(
            ts.contains(&format!("{}:", status.slug())),
            "status-badge: status `{}` is not declared in STATUS_STYLES",
            status.slug()
        );
    }
    let own = tsx("n2-primitives", "status-badge");
    for attr in [
        "data-slot=\"status-badge\"",
        "data-portal=\"https://mzizi.dev/components/status-badge\"",
    ] {
        assert!(own.contains(attr), "status-badge.tsx does not carry {attr}");
    }
}

#[test]
fn every_exported_contract_is_listed() {
    assert!(
        mzizi_ui::CONTRACTS
            .iter()
            .any(|(name, c)| *name == "status-badge" && c.starts_with("contract"))
    );
}

#[test]
fn safe_area_frame_classes_and_geometry_match_the_typescript() {
    use mzizi_ui::safe_area_frame::{BAND_X, BAND_Y, CANVAS, FRAME};
    let ts = tsx("n2-primitives", "safe-area-frame");
    for (what, classes) in [
        ("frame", FRAME),
        ("canvas", CANVAS),
        ("band-y", BAND_Y),
        ("band-x", BAND_X),
    ] {
        assert_classes_present(classes, &ts, &format!("safe-area-frame/{what}"));
    }
    // A 1080x1920 story with Meta's 250/340 bands in a 56px box: the TypeScript's
    // safeAreaBands gives 32x56, top 13.02%, bottom 17.71%, sides 5.93%.
    let b = mzizi_ui::safe_area_bands(1080, 1920, [250, 64, 340, 64], 56);
    assert_eq!((b.width, b.height), (32, 56));
    assert!((b.top - 13.02).abs() < 1e-9 && (b.bottom - 17.71).abs() < 1e-9);
    assert!((b.left - 5.93).abs() < 1e-9 && (b.right - 5.93).abs() < 1e-9);
    // A favicon never collapses below 6px a side.
    let f = mzizi_ui::safe_area_bands(32, 4, [0, 0, 0, 0], 56);
    assert_eq!((f.width, f.height), (56, 7));
}

// ─── markdown-renderer ──────────────────────────────────────────────────────────────────────
//
// The React and Astro builds share `markdown-parse.ts`; this build has its own parser. They are
// held together three ways: the same class strings, the same trees for every case in
// `__tests__/fixtures/markdown-renderer.cases.json` (which the TypeScript suite runs too), and
// no HTML string sink in any of the three files.

mod markdown {
    use super::*;
    use mzizi_ui::markdown_renderer::{
        Align, Block, Inline, List, MarkdownLinks, MarkdownSource, classes, markdown_blocks,
    };
    use serde_json::{Value, json};

    fn source(file: &str) -> String {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n2-primitives")
            .join(file);
        fs::read_to_string(&path).unwrap_or_else(|e| panic!("cannot read {path:?}: {e}"))
    }

    #[test]
    fn classes_are_the_typescript_classes() {
        let ts = source("markdown-parse.ts");
        let mut all = vec![
            classes::ROOT,
            classes::P,
            classes::UL,
            classes::OL,
            classes::NESTED,
            classes::QUOTE,
            classes::PRE,
            classes::CODE,
            classes::A,
            classes::HR,
            classes::TABLE_WRAP,
            classes::TABLE,
            classes::TH,
            classes::TD,
            classes::LEFT,
            classes::CENTER,
            classes::RIGHT,
        ];
        all.extend(classes::H);
        for class in all {
            assert!(
                ts.contains(&format!("\"{class}\"")),
                "markdown-renderer.rs has the class string `{class}`, which MARKDOWN_CLASSES in \
                 markdown-parse.ts does not: the builds have drifted"
            );
        }
    }

    #[test]
    fn no_build_has_an_html_string_sink() {
        for file in [
            "markdown-renderer.rs",
            "markdown-renderer.tsx",
            "markdown-renderer.astro",
            "markdown-parse.ts",
        ] {
            let code: String = source(file)
                .lines()
                .filter(|l| {
                    let t = l.trim_start();
                    !(t.starts_with("//") || t.starts_with('*') || t.starts_with("/*"))
                })
                .collect::<Vec<_>>()
                .join("\n");
            for sink in [
                "dangerouslySetInnerHTML",
                "set:html",
                "dangerous_inner_html",
                "innerHTML",
                "outerHTML",
                "insertAdjacentHTML",
                "document.write",
            ] {
                assert!(
                    !code.contains(sink),
                    "{file} uses the HTML string sink `{sink}`"
                );
            }
        }
    }

    fn inlines(c: &[Inline]) -> Value {
        Value::Array(
            c.iter()
                .map(|x| match x {
                    Inline::Text(v) => json!({ "t": "text", "v": v }),
                    Inline::Code(v) => json!({ "t": "code", "v": v }),
                    Inline::Strong(c) => json!({ "t": "strong", "c": inlines(c) }),
                    Inline::Em(c) => json!({ "t": "em", "c": inlines(c) }),
                    Inline::Link { href, children } => {
                        json!({ "t": "link", "href": href, "c": inlines(children) })
                    }
                })
                .collect(),
        )
    }

    fn lines(ls: &[Vec<Inline>]) -> Value {
        Value::Array(ls.iter().map(|l| inlines(l)).collect())
    }

    fn list(l: &List) -> Value {
        let items: Vec<Value> = l
            .items
            .iter()
            .map(|it| {
                json!({ "lines": lines(&it.lines), "children": it.children.iter().map(list).collect::<Vec<_>>() })
            })
            .collect();
        if l.ordered {
            json!({ "kind": "ol", "start": l.start, "items": items })
        } else {
            json!({ "kind": "ul", "items": items })
        }
    }

    /// The tree in `markdown-parse.ts`'s JSON shape.
    fn blocks(bs: &[Block]) -> Value {
        Value::Array(
            bs.iter()
                .map(|b| match b {
                    Block::Paragraph(ls) => json!({ "kind": "p", "lines": lines(ls) }),
                    Block::Heading { level, children } => {
                        json!({ "kind": "h", "level": level, "c": inlines(children) })
                    }
                    Block::List(l) => list(l),
                    Block::Quote(children) => json!({ "kind": "quote", "children": blocks(children) }),
                    Block::Code { lang, text } => json!({ "kind": "code", "lang": lang, "v": text }),
                    Block::Rule => json!({ "kind": "hr" }),
                    Block::Table { align, head, rows } => json!({
                        "kind": "table",
                        "align": align.iter().map(|a| match a {
                            None => Value::Null,
                            Some(Align::Left) => json!("left"),
                            Some(Align::Center) => json!("center"),
                            Some(Align::Right) => json!("right"),
                        }).collect::<Vec<_>>(),
                        "head": head.iter().map(|c| inlines(c)).collect::<Vec<_>>(),
                        "rows": rows.iter().map(|r| r.iter().map(|c| inlines(c)).collect::<Vec<_>>()).collect::<Vec<_>>(),
                    }),
                })
                .collect(),
        )
    }

    #[test]
    fn the_parser_matches_the_typescript_case_for_case() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../__tests__/fixtures/markdown-renderer.cases.json");
        let fixture: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        let cases = fixture["cases"].as_array().unwrap();
        assert!(cases.len() >= 40, "the shared fixture has too few cases");
        for case in cases {
            let policy = match case["links"].as_str() {
                Some("https") => MarkdownLinks::Https,
                _ => MarkdownLinks::Safe,
            };
            let from = match case["from"].as_str() {
                Some("html") => MarkdownSource::Html,
                Some("auto") => MarkdownSource::Auto,
                _ => MarkdownSource::Markdown,
            };
            let got = blocks(&markdown_blocks(
                case["input"].as_str().unwrap(),
                policy,
                from,
            ));
            assert_eq!(
                got,
                case["expect"],
                "case `{}`",
                case["say"].as_str().unwrap()
            );
        }
    }
}

// ─── device-code ────────────────────────────────────────────────────────────────────────────
//
// The React and Astro builds share `device-code-format.ts` and `qr-code.ts`; this build has its
// own formatting and draws its QR code with the `qrcode` crate. They are held together by the
// same class strings and words, and by `__tests__/fixtures/device-code.cases.json` (which the
// TypeScript suite runs too): every QR version at every error-correction level must give the
// same matrix, and every code, countdown, address, status and time the same text.

mod device_code {
    use super::*;
    use mzizi_ui::device_code::{
        DeviceCodeStatus, QrEcc, classes, display_uri, effective_status, format_remaining,
        format_user_code, qr_matrix, qr_path, qr_view_box, rfc3339_to_unix_ms, spoken_user_code,
        status_message, text,
    };
    use serde_json::Value;

    fn source(file: &str) -> String {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n2-primitives")
            .join(file);
        fs::read_to_string(&path).unwrap_or_else(|e| panic!("cannot read {path:?}: {e}"))
    }

    fn fixture() -> Value {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../__tests__/fixtures/device-code.cases.json");
        serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
    }

    fn ecc(v: &Value) -> QrEcc {
        match v.as_str().unwrap() {
            "L" => QrEcc::L,
            "M" => QrEcc::M,
            "Q" => QrEcc::Q,
            "H" => QrEcc::H,
            other => panic!("unknown level {other}"),
        }
    }

    fn bits(dark: &[bool]) -> String {
        dark.iter().map(|d| if *d { '1' } else { '0' }).collect()
    }

    fn fnv1a64(s: &str) -> String {
        let mut h: u64 = 0xcbf2_9ce4_8422_2325;
        for b in s.bytes() {
            h ^= u64::from(b);
            h = h.wrapping_mul(0x0100_0000_01b3);
        }
        format!("{h:016x}")
    }

    #[test]
    fn classes_and_words_are_the_typescript_ones() {
        let ts = source("device-code-format.ts");
        let mut all = vec![
            classes::ROOT,
            classes::STEPS,
            classes::TIMER,
            classes::FIGURE,
            classes::ENDED,
        ];
        for pair in [
            classes::ROOT_SIZE,
            classes::PENDING,
            classes::STEP,
            classes::URI,
            classes::CODE,
            classes::COUNTDOWN,
            classes::QR,
            classes::CAPTION,
            classes::STATUS,
            classes::DOT,
            classes::REFRESH,
        ] {
            all.extend(pair);
        }
        all.extend([
            text::LABEL,
            text::GO_TO,
            text::ENTER,
            text::SPOKEN_PREFIX,
            text::EXPIRES_IN,
            text::SCAN,
            text::REFRESH,
            text::LAST_MINUTE,
        ]);
        for s in all {
            assert!(
                ts.contains(&format!("\"{s}\"")),
                "device-code.rs has the string `{s}`, which device-code-format.ts does not: the \
                 builds have drifted"
            );
        }
    }

    #[test]
    fn every_data_slot_the_rust_emits_exists_in_the_other_builds() {
        let rs = source("device-code.rs");
        for other in ["device-code.tsx", "device-code.astro"] {
            let src = source(other);
            for slot in rs
                .match_indices("\"data-slot\": \"")
                .map(|(i, m)| &rs[i + m.len()..])
                .map(|rest| &rest[..rest.find('"').unwrap()])
            {
                assert!(
                    src.contains(&format!("data-slot=\"{slot}\"")),
                    "device-code.rs emits data-slot=\"{slot}\", which {other} does not"
                );
            }
        }
    }

    #[test]
    fn the_qr_matrix_matches_the_typescript_at_every_version_and_level() {
        let f = fixture();
        let seed = f["seed"].as_str().unwrap();
        let cases = f["qr"].as_array().unwrap();
        assert_eq!(
            cases.len(),
            4 * 41,
            "40 versions and one too-long case per level"
        );
        for c in cases {
            let n = usize::try_from(c["length"].as_u64().unwrap()).unwrap();
            let text: String = seed.repeat(n / seed.len() + 2)[..n].to_owned();
            let got = qr_matrix(&text, ecc(&c["ecc"]));
            match c["version"].as_i64() {
                None => assert!(got.is_none(), "{c}: should be too long for version 40"),
                Some(v) => {
                    let m = got.unwrap_or_else(|| panic!("{c}: no matrix"));
                    assert_eq!(i64::from(m.version), v, "{c}");
                    assert_eq!(m.size, usize::try_from(v * 4 + 17).unwrap(), "{c}");
                    assert_eq!(
                        fnv1a64(&bits(&m.dark)),
                        c["fnv1a64"].as_str().unwrap(),
                        "{c}"
                    );
                }
            }
        }
        for c in f["qrLiteral"].as_array().unwrap() {
            let m = qr_matrix(c["text"].as_str().unwrap(), ecc(&c["ecc"])).unwrap();
            assert_eq!(i64::from(m.version), c["version"].as_i64().unwrap());
            let rows: Vec<String> = m.dark.chunks(m.size).map(bits).collect();
            let want: Vec<String> = c["rows"]
                .as_array()
                .unwrap()
                .iter()
                .map(|r| r.as_str().unwrap().to_owned())
                .collect();
            assert_eq!(rows, want, "whole matrix of {}", c["text"]);
        }
    }

    #[test]
    fn the_path_is_one_subpath_per_run() {
        let m = mzizi_ui::QrMatrix {
            size: 3,
            version: 1,
            dark: vec![true, true, false, false, false, false, false, true, true],
        };
        assert_eq!(qr_path(&m, 4), "M4 4h2v1h-2zM5 6h2v1h-2z");
        assert_eq!(qr_view_box(21, 4), "0 0 29 29");
    }

    #[test]
    fn the_words_match_the_typescript_case_for_case() {
        let f = fixture();
        for c in f["userCode"].as_array().unwrap() {
            let input = c["in"].as_str().unwrap();
            assert_eq!(
                format_user_code(input),
                c["display"].as_str().unwrap(),
                "{c}"
            );
            assert_eq!(
                spoken_user_code(input),
                c["spoken"].as_str().unwrap(),
                "{c}"
            );
        }
        for c in f["remaining"].as_array().unwrap() {
            assert_eq!(
                format_remaining(c["ms"].as_i64().unwrap()),
                c["text"].as_str().unwrap(),
                "{c}"
            );
        }
        for c in f["uri"].as_array().unwrap() {
            assert_eq!(
                display_uri(c["in"].as_str().unwrap()),
                c["out"].as_str().unwrap()
            );
        }
        for c in f["status"].as_array().unwrap() {
            let status = match c["status"].as_str().unwrap() {
                "pending" => DeviceCodeStatus::Pending,
                "approved" => DeviceCodeStatus::Approved,
                "expired" => DeviceCodeStatus::Expired,
                "denied" => DeviceCodeStatus::Denied,
                _ => DeviceCodeStatus::Error,
            };
            let ms = c["ms"].as_i64().unwrap();
            let shown = effective_status(status, ms);
            assert_eq!(shown.slug(), c["shown"].as_str().unwrap(), "{c}");
            assert_eq!(
                status_message(shown, ms),
                c["message"].as_str().unwrap(),
                "{c}"
            );
        }
        for c in f["time"].as_array().unwrap() {
            assert_eq!(
                rfc3339_to_unix_ms(c["in"].as_str().unwrap()),
                c["ms"].as_i64(),
                "{c}"
            );
        }
    }
}
