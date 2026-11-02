//! MZIZI COVER HEADER — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-cover-header.tsx`: a cover image with an overlapping avatar,
//! a serif name, an optional badge and a trailing action. Same `data-slot`, same opt-in
//! `role="banner"`, same three cover heights and two avatar shapes.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziCoverHeaderProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.
//!
//! # The cover is an `<img>`, the avatar is optional, the banner role is opt-in (#543)
//!
//! Both builds draw the cover as a real `<img>` (lazy and async by default, eager with
//! `fetchpriority="high"` under [`MziziCoverHeaderProps::priority`], alt text from
//! [`MziziCoverHeaderProps::cover_alt`]), so no URL can break a CSS declaration and the browser
//! can prioritise it as the LCP image. The avatar box is drawn only when there is an avatar.
//! `role="banner"` is set only with [`MziziCoverHeaderProps::banner`]: the header usually sits
//! inside `<main>`, where a second banner landmark duplicates the page's own.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-cover-header"
  portal is "https://mzizi.dev/components/mzizi-cover-header"
  when banner role is "banner"
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
    /// Cover image URL, drawn as an `<img>`.
    #[props(default)]
    pub cover_image: Option<String>,
    /// The cover's alt text; empty (decorative) by default.
    #[props(default)]
    pub cover_alt: String,
    /// Load the cover eagerly with `fetchpriority="high"` (the page's LCP image).
    #[props(default)]
    pub priority: bool,
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
    /// Give the root `role="banner"`; off by default (see the module docs).
    #[props(default)]
    pub banner: bool,
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
    let (loading, decoding, fetchpriority) = if props.priority {
        ("eager", None, Some("high"))
    } else {
        ("lazy", Some("async"), None)
    };
    rsx! {
        div {
            "data-slot": "mzizi-cover-header",
            "data-portal": "https://mzizi.dev/components/mzizi-cover-header",
            role: if props.banner { Some("banner") } else { None },
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            div {
                "data-slot": "mzizi-cover-header-cover",
                class: "{props.cover_height.classes()} overflow-hidden bg-muted",
                if let Some(cover) = &props.cover_image {
                    img {
                        src: "{cover}",
                        alt: "{props.cover_alt}",
                        loading,
                        "decoding": decoding,
                        "fetchpriority": fetchpriority,
                        class: "size-full object-cover",
                    }
                }
            }
            div { class: "px-4 pb-4",
                if let Some(avatar) = &props.avatar {
                    div { class: "-mt-10 flex items-end justify-between",
                        div {
                            "data-slot": "mzizi-cover-header-avatar",
                            class: "size-20 overflow-hidden border-4 border-background bg-muted {props.avatar_shape.classes()}",
                            img { src: "{avatar}", alt: "", class: "size-full object-cover", loading: "lazy", decoding: "async" }
                        }
                        if let Some(action) = &props.action {
                            {action}
                        }
                    }
                } else if let Some(action) = &props.action {
                    div { class: "mt-3 flex justify-end", {action} }
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
