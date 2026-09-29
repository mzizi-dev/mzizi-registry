//! MZIZI ESCALATION CARD — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-escalation-card.tsx`: the "requires escalation" card an agent
//! renders when a flow needs a human choice. The agent pauses, the person picks an option, the
//! agent resumes. Same `data-slot`, same `role="group"` named by the title, same 48px option
//! buttons.
//!
//! # The host owns the pending state
//!
//! The `.tsx` keeps `pendingId` in React state, awaits `onChoose`, and clears it in a
//! `finally`. A Dioxus [`EventHandler`] returns nothing to await, so this port does not
//! pretend to: [`MziziEscalationCardProps::pending_id`] is a controlled prop. The host sets it
//! when it starts resuming the agent and clears it when the resume settles. That also lets a
//! host that re-renders from agent state (a server, a Worker, a replay) show the pending
//! option without any client state at all, which the `.tsx` cannot do.
//!
//! While `pending_id` is set every option is disabled and the chosen one reads "…", as in the
//! `.tsx`. [`is_choosable`] is that guard.
//!
//! # No logging dependency
//!
//! The `.tsx` logs `escalation_choose` through the harness. Logging is the host's job here:
//! it receives the id in `on_choose` and can record it where it records everything else.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-escalation-card"
  portal is "https://mzizi.dev/components/mzizi-escalation-card"
  role is "group"
  label not_empty
  button "Approve" min_height 48
  button "Decline" min_height 48
  when pending shows span "…"
end"#;

/// One option the person can choose.
#[derive(Clone, Debug, PartialEq)]
pub struct EscalationOption {
    /// Stable id, passed back to `on_choose`.
    pub id: String,
    /// Button label.
    pub label: String,
    /// Muted line under the label.
    pub description: Option<String>,
}

/// Whether an option can be chosen now: only while nothing is pending, as the `.tsx`'s
/// `if (pendingId) return` guard.
#[must_use]
pub fn is_choosable(pending_id: Option<&str>) -> bool {
    pending_id.is_none()
}

/// The label an option shows: "…" for the pending one, its own label otherwise.
#[must_use]
pub fn option_label<'a>(option: &'a EscalationOption, pending_id: Option<&str>) -> &'a str {
    if pending_id == Some(option.id.as_str()) {
        "…"
    } else {
        &option.label
    }
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

const ROOT: &str = "w-full max-w-sm rounded-[var(--radius-xl,17px)] border border-border bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-[var(--shadow-lg)]";
const OPTION: &str = "flex min-h-[48px] flex-col items-start justify-center rounded-[var(--radius,10px)] border border-border bg-[var(--background)] px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--muted)] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none";

/// Props for [`MziziEscalationCard`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziEscalationCardProps {
    /// What the agent needs decided; also the group's accessible name.
    #[props(into)]
    pub title: String,
    /// Supporting prompt.
    #[props(default)]
    pub prompt: Option<String>,
    /// The choices.
    pub options: Vec<EscalationOption>,
    /// Fired with the chosen option's id.
    pub on_choose: EventHandler<String>,
    /// The option being resumed, set by the host while the agent resumes.
    #[props(default)]
    pub pending_id: Option<String>,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A card asking a person to choose, so a paused agent can resume.
#[component]
pub fn MziziEscalationCard(props: MziziEscalationCardProps) -> Element {
    let root = if props.class.is_empty() {
        ROOT.to_owned()
    } else {
        format!("{ROOT} {}", props.class)
    };
    let pending = props.pending_id.clone();
    let disabled = !is_choosable(pending.as_deref());
    rsx! {
        div {
            "data-slot": "mzizi-escalation-card",
            "data-portal": "https://mzizi.dev/components/mzizi-escalation-card",
            role: "group",
            "aria-label": "{props.title}",
            "aria-busy": if disabled { "true" } else { "false" },
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            header { class: "mb-4 space-y-1",
                h2 { class: "text-base font-semibold tracking-tight", "{props.title}" }
                if let Some(prompt) = &props.prompt {
                    p { class: "text-sm text-[var(--muted-foreground)]", "{prompt}" }
                }
            }
            div { class: "grid gap-2",
                for option in props.options.iter() {
                    button {
                        key: "{option.id}",
                        r#type: "button",
                        disabled,
                        class: OPTION,
                        onclick: {
                            let id = option.id.clone();
                            let on_choose = props.on_choose;
                            let pending = pending.clone();
                            move |_| {
                                if is_choosable(pending.as_deref()) {
                                    on_choose.call(id.clone());
                                }
                            }
                        },
                        span { class: "font-medium", {option_label(option, pending.as_deref())} }
                        if let Some(description) = &option.description {
                            span { class: "text-xs text-[var(--muted-foreground)]", "{description}" }
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

    fn option(id: &str) -> EscalationOption {
        EscalationOption {
            id: id.into(),
            label: id.to_uppercase(),
            description: None,
        }
    }

    #[test]
    fn nothing_is_choosable_while_an_option_is_pending() {
        assert!(is_choosable(None));
        assert!(!is_choosable(Some("approve")));
    }

    #[test]
    fn only_the_pending_option_reads_as_pending() {
        let approve = option("approve");
        let decline = option("decline");
        assert_eq!(option_label(&approve, Some("approve")), "…");
        assert_eq!(option_label(&decline, Some("approve")), "DECLINE");
        assert_eq!(option_label(&approve, None), "APPROVE");
    }
}
