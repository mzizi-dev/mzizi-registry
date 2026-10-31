//! Fallback chain: try the stages in order and serve the first that works.
//!
//! The answer says which stage served it and whether that is a *degraded* answer
//! (any stage after the first), which health reporting needs. When every stage fails
//! the error holds only the number of stages: the stages' own errors are dropped, so
//! a message that quotes a request cannot reach a log through this type.

/// A successful answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Served<T> {
    /// The value.
    pub value: T,
    /// Which stage produced it (0 is the preferred one).
    pub stage: usize,
    /// True when a fallback served, not the first stage.
    pub degraded: bool,
}

/// Every stage failed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AllFailed {
    /// How many stages were tried.
    pub stages: usize,
}

/// Run the stages in order.
pub fn run<T, E, F>(stages: impl IntoIterator<Item = F>) -> Result<Served<T>, AllFailed>
where
    F: FnOnce() -> Result<T, E>,
{
    let mut tried = 0;
    for (i, stage) in stages.into_iter().enumerate() {
        tried = i + 1;
        if let Ok(value) = stage() {
            return Ok(Served {
                value,
                stage: i,
                degraded: i > 0,
            });
        }
    }
    Err(AllFailed { stages: tried })
}

#[cfg(test)]
mod tests {
    use super::*;

    type Stage = Box<dyn FnOnce() -> Result<&'static str, String>>;

    #[test]
    fn the_first_working_stage_serves() {
        let stages: Vec<Stage> = vec![
            Box::new(|| Err("patient 4411 not found".to_string())),
            Box::new(|| Ok("cached")),
            Box::new(|| Ok("static")),
        ];
        let got = run(stages).unwrap();
        assert_eq!(
            got,
            Served {
                value: "cached",
                stage: 1,
                degraded: true
            }
        );
    }

    #[test]
    fn the_preferred_stage_is_not_degraded() {
        let stages: Vec<Stage> = vec![Box::new(|| Ok("live"))];
        assert!(!run(stages).unwrap().degraded);
    }

    #[test]
    fn a_total_failure_carries_no_error_text() {
        let stages: Vec<Stage> = vec![
            Box::new(|| Err("secret one".to_string())),
            Box::new(|| Err("secret two".to_string())),
        ];
        let err = run(stages).unwrap_err();
        assert_eq!(err, AllFailed { stages: 2 });
        assert!(!format!("{err:?}").contains("secret"));
    }

    #[test]
    fn no_stages_is_a_failure_of_zero_stages() {
        let none: Vec<Stage> = vec![];
        assert_eq!(run(none).unwrap_err(), AllFailed { stages: 0 });
    }
}
