//! MZIZI SUCCESS SCREEN — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-success-screen.tsx`: the confirmation shown after a payment,
//! a booking or a submission. Same `data-slot`, same polite live `role="status"`, same default
//! check mark in the success mineral, same pill actions at the 48px floor.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziSuccessScreenProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-success-screen"
  portal is "https://mzizi.dev/components/mzizi-success-screen"
  role is "status"
  title is "Success"
  button "Done" min_height 48
  button "View receipt" min_height 48
end"#;

/// A labelled action button.
#[derive(Clone, PartialEq)]
pub struct SuccessAction {
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

/// The success mineral, used for the default check mark.
pub const SUCCESS_STROKE: &str = "var(--status-success, var(--color-malachite, #64FFDA))";

const PRIMARY: &str = "min-h-[48px] rounded-full bg-[var(--color-cobalt,#00B0FF)] px-6 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";
const SECONDARY: &str = "min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";

/// Props for [`MziziSuccessScreen`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziSuccessScreenProps {
    /// Heading.
    #[props(default = "Success".to_string(), into)]
    pub title: String,
    /// Supporting message.
    #[props(default)]
    pub message: Option<String>,
    /// Extra detail below the message, e.g. a receipt summary.
    #[props(default)]
    pub detail: Option<Element>,
    /// Primary action.
    #[props(default)]
    pub primary_action: Option<SuccessAction>,
    /// Secondary action.
    #[props(default)]
    pub secondary_action: Option<SuccessAction>,
    /// Replaces the default check mark.
    #[props(default)]
    pub icon: Option<Element>,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A confirmation screen with a check mark and up to two actions.
#[component]
pub fn MziziSuccessScreen(props: MziziSuccessScreenProps) -> Element {
    let root = if props.class.is_empty() {
        "flex flex-col items-center gap-4 px-6 py-12 text-center".to_owned()
    } else {
        format!(
            "flex flex-col items-center gap-4 px-6 py-12 text-center {}",
            props.class
        )
    };
    let has_actions = props.primary_action.is_some() || props.secondary_action.is_some();
    rsx! {
        div {
            "data-slot": "mzizi-success-screen",
            "data-portal": "https://mzizi.dev/components/mzizi-success-screen",
            role: "status",
            "aria-live": "polite",
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            div { class: "flex size-16 items-center justify-center rounded-full bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15",
                if let Some(icon) = &props.icon {
                    {icon}
                } else {
                    svg {
                        width: "32",
                        height: "32",
                        view_box: "0 0 24 24",
                        fill: "none",
                        stroke: SUCCESS_STROKE,
                        stroke_width: "2",
                        stroke_linecap: "round",
                        stroke_linejoin: "round",
                        "aria-hidden": "true",
                        path { d: "M5 12l5 5L20 7" }
                    }
                }
            }
            h2 { class: "text-xl font-bold text-foreground", style: "font-family: var(--font-serif);",
                "{props.title}"
            }
            if let Some(message) = &props.message {
                p { class: "max-w-sm text-sm text-muted-foreground", "{message}" }
            }
            if let Some(detail) = &props.detail {
                {detail}
            }
            if has_actions {
                div { class: "mt-4 flex gap-3",
                    if let Some(action) = &props.primary_action {
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
                    if let Some(action) = &props.secondary_action {
                        button {
                            r#type: "button",
                            class: SECONDARY,
                            onclick: {
                                let on_press = action.on_press;
                                move |_| on_press.call(())
                            },
                            "{action.label}"
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
    fn both_actions_are_pills_at_the_touch_floor() {
        for classes in [PRIMARY, SECONDARY] {
            assert!(classes.split_whitespace().any(|c| c == "min-h-[48px]"));
            assert!(classes.split_whitespace().any(|c| c == "rounded-full"));
        }
    }

    #[test]
    fn the_check_mark_uses_the_success_mineral() {
        assert!(SUCCESS_STROKE.starts_with("var(--status-success"));
    }
}
