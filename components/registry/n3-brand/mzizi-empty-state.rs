//! MZIZI EMPTY STATE — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-empty-state.tsx`: the branded empty state every feed and list
//! shows when there is nothing in it. Same `data-slot`, same `role="status"`, same compact and
//! full sizes, same brand-accent primary action.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziEmptyStateProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.
//!
//! # An action needs both a label and a handler, as in the `.tsx`
//!
//! The `.tsx` renders the primary button only when `onAction && actionLabel`, and the same for
//! the secondary. [`EmptyStateAction`] carries the two together, so the half-configured case
//! the `.tsx` silently drops cannot be written.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-empty-state"
  portal is "https://mzizi.dev/components/mzizi-empty-state"
  role is "status"
  every empty_state_density padding not_empty
  button "Create" min_height 48
  button "Learn more" min_height 48
end"#;

/// Full or compact spacing. `compact` is the `.tsx`'s boolean prop.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum EmptyStateDensity {
    /// Page-level empty state.
    #[default]
    Full,
    /// Inline empty state inside a card.
    Compact,
}

impl EmptyStateDensity {
    /// Every density, for exhaustive checks.
    pub const ALL: [Self; 2] = [Self::Full, Self::Compact];

    /// Outer padding.
    #[must_use]
    pub const fn padding(self) -> &'static str {
        match self {
            Self::Full => "px-6 py-16",
            Self::Compact => "px-4 py-8",
        }
    }

    /// Icon well size and spacing.
    #[must_use]
    pub const fn icon(self) -> &'static str {
        match self {
            Self::Full => "mb-4 size-16 text-2xl",
            Self::Compact => "mb-3 size-12 text-xl",
        }
    }

    /// Title size.
    #[must_use]
    pub const fn title(self) -> &'static str {
        match self {
            Self::Full => "text-base",
            Self::Compact => "text-sm",
        }
    }

    /// Description size and spacing.
    #[must_use]
    pub const fn description(self) -> &'static str {
        match self {
            Self::Full => "mt-2 text-sm",
            Self::Compact => "mt-1 text-xs",
        }
    }

    /// Space above the actions.
    #[must_use]
    pub const fn actions(self) -> &'static str {
        match self {
            Self::Full => "mt-6",
            Self::Compact => "mt-4",
        }
    }
}

/// A labelled action button.
#[derive(Clone, PartialEq)]
pub struct EmptyStateAction {
    /// Button label.
    pub label: String,
    /// Fired on press.
    pub on_press: EventHandler<()>,
}

/// The entrance animation, empty when motion is reduced — the `.tsx`'s `animStyle`, with the
/// harness's 200ms decelerate curve.
#[must_use]
pub fn entrance_style(prefers_reduced_motion: bool) -> &'static str {
    if prefers_reduced_motion {
        ""
    } else {
        "animation: nyuchi-fade-slide-up 200ms cubic-bezier(0, 0, 0.2, 1) both;"
    }
}

const PRIMARY: &str = "h-12 rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] px-6 text-[13px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";
const SECONDARY: &str = "h-12 rounded-full border border-border bg-muted px-6 text-[13px] font-medium text-foreground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";

/// Props for [`MziziEmptyState`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziEmptyStateProps {
    /// Illustration or glyph above the title.
    #[props(default)]
    pub icon: Option<Element>,
    /// What is empty.
    #[props(into)]
    pub title: String,
    /// What the user can do about it.
    #[props(default)]
    pub description: Option<String>,
    /// Primary call to action.
    #[props(default)]
    pub action: Option<EmptyStateAction>,
    /// Secondary action.
    #[props(default)]
    pub secondary: Option<EmptyStateAction>,
    /// Full or compact spacing.
    #[props(default)]
    pub density: EmptyStateDensity,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// The branded empty state.
#[component]
pub fn MziziEmptyState(props: MziziEmptyStateProps) -> Element {
    let d = props.density;
    let root = if props.class.is_empty() {
        format!(
            "flex flex-col items-center justify-center text-center {}",
            d.padding()
        )
    } else {
        format!(
            "flex flex-col items-center justify-center text-center {} {}",
            d.padding(),
            props.class
        )
    };
    let has_actions = props.action.is_some() || props.secondary.is_some();
    rsx! {
        div {
            "data-slot": "mzizi-empty-state",
            "data-portal": "https://mzizi.dev/components/mzizi-empty-state",
            role: "status",
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            if let Some(icon) = &props.icon {
                div { class: "flex items-center justify-center rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))]/10 {d.icon()}",
                    {icon}
                }
            }
            h3 { class: "font-semibold text-foreground {d.title()}", style: "font-family: var(--font-serif);",
                "{props.title}"
            }
            if let Some(description) = &props.description {
                p { class: "max-w-[280px] leading-relaxed text-muted-foreground {d.description()}", "{description}" }
            }
            if has_actions {
                div { class: "flex items-center gap-2 {d.actions()}",
                    if let Some(action) = &props.action {
                        button {
                            r#type: "button",
                            class: PRIMARY,
                            onclick: {
                                let on_press = action.on_press;
                                move |_| on_press.call(())
                            },
                            "{action.label}"
                        }
                    }
                    if let Some(secondary) = &props.secondary {
                        button {
                            r#type: "button",
                            class: SECONDARY,
                            onclick: {
                                let on_press = secondary.on_press;
                                move |_| on_press.call(())
                            },
                            "{secondary.label}"
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
    fn compact_is_tighter_than_full() {
        assert_eq!(EmptyStateDensity::Full.padding(), "px-6 py-16");
        assert_eq!(EmptyStateDensity::Compact.padding(), "px-4 py-8");
    }

    #[test]
    fn both_action_buttons_meet_the_touch_floor() {
        assert!(PRIMARY.split_whitespace().any(|c| c == "h-12"));
        assert!(SECONDARY.split_whitespace().any(|c| c == "h-12"));
    }
}
