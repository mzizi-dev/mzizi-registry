// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/avatar.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! AVATAR — N2 primitive, Dioxus.
//!
//! The Rust sibling of `avatar.tsx`, which wraps Radix's `Avatar.Root`/`Image`/`Fallback`.
//! Six pieces: `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`,
//! `AvatarGroupCount`.
//!
//! **`size` is a three-way enum — `"default" | "sm" | "lg"` — not a pixel count.**
//! Registry issue #223 calls this out directly: a `size` of `12` handed to a component
//! whose variants are `"sm" | "lg"` produced one real bug already (in the sample
//! resolver, before this port existed). `AvatarSize` is therefore a closed enum with no
//! numeric variant and no `From<u32>` — a pixel value has no way in.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry
//! issue #222, rule 1).
//!
//! `registry #223`: 30 dependents.

use dioxus::prelude::*;

/// Avatar size. See the module doc — this is closed on purpose.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AvatarSize {
    /// 32px (`size-8`) — the standard avatar.
    #[default]
    Default,
    /// 24px (`size-6`) — for dense lists and inline mentions.
    Sm,
    /// 40px (`size-10`) — for a profile header or a solo, prominent avatar.
    Lg,
}

impl AvatarSize {
    /// The `data-size` value, matching the TypeScript's own strings exactly.
    const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Sm => "sm",
            Self::Lg => "lg",
        }
    }

    /// The square size class used by the LOADING placeholder. Deliberately different
    /// numbers from the non-loading root below — that asymmetry is in the TypeScript
    /// today and rule 1 says match the contract, not quietly reconcile something the
    /// registry issue did not flag.
    const fn loading_class(self) -> &'static str {
        match self {
            Self::Default => "size-9",
            Self::Sm => "size-7",
            Self::Lg => "size-12",
        }
    }
}

const ROOT_BASE: &str = "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten";

/// `data-[size=lg]:size-10 data-[size=sm]:size-6` resolved for the given size — Rust
/// emits the one that applies rather than the always-present Tailwind arbitrary-attribute
/// selector, the same convention `button.rs`/`separator.rs` use.
const fn root_size_class(size: AvatarSize) -> &'static str {
    match size {
        AvatarSize::Default => "",
        AvatarSize::Sm => "size-6",
        AvatarSize::Lg => "size-10",
    }
}

/// Compose the full class string for the (non-loading) avatar root.
pub fn avatar_variants(size: AvatarSize, extra: &str) -> String {
    let mut out = String::with_capacity(ROOT_BASE.len() + 32);
    out.push_str(ROOT_BASE);
    let sized = root_size_class(size);
    if !sized.is_empty() {
        out.push(' ');
        out.push_str(sized);
    }
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Avatar`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarProps {
    /// See [`AvatarSize`].
    #[props(default)]
    pub size: AvatarSize,
    /// A skeleton placeholder instead of the real avatar — used while the identity
    /// behind it is still loading.
    #[props(default)]
    pub loading: bool,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// `AvatarImage` / `AvatarFallback` / `AvatarBadge`, when not loading.
    pub children: Element,
}

/// A circular identity marker: an image, a text/icon fallback, and an optional badge.
///
/// ```ignore
/// rsx! {
///     Avatar {
///         AvatarImage { src: "/me.png", alt: "Bryan" }
///         AvatarFallback { "BF" }
///     }
/// }
/// ```
#[component]
pub fn Avatar(props: AvatarProps) -> Element {
    if props.loading {
        let class = format!(
            "animate-pulse rounded-full bg-muted {}{}",
            props.size.loading_class(),
            if props.class.is_empty() {
                String::new()
            } else {
                format!(" {}", props.class)
            }
        );
        return rsx! {
            div {
                "data-slot": "avatar",
                "data-portal": "https://mzizi.dev/components/avatar",
                "data-loading": true,
                class,
                ..props.attributes,
            }
        };
    }

    rsx! {
        div {
            "data-slot": "avatar",
            "data-portal": "https://mzizi.dev/components/avatar",
            "data-size": props.size.slug(),
            class: avatar_variants(props.size, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`AvatarImage`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarImageProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute — `src`, `alt`, `onerror`, and the rest.
    #[props(extends = GlobalAttributes, extends = img)]
    pub attributes: Vec<Attribute>,
}

/// The photo. Renders nothing (falls through to [`AvatarFallback`]) if `src` 404s —
/// that behaviour is Radix's `Image` load-state machine in the TypeScript; this port
/// relies on the plain `<img>` `onerror` a consumer wires up, since there is no Radix
/// underneath here to do it implicitly.
#[component]
pub fn AvatarImage(props: AvatarImageProps) -> Element {
    const BASE: &str = "aspect-square size-full rounded-full object-cover";
    rsx! {
        img {
            "data-slot": "avatar-image",
            class: if props.class.is_empty() { BASE.to_string() } else { format!("{BASE} {}", props.class) },
            ..props.attributes,
        }
    }
}

/// Props for [`AvatarFallback`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarFallbackProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// Initials or an icon.
    pub children: Element,
}

/// Initials or an icon, shown while the image is missing or still loading.
#[component]
pub fn AvatarFallback(props: AvatarFallbackProps) -> Element {
    const BASE: &str = "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs";
    rsx! {
        div {
            "data-slot": "avatar-fallback",
            class: if props.class.is_empty() { BASE.to_string() } else { format!("{BASE} {}", props.class) },
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`AvatarBadge`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarBadgeProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The badge's icon or dot.
    pub children: Element,
}

/// A small status marker pinned to the avatar's bottom-right corner (e.g. an
/// online/offline dot or a platform icon). Sized off the ANCESTOR avatar's `size` via
/// the `group-data-[size=…]/avatar` selectors — it has no size prop of its own.
#[component]
pub fn AvatarBadge(props: AvatarBadgeProps) -> Element {
    const BASE: &str = "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2";
    rsx! {
        span {
            "data-slot": "avatar-badge",
            class: if props.class.is_empty() { BASE.to_string() } else { format!("{BASE} {}", props.class) },
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`AvatarGroup`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarGroupProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The member [`Avatar`]s, and optionally a trailing [`AvatarGroupCount`].
    pub children: Element,
}

/// Overlapping stack of avatars, each ringed to separate it from its neighbours.
#[component]
pub fn AvatarGroup(props: AvatarGroupProps) -> Element {
    const BASE: &str = "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background";
    rsx! {
        div {
            "data-slot": "avatar-group",
            class: if props.class.is_empty() { BASE.to_string() } else { format!("{BASE} {}", props.class) },
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`AvatarGroupCount`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarGroupCountProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The overflow count, e.g. `"+3"`.
    pub children: Element,
}

/// The trailing "+N" tile at the end of an [`AvatarGroup`], sized off the GROUP's own
/// size via `group-has-data-[size=…]/avatar-group` — the group, not an individual
/// avatar, since this element has no avatar of its own to key off.
#[component]
pub fn AvatarGroupCount(props: AvatarGroupCountProps) -> Element {
    const BASE: &str = "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3";
    rsx! {
        div {
            "data-slot": "avatar-group-count",
            class: if props.class.is_empty() { BASE.to_string() } else { format!("{BASE} {}", props.class) },
            ..props.attributes,
            {props.children}
        }
    }
}
