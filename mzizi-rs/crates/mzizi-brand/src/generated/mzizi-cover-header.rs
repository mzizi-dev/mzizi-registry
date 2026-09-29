// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-cover-header.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI COVER HEADER — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-cover-header.tsx`: a cover image with an overlapping avatar,
//! a serif name, an optional badge and a trailing action. Same `data-slot`, same
//! `role="banner"`, same three cover heights and two avatar shapes.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziCoverHeaderProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.
//!
//! # The cover URL is quoted
//!
//! The `.tsx` writes `url(${coverImage})` unquoted, so a URL containing a space or a `)`
//! breaks the declaration. [`cover_style`] quotes it and escapes the characters that would end
//! the string. **The `.tsx` sibling still writes it unquoted.**

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-cover-header"
  portal is "https://mzizi.dev/components/mzizi-cover-header"
  role is "banner"
  cover_height.md class is "h-32 sm:h-48"
  every avatar_shape class contains "rounded-"
end"#;

/// Cover height. Matches `HEIGHT_MAP` in the `.tsx`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum CoverHeight {
    /// Short cover.
    Sm,
    /// Default cover.
    #[default]
    Md,
    /// Tall cover.
    Lg,
}

impl CoverHeight {
    /// Every height, for exhaustive checks.
    pub const ALL: [Self; 3] = [Self::Sm, Self::Md, Self::Lg];

    /// The height classes.
    #[must_use]
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Sm => "h-24 sm:h-32",
            Self::Md => "h-32 sm:h-48",
            Self::Lg => "h-40 sm:h-56",
        }
    }

    /// The value the `.tsx` accepts for `coverHeight`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Sm => "sm",
            Self::Md => "md",
            Self::Lg => "lg",
        }
    }
}

/// Avatar mask.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum AvatarShape {
    /// Round avatar, for people.
    #[default]
    Circle,
    /// Rounded square, for organisations.
    Rounded,
}

impl AvatarShape {
    /// Every shape, for exhaustive checks.
    pub const ALL: [Self; 2] = [Self::Circle, Self::Rounded];

    /// The radius class.
    #[must_use]
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Circle => "rounded-full",
            Self::Rounded => "rounded-[var(--radius-lg,14px)]",
        }
    }

    /// The value the `.tsx` accepts for `avatarShape`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Circle => "circle",
            Self::Rounded => "rounded",
        }
    }
}

/// The cover's inline style: a quoted, escaped `background-image`, or nothing.
#[must_use]
pub fn cover_style(cover_image: Option<&str>) -> String {
    match cover_image {
        None => String::new(),
        Some(url) => {
            let escaped = url
                .replace('\\', "\\\\")
                .replace('"', "\\\"")
                .replace('\n', "");
            format!("background-image: url(\"{escaped}\");")
        }
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

/// Props for [`MziziCoverHeader`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziCoverHeaderProps {
    /// Cover image URL.
    #[props(default)]
    pub cover_image: Option<String>,
    /// Avatar image URL.
    #[props(default)]
    pub avatar: Option<String>,
    /// Avatar mask.
    #[props(default)]
    pub avatar_shape: AvatarShape,
    /// Display name, in the serif face.
    #[props(into)]
    pub name: String,
    /// Muted line under the name.
    #[props(default)]
    pub subtitle: Option<String>,
    /// Badge after the name, e.g. a verified mark.
    #[props(default)]
    pub badge: Option<Element>,
    /// Trailing action beside the avatar, e.g. a Follow button.
    #[props(default)]
    pub action: Option<Element>,
    /// Cover height.
    #[props(default)]
    pub cover_height: CoverHeight,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A cover image with an overlapping avatar and a name.
#[component]
pub fn MziziCoverHeader(props: MziziCoverHeaderProps) -> Element {
    let root = if props.class.is_empty() {
        "relative".to_owned()
    } else {
        format!("relative {}", props.class)
    };
    rsx! {
        div {
            "data-slot": "mzizi-cover-header",
            "data-portal": "https://mzizi.dev/components/mzizi-cover-header",
            role: "banner",
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            div {
                class: "{props.cover_height.classes()} bg-muted bg-cover bg-center",
                style: cover_style(props.cover_image.as_deref()),
            }
            div { class: "px-4 pb-4",
                div { class: "-mt-10 flex items-end justify-between",
                    div { class: "size-20 overflow-hidden border-4 border-background bg-muted {props.avatar_shape.classes()}",
                        if let Some(avatar) = &props.avatar {
                            img { src: "{avatar}", alt: "", class: "size-full object-cover", loading: "lazy" }
                        }
                    }
                    if let Some(action) = &props.action {
                        {action}
                    }
                }
                div { class: "mt-3",
                    div { class: "flex items-center gap-2",
                        h1 { class: "text-xl font-bold text-foreground", style: "font-family: var(--font-serif);",
                            "{props.name}"
                        }
                        if let Some(badge) = &props.badge {
                            {badge}
                        }
                    }
                    if let Some(subtitle) = &props.subtitle {
                        p { class: "text-sm text-muted-foreground", "{subtitle}" }
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
    fn no_cover_means_no_style() {
        assert_eq!(cover_style(None), "");
    }

    #[test]
    fn a_cover_url_is_quoted() {
        assert_eq!(
            cover_style(Some("https://x.test/a b.jpg")),
            "background-image: url(\"https://x.test/a b.jpg\");"
        );
    }

    #[test]
    fn a_quote_in_the_url_cannot_end_the_string() {
        assert_eq!(
            cover_style(Some("x\").y")),
            "background-image: url(\"x\\\").y\");"
        );
    }
}
