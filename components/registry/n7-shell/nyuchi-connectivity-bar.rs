//! NYUCHI CONNECTIVITY BAR — N7 shell, Dioxus.
//!
//! The Rust sibling of `nyuchi-connectivity-bar.tsx`: a status strip announcing the app's
//! network state, sharing its contract — same `data-slot`, same four states, same colours.
//!
//! # The retry control is below the published touch floor
//!
//! The `.tsx` ships `min-h-[44px]` on the retry button. N10's own `nyuchi-ai-context` states
//! the rule as "Touch targets: 48px minimum" — 44 is Apple's number, not this system's, and
//! this is the fourth component in this build-out with the identical shortfall
//! (`nyuchi-docs-engine`'s sidebar was the first two). Raised to `min-h-[48px]` here; nothing
//! else about the control changes.
//!
//! **The `.tsx` sibling still has this.**
//!
//! # The harness is a parameter, not a dependency
//!
//! The `.tsx` calls `useNyuchiHarness("connectivity-bar")` for `log.warn`. That hook is
//! itself an N3 component (`nyuchi-harness.tsx`) with no Rust port yet, and this component
//! should not block on one existing — nor should porting the harness later require touching
//! every N7 component that logs through it. [`ConnectivityBarProps::on_state_change`] is a
//! plain callback the host wires to whatever logger it has.
//!
//! # Auto-hide is host-owned, not timer-owned
//!
//! The `.tsx` starts a `setTimeout` internally and hides itself when it fires. Reproducing
//! that here would pull a timer dependency that differs by target — `gloo-timers` on wasm,
//! something else natively — into a crate that otherwise has none, to save the host four
//! lines. [`ConnectivityBarProps::visible`] is a plain controlled prop instead: the host
//! decides when the bar shows, exactly as it already decides `state`. `auto_hide_delay_ms`
//! is kept as data the host can act on, not a timer this component runs itself.

use dioxus::prelude::*;

/// Network state this bar reports.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ConnectionState {
    /// Connected. Auto-hides after [`ConnectivityBarProps::auto_hide_delay_ms`] by default.
    #[default]
    Online,
    /// A sync is in flight.
    Syncing,
    /// Serving stale data because the network is unavailable.
    Cached,
    /// No connection at all.
    Offline,
}

impl ConnectionState {
    /// Default label, matching the `.tsx` `STATE_CONFIG`.
    #[must_use]
    pub const fn default_label(self) -> &'static str {
        match self {
            Self::Online => "Connected",
            Self::Syncing => "Syncing...",
            Self::Cached => "Using cached data",
            Self::Offline => "No connection",
        }
    }

    /// CSS colour expression, byte-identical to the `.tsx`.
    #[must_use]
    pub const fn colour(self) -> &'static str {
        match self {
            Self::Online => "var(--connection-online, var(--status-success, #64FFDA))",
            Self::Syncing => "var(--connection-syncing, var(--status-info, #00B0FF))",
            Self::Cached => "var(--connection-cached, var(--status-warning, #FFD740))",
            Self::Offline => "var(--connection-offline, var(--status-error, #FF5252))",
        }
    }

    /// `data-state` value.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Online => "online",
            Self::Syncing => "syncing",
            Self::Cached => "cached",
            Self::Offline => "offline",
        }
    }
}

const ROOT: &str = "flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium text-white transition-all";
const SPINNER: &str = "size-3 animate-spin rounded-full border-2 border-white/30 border-t-white";
/// The `.tsx` says `min-h-[44px]`. See the module docs.
const RETRY: &str = "ml-2 min-h-[48px] underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/// Join a base class string with a consumer's extra classes.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`ConnectivityBar`].
#[derive(Props, Clone, PartialEq)]
pub struct ConnectivityBarProps {
    /// Current connection state.
    #[props(default)]
    pub state: ConnectionState,
    /// Overrides the state's default label.
    #[props(default)]
    pub message: Option<String>,
    /// Whether the bar is shown right now. The host owns the auto-hide timer — see the
    /// module docs — and flips this after `auto_hide_delay_ms` when it wants the `.tsx`'s
    /// behaviour.
    #[props(default = true)]
    pub visible: bool,
    /// Suggested auto-hide delay in milliseconds, for a host that wants to reproduce the
    /// `.tsx` timing. Not enforced by this component.
    #[props(default = 2000)]
    pub auto_hide_delay_ms: u32,
    /// Called on every non-online state, in place of the `.tsx`'s harness `log.warn`.
    #[props(default)]
    pub on_state_change: Option<EventHandler<ConnectionState>>,
    /// Called when the retry control is pressed. Retry renders only when this is set AND
    /// the state is [`ConnectionState::Offline`], matching the `.tsx`.
    #[props(default)]
    pub on_retry: Option<EventHandler<()>>,
    /// Extra classes, merged onto the root.
    #[props(default)]
    pub class: String,
    /// Any other root attributes.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A status strip announcing the app's network state.
#[component]
pub fn ConnectivityBar(props: ConnectivityBarProps) -> Element {
    let state = props.state;

    use_effect(move || {
        if state != ConnectionState::Online {
            if let Some(handler) = props.on_state_change {
                handler.call(state);
            }
        }
    });

    if !props.visible {
        return rsx! {};
    }

    let label = props
        .message
        .clone()
        .unwrap_or_else(|| state.default_label().to_owned());
    let colour = state.colour();
    let style = format!("background-color: {colour};");

    rsx! {
        div {
            "data-slot": "nyuchi-connectivity-bar",
            "data-portal": "https://mzizi.dev/components/nyuchi-connectivity-bar",
            "data-state": state.as_str(),
            role: "status",
            "aria-live": "polite",
            class: join(ROOT, &props.class),
            style: "{style}",
            ..props.attributes,

            if state == ConnectionState::Syncing {
                div { class: SPINNER }
            }
            span { "{label}" }
            if state == ConnectionState::Offline {
                if let Some(on_retry) = props.on_retry {
                    button {
                        class: RETRY,
                        onclick: move |_| on_retry.call(()),
                        "Retry"
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
    fn labels_match_the_typescript() {
        assert_eq!(ConnectionState::Online.default_label(), "Connected");
        assert_eq!(ConnectionState::Syncing.default_label(), "Syncing...");
        assert_eq!(ConnectionState::Cached.default_label(), "Using cached data");
        assert_eq!(ConnectionState::Offline.default_label(), "No connection");
    }

    #[test]
    fn the_retry_control_meets_the_published_touch_floor() {
        assert!(RETRY.contains("min-h-[48px]"));
        assert!(!RETRY.contains("44px"));
    }

    #[test]
    fn data_state_values_are_lowercase_and_distinct() {
        let all = [
            ConnectionState::Online,
            ConnectionState::Syncing,
            ConnectionState::Cached,
            ConnectionState::Offline,
        ];
        let mut seen = std::collections::HashSet::new();
        for s in all {
            assert_eq!(s.as_str(), s.as_str().to_lowercase());
            assert!(seen.insert(s.as_str()));
        }
    }
}
