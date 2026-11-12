//! CARD — N2 primitive, Dioxus.
//!
//! The Rust sibling of `card.tsx`, sharing its contract: the same seven slots, the same
//! `data-slot` names, the same radius tokens, and the same built-in loading skeleton.
//!
//! The card is the most composed primitive in the system — every brand component that shows
//! content in a container ultimately renders one — which is why the slots matter more than
//! the container. A Dioxus consumer composing `CardHeader` / `CardTitle` / `CardContent`
//! produces markup a React-authored stylesheet already styles, because the `data-slot` names
//! are the contract.
//!
//! Token compliance, identical to the TypeScript:
//!   * `rounded-[var(--radius-lg,14px)]` — the Mzizi card radius, with the documented `var()`
//!     fallback form so the component still has a radius in an app that has not defined the
//!     custom property (CLAUDE.md §7.6)
//!   * `ring-1 ring-foreground/10` for the border, consistent across themes

use dioxus::prelude::*;

/// The escaping HTML writer `render` uses, inlined so this file installs on its own.
///
/// It is a copy of `mzizi-ui/src/html.rs`, which is the reference and carries the unit tests.
/// A test in `html.rs` holds the two to the same output on the five escaped characters and on
/// non-ASCII text, so the copies cannot drift without a test failing.
mod html {
    /// Escape `value` for text and double-quoted attribute values: `&`, `<`, `>`, `"` and `'`
    /// become decimal references; everything else, including non-ASCII, is written unchanged.
    fn escape_into(out: &mut String, value: &str) {
        for c in value.chars() {
            match c {
                '&' => out.push_str("&#38;"),
                '<' => out.push_str("&#60;"),
                '>' => out.push_str("&#62;"),
                '"' => out.push_str("&#34;"),
                '\'' => out.push_str("&#39;"),
                _ => out.push(c),
            }
        }
    }

    /// Write an opening tag with its attributes, in the order given. Values are escaped.
    pub(super) fn open(out: &mut String, tag: &str, attrs: &[(&str, &str)]) {
        out.push('<');
        out.push_str(tag);
        for (name, value) in attrs {
            out.push(' ');
            out.push_str(name);
            out.push_str("=\"");
            escape_into(out, value);
            out.push('"');
        }
        out.push('>');
    }

    /// Write a closing tag.
    pub(super) fn close(out: &mut String, tag: &str) {
        out.push_str("</");
        out.push_str(tag);
        out.push('>');
    }
}

/// Card density.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CardSize {
    /// Standard padding and gaps.
    #[default]
    Default,
    /// Tighter padding and gaps.
    Sm,
}

impl CardSize {
    /// The `data-size` value, which the descendant slots key their padding off via
    /// `group-data-[size=sm]/card:`.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Sm => "sm",
        }
    }
}

const CARD_BASE: &str = "group/card flex flex-col gap-6 overflow-hidden rounded-[var(--radius-lg,14px)] bg-card py-6 text-sm text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-[var(--radius-md,12px)] *:[img:last-child]:rounded-b-[var(--radius-md,12px)]";

const CARD_LOADING: &str = "group/card flex animate-pulse flex-col gap-4 overflow-hidden rounded-[var(--radius-lg,14px)] bg-card p-6 text-sm ring-1 ring-foreground/10";

/// Join a base class string with a consumer's extra classes.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_string()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`Card`].
#[derive(Props, Clone, PartialEq)]
pub struct CardProps {
    /// Density.
    #[props(default)]
    pub size: CardSize,
    /// Render the built-in skeleton instead of the children.
    ///
    /// Every component from N2 up renders its own skeleton rather than leaving the decision
    /// to the page, so a slow section degrades in place instead of collapsing the layout.
    #[props(default = false)]
    pub loading: bool,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// Card contents — normally `CardHeader`, `CardContent`, `CardFooter`.
    pub children: Element,
}

/// A content container.
#[component]
pub fn Card(props: CardProps) -> Element {
    if props.loading {
        let class = join(
            CARD_LOADING,
            &if matches!(props.size, CardSize::Sm) {
                join("gap-3 p-4", &props.class)
            } else {
                props.class.clone()
            },
        );
        return rsx! {
            div {
                "data-slot": "card",
                "data-portal": "https://mzizi.dev/components/card",
                "data-loading": "true",
                class,
                div { class: "h-4 w-2/3 rounded bg-muted" }
                div { class: "h-3 w-full rounded bg-muted" }
                div { class: "h-3 w-4/5 rounded bg-muted" }
            }
        };
    }

    rsx! {
        div {
            "data-slot": "card",
            "data-size": props.size.slug(),
            class: join(CARD_BASE, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props shared by every plain card slot.
#[derive(Props, Clone, PartialEq)]
pub struct CardSlotProps {
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// Slot contents.
    pub children: Element,
}

/// The card's header region.
#[component]
pub fn CardHeader(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-header",
            class: join("group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-[var(--radius-md,12px)] px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The card's title.
#[component]
pub fn CardTitle(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-title",
            class: join("text-base font-medium", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Supporting text under the title.
#[component]
pub fn CardDescription(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-description",
            class: join("text-sm text-muted-foreground", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// An action pinned to the header's trailing edge.
#[component]
pub fn CardAction(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-action",
            class: join("col-start-2 row-span-2 row-start-1 self-start justify-self-end", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The card's main body.
#[component]
pub fn CardContent(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-content",
            class: join("px-6 group-data-[size=sm]/card:px-4", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The card's footer region.
#[component]
pub fn CardFooter(props: CardSlotProps) -> Element {
    rsx! {
        div {
            "data-slot": "card-footer",
            class: join("flex items-center rounded-b-[var(--radius-md,12px)] px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes.
///
/// `children` is HTML the caller has already rendered, through the slot `render_*` functions. It
/// is written as it is, not escaped, so it must be built from those functions, never from
/// untrusted text. With `loading` the children are not written, as in [`Card`].
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Density.
    pub size: CardSize,
    /// Render the built-in skeleton instead of the children.
    pub loading: bool,
    /// Extra classes, appended last.
    pub class: String,
    /// The card's slots, already rendered HTML.
    pub children: String,
}

/// The Dioxus-free render path for a card slot: the props every `render_*` slot function takes,
/// the same as [`CardSlotProps`] without the free-form attributes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SlotProps {
    /// Extra classes, appended last.
    pub class: String,
    /// The slot's content, already rendered HTML.
    pub children: String,
}

/// Render a card to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Card`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    if props.loading {
        let class = join(
            CARD_LOADING,
            &if matches!(props.size, CardSize::Sm) {
                join("gap-3 p-4", &props.class)
            } else {
                props.class.clone()
            },
        );
        let mut out = String::with_capacity(CARD_LOADING.len() + 256);
        html::open(
            &mut out,
            "div",
            &[
                ("data-slot", "card"),
                ("data-portal", "https://mzizi.dev/components/card"),
                ("data-loading", "true"),
                ("class", class.as_str()),
            ],
        );
        for bar in [
            "h-4 w-2/3 rounded bg-muted",
            "h-3 w-full rounded bg-muted",
            "h-3 w-4/5 rounded bg-muted",
        ] {
            html::open(&mut out, "div", &[("class", bar)]);
            html::close(&mut out, "div");
        }
        html::close(&mut out, "div");
        return out;
    }
    let class = join(CARD_BASE, &props.class);
    let mut out = String::with_capacity(CARD_BASE.len() + props.children.len() + 64);
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "card"),
            ("data-size", props.size.slug()),
            ("class", class.as_str()),
        ],
    );
    out.push_str(&props.children);
    html::close(&mut out, "div");
    out
}

/// One slot `<div>`: a slot name, its base classes with the caller's extra ones, and its children.
fn slot(name: &str, base: &str, props: &SlotProps) -> String {
    let class = join(base, &props.class);
    let mut out = String::with_capacity(props.children.len() + class.len() + 64);
    html::open(
        &mut out,
        "div",
        &[("data-slot", name), ("class", class.as_str())],
    );
    out.push_str(&props.children);
    html::close(&mut out, "div");
    out
}

/// Render a card's header to an HTML string.
#[must_use]
pub fn render_header(props: &SlotProps) -> String {
    slot(
        "card-header",
        "group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-[var(--radius-md,12px)] px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        props,
    )
}

/// Render a card's title to an HTML string.
#[must_use]
pub fn render_title(props: &SlotProps) -> String {
    slot("card-title", "text-base font-medium", props)
}

/// Render a card's description to an HTML string.
#[must_use]
pub fn render_description(props: &SlotProps) -> String {
    slot("card-description", "text-sm text-muted-foreground", props)
}

/// Render a card's action to an HTML string.
#[must_use]
pub fn render_action(props: &SlotProps) -> String {
    slot(
        "card-action",
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        props,
    )
}

/// Render a card's content to an HTML string.
#[must_use]
pub fn render_content(props: &SlotProps) -> String {
    slot("card-content", "px-6 group-data-[size=sm]/card:px-4", props)
}

/// Render a card's footer to an HTML string.
#[must_use]
pub fn render_footer(props: &SlotProps) -> String {
    slot(
        "card-footer",
        "flex items-center rounded-b-[var(--radius-md,12px)] px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        props,
    )
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/card.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "card"
  class contains "bg-card"
  class contains "rounded-[var(--radius-lg,14px)]"
  when default shows div "Body"
  when sm slot is "card"
  when loading class contains "animate-pulse"
end"#;
