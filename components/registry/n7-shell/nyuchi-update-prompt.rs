//! NYUCHI UPDATE PROMPT — N7 shell, Dioxus.
//!
//! The Rust sibling of `nyuchi-update-prompt.tsx`: a bottom-sheet asking the user to refresh
//! for a new version, sharing its contract — same `data-slot`, same critical/optional split.
//!
//! # The harness's motion preference is a parameter, not a dependency
//!
//! The `.tsx` reads `motion.prefersReduced` and `motion.enterDuration`/`enterEasing` from
//! `useNyuchiHarness`, which is an N3 component (`nyuchi-harness.tsx`) with no Rust port yet.
//! [`UpdatePromptProps::prefers_reduced_motion`] takes the one bit this component actually
//! branches on directly; a host with the full harness passes its `motion.prefersReduced`
//! through, and a host without one can pass `false` and get the entrance animation.

use dioxus::prelude::*;

const ROOT: &str = "fixed right-4 bottom-20 left-4 z-50 mx-auto max-w-sm rounded-[var(--radius-xl,17px)] border border-border bg-card p-4 shadow-2xl";
const UPDATE_BUTTON: &str = "min-h-[48px] flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const DISMISS_BUTTON: &str = "min-h-[48px] rounded-full bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80";

/// Join a base class string with a consumer's extra classes.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// The body copy, matching the `.tsx` exactly including its conditional phrasing.
#[must_use]
pub fn body_text(version: Option<&str>, is_critical: bool) -> String {
    let lead = version.map_or_else(
        || "A new version is ready.".to_owned(),
        |v| format!("Version {v} is ready."),
    );
    let tail = if is_critical {
        "This update is required to continue."
    } else {
        "Refresh to get the latest improvements."
    };
    format!("{lead} {tail}")
}

/// The animation inline style, matching the `.tsx`'s `motion.prefersReduced` branch.
///
/// Empty when motion is reduced, matching the `.tsx`'s `{}`.
#[must_use]
pub fn entrance_style(prefers_reduced_motion: bool, duration_ms: u32, easing: &str) -> String {
    if prefers_reduced_motion {
        String::new()
    } else {
        format!("animation: nyuchi-fade-slide-up {duration_ms}ms {easing} both;")
    }
}

/// Props for [`UpdatePrompt`].
#[derive(Props, Clone, PartialEq)]
pub struct UpdatePromptProps {
    /// Whether the prompt is shown.
    #[props(default = false)]
    pub visible: bool,
    /// Version being offered.
    #[props(default)]
    pub version: Option<String>,
    /// Whether declining is not an option — hides the dismiss button.
    #[props(default = false)]
    pub is_critical: bool,
    /// Called when the user chooses to update.
    #[props(default)]
    pub on_update: Option<EventHandler<()>>,
    /// Called when the user dismisses. Ignored when `is_critical` is true, matching the
    /// `.tsx`'s `{!isCritical && onDismiss && ...}`.
    #[props(default)]
    pub on_dismiss: Option<EventHandler<()>>,
    /// See the module docs.
    #[props(default = false)]
    pub prefers_reduced_motion: bool,
    /// Entrance animation duration in ms, when motion is not reduced.
    #[props(default = 220)]
    pub enter_duration_ms: u32,
    /// Entrance animation easing, when motion is not reduced.
    #[props(default = "ease-out".to_owned())]
    pub enter_easing: String,
    /// Extra classes, merged onto the root.
    #[props(default)]
    pub class: String,
    /// Any other root attributes.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A bottom-sheet prompting the user to refresh for a new version.
#[component]
pub fn UpdatePrompt(props: UpdatePromptProps) -> Element {
    if !props.visible {
        return rsx! {};
    }

    let heading = if props.is_critical {
        "Critical update required"
    } else {
        "Update available"
    };
    let body = body_text(props.version.as_deref(), props.is_critical);
    let style = entrance_style(
        props.prefers_reduced_motion,
        props.enter_duration_ms,
        &props.enter_easing,
    );
    let show_dismiss = !props.is_critical && props.on_dismiss.is_some();

    rsx! {
        div {
            "data-slot": "nyuchi-update-prompt",
            "data-portal": "https://mzizi.dev/components/nyuchi-update-prompt",
            role: "alertdialog",
            "aria-label": "Update available",
            style: "{style}",
            class: join(ROOT, &props.class),
            ..props.attributes,

            p { class: "text-sm font-semibold", "{heading}" }
            p { class: "mt-1 text-xs text-muted-foreground", "{body}" }
            div { class: "mt-3 flex gap-2",
                button {
                    class: UPDATE_BUTTON,
                    onclick: move |_| {
                        if let Some(h) = props.on_update { h.call(()) }
                    },
                    "Update"
                }
                if show_dismiss {
                    button {
                        class: DISMISS_BUTTON,
                        onclick: move |_| {
                            if let Some(h) = props.on_dismiss { h.call(()) }
                        },
                        "Later"
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
    fn body_text_with_version_and_critical() {
        assert_eq!(
            body_text(Some("4.2.0"), true),
            "Version 4.2.0 is ready. This update is required to continue."
        );
    }

    #[test]
    fn body_text_without_version_and_optional() {
        assert_eq!(
            body_text(None, false),
            "A new version is ready. Refresh to get the latest improvements."
        );
    }

    #[test]
    fn reduced_motion_produces_no_animation_style() {
        assert_eq!(entrance_style(true, 220, "ease-out"), "");
    }

    #[test]
    fn full_motion_names_the_fade_slide_up_keyframe() {
        let style = entrance_style(false, 300, "ease-in-out");
        assert!(style.contains("nyuchi-fade-slide-up"));
        assert!(style.contains("300ms"));
        assert!(style.contains("ease-in-out"));
    }

    #[test]
    fn the_update_button_meets_the_touch_floor() {
        assert!(UPDATE_BUTTON.contains("min-h-[48px]"));
        assert!(DISMISS_BUTTON.contains("min-h-[48px]"));
    }
}
