//! NYUCHI CHANGELOG RENDERER — N10 documentation, Dioxus.
//!
//! The Rust sibling of `nyuchi-changelog-renderer.tsx`, sharing its contract: the same
//! `data-slot`, the same timeline structure, and the same class strings, so a Dioxus app
//! renders markup a React-authored stylesheet already styles.
//!
//! # The node table went stale, again
//!
//! The `.tsx` carries two hardcoded maps, `NODE_LABELS` and `NODE_AXIS`, both stopping at
//! N10. `nyuchi-ai-context` next door has the identical defect and this file makes three in
//! one node — which is the argument for treating a node table as DATA rather than as a
//! literal, everywhere it appears.
//!
//! The consequence here is visible rather than merely wrong. `NODE_AXIS[11]` is undefined, so
//! `AXIS_COLOURS[NODE_AXIS[n] ?? "horizontal"]` paints N11 and N12 cobalt — the horizontal
//! colour — while the `title` beside it reads "N11 — Unknown (unknown axis)". A changelog
//! entry touching the discovery rung renders with a confident wrong colour and a tooltip
//! admitting it does not know.
//!
//! So [`NodeStyle`] rows are a parameter. [`default_node_styles`] covers N1–N12 and is a
//! DEFAULT, not a definition — a caller reading `/api/v1/architecture` gets one that cannot
//! go stale.
//!
//! # The axis words are gone, the colours are not
//!
//! `horizontal` / `vertical` / `depth` / `outlier` are the retired layer-and-axis scheme.
//! The four colour classes they selected are real and shipped, so [`NodeAccent`] keeps the
//! colours and names them by their mineral — which is what they actually are — instead of by
//! a model this repo no longer uses. Every class string is byte-identical to the `.tsx`; the
//! contract test asserts each one appears there.

use dioxus::prelude::*;

/// Which mineral a node's badge is painted in.
///
/// Named for the mineral rather than the retired axis it used to stand for. The class
/// strings are unchanged, so nothing renders differently.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum NodeAccent {
    /// Cobalt. Was the `horizontal` axis, and the fallback for an unknown node.
    #[default]
    Cobalt,
    /// Tanzanite. Was the `vertical` axis.
    Tanzanite,
    /// Malachite. Was the `depth` axis.
    Malachite,
    /// Gold. Was the `outlier` axis.
    Gold,
}

impl NodeAccent {
    /// The badge classes. Identical to the `.tsx` `AXIS_COLOURS` entries.
    #[must_use]
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Cobalt => "bg-[var(--color-cobalt)]/10 text-[var(--color-cobalt)]",
            Self::Tanzanite => "bg-[var(--color-tanzanite)]/10 text-[var(--color-tanzanite)]",
            Self::Malachite => "bg-[var(--color-malachite)]/10 text-[var(--color-malachite)]",
            Self::Gold => "bg-[var(--color-gold)]/10 text-[var(--color-gold)]",
        }
    }
}

/// How one node renders in a badge.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeStyle {
    /// Node number. Uncapped.
    pub number: u16,
    /// Short label, e.g. `Primitives`.
    pub label: String,
    /// Badge colour.
    pub accent: NodeAccent,
}

impl NodeStyle {
    /// Build a row.
    #[must_use]
    pub fn new(number: u16, label: &str, accent: NodeAccent) -> Self {
        Self {
            number,
            label: label.to_owned(),
            accent,
        }
    }
}

/// The node set as it stands. A DEFAULT — see the module docs.
///
/// N1–N10 keep exactly the colours the `.tsx` gave them. N11 and N12 are added because the
/// `.tsx` rendered them as "Unknown" in a horizontal-axis colour it had not been asked for.
#[must_use]
pub fn default_node_styles() -> Vec<NodeStyle> {
    vec![
        NodeStyle::new(1, "Tokens", NodeAccent::Tanzanite),
        NodeStyle::new(2, "Primitives", NodeAccent::Cobalt),
        NodeStyle::new(3, "Brand", NodeAccent::Cobalt),
        NodeStyle::new(4, "Safety", NodeAccent::Tanzanite),
        NodeStyle::new(5, "Resilience", NodeAccent::Tanzanite),
        NodeStyle::new(6, "Pages", NodeAccent::Cobalt),
        NodeStyle::new(7, "Shell", NodeAccent::Cobalt),
        NodeStyle::new(8, "Assurance", NodeAccent::Malachite),
        NodeStyle::new(9, "Fundi", NodeAccent::Gold),
        NodeStyle::new(10, "Documentation", NodeAccent::Gold),
        NodeStyle::new(11, "Discovery", NodeAccent::Gold),
        NodeStyle::new(12, "Skills", NodeAccent::Gold),
    ]
}

/// One released version.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChangelogEntry {
    /// Semantic version.
    pub version: String,
    /// One-line headline.
    pub title: String,
    /// Longer prose.
    pub description: String,
    /// Release date, already formatted by the caller.
    ///
    /// A pre-formatted string rather than a date type, matching the `.tsx`, which renders
    /// `entry.date` verbatim. Formatting is the host's: it knows the viewer's locale and
    /// this component does not.
    pub date: String,
    /// Node numbers this release touched. Mirrors `changelog.nodes_affected`.
    pub nodes_affected: Vec<u16>,
    /// Components added.
    pub components_added: Vec<String>,
    /// Components changed.
    pub components_modified: Vec<String>,
    /// Components deprecated.
    pub components_deprecated: Vec<String>,
}

/// Look a node up, falling back the way the `.tsx` does.
fn style_for(styles: &[NodeStyle], n: u16) -> (String, NodeAccent) {
    styles.iter().find(|s| s.number == n).map_or_else(
        // The `.tsx` says "Unknown" here and paints the horizontal colour anyway. Saying
        // the node is unrecognised and colouring it as if it were is the part worth not
        // reproducing: the label admits the gap, and the default accent is stated.
        || (format!("N{n} — unrecognised node"), NodeAccent::default()),
        |s| (format!("N{} — {}", s.number, s.label), s.accent),
    )
}

const ROOT: &str = "flex flex-col gap-8";
const ARTICLE: &str = "relative border-l-2 border-border pl-6";
const DOT: &str = "absolute top-1 -left-[5px] size-2 rounded-full bg-primary";
const VERSION: &str = "font-mono text-sm font-bold text-primary";
const DATE: &str = "text-xs text-muted-foreground";
const TITLE: &str = "mt-1 text-lg font-semibold";
const DESCRIPTION: &str = "mt-1 text-sm text-muted-foreground";
const NODE_BADGE: &str = "rounded-full px-2 py-0.5 text-xs font-medium";
const ADDED: &str = "rounded bg-[var(--status-success,#64FFDA)]/10 px-1.5 py-0.5 text-xs text-[var(--status-success,#22C55E)]";
const MODIFIED: &str =
    "rounded bg-[var(--color-cobalt)]/10 px-1.5 py-0.5 text-xs text-[var(--color-cobalt)]";
const DEPRECATED: &str = "rounded bg-[var(--status-warning,#F59E0B)]/10 px-1.5 py-0.5 text-xs text-[var(--status-warning,#F59E0B)] line-through";

/// Join a base class string with a consumer's extra classes.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`ChangelogRenderer`].
#[derive(Props, Clone, PartialEq)]
pub struct ChangelogRendererProps {
    /// Entries, newest first.
    pub entries: Vec<ChangelogEntry>,
    /// Node styling. Empty means [`default_node_styles`].
    #[props(default)]
    pub node_styles: Vec<NodeStyle>,
    /// Extra classes, merged onto the root.
    #[props(default)]
    pub class: String,
    /// Any other root attributes.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// The database changelog as a visual timeline.
#[component]
pub fn ChangelogRenderer(props: ChangelogRendererProps) -> Element {
    let owned = default_node_styles();
    let styles: &[NodeStyle] = if props.node_styles.is_empty() {
        &owned
    } else {
        &props.node_styles
    };
    let total = props.entries.len();

    rsx! {
        div {
            "data-slot": "nyuchi-changelog-renderer",
            "data-portal": "https://mzizi.dev/components/nyuchi-changelog-renderer",
            class: join(ROOT, &props.class),
            role: "feed",
            "aria-label": "Changelog",
            ..props.attributes,

            for (index , entry) in props.entries.iter().enumerate() {
                article {
                    key: "{entry.version}",
                    class: ARTICLE,
                    // `role="feed"` requires its articles to carry their position, or a
                    // screen reader announces an unbounded stream with no sense of where the
                    // user is. The `.tsx` sets `role="feed"` and omits both.
                    "aria-posinset": "{index + 1}",
                    "aria-setsize": "{total}",
                    "aria-labelledby": "changelog-{entry.version}",

                    div { class: DOT }

                    div { class: "flex flex-wrap items-baseline gap-3",
                        span { class: VERSION, "{entry.version}" }
                        time { class: DATE, "{entry.date}" }
                    }

                    h3 { id: "changelog-{entry.version}", class: TITLE, "{entry.title}" }
                    p { class: DESCRIPTION, "{entry.description}" }

                    if !entry.nodes_affected.is_empty() {
                        div {
                            class: "mt-2 flex flex-wrap gap-1",
                            "aria-label": "Nodes affected",
                            for n in entry.nodes_affected.iter().copied() {
                                {
                                    let (label, accent) = style_for(styles, n);
                                    rsx! {
                                        span {
                                            key: "{n}",
                                            class: "{NODE_BADGE} {accent.classes()}",
                                            title: "{label}",
                                            "N{n}"
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if !entry.components_added.is_empty() {
                        div {
                            class: "mt-2 flex flex-wrap gap-1",
                            "aria-label": "Components added",
                            for c in entry.components_added.iter() {
                                span { key: "{c}", class: ADDED, "+{c}" }
                            }
                        }
                    }

                    if !entry.components_modified.is_empty() {
                        div {
                            class: "mt-1 flex flex-wrap gap-1",
                            "aria-label": "Components modified",
                            for c in entry.components_modified.iter() {
                                span { key: "{c}", class: MODIFIED, "~{c}" }
                            }
                        }
                    }

                    if !entry.components_deprecated.is_empty() {
                        div {
                            class: "mt-1 flex flex-wrap gap-1",
                            "aria-label": "Components deprecated",
                            for c in entry.components_deprecated.iter() {
                                span { key: "{c}", class: DEPRECATED, "{c}" }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_default_node_has_a_label_and_no_duplicates() {
        let styles = default_node_styles();
        assert_eq!(styles.len(), 12);
        for s in &styles {
            assert!(!s.label.is_empty());
        }
        let mut numbers: Vec<u16> = styles.iter().map(|s| s.number).collect();
        numbers.sort_unstable();
        numbers.dedup();
        assert_eq!(numbers.len(), styles.len());
    }

    #[test]
    fn the_defaults_reach_past_n10() {
        let styles = default_node_styles();
        assert!(styles.iter().any(|s| s.number == 11));
        assert!(styles.iter().any(|s| s.number == 12));
    }

    #[test]
    fn n1_to_n10_keep_the_colours_the_tsx_gave_them() {
        let styles = default_node_styles();
        let accent = |n: u16| styles.iter().find(|s| s.number == n).unwrap().accent;
        // vertical → tanzanite
        for n in [1, 4, 5] {
            assert_eq!(accent(n), NodeAccent::Tanzanite);
        }
        // horizontal → cobalt
        for n in [2, 3, 6, 7] {
            assert_eq!(accent(n), NodeAccent::Cobalt);
        }
        assert_eq!(accent(8), NodeAccent::Malachite);
        for n in [9, 10] {
            assert_eq!(accent(n), NodeAccent::Gold);
        }
    }

    #[test]
    fn an_unknown_node_says_so_rather_than_claiming_a_colour_it_was_not_given() {
        let (label, accent) = style_for(&default_node_styles(), 99);
        assert!(label.contains("unrecognised"));
        assert_eq!(accent, NodeAccent::default());
    }

    #[test]
    fn a_caller_supplied_table_replaces_the_default() {
        let custom = vec![NodeStyle::new(42, "Future", NodeAccent::Malachite)];
        let (label, accent) = style_for(&custom, 42);
        assert_eq!(label, "N42 — Future");
        assert_eq!(accent, NodeAccent::Malachite);
    }

    #[test]
    fn accent_classes_are_distinct() {
        let all = [
            NodeAccent::Cobalt,
            NodeAccent::Tanzanite,
            NodeAccent::Malachite,
            NodeAccent::Gold,
        ];
        for (i, a) in all.iter().enumerate() {
            for b in &all[i + 1..] {
                assert_ne!(a.classes(), b.classes());
            }
        }
    }
}
