//! What a read returns: the data and where it came from.

use crate::layer::Source;

/// A UTC instant, in milliseconds since the Unix epoch, formatted as RFC 3339 on request.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UtcTime {
    unix_ms: u64,
}

impl UtcTime {
    /// The instant `unix_ms` milliseconds after the epoch.
    #[must_use]
    pub const fn from_unix_ms(unix_ms: u64) -> Self {
        Self { unix_ms }
    }

    /// Milliseconds since the Unix epoch.
    #[must_use]
    pub const fn unix_ms(&self) -> u64 {
        self.unix_ms
    }

    /// `YYYY-MM-DDTHH:MM:SS.mmmZ`, in UTC.
    #[must_use]
    pub fn to_rfc3339(&self) -> String {
        let days = (self.unix_ms / 86_400_000) as i64;
        let ms_of_day = self.unix_ms % 86_400_000;
        let (y, m, d) = civil_from_days(days);
        let secs = ms_of_day / 1000;
        format!(
            "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}.{:03}Z",
            secs / 3600,
            (secs % 3600) / 60,
            secs % 60,
            ms_of_day % 1000
        )
    }
}

/// Days since 1970-01-01 to a proleptic Gregorian (year, month, day).
fn civil_from_days(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    let y = yoe + era * 400 + i64::from(m <= 2);
    (y, m, d)
}

/// The answer to a read: the document as this client sees it, with its provenance.
#[derive(Debug, Clone, PartialEq)]
pub struct QueryResult<V> {
    /// The document, with this client's own pending mutations applied. `None` if it does not
    /// exist (or is deleted), including when only a pending mutation would create it.
    pub data: Option<V>,
    /// The tier that answered (local, edge or cloud). A cloud answer with no record is a miss.
    pub source: Source,
    /// The server version of the confirmed record. `0` when there is no confirmed record.
    pub version: u64,
    /// When the confirmed record was last updated, in UTC.
    pub as_of: UtcTime,
    /// How many of this client's unconfirmed mutations affect this document.
    pub pending: usize,
}
