// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-avatar-stack.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI AVATAR STACK — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-avatar-stack.tsx`: an overlapping social-proof stack that shows
//! up to `max` avatars, then a `+N` overflow bubble, then an optional "<total> <label>" line.
//! Same `data-slot`, same classes, same accessible summary.
//!
//! Purely presentational and server-safe, like the `.tsx`. The group carries the summary as
//! its accessible name; the avatars themselves are decorative (`aria-hidden`).
//!
//! # `initials` splits on Unicode whitespace and never inside a code point
//!
//! The `.tsx` takes `w[0]`, which is a UTF-16 code unit: a name starting with an emoji or a
//! character outside the Basic Multilingual Plane yields half a surrogate pair. [`initials`]
//! takes the first `char` of each word instead. For every name the `.tsx` handles correctly,
//! the two agree.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-avatar-stack"
  role is "group"
  label not_empty
  max is "4"
  every avatar_stack_size class contains "rounded-full"
end"#;

/// One person in the stack.
#[derive(Clone, Debug, PartialEq)]
pub struct AvatarPerson {
    /// Display name; initials are derived from it when there is no image.
    pub name: String,
    /// Image URL.
    pub src: Option<String>,
}

/// Avatar diameter.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum AvatarStackSize {
    /// 24px avatars.
    Sm,
    /// 32px avatars.
    #[default]
    Md,
}

impl AvatarStackSize {
    /// Every size, for exhaustive checks.
    pub const ALL: [Self; 2] = [Self::Sm, Self::Md];

    /// The `size === "sm"` branch of the `.tsx`.
    #[must_use]
    pub const fn size_classes(self) -> &'static str {
        match self {
            Self::Sm => "size-6 text-[10px]",
            Self::Md => "size-8 text-[11px]",
        }
    }

    /// The classes of an initials or overflow bubble at this size.
    #[must_use]
    pub fn bubble_classes(self) -> String {
        format!(
            "inline-flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card {}",
            self.size_classes()
        )
    }

    /// The classes of an image avatar at this size.
    #[must_use]
    pub fn image_classes(self) -> String {
        format!(
            "rounded-full object-cover ring-2 ring-card {}",
            self.size_classes()
        )
    }

    /// The value the `.tsx` accepts for `size`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Sm => "sm",
            Self::Md => "md",
        }
    }
}

/// Up to two uppercase initials, one per leading word.
#[must_use]
pub fn initials(name: &str) -> String {
    name.split_whitespace()
        .filter_map(|word| word.chars().next())
        .take(2)
        .flat_map(char::to_uppercase)
        .collect()
}

/// What the stack shows: how many avatars, how large the `+N` overflow is, and the summary.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StackLayout {
    /// How many avatars are drawn.
    pub shown: usize,
    /// The `+N` overflow count; zero hides the bubble.
    pub overflow: usize,
    /// The accessible summary, e.g. "128 going".
    pub summary: String,
}

/// The `.tsx`'s arithmetic: `shown = people.slice(0, max)`, `count = total ?? people.length`,
/// `overflow = count - shown.length`, and the summary with or without a label.
///
/// Saturating where the `.tsx` would go negative (a `total` smaller than the people drawn),
/// which the `.tsx` hides only because it tests `overflow > 0`.
#[must_use]
pub fn stack_layout(
    people: usize,
    max: usize,
    total: Option<usize>,
    label: Option<&str>,
) -> StackLayout {
    let shown = people.min(max);
    let count = total.unwrap_or(people);
    let summary = match label {
        Some(l) if !l.is_empty() => format!("{count} {l}"),
        _ => count.to_string(),
    };
    StackLayout {
        shown,
        overflow: count.saturating_sub(shown),
        summary,
    }
}

/// Join a base class string with a consumer's extra classes, without a trailing space.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`MziziAvatarStack`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziAvatarStackProps {
    /// The people to draw, in order.
    pub people: Vec<AvatarPerson>,
    /// Max avatars before collapsing into a `+N` bubble.
    #[props(default = 4)]
    pub max: usize,
    /// Total count for the bubble and summary; defaults to `people.len()`.
    #[props(default)]
    pub total: Option<usize>,
    /// Trailing label after the count. `None` or empty hides the visible line.
    #[props(default = Some("going".to_string()))]
    pub label: Option<String>,
    /// Avatar diameter.
    #[props(default)]
    pub size: AvatarStackSize,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// Overlapping avatars with a `+N` overflow bubble and a count label.
#[component]
pub fn MziziAvatarStack(props: MziziAvatarStackProps) -> Element {
    let layout = stack_layout(
        props.people.len(),
        props.max,
        props.total,
        props.label.as_deref(),
    );
    let bubble = props.size.bubble_classes();
    let image = props.size.image_classes();
    let show_label = props.label.as_deref().is_some_and(|l| !l.is_empty());
    rsx! {
        div {
            "data-slot": "mzizi-avatar-stack",
            role: "group",
            "aria-label": "{layout.summary}",
            class: join("flex items-center gap-2", &props.class),
            div { class: "flex -space-x-2", "aria-hidden": "true",
                for (i, person) in props.people.iter().take(layout.shown).enumerate() {
                    if let Some(src) = &person.src {
                        img { key: "{i}", src: "{src}", alt: "", class: "{image}" }
                    } else {
                        span { key: "{i}", class: "{bubble}", {initials(&person.name)} }
                    }
                }
                if layout.overflow > 0 {
                    span { class: "{bubble}", "+{layout.overflow}" }
                }
            }
            if show_label {
                span { class: "text-[13px] text-muted-foreground", "aria-hidden": "true", "{layout.summary}" }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initials_take_the_first_two_words() {
        assert_eq!(initials("Tendai Moyo"), "TM");
        assert_eq!(initials("  chipo  ruvimbo  mapfumo "), "CR");
        assert_eq!(initials("Nyasha"), "N");
        assert_eq!(initials(""), "");
    }

    #[test]
    fn initials_never_split_a_code_point() {
        assert_eq!(initials("Émile Zola"), "ÉZ");
    }

    #[test]
    fn overflow_counts_everyone_not_drawn() {
        let l = stack_layout(6, 4, None, Some("going"));
        assert_eq!(l.shown, 4);
        assert_eq!(l.overflow, 2);
        assert_eq!(l.summary, "6 going");
    }

    #[test]
    fn an_explicit_total_drives_the_bubble_and_summary() {
        let l = stack_layout(3, 4, Some(128), Some("going"));
        assert_eq!(l.shown, 3);
        assert_eq!(l.overflow, 125);
        assert_eq!(l.summary, "128 going");
    }

    #[test]
    fn no_label_leaves_the_bare_count() {
        assert_eq!(stack_layout(2, 4, None, None).summary, "2");
        assert_eq!(stack_layout(2, 4, None, Some("")).summary, "2");
    }

    #[test]
    fn a_total_below_the_drawn_count_never_underflows() {
        assert_eq!(stack_layout(4, 4, Some(1), None).overflow, 0);
    }
}
