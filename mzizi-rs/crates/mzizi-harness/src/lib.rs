//! The Mzizi harness: one harness, the same for the UI, the language and every server
//! component.
//!
//! The UI harness (`useMziziHarness`) gives a component three things: a scoped `log`, a
//! `motion` configuration that honours reduced motion, and `announce` for a screen reader.
//! This crate is that harness as a Rust trait, [`Harness`], so a Dioxus component, a Mzizi
//! language program and a Cloudflare Worker client all report to, and take their
//! configuration from, the same thing. A component takes a [`Shared`] harness; the host
//! decides what it is.
//!
//! A harness can be plugged in (hand a component one), adapted (implement [`Harness`] to
//! forward to `console.log`, OpenTelemetry or a test recorder) or removed (the default is
//! [`Noop`], so a component costs nothing without one).
//!
//! The three capabilities are not equally meaningful everywhere. A server component has no
//! screen: it only logs. Its [`Harness::motion`] is [`Motion::STILL`] and it never calls
//! [`Harness::announce`]. A UI component may use all three. The log path is the same for
//! both, and it cannot carry a secret by type: an [`Event`]'s name, field keys and string
//! values are `&'static str`, so no connection string, password, name or document can be
//! formatted into one. Only integers and flags vary. `announce` is the one method that takes
//! a runtime string, because a live region reads prose, and it is not part of the log path.

use std::rc::Rc;

/// How loud an event is.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    /// Routine progress: a command ran.
    Debug,
    /// A step that matters: authenticated, connected.
    Info,
    /// Something was refused or failed.
    Warn,
}

/// A field's value. A string must be a literal in the source, never built at run time.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Value {
    /// A fixed word, such as a command name.
    Str(&'static str),
    /// A count or a code.
    Int(i64),
    /// A flag.
    Bool(bool),
}

/// One thing that happened.
#[derive(Debug, Clone, Copy)]
pub struct Event<'a> {
    /// A dotted name such as `mongodb.command`.
    pub name: &'static str,
    /// How loud it is.
    pub level: Level,
    /// What varied, as `(key, value)` pairs.
    pub fields: &'a [(&'static str, Value)],
}

/// Motion settings for a component that animates. A host with no screen has none.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Motion {
    /// The user asked for reduced motion (or there is nothing to animate).
    pub reduced: bool,
    /// How long an enter transition lasts, in milliseconds.
    pub enter_ms: u32,
    /// How long an exit transition lasts, in milliseconds.
    pub exit_ms: u32,
}

impl Motion {
    /// No motion: what a server, or a user who asked for reduced motion, gets.
    pub const STILL: Motion = Motion {
        reduced: true,
        enter_ms: 0,
        exit_ms: 0,
    };

    /// The standard motion: 200 ms in, 100 ms out.
    pub const STANDARD: Motion = Motion {
        reduced: false,
        enter_ms: 200,
        exit_ms: 100,
    };
}

/// How urgently a screen reader should read an announcement.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Politeness {
    /// Wait for a pause.
    Polite,
    /// Interrupt.
    Assertive,
}

/// What a component needs from its host: a place to log, how to move, how to announce.
/// Implementations must not block.
pub trait Harness {
    /// Record one event. Every host implements this.
    fn event(&self, event: &Event<'_>);

    /// The motion settings. The default is [`Motion::STILL`]: a host with no screen has none.
    fn motion(&self) -> Motion {
        Motion::STILL
    }

    /// Announce `message` to a screen reader. The default does nothing. Server components
    /// never call it.
    fn announce(&self, _message: &str, _politeness: Politeness) {}
}

/// The harness that does nothing: what a component uses until it is given another.
#[derive(Debug, Clone, Copy, Default)]
pub struct Noop;

impl Harness for Noop {
    fn event(&self, _event: &Event<'_>) {}
}

/// A shared harness, as a component holds it. A Worker and a browser are single-threaded, so `Rc`.
pub type Shared = Rc<dyn Harness>;

/// The default shared harness: [`Noop`].
pub fn noop() -> Shared {
    Rc::new(Noop)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct Recorder(RefCell<Vec<(&'static str, Level)>>);
    impl Harness for Recorder {
        fn event(&self, e: &Event<'_>) {
            self.0.borrow_mut().push((e.name, e.level));
        }
    }

    #[test]
    fn a_harness_receives_events_and_the_default_ignores_them() {
        let rec = Rc::new(Recorder(RefCell::new(Vec::new())));
        let shared: Shared = rec.clone();
        shared.event(&Event {
            name: "x.y",
            level: Level::Warn,
            fields: &[("n", Value::Int(1))],
        });
        noop().event(&Event {
            name: "ignored",
            level: Level::Info,
            fields: &[],
        });
        assert_eq!(*rec.0.borrow(), vec![("x.y", Level::Warn)]);
    }

    #[test]
    fn a_host_with_no_screen_has_no_motion_and_announces_nothing() {
        let h = Noop;
        assert_eq!(h.motion(), Motion::STILL);
        assert!(h.motion().reduced);
        h.announce("ignored", Politeness::Assertive);
    }

    #[test]
    fn a_ui_host_can_override_motion_and_announce() {
        struct Ui(RefCell<Vec<String>>);
        impl Harness for Ui {
            fn event(&self, _: &Event<'_>) {}
            fn motion(&self) -> Motion {
                Motion::STANDARD
            }
            fn announce(&self, m: &str, _: Politeness) {
                self.0.borrow_mut().push(m.to_owned());
            }
        }
        let ui = Ui(RefCell::new(Vec::new()));
        assert_eq!(ui.motion(), Motion::STANDARD);
        ui.announce("Saved", Politeness::Polite);
        assert_eq!(*ui.0.borrow(), vec!["Saved".to_owned()]);
    }
}
