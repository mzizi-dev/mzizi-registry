//! Injected randomness for the Mzizi resilience node (N5) and the chaos engine (N8).
//!
//! No core reads ambient randomness: retry jitter and chaos decisions draw from a
//! [`Random`] passed in. [`Mulberry32`] is the seeded generator every build reproduces bit
//! for bit (pinned in `__tests__/fixtures/resilience/prng.cases.json`). For production
//! jitter, seed it from the host's entropy (`getrandom`, `crypto.getRandomValues`).
//!
//! The TypeScript build is `rng.ts`; both are held to `contracts/lib/rng.contract.json`.

use crate::resilience_core::ConfigError;

/// A source of uniformly distributed `u32`s.
pub trait Random {
    /// The next value.
    fn next_u32(&mut self) -> u32;
}

impl<R: Random + ?Sized> Random for &mut R {
    fn next_u32(&mut self) -> u32 {
        (**self).next_u32()
    }
}

impl<R: Random + ?Sized> Random for Box<R> {
    fn next_u32(&mut self) -> u32 {
        (**self).next_u32()
    }
}

/// mulberry32, exactly as the resilience spec defines it.
///
/// ```
/// use mzizi_resilience::rng::{Mulberry32, Random};
///
/// let mut rng = Mulberry32::new(0);
/// assert_eq!(rng.next_u32(), 1144304738);
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Mulberry32 {
    state: u32,
}

impl Mulberry32 {
    /// A generator seeded with `seed`.
    pub const fn new(seed: u32) -> Self {
        Mulberry32 { state: seed }
    }
}

impl Random for Mulberry32 {
    fn next_u32(&mut self) -> u32 {
        self.state = self.state.wrapping_add(0x6D2B_79F5);
        let mut t = self.state;
        t = (t ^ (t >> 15)).wrapping_mul(t | 1);
        t = t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61)) ^ t;
        t ^ (t >> 14)
    }
}

/// A probability `p` in [0, 1] as a u32 threshold: `floor(p * 2^32)`, with `p = 1` as
/// `u32::MAX` (and [`hits`] treating it as always).
pub fn probability_threshold(p: f64) -> Result<u32, ConfigError> {
    if !p.is_finite() || !(0.0..=1.0).contains(&p) {
        return Err(ConfigError::new(
            "probability",
            format!("must be a number in [0, 1], got {p}"),
        ));
    }
    if p >= 1.0 {
        return Ok(u32::MAX);
    }
    // 0 <= p < 1, so p * 2^32 < 2^32 and the floor fits a u32.
    Ok((p * 4_294_967_296.0).floor() as u32)
}

/// Whether a draw `u` hits probability `p` (`p = 1` always hits).
pub fn hits(u: u32, p: f64) -> Result<bool, ConfigError> {
    let threshold = probability_threshold(p)?;
    // Validated: p >= 1.0 here means exactly 1.
    Ok(p >= 1.0 || u < threshold)
}
