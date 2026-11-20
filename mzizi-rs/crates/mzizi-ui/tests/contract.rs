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
    AvatarSize, ButtonSize, ButtonVariant, avatar_variants, input_variants, label_variants,
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
fn button_attributes_match_the_typescript() {
    // The Rust button emits the same data-* values as the TypeScript one, so one stylesheet
    // (styles/pattern/mzizi-theme.css) and one selector serve both targets.
    let ts = tsx("n2-primitives", "button");
    for variant in [
        ButtonVariant::Default,
        ButtonVariant::Outline,
        ButtonVariant::Secondary,
        ButtonVariant::Ghost,
        ButtonVariant::Destructive,
        ButtonVariant::Link,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", variant.slug())),
            "button: variant `{}` is not in the TypeScript union",
            variant.slug()
        );
    }
    for size in [
        ButtonSize::Default,
        ButtonSize::Sm,
        ButtonSize::Lg,
        ButtonSize::Icon,
        ButtonSize::IconSm,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", size.slug())),
            "button: size `{}` is not in the TypeScript union",
            size.slug()
        );
    }
}

#[test]
fn button_sets_no_styling_class_in_either_target() {
    // The source of each button carries structure and state only. No class string, no cva.
    let ts = tsx("n2-primitives", "button");
    let rs = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n2-primitives/button.rs"),
    )
    .expect("button.rs");
    for (name, src) in [("button.tsx", ts.as_str()), ("button.rs", rs.as_str())] {
        assert!(!src.contains("cva("), "{name} builds a class recipe");
        assert!(!src.contains("classes()"), "{name} still has a class table");
        assert!(
            !src.contains("className=\"") && !src.contains("class=\""),
            "{name} sets a literal class string"
        );
    }
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
        input_variants("")
            .split_whitespace()
            .any(|c| c == "h-field"),
        "input does not take its height from the size role (h-field: 49px touch, 36px desktop)"
    );
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
