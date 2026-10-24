//! Request identifiers: UUIDv7, generated in the crate from an injected random source.
//!
//! A mutation carries a client-generated request id. The server applies a mutation at most
//! once per id, so a resent mutation is safe. The id is a UUIDv7 (RFC 9562): 48 bits of Unix
//! milliseconds, then random bits. Order between mutations comes from the outbox, never from
//! the id, so the random bits within one millisecond do not matter. This is the crate's own
//! encoding, not the `uuid` crate's, so the crate adds no dependency for it.

use std::cell::Cell;
use std::fmt;
use std::rc::Rc;

/// Random bytes for request ids. The host supplies it: a browser passes `crypto.getRandomValues`,
/// a native host the operating system's generator.
pub trait RandomSource {
    /// Fills `buf` with random bytes.
    fn fill(&self, buf: &mut [u8]);
}

impl<T: RandomSource + ?Sized> RandomSource for &T {
    fn fill(&self, buf: &mut [u8]) {
        (**self).fill(buf);
    }
}

impl<T: RandomSource + ?Sized> RandomSource for Rc<T> {
    fn fill(&self, buf: &mut [u8]) {
        (**self).fill(buf);
    }
}

/// A deterministic generator (splitmix64), for tests only. It is not secure: a production host
/// passes a cryptographic generator.
#[derive(Debug)]
pub struct SeededRandom {
    state: Cell<u64>,
}

impl SeededRandom {
    /// A generator started from `seed`.
    #[must_use]
    pub fn new(seed: u64) -> Self {
        Self {
            state: Cell::new(seed),
        }
    }

    fn next_u64(&self) -> u64 {
        let next = self.state.get().wrapping_add(0x9E37_79B9_7F4A_7C15);
        self.state.set(next);
        let mut z = next;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
}

impl RandomSource for SeededRandom {
    fn fill(&self, buf: &mut [u8]) {
        for chunk in buf.chunks_mut(8) {
            let bytes = self.next_u64().to_le_bytes();
            chunk.copy_from_slice(&bytes[..chunk.len()]);
        }
    }
}

/// A request id: 16 bytes, a UUIDv7 when made by [`RequestId::v7`].
#[derive(Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct RequestId([u8; 16]);

impl RequestId {
    /// A UUIDv7 for `unix_ms`, with random bits from `random`.
    #[must_use]
    pub fn v7(unix_ms: u64, random: &impl RandomSource) -> Self {
        let mut bytes = [0u8; 16];
        random.fill(&mut bytes);
        let ms = (unix_ms & 0xFFFF_FFFF_FFFF).to_be_bytes();
        bytes[..6].copy_from_slice(&ms[2..]);
        bytes[6] = (bytes[6] & 0x0F) | 0x70;
        bytes[8] = (bytes[8] & 0x3F) | 0x80;
        Self(bytes)
    }

    /// The id from its 16 bytes, as the server sends it back.
    #[must_use]
    pub const fn from_bytes(bytes: [u8; 16]) -> Self {
        Self(bytes)
    }

    /// The 16 bytes.
    #[must_use]
    pub const fn as_bytes(&self) -> &[u8; 16] {
        &self.0
    }

    /// Whether the id is a UUIDv7 (version nibble 7, RFC variant).
    #[must_use]
    pub fn is_v7(&self) -> bool {
        self.0[6] >> 4 == 7 && self.0[8] >> 6 == 0b10
    }

    /// The Unix milliseconds the id was made at. Meaningful only for a UUIDv7.
    #[must_use]
    pub fn unix_ms(&self) -> u64 {
        let mut ms = [0u8; 8];
        ms[2..].copy_from_slice(&self.0[..6]);
        u64::from_be_bytes(ms)
    }
}

impl fmt::Display for RequestId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let b = &self.0;
        write!(
            f,
            "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
            b[0],
            b[1],
            b[2],
            b[3],
            b[4],
            b[5],
            b[6],
            b[7],
            b[8],
            b[9],
            b[10],
            b[11],
            b[12],
            b[13],
            b[14],
            b[15]
        )
    }
}

impl fmt::Debug for RequestId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "RequestId({self})")
    }
}
