// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/fallback-chain.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Fallback chain for the Mzizi resilience node (N5): try stages in order and return the
//! first success.
//!
//! Each [`Stage`] may carry its own timeout. [`with_fallback_result`] reports which stage
//! served ([`Served`]), which is what tells a health monitor "degraded"; [`with_fallback`]
//! returns the bare value. When every stage fails, [`Error::AllStagesFailed`] (code
//! `all-stages-failed`) lists each stage with its error CODE, never its message.
//!
//! The TypeScript build is `fallback-chain.ts`; both are held to
//! `contracts/lib/fallback-chain.contract.json`.

use std::fmt;
use std::future::Future;
use std::pin::Pin;

use crate::resilience_core::{
    ConfigError, Error, ErrorCode, Runtime, StageError, check_min, check_name,
};
use crate::timeout::with_timeout;

/// A boxed stage future.
pub type StageFuture<'a, T, E> = Pin<Box<dyn Future<Output = Result<T, Error<E>>> + 'a>>;

/// One stage: a name, an optional timeout and the operation.
pub struct Stage<'a, T, E> {
    /// A name for results and health, e.g. `cache`.
    pub name: String,
    /// The stage's own timeout, in ms.
    pub timeout_ms: Option<u64>,
    run: Box<dyn Fn() -> StageFuture<'a, T, E> + 'a>,
}

impl<T, E> fmt::Debug for Stage<'_, T, E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Stage")
            .field("name", &self.name)
            .field("timeout_ms", &self.timeout_ms)
            .finish_non_exhaustive()
    }
}

impl<'a, T, E> Stage<'a, T, E> {
    /// A stage running `run` (called once per attempt of the chain).
    pub fn new<F, Fut>(name: impl Into<String>, run: F) -> Self
    where
        F: Fn() -> Fut + 'a,
        Fut: Future<Output = Result<T, Error<E>>> + 'a,
    {
        Stage {
            name: name.into(),
            timeout_ms: None,
            run: Box::new(move || Box::pin(run())),
        }
    }

    /// With a timeout of `ms`.
    #[must_use]
    pub fn with_timeout(mut self, ms: u64) -> Self {
        self.timeout_ms = Some(ms);
        self
    }

    /// Run the stage once (with its timeout, if any).
    pub async fn run<R: Runtime + ?Sized>(&self, rt: &R) -> Result<T, Error<E>> {
        match self.timeout_ms {
            Some(ms) => with_timeout(rt, ms, (self.run)()).await,
            None => (self.run)().await,
        }
    }

    /// Check the name and timeout.
    pub fn validate(&self) -> Result<(), ConfigError> {
        check_name("stage.name", &self.name)?;
        if let Some(ms) = self.timeout_ms {
            check_min("stage.timeout_ms", ms, 1)?;
        }
        Ok(())
    }
}

/// Which stage served, and its value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Served<T> {
    /// The value.
    pub value: T,
    /// The stage's name.
    pub stage: String,
    /// Its index.
    pub index: usize,
}

/// Run the stages in order; the first success and the stage that served it.
pub async fn with_fallback_result<R, T, E>(
    rt: &R,
    stages: &[Stage<'_, T, E>],
) -> Result<Served<T>, Error<E>>
where
    R: Runtime + ?Sized,
    E: ErrorCode,
{
    if stages.is_empty() {
        return Err(ConfigError::new("stages", "must hold at least one stage").into());
    }
    for stage in stages {
        stage.validate()?;
    }
    let mut stage_errors = Vec::with_capacity(stages.len());
    for (index, stage) in stages.iter().enumerate() {
        match stage.run(rt).await {
            Ok(value) => {
                return Ok(Served {
                    value,
                    stage: stage.name.clone(),
                    index,
                });
            }
            Err(e) => stage_errors.push(StageError {
                stage: stage.name.clone(),
                code: e.code().into_owned(),
            }),
        }
    }
    Err(Error::AllStagesFailed { stage_errors })
}

/// Run the stages in order; the first success's value.
pub async fn with_fallback<R, T, E>(rt: &R, stages: &[Stage<'_, T, E>]) -> Result<T, Error<E>>
where
    R: Runtime + ?Sized,
    E: ErrorCode,
{
    with_fallback_result(rt, stages).await.map(|s| s.value)
}
