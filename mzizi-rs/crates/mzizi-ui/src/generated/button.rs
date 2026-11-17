// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/button.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! BUTTON — N2 primitive, Dioxus (pattern: unstyled, #708).
//!
//! The Rust sibling of `button.tsx`. They share a CONTRACT and the same attributes, not a
//! source file: `data-slot`, `data-portal`, `data-variant`, `data-size` and `data-state`,
//! so one stylesheet (`styles/pattern/mzizi-theme.css`) and one test selector serve both.
//!
//! This component emits NO styling class. The look is in the stylesheet, keyed on those
//! attributes; the identity-neutral minimums are in `floor.css`; the values are in
//! `tokens.css`. `class` is a pass-through for the adopter's own classes.
//!
//! No harness. Primitives are too low-level for observability wiring; brand components
//! that USE a button wire in at their own level (CLAUDE.md §6.2).

use dioxus::prelude::*;

/// Visual treatment. The set matches `button.tsx` exactly; a variant that exists on one
/// target and not the other is a broken contract, not a feature.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonVariant {
    /// Solid primary fill — the default call to action.
    #[default]
    Default,
    /// Bordered, transparent-ish fill.
    Outline,
    /// Solid secondary fill.
    Secondary,
    /// No fill until hovered.
    Ghost,
    /// Destructive action — delete, remove, revoke.
    Destructive,
    /// Renders as an inline text link.
    Link,
}

/// Control size. The stylesheet sets the heights from the size roles.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonSize {
    /// The default control height.
    #[default]
    Default,
    /// The small control height.
    Sm,
    /// The large control height.
    Lg,
    /// A square, for an icon alone.
    Icon,
    /// A small square, for an icon alone.
    IconSm,
}

impl ButtonVariant {
    /// The `data-variant` value, matching what the React component emits.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Outline => "outline",
            Self::Secondary => "secondary",
            Self::Ghost => "ghost",
            Self::Destructive => "destructive",
            Self::Link => "link",
        }
    }
}

impl ButtonSize {
    /// The `data-size` value.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Sm => "sm",
            Self::Lg => "lg",
            Self::Icon => "icon",
            Self::IconSm => "icon-sm",
        }
    }
}

/// Props for [`Button`].
#[derive(Props, Clone, PartialEq)]
pub struct ButtonProps {
    /// Visual treatment.
    #[props(default)]
    pub variant: ButtonVariant,
    /// Control size.
    #[props(default)]
    pub size: ButtonSize,
    /// The native `disabled` attribute, mirrored to `data-state`.
    #[props(default)]
    pub disabled: bool,
    /// The adopter's own classes, passed through untouched. The component adds none.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute — `onclick`, `aria-*`, `type`, and the rest.
    #[props(extends = GlobalAttributes, extends = button)]
    pub attributes: Vec<Attribute>,
    /// Button label or icon.
    pub children: Element,
}

/// A button with structure, state and ARIA only.
///
/// ```ignore
/// rsx! { Button { variant: ButtonVariant::Outline, "Cancel" } }
/// ```
#[component]
pub fn Button(props: ButtonProps) -> Element {
    let state = if props.disabled {
        "disabled"
    } else {
        "enabled"
    };
    let class = (!props.class.is_empty()).then(|| props.class.clone());
    rsx! {
        button {
            "data-slot": "button",
            "data-portal": "https://mzizi.dev/components/button",
            "data-variant": props.variant.slug(),
            "data-size": props.size.slug(),
            "data-state": state,
            disabled: props.disabled,
            class: class,
            ..props.attributes,
            {props.children}
        }
    }
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/button.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "button"
  portal is "https://mzizi.dev/components/button"
end"#;
