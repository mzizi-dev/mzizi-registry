//! MZIZI USER CARD — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-user-card.tsx`: a person with an avatar or initials, a name, an
//! optional role pill, an email line and trailing actions. Same `data-slot` (`user-card`, as
//! the `.tsx` has it), same `role="article"`, same loading skeleton.
//!
//! # One skeleton, not two
//!
//! The `.tsx` has two `if (loading)` branches back to back; the second is unreachable. This
//! port has the first one only, which is what the `.tsx` renders.
//!
//! # Initials never split a code point
//!
//! The `.tsx` takes `n[0]` of each space-separated word, a UTF-16 code unit. [`initials`]
//! takes the first `char` and skips the empty words a double space produces.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziUserCardProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "user-card"
  role is "article"
  class contains "rounded-2xl"
end"#;

/// Up to two uppercase initials from the leading words of a name.
#[must_use]
pub fn initials(name: &str) -> String {
    name.split(' ')
        .filter_map(|word| word.chars().next())
        .take(2)
        .flat_map(char::to_uppercase)
        .collect()
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

const ROOT: &str =
    "flex items-center gap-4 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10";

/// Props for [`MziziUserCard`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziUserCardProps {
    /// Renders the skeleton instead of the card.
    #[props(default)]
    pub loading: bool,
    /// Display name.
    #[props(into)]
    pub name: String,
    /// Email line.
    #[props(default)]
    pub email: Option<String>,
    /// Avatar image URL; initials are shown without one.
    #[props(default)]
    pub avatar: Option<String>,
    /// Role pill, e.g. "Admin".
    #[props(default)]
    pub role: Option<String>,
    /// Trailing actions.
    #[props(default)]
    pub actions: Option<Element>,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A person, with avatar, name, role and actions.
#[component]
pub fn MziziUserCard(props: MziziUserCardProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "user-card",
                "data-portal": "https://mzizi.dev/components/user-card",
                "data-loading": "",
                role: "article",
                class: "flex animate-pulse items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-3 ring-1 ring-foreground/10",
                div { class: "size-10 shrink-0 rounded-full bg-muted" }
                div { class: "flex-1 space-y-1.5",
                    div { class: "h-3.5 w-1/3 rounded bg-muted" }
                    div { class: "h-2.5 w-1/4 rounded bg-muted" }
                }
            }
        };
    }
    let root = if props.class.is_empty() {
        ROOT.to_owned()
    } else {
        format!("{ROOT} {}", props.class)
    };
    rsx! {
        div {
            "data-slot": "user-card",
            style: entrance_style(props.prefers_reduced_motion),
            role: "article",
            class: "{root}",
            div { class: "size-12 shrink-0 overflow-hidden rounded-full",
                if let Some(avatar) = &props.avatar {
                    img { src: "{avatar}", alt: "{props.name}", class: "size-full object-cover" }
                } else {
                    div { class: "flex size-full items-center justify-center bg-muted text-base font-medium text-muted-foreground",
                        {initials(&props.name)}
                    }
                }
            }
            div { class: "min-w-0 flex-1",
                div { class: "flex items-center gap-2",
                    p { class: "truncate font-medium", "{props.name}" }
                    if let Some(role) = &props.role {
                        span { class: "shrink-0 rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary", "{role}" }
                    }
                }
                if let Some(email) = &props.email {
                    p { class: "mt-0.5 truncate text-xs text-muted-foreground", "{email}" }
                }
            }
            if let Some(actions) = &props.actions {
                div { class: "flex shrink-0 items-center gap-1", {actions} }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initials_take_two_words() {
        assert_eq!(initials("Rudo Chikomo"), "RC");
        assert_eq!(initials("Farai"), "F");
        assert_eq!(initials("Tariro Rufaro Dube"), "TR");
    }

    #[test]
    fn a_double_space_does_not_eat_an_initial() {
        assert_eq!(initials("Rudo  Chikomo"), "RC");
    }
}
