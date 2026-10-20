//! The server harness: where a Mzizi database client reports what it did.
//!
//! The UI harness (`useMziziHarness`) gives a component `log`, `motion` and `announce`.
//! A server component has no screen to announce to and no motion to reduce, so its harness
//! is the one part that carries over: `log`. A client reports each step as an [`Event`] to
//! whatever [`Harness`] it was given. The harness can be plugged in (`with_harness`),
//! adapted (implement the trait to forward to `console.log`, OpenTelemetry or a test
//! recorder) or removed (the default is [`Noop`], so a client costs nothing without one).
//!
//! An event cannot carry a secret, by type. A name and every field key are `&'static str`,
//! and a string field value is a `&'static str` too, so no connection string, password,
//! username, collection name or document can be formatted into one. Numbers and flags are
//! the only data that vary.

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

/// Receives a client's [`Event`]s. Implementations must not block.
pub trait Harness {
    /// Record one event.
    fn event(&self, event: &Event<'_>);
}

/// The harness that does nothing: what a client uses until it is given another.
#[derive(Debug, Clone, Copy, Default)]
pub struct Noop;

impl Harness for Noop {
    fn event(&self, _event: &Event<'_>) {}
}

/// A shared harness, as a client holds it. A Worker is single-threaded, so `Rc`.
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
}
