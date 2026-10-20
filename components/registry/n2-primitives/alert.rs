//! ALERT — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/alert.contract.json`, beside `alert.tsx` and `alert.astro`:
//! a message with `role="alert"`, default or destructive, and its title, description and
//! action parts. Danger reads only the destructive token, never a brand colour.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1).

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

/// The classes every alert carries.
const BASE: &str = "grid gap-0.5 rounded-[var(--radius-lg,14px)] border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert";

/// The alert's variant.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum AlertVariant {
    /// The card surface.
    #[default]
    Default,
    /// Destructive text on the card surface.
    Destructive,
}

impl AlertVariant {
    fn classes(self) -> &'static str {
        match self {
            Self::Default => "bg-card text-card-foreground",
            Self::Destructive => {
                "text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
            }
        }
    }
}

/// Compose the full class string for an alert.
#[must_use]
pub fn alert_variants(variant: AlertVariant, extra: &str) -> String {
    let mut out = format!("{BASE} {}", variant.classes());
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`Alert`].
#[derive(Props, Clone, PartialEq)]
pub struct AlertProps {
    /// Default or destructive.
    #[props(default)]
    pub variant: AlertVariant,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// An icon, the title and description parts, an optional action.
    pub children: Element,
}

/// A message announced with `role="alert"`.
#[component]
pub fn Alert(props: AlertProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert",
            "data-portal": "https://mzizi.dev/components/alert",
            role: "alert",
            class: alert_variants(props.variant, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props shared by the alert's parts.
#[derive(Props, Clone, PartialEq)]
pub struct AlertPartProps {
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The part's content.
    pub children: Element,
}

/// The alert's heading line.
#[component]
pub fn AlertTitle(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-title",
            class: join("font-medium group-has-[>svg]/alert:col-start-2 hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The alert's description.
#[component]
pub fn AlertDescription(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-description",
            class: join("text-sm text-balance text-muted-foreground hover:text-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors [&_p:not(:last-child)]:mb-4", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// An action pinned to the alert's top right.
#[component]
pub fn AlertAction(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-action",
            class: join("absolute top-2.5 right-3", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes.
///
/// `children` is HTML the caller has already rendered: the title, description and action parts
/// through their own `render_*` functions, and any icon. It is written as it is, not escaped, so
/// it must be built from those functions, never from untrusted text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Default or destructive.
    pub variant: AlertVariant,
    /// Extra classes, appended last.
    pub class: String,
    /// The alert's parts, already rendered HTML.
    pub children: String,
}

/// The Dioxus-free render path for an alert part: the props [`render_title`],
/// [`render_description`] and [`render_action`] take, the same as [`AlertPartProps`] without the
/// free-form attributes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PartProps {
    /// Extra classes, appended last.
    pub class: String,
    /// The part's content, already rendered HTML.
    pub children: String,
}

/// Render an alert to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Alert`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let class = alert_variants(props.variant, &props.class);
    let mut out = String::with_capacity(BASE.len() + props.children.len() + 160);
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "alert"),
            ("data-portal", "https://mzizi.dev/components/alert"),
            ("role", "alert"),
            ("class", class.as_str()),
        ],
    );
    out.push_str(&props.children);
    html::close(&mut out, "div");
    out
}

/// Render an alert's title to an HTML string.
#[must_use]
pub fn render_title(props: &PartProps) -> String {
    part(
        "alert-title",
        &join(
            "font-medium group-has-[>svg]/alert:col-start-2 hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors",
            &props.class,
        ),
        &props.children,
    )
}

/// Render an alert's description to an HTML string.
#[must_use]
pub fn render_description(props: &PartProps) -> String {
    part(
        "alert-description",
        &join(
            "text-sm text-balance text-muted-foreground hover:text-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors [&_p:not(:last-child)]:mb-4",
            &props.class,
        ),
        &props.children,
    )
}

/// Render an alert's action to an HTML string.
#[must_use]
pub fn render_action(props: &PartProps) -> String {
    part(
        "alert-action",
        &join("absolute top-2.5 right-3", &props.class),
        &props.children,
    )
}

/// One `<div>` part with a slot name and a class, around its rendered children.
fn part(slot: &str, class: &str, children: &str) -> String {
    let mut out = String::with_capacity(children.len() + class.len() + 64);
    html::open(&mut out, "div", &[("data-slot", slot), ("class", class)]);
    out.push_str(children);
    html::close(&mut out, "div");
    out
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/alert.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "alert"
  role is "alert"
  portal is "https://mzizi.dev/components/alert"
  class contains "bg-card"
  when default shows div "Heads up"
  when destructive class contains "text-destructive"
end"#;
