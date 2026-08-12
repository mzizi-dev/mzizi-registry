//! NYUCHI DOCS ENGINE — N10 documentation, Dioxus.
//!
//! The Rust sibling of `nyuchi-docs-engine.tsx`, sharing its contract: the same `data-slot`,
//! the same sidebar/main split, and the same class strings, so a Dioxus app renders markup a
//! React-authored stylesheet already styles.
//!
//! # Two accessibility defects in the TypeScript, fixed here
//!
//! **1. `role="listitem"` on a `<button>` destroys the button.** The `.tsx` puts
//! `role="list"` on a `<nav>` and `role="listitem"` on each `<button>` inside it. An explicit
//! role REPLACES the implicit one, so assistive technology is told these are list items, not
//! buttons — a screen-reader user loses the "button" announcement and the interaction hint on
//! every navigation control in the sidebar. The `listitem` is invalid regardless: its required
//! owner is a `list`, and `<nav role="list">` is a role clash of its own.
//!
//! Here the nav holds a `<ul>` of `<li>`s, each containing a plain `<button>`. The list
//! semantics are real, and the buttons stay buttons.
//!
//! **2. `min-h-[44px]` is below the floor this system publishes.** N10's own
//! `nyuchi-ai-context` states the rule as "Touch targets: 48px minimum", and the sidebar
//! entries — the primary navigation of a documentation portal, on a mobile viewport — are
//! 44. That is Apple's number, not this system's. Raised to `min-h-[48px]`; nothing else about
//! the control changes.
//!
//! **The `.tsx` sibling still has both.**
//!
//! # A hydration hazard not reproduced
//!
//! The `.tsx` renders `new Date(updatedAt).toLocaleDateString()`. That formats against
//! whatever locale and timezone the runtime has, so a server render and a client render can
//! disagree and React reports a hydration mismatch — and the visible date depends on where
//! the process runs rather than who is reading. [`DocPage::updated_at`] is a pre-formatted
//! string, like `ChangelogEntry::date` next door: the host knows the viewer's locale and this
//! component does not.
//!
//! # The node table, a third time in this node
//!
//! `NODE_LABELS` is hardcoded N1–N10 again. Its fallback is at least graceful — an unknown
//! node renders `N{n}` — so the visible damage is smaller than in the changelog renderer, but
//! it is the same literal going stale. [`node_label`] takes the table as data.

use dioxus::prelude::*;

/// One documentation page.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DocPage {
    /// URL slug, unique.
    pub slug: String,
    /// Page title.
    pub title: String,
    /// Grouping for the sidebar. Hyphens render as spaces.
    pub category: String,
    /// Optional finer grouping. Carried for parity with the `.tsx` and the
    /// `documentation_pages` column; the sidebar groups by `category` alone.
    pub subcategory: Option<String>,
    /// Markdown/MDX body. Rendered by the host — see [`DocsEngineProps::render_content`].
    pub content: String,
    /// Short summary.
    pub description: Option<String>,
    /// Search keywords.
    pub keywords: Vec<String>,
    /// Node numbers this page relates to. Mirrors `documentation_pages.related_nodes`.
    pub related_nodes: Vec<u16>,
    /// Related component names.
    pub related_components: Vec<String>,
    /// Version this page documents.
    pub version: Option<String>,
    /// Last-updated, ALREADY FORMATTED by the host. See the module docs.
    pub updated_at: Option<String>,
}

impl DocPage {
    /// A page with only the required fields.
    #[must_use]
    pub fn new(slug: &str, title: &str, category: &str, content: &str) -> Self {
        Self {
            slug: slug.to_owned(),
            title: title.to_owned(),
            category: category.to_owned(),
            subcategory: None,
            content: content.to_owned(),
            description: None,
            keywords: Vec::new(),
            related_nodes: Vec::new(),
            related_components: Vec::new(),
            version: None,
            updated_at: None,
        }
    }

    /// Whether this page matches a search query.
    ///
    /// Title, description and keywords, case-insensitively — the same three fields the `.tsx`
    /// searches, in the same order.
    #[must_use]
    pub fn matches(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        self.title.to_lowercase().contains(&q)
            || self
                .description
                .as_deref()
                .is_some_and(|d| d.to_lowercase().contains(&q))
            || self.keywords.iter().any(|k| k.to_lowercase().contains(&q))
    }
}

/// A node number to its sidebar label.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeLabel {
    /// Node number. Uncapped.
    pub number: u16,
    /// Display text, e.g. `N2 Primitives`.
    pub label: String,
}

/// The node labels as they stand. A DEFAULT, not a definition — see the module docs.
#[must_use]
pub fn default_node_labels() -> Vec<NodeLabel> {
    [
        (1, "N1 Tokens"),
        (2, "N2 Primitives"),
        (3, "N3 Brand"),
        (4, "N4 Safety"),
        (5, "N5 Resilience"),
        (6, "N6 Pages"),
        (7, "N7 Shell"),
        (8, "N8 Assurance"),
        (9, "N9 Fundi"),
        (10, "N10 Docs"),
        (11, "N11 Discovery"),
        (12, "N12 Skills"),
    ]
    .into_iter()
    .map(|(number, label)| NodeLabel {
        number,
        label: label.to_owned(),
    })
    .collect()
}

/// A node's label, falling back to `N{n}` exactly as the `.tsx` does.
#[must_use]
pub fn node_label(labels: &[NodeLabel], n: u16) -> String {
    labels
        .iter()
        .find(|l| l.number == n)
        .map_or_else(|| format!("N{n}"), |l| l.label.clone())
}

/// Filter pages by a search query, preserving order.
///
/// An empty or whitespace-only query returns everything, matching the `.tsx` `search.trim()`.
#[must_use]
pub fn filter_pages(pages: &[DocPage], search: &str) -> Vec<DocPage> {
    if search.trim().is_empty() {
        return pages.to_vec();
    }
    pages
        .iter()
        .filter(|p| p.matches(search))
        .cloned()
        .collect()
}

/// Distinct categories, in first-appearance order.
///
/// The `.tsx` uses `[...new Set(...)]`, which preserves insertion order; a `HashSet` here
/// would reorder the sidebar between runs.
#[must_use]
pub fn categories(pages: &[DocPage]) -> Vec<String> {
    let mut seen: Vec<String> = Vec::new();
    for p in pages {
        if !seen.iter().any(|c| c == &p.category) {
            seen.push(p.category.clone());
        }
    }
    seen
}

/// A category slug as the sidebar shows it: hyphens become spaces.
#[must_use]
pub fn category_label(category: &str) -> String {
    category.replace('-', " ")
}

const ROOT: &str = "flex h-screen overflow-hidden bg-background";
const ASIDE: &str = "w-64 shrink-0 overflow-y-auto border-r border-border p-4";
const SEARCH_INPUT: &str = "min-h-[48px] w-full rounded-[var(--radius-md,12px)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--ring)]";
const CATEGORY_HEADING: &str =
    "mb-1 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase";
/// The `.tsx` says `min-h-[44px]`. See the module docs.
const NAV_ITEM: &str = "block min-h-[48px] w-full rounded-[var(--radius-sm,7px)] px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]";
const NAV_ITEM_CURRENT: &str = "bg-muted font-medium text-foreground";
const NAV_ITEM_IDLE: &str = "text-muted-foreground hover:bg-muted hover:text-foreground";
const MAIN: &str = "flex-1 overflow-y-auto p-8";
const PAGE_TITLE: &str = "font-serif text-3xl font-bold";
const PAGE_DESCRIPTION: &str = "mt-2 text-lg text-muted-foreground";
const RELATED_NODE: &str =
    "rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground";
const PROSE: &str = "prose prose-sm max-w-none text-foreground";
const FALLBACK_CONTENT: &str = "font-sans text-sm leading-relaxed whitespace-pre-wrap";

/// Join a base class string with a consumer's extra classes.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`DocsEngine`].
#[derive(Props, Clone, PartialEq)]
pub struct DocsEngineProps {
    /// Every page the portal knows about.
    pub pages: Vec<DocPage>,
    /// Slug of the page on screen.
    #[props(default)]
    pub current_slug: Option<String>,
    /// Called when a sidebar entry is chosen.
    #[props(default)]
    pub on_navigate: Option<EventHandler<String>>,
    /// Current search text.
    #[props(default)]
    pub search: String,
    /// Called as the search box changes. Absent hides the search box, as in the `.tsx`.
    #[props(default)]
    pub on_search: Option<EventHandler<String>>,
    /// Render the page body. Absent falls back to preformatted text.
    ///
    /// The host owns markdown/MDX, exactly as in the `.tsx` — this component does layout and
    /// navigation and deliberately ships no renderer.
    #[props(default)]
    pub render_content: Option<Callback<DocPage, Element>>,
    /// Node labels. Empty means [`default_node_labels`].
    #[props(default)]
    pub node_labels: Vec<NodeLabel>,
    /// Extra classes, merged onto the root.
    #[props(default)]
    pub class: String,
    /// Any other root attributes.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// The documentation portal: sidebar navigation plus a rendered page.
#[component]
pub fn DocsEngine(props: DocsEngineProps) -> Element {
    let current_page = props
        .current_slug
        .as_ref()
        .and_then(|slug| props.pages.iter().find(|p| &p.slug == slug))
        .cloned();

    let filtered = filter_pages(&props.pages, &props.search);
    let cats = categories(&filtered);

    let owned_labels = default_node_labels();
    let labels: &[NodeLabel] = if props.node_labels.is_empty() {
        &owned_labels
    } else {
        &props.node_labels
    };

    let searching = !props.search.trim().is_empty();

    // Read before the `if let` below consumes `current_page`.
    let main_label = current_page
        .as_ref()
        .map_or_else(|| "Documentation".to_owned(), |p| p.title.clone());

    rsx! {
        div {
            "data-slot": "nyuchi-docs-engine",
            "data-portal": "https://mzizi.dev/components/nyuchi-docs-engine",
            class: join(ROOT, &props.class),
            ..props.attributes,

            aside { class: ASIDE, "aria-label": "Documentation navigation",

                if let Some(on_search) = props.on_search {
                    div { class: "mb-4",
                        label { r#for: "docs-search", class: "sr-only", "Search documentation" }
                        input {
                            id: "docs-search",
                            value: "{props.search}",
                            placeholder: "Search docs...",
                            class: SEARCH_INPUT,
                            oninput: move |e| on_search.call(e.value()),
                        }
                    }
                }

                if cats.is_empty() && searching {
                    p { class: "px-2 text-sm text-muted-foreground", "No results for \"{props.search}\"" }
                }

                for cat in cats.iter() {
                    div { key: "{cat}", class: "mb-4",
                        p { class: CATEGORY_HEADING, "{category_label(cat)}" }
                        // A real list of real buttons. The `.tsx` puts role="list" on the
                        // nav and role="listitem" on each button, which takes the button
                        // role away from every control here.
                        nav {
                            ul { class: "contents",
                                for p in filtered.iter().filter(|p| &p.category == cat) {
                                    li { key: "{p.slug}",
                                        {
                                            let is_current = props.current_slug.as_deref() == Some(p.slug.as_str());
                                            let slug = p.slug.clone();
                                            // Hoisted: an rsx format string takes an ident or a
                                            // simple expression, not an `if` block.
                                            let item_class = format!(
                                                "{NAV_ITEM} {}",
                                                if is_current { NAV_ITEM_CURRENT } else { NAV_ITEM_IDLE }
                                            );
                                            let current = if is_current { "page" } else { "false" };
                                            rsx! {
                                                button {
                                                    class: "{item_class}",
                                                    "aria-current": "{current}",
                                                    onclick: move |_| {
                                                        if let Some(nav) = props.on_navigate {
                                                            nav.call(slug.clone());
                                                        }
                                                    },
                                                    "{p.title}"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            main {
                class: MAIN,
                "aria-label": "{main_label}",

                if let Some(page) = current_page {
                    article { class: "max-w-3xl",
                        header { class: "mb-8 border-b border-border pb-6",
                            h1 { class: PAGE_TITLE, "{page.title}" }

                            if let Some(description) = page.description.as_ref() {
                                p { class: PAGE_DESCRIPTION, "{description}" }
                            }

                            div { class: "mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
                                if let Some(version) = page.version.as_ref() {
                                    span { class: "font-mono", "v{version}" }
                                }
                                if let Some(updated) = page.updated_at.as_ref() {
                                    time { "Updated {updated}" }
                                }
                            }

                            if !page.related_nodes.is_empty() {
                                div {
                                    class: "mt-3 flex flex-wrap gap-1.5",
                                    "aria-label": "Related ecosystem nodes",
                                    for n in page.related_nodes.iter().copied() {
                                        {
                                            let label = node_label(labels, n);
                                            rsx! {
                                                span { key: "{n}", class: RELATED_NODE, title: "{label}", "{label}" }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        div { class: PROSE,
                            if let Some(render) = props.render_content {
                                {render.call(page.clone())}
                            } else {
                                pre { class: FALLBACK_CONTENT, "{page.content}" }
                            }
                        }
                    }
                } else {
                    div { class: "flex h-full items-center justify-center",
                        p { class: "text-muted-foreground",
                            if props.pages.is_empty() {
                                "No documentation pages found."
                            } else {
                                "Select a page from the sidebar."
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

    fn pages() -> Vec<DocPage> {
        let mut a = DocPage::new("intro", "Getting started", "guides", "body");
        a.description = Some("How to begin".to_owned());
        a.keywords = vec!["setup".to_owned(), "install".to_owned()];
        let b = DocPage::new("tokens", "Design tokens", "reference", "body");
        let c = DocPage::new("button", "Button", "reference", "body");
        vec![a, b, c]
    }

    #[test]
    fn an_empty_search_returns_everything() {
        assert_eq!(filter_pages(&pages(), "").len(), 3);
        assert_eq!(filter_pages(&pages(), "   ").len(), 3);
    }

    #[test]
    fn search_covers_title_description_and_keywords() {
        assert_eq!(filter_pages(&pages(), "Button").len(), 1);
        assert_eq!(filter_pages(&pages(), "how to begin").len(), 1);
        assert_eq!(filter_pages(&pages(), "install").len(), 1);
    }

    #[test]
    fn search_is_case_insensitive_in_both_directions() {
        // Query case and source case both fold.
        assert_eq!(filter_pages(&pages(), "BUTTON").len(), 1);
        assert_eq!(filter_pages(&pages(), "getting STARTED").len(), 1);
    }

    #[test]
    fn search_is_substring_not_fuzzy() {
        // The words are present but not contiguous, so it does not match — the `.ts`
        // uses `String.includes`, and this must behave identically or the two targets
        // return different result sets for the same query.
        assert_eq!(filter_pages(&pages(), "getting fast").len(), 0);
        assert_eq!(filter_pages(&pages(), "sartd").len(), 0);
    }

    #[test]
    fn categories_keep_first_appearance_order() {
        assert_eq!(categories(&pages()), vec!["guides", "reference"]);
    }

    #[test]
    fn categories_of_nothing_is_nothing() {
        assert!(categories(&[]).is_empty());
    }

    #[test]
    fn a_category_slug_renders_with_spaces() {
        assert_eq!(
            category_label("getting-started-fast"),
            "getting started fast"
        );
    }

    #[test]
    fn node_labels_fall_back_to_the_bare_number() {
        let labels = default_node_labels();
        assert_eq!(node_label(&labels, 2), "N2 Primitives");
        assert_eq!(node_label(&labels, 99), "N99");
    }

    #[test]
    fn the_default_labels_reach_past_n10() {
        let labels = default_node_labels();
        assert_eq!(node_label(&labels, 11), "N11 Discovery");
        assert_eq!(node_label(&labels, 12), "N12 Skills");
    }

    #[test]
    fn caller_supplied_labels_replace_the_default() {
        let custom = vec![NodeLabel {
            number: 2,
            label: "Second".to_owned(),
        }];
        assert_eq!(node_label(&custom, 2), "Second");
    }

    #[test]
    fn the_nav_item_meets_the_published_touch_floor() {
        // The .tsx ships min-h-[44px]; the system publishes 48px minimum.
        assert!(NAV_ITEM.contains("min-h-[48px]"));
        assert!(!NAV_ITEM.contains("44px"));
    }

    #[test]
    fn the_search_box_meets_it_too() {
        assert!(SEARCH_INPUT.contains("min-h-[48px]"));
    }
}
