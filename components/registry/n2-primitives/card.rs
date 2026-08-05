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
