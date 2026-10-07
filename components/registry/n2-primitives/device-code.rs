//! DEVICE CODE — N2 primitive, Dioxus.
//!
//! The device side of OAuth 2.0 Device Authorization (RFC 8628 §3.3): the user code (large,
//! monospace, read across a room), the short verification address, a QR code of the complete
//! address drawn on the device, a countdown, and a status line that is a polite live region.
//!
//! The Rust sibling of `device-code.astro` and `device-code.tsx`, held to the same contract
//! (`contracts/ui/device-code.contract.json`): the same markup, `data-slot`s and class strings.
//! The QR code comes from the `qrcode` crate (encoder only, no image renderers), in byte mode
//! at error-correction level M; `qr-code.ts` scores masks the same way, so all three builds
//! draw the same matrix (`__tests__/fixtures/device-code.cases.json` holds the shared cases).
//!
//! This build renders one frame from `now` (Unix ms; the system clock when it is not given).
//! It does not tick on its own: an app that shows it live re-renders each second, from its
//! own timer, with a new `now`.

use dioxus::prelude::*;
use qrcode::bits::Bits;
use qrcode::{Color, EcLevel, QrCode, Version};

/// Where the pairing stands. A `Pending` code past `expires_at` shows as `Expired`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum DeviceCodeStatus {
    /// Waiting for the person to approve on another device.
    #[default]
    Pending,
    /// Approved: the device is linked.
    Approved,
    /// The code lapsed.
    Expired,
    /// The person declined.
    Denied,
    /// The pairing failed.
    Error,
}

impl DeviceCodeStatus {
    /// The `data-status` value.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Approved => "approved",
            Self::Expired => "expired",
            Self::Denied => "denied",
            Self::Error => "error",
        }
    }
}

/// `Phone` for a hand-held or windowed screen; `Tv` for a screen read from across a room.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum DeviceCodeSize {
    /// A hand-held or windowed screen.
    #[default]
    Phone,
    /// A screen read from across a room (10-foot UI).
    Tv,
}

impl DeviceCodeSize {
    /// The `data-size` value.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Phone => "phone",
            Self::Tv => "tv",
        }
    }
}

/// The control's words, and the root's accessible name (as `DEVICE_CODE_TEXT` in TypeScript).
pub mod text {
    /// The root's accessible name.
    pub const LABEL: &str = "Link this device";
    /// Before the address.
    pub const GO_TO: &str = "On your phone, go to";
    /// Before the code.
    pub const ENTER: &str = "and enter this code";
    /// Before the spoken code.
    pub const SPOKEN_PREFIX: &str = "Code: ";
    /// Before the countdown.
    pub const EXPIRES_IN: &str = "Expires in ";
    /// Under the QR code.
    pub const SCAN: &str = "Or scan this with your phone's camera";
    /// The refresh control.
    pub const REFRESH: &str = "Get a new code";
    /// Said once the code has a minute or less left.
    pub const LAST_MINUTE: &str = "Less than a minute left to enter the code.";
}

/// The class strings, identical to `DEVICE_CODE_CLASSES` in `device-code-format.ts`.
pub mod classes {
    /// The root.
    pub const ROOT: &str = "group/device-code flex w-full flex-col items-center rounded-[var(--radius-lg,14px)] border border-border bg-card text-center text-card-foreground";
    /// The root, by size: phone, tv.
    pub const ROOT_SIZE: [&str; 2] = ["max-w-sm gap-6 p-6", "gap-10 p-10"];
    /// The pending panel, by size.
    pub const PENDING: [&str; 2] = [
        "flex w-full flex-col items-center gap-6",
        "flex w-full flex-col items-center gap-10 md:flex-row md:justify-center md:gap-16",
    ];
    /// The column of steps.
    pub const STEPS: &str = "flex flex-col items-center gap-2";
    /// An instruction line, by size.
    pub const STEP: [&str; 2] = [
        "text-sm text-muted-foreground",
        "text-2xl text-muted-foreground",
    ];
    /// The verification address, by size.
    pub const URI: [&str; 2] = [
        "text-lg font-semibold break-all text-foreground",
        "text-4xl font-semibold break-all text-foreground",
    ];
    /// The user code, by size.
    pub const CODE: [&str; 2] = [
        "my-2 rounded-[var(--radius-md,12px)] border-2 border-primary px-4 py-2 font-mono text-4xl font-bold tracking-widest whitespace-nowrap text-foreground tabular-nums",
        "my-4 rounded-[var(--radius-md,12px)] border-4 border-primary px-8 py-4 font-mono text-7xl font-bold tracking-widest whitespace-nowrap text-foreground tabular-nums",
    ];
    /// The countdown line, by size.
    pub const COUNTDOWN: [&str; 2] = [
        "text-sm text-muted-foreground",
        "text-2xl text-muted-foreground",
    ];
    /// The time left.
    pub const TIMER: &str = "font-mono font-semibold text-foreground tabular-nums";
    /// The QR code's figure.
    pub const FIGURE: &str = "flex flex-col items-center gap-2";
    /// The QR code, by size: dark modules on white in either theme, so any camera reads it.
    pub const QR: [&str; 2] = [
        "size-48 rounded-[var(--radius-md,12px)] bg-white text-black",
        "size-80 rounded-[var(--radius-md,12px)] bg-white text-black",
    ];
    /// The QR code's caption, by size.
    pub const CAPTION: [&str; 2] = [
        "text-xs text-muted-foreground",
        "text-xl text-muted-foreground",
    ];
    /// The status line, by size.
    pub const STATUS: [&str; 2] = [
        "flex items-center justify-center gap-2 text-base font-medium text-foreground group-data-[status=denied]/device-code:text-destructive group-data-[status=error]/device-code:text-destructive",
        "flex items-center justify-center gap-3 text-3xl font-medium text-foreground group-data-[status=denied]/device-code:text-destructive group-data-[status=error]/device-code:text-destructive",
    ];
    /// The pending dot, by size (still under reduced motion).
    pub const DOT: [&str; 2] = [
        "hidden size-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse group-data-[status=pending]/device-code:inline-block",
        "hidden size-4 shrink-0 rounded-full bg-primary motion-safe:animate-pulse group-data-[status=pending]/device-code:inline-block",
    ];
    /// The panel that holds the refresh control.
    pub const ENDED: &str = "flex justify-center";
    /// The refresh control, by size: 48px (56px on touch) on a phone, 64px on a TV.
    pub const REFRESH: [&str; 2] = [
        "inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-base font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:transition-colors pointer-coarse:h-14",
        "inline-flex h-16 items-center justify-center rounded-full bg-primary px-10 text-2xl font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-8 focus-visible:ring-ring/50 motion-safe:transition-colors",
    ];
}

// ─── Formatting ─────────────────────────────────────────────────────────────────────────────

/// The code as people read it: upper case, ASCII letters and digits only, in groups of four
/// (`ktqb4rmx` → `KTQB-4RMX`).
pub fn format_user_code(code: &str) -> String {
    let clean: Vec<char> = code
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .map(|c| c.to_ascii_uppercase())
        .collect();
    clean
        .chunks(4)
        .map(|g| g.iter().collect::<String>())
        .collect::<Vec<_>>()
        .join("-")
}

/// The code for a screen reader: one character at a time, a pause between groups
/// (`K T Q B, 4 R M X`).
pub fn spoken_user_code(code: &str) -> String {
    format_user_code(code)
        .split('-')
        .map(|g| g.chars().map(String::from).collect::<Vec<_>>().join(" "))
        .collect::<Vec<_>>()
        .join(", ")
}

/// The verification address without its scheme or a trailing slash: what a person types.
pub fn display_uri(uri: &str) -> String {
    let lower = uri.to_ascii_lowercase();
    let rest = if lower.starts_with("https://") {
        &uri[8..]
    } else if lower.starts_with("http://") {
        &uri[7..]
    } else {
        uri
    };
    rest.strip_suffix('/').unwrap_or(rest).to_owned()
}

/// Time left as `m:ss`, rounded up to the second; `0:00` once it has passed.
pub fn format_remaining(ms: i64) -> String {
    let s = if ms <= 0 { 0 } else { (ms + 999) / 1000 };
    format!("{}:{:02}", s / 60, s % 60)
}

/// The status the component shows: a `Pending` code whose time has passed is `Expired`.
pub fn effective_status(status: DeviceCodeStatus, remaining_ms: i64) -> DeviceCodeStatus {
    if status == DeviceCodeStatus::Pending && remaining_ms <= 0 {
        DeviceCodeStatus::Expired
    } else {
        status
    }
}

/// The live status message for a (shown) status and the time left.
pub fn status_message(status: DeviceCodeStatus, remaining_ms: i64) -> &'static str {
    match status {
        DeviceCodeStatus::Pending if remaining_ms <= 60_000 => text::LAST_MINUTE,
        DeviceCodeStatus::Pending => "Waiting for approval on your phone.",
        DeviceCodeStatus::Approved => "This device is linked.",
        DeviceCodeStatus::Expired => "This code has expired.",
        DeviceCodeStatus::Denied => "The request was declined.",
        DeviceCodeStatus::Error => "Something went wrong.",
    }
}

/// Unix milliseconds for an RFC 3339 time (`2026-10-07T12:10:00Z`, fractional seconds and a
/// `±hh:mm` offset allowed), or `None` when it does not parse.
pub fn rfc3339_to_unix_ms(s: &str) -> Option<i64> {
    let b = s.as_bytes();
    let num = |from: usize, len: usize| -> Option<i64> {
        let part = s.get(from..from + len)?;
        if part.bytes().all(|c| c.is_ascii_digit()) {
            part.parse().ok()
        } else {
            None
        }
    };
    if b.len() < 20
        || b[4] != b'-'
        || b[7] != b'-'
        || !matches!(b[10], b'T' | b't' | b' ')
        || b[13] != b':'
        || b[16] != b':'
    {
        return None;
    }
    let (year, month, day) = (num(0, 4)?, num(5, 2)?, num(8, 2)?);
    let (hour, minute, second) = (num(11, 2)?, num(14, 2)?, num(17, 2)?);
    if !(1..=12).contains(&month)
        || !(1..=31).contains(&day)
        || hour > 23
        || minute > 59
        || second > 60
    {
        return None;
    }
    let mut i = 19;
    let mut millis = 0;
    if b.get(i) == Some(&b'.') {
        i += 1;
        let start = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == start {
            return None;
        }
        let frac = &s[start..i.min(start + 3)];
        millis = frac.parse::<i64>().ok()? * 10_i64.pow(3 - u32::try_from(frac.len()).ok()?);
    }
    let offset_min = match b.get(i) {
        Some(b'Z' | b'z') if i + 1 == b.len() => 0,
        Some(sign @ (b'+' | b'-')) if i + 6 == b.len() && b[i + 3] == b':' => {
            let m = num(i + 1, 2)? * 60 + num(i + 4, 2)?;
            if *sign == b'+' { m } else { -m }
        }
        _ => return None,
    };
    // Days from the civil date (Howard Hinnant's algorithm).
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let mp = (month + 9) % 12;
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    let secs = days * 86_400 + hour * 3_600 + minute * 60 + second - offset_min * 60;
    Some(secs * 1_000 + millis)
}

/// The current time in Unix ms, from the platform clock.
#[cfg(not(all(target_arch = "wasm32", target_os = "unknown")))]
fn clock_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
}

/// The current time in Unix ms, from the browser's clock (`SystemTime` panics on this target).
#[cfg(all(target_arch = "wasm32", target_os = "unknown"))]
fn clock_ms() -> i64 {
    #[allow(clippy::cast_possible_truncation)]
    {
        js_sys::Date::now() as i64
    }
}

// ─── The QR code ────────────────────────────────────────────────────────────────────────────

/// Error-correction level: L (7%), M (15%), Q (25%) or H (30%) of codewords recoverable.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum QrEcc {
    /// 7%.
    L,
    /// 15%: the component's level.
    #[default]
    M,
    /// 25%.
    Q,
    /// 30%.
    H,
}

/// An encoded QR code: `size` × `size` modules, row-major, `true` is dark.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QrMatrix {
    /// Modules per side (`version * 4 + 17`).
    pub size: usize,
    /// The QR version, 1 to 40.
    pub version: i16,
    /// Every module, row by row.
    pub dark: Vec<bool>,
}

/// Encode text as a QR code in byte mode (UTF-8) at the smallest version that holds it, as
/// `qrMatrix` in `qr-code.ts` does. `None` when it is too long for version 40 at this level.
pub fn qr_matrix(text: &str, ecc: QrEcc) -> Option<QrMatrix> {
    let level = match ecc {
        QrEcc::L => EcLevel::L,
        QrEcc::M => EcLevel::M,
        QrEcc::Q => EcLevel::Q,
        QrEcc::H => EcLevel::H,
    };
    (1..=40).find_map(|version| {
        let mut bits = Bits::new(Version::Normal(version));
        bits.push_byte_data(text.as_bytes()).ok()?;
        bits.push_terminator(level).ok()?;
        let code = QrCode::with_bits(bits, level).ok()?;
        Some(QrMatrix {
            size: code.width(),
            version,
            dark: code
                .to_colors()
                .into_iter()
                .map(|c| c == Color::Dark)
                .collect(),
        })
    })
}

/// SVG path data for a matrix, in module units, offset by a quiet zone of `quiet` modules: one
/// subpath per horizontal run of dark modules, exactly as `qrPath` in `qr-code.ts` writes it.
pub fn qr_path(m: &QrMatrix, quiet: usize) -> String {
    let mut d = String::new();
    for y in 0..m.size {
        let row = &m.dark[y * m.size..(y + 1) * m.size];
        let mut x = 0;
        while x < m.size {
            if !row[x] {
                x += 1;
                continue;
            }
            let start = x;
            while x < m.size && row[x] {
                x += 1;
            }
            let len = x - start;
            d.push_str(&format!("M{} {}h{len}v1h-{len}z", start + quiet, y + quiet));
        }
    }
    d
}

/// The `viewBox` for [`qr_path`]: the matrix plus its quiet zone on every side.
pub fn qr_view_box(size: usize, quiet: usize) -> String {
    let side = size + 2 * quiet;
    format!("0 0 {side} {side}")
}

// ─── The component ──────────────────────────────────────────────────────────────────────────

/// This component's contract (RFC-0006 clause grammar). WRITTEN BY `pnpm contracts:sync` from
/// `contracts/ui/device-code.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every state
/// the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "device-code"
  portal is "https://mzizi.dev/components/device-code"
  role is "group"
  label is "Link this device"
  class contains "bg-card"
  when default shows p "KTQB-4RMX"
  when default shows p "mukoko.com/link"
  when default shows span "9:42"
  when default shows span "Waiting for approval on your phone."
  when tv class contains "p-10"
  when last-minute shows span "Less than a minute left to enter the code."
  when lapsed shows button "Get a new code"
  when expired shows span "This code has expired."
  when expired shows button "Get a new code"
  when refresh-link shows a "Get a new code"
  when approved shows span "This device is linked."
  when denied shows span "The request was declined."
  when error shows span "Something went wrong."
  button "Get a new code" min_height 48
end"#;

/// Props for [`DeviceCode`].
#[derive(Props, Clone, PartialEq)]
pub struct DeviceCodeProps {
    /// RFC 8628 `user_code`. Shown upper case in groups of four (`KTQB-4RMX`).
    pub user_code: String,
    /// RFC 8628 `verification_uri`: the short address a person types.
    pub verification_uri: String,
    /// RFC 8628 `verification_uri_complete`: the address with the code, drawn as the QR code.
    pub verification_uri_complete: String,
    /// When the code lapses, in Unix ms ([`rfc3339_to_unix_ms`] reads an RFC 3339 string).
    pub expires_at: i64,
    /// Where the pairing stands.
    #[props(default)]
    pub status: DeviceCodeStatus,
    /// `Phone` or `Tv`.
    #[props(default)]
    pub size: DeviceCodeSize,
    /// The clock for this frame, in Unix ms; the platform clock when omitted.
    #[props(default)]
    pub now: Option<i64>,
    /// Makes the refresh control a link to this address.
    #[props(default)]
    pub refresh_href: Option<String>,
    /// Called when the person asks for a new code.
    #[props(default)]
    pub on_refresh: Option<EventHandler<MouseEvent>>,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// The device side of an RFC 8628 pairing: code, address, QR code, countdown and status.
#[component]
pub fn DeviceCode(props: DeviceCodeProps) -> Element {
    let s = usize::from(props.size == DeviceCodeSize::Tv);
    let remaining = props.expires_at - props.now.unwrap_or_else(clock_ms);
    let shown = effective_status(props.status, remaining);
    let pending = shown == DeviceCodeStatus::Pending;
    let qr = if pending {
        qr_matrix(&props.verification_uri_complete, QrEcc::M)
    } else {
        None
    };
    let root_class = [classes::ROOT, classes::ROOT_SIZE[s], props.class.as_str()]
        .iter()
        .filter(|c| !c.is_empty())
        .copied()
        .collect::<Vec<_>>()
        .join(" ");
    let code = format_user_code(&props.user_code);
    let spoken = format!(
        "{}{}",
        text::SPOKEN_PREFIX,
        spoken_user_code(&props.user_code)
    );
    let uri = display_uri(&props.verification_uri);
    let qr_label = format!("QR code for {}", props.verification_uri_complete);
    let on_refresh = props.on_refresh;
    let click = move |e: MouseEvent| {
        if let Some(handler) = &on_refresh {
            handler.call(e);
        }
    };
    rsx! {
        div {
            "data-slot": "device-code",
            "data-portal": "https://mzizi.dev/components/device-code",
            "data-status": shown.slug(),
            "data-size": props.size.slug(),
            "data-expires-at": "{props.expires_at}",
            role: "group",
            "aria-label": text::LABEL,
            class: root_class,
            if pending {
                div { "data-slot": "device-code-pending", class: classes::PENDING[s],
                    div { class: classes::STEPS,
                        p { class: classes::STEP[s], {text::GO_TO} }
                        p { "data-slot": "device-code-uri", class: classes::URI[s], "{uri}" }
                        p { class: classes::STEP[s], {text::ENTER} }
                        p {
                            "data-slot": "device-code-user-code",
                            "aria-hidden": "true",
                            class: classes::CODE[s],
                            "{code}"
                        }
                        p { "data-slot": "device-code-spoken", class: "sr-only", "{spoken}" }
                        p { "data-slot": "device-code-countdown", class: classes::COUNTDOWN[s],
                            {text::EXPIRES_IN}
                            span {
                                "data-slot": "device-code-timer",
                                role: "timer",
                                class: classes::TIMER,
                                {format_remaining(remaining)}
                            }
                        }
                    }
                    if let Some(m) = qr {
                        figure { class: classes::FIGURE,
                            svg {
                                "data-slot": "device-code-qr",
                                role: "img",
                                "aria-label": "{qr_label}",
                                "viewBox": qr_view_box(m.size, 4),
                                "shape-rendering": "crispEdges",
                                class: classes::QR[s],
                                path { "fill": "currentColor", "d": qr_path(&m, 4) }
                            }
                            figcaption { class: classes::CAPTION[s], {text::SCAN} }
                        }
                    }
                }
            }
            p { "data-slot": "device-code-status", role: "status", class: classes::STATUS[s],
                span { "aria-hidden": "true", class: classes::DOT[s] }
                span { "data-slot": "device-code-message", {status_message(shown, remaining)} }
            }
            if shown != DeviceCodeStatus::Approved {
                div { "data-slot": "device-code-ended", hidden: pending, class: classes::ENDED,
                    if let Some(href) = props.refresh_href.clone() {
                        a {
                            href,
                            "data-device-code-refresh": "",
                            class: classes::REFRESH[s],
                            onclick: click,
                            {text::REFRESH}
                        }
                    } else {
                        button {
                            r#type: "button",
                            "data-device-code-refresh": "",
                            class: classes::REFRESH[s],
                            onclick: click,
                            {text::REFRESH}
                        }
                    }
                }
            }
        }
    }
}
