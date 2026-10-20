//! MARKDOWN RENDERER — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/markdown-renderer.contract.json`, beside
//! `markdown-renderer.astro` and `markdown-renderer.tsx` (which share `markdown-parse.ts`).
//!
//! Safe by construction. The Markdown is parsed into a typed tree ([`Block`], [`Inline`]) and
//! the tree is rendered as Dioxus elements, so every piece of text is a text node and every
//! address an attribute, both escaped by the renderer. There is no HTML string and no
//! `dangerous_inner_html`. Raw HTML in the source is text. Links pass [`safe_link`], an
//! allow-list of schemes; a refused link keeps its words and loses its address, and a kept one
//! shows its address on hover (`title`), normalised so an IDN look-alike host reads as punycode.
//!
//! The parser is the same, rule for rule, as `markdown-parse.ts`: paragraphs with every line
//! break kept, ATX headings, nested bulleted and numbered lists, blockquotes, fenced code,
//! rules and GFM tables; code spans, links, bold, italic and backslash escapes. Rich-text HTML
//! (`from: Html`) is read by the same small reader (`rich_text_blocks`), which builds plain
//! values and never a DOM.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1). Self-contained, like every file in this crate.

use dioxus::prelude::*;

// ─── The tree ───────────────────────────────────────────────────────────────────────────────

/// Inline content.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Inline {
    /// Plain text.
    Text(String),
    /// `**bold**`.
    Strong(Vec<Inline>),
    /// `*italic*`.
    Em(Vec<Inline>),
    /// `` `code` ``.
    Code(String),
    /// `[words](address)`, the address already checked by [`safe_link`].
    Link {
        /// The kept address, as written.
        href: String,
        /// The address a reader is shown on hover: scheme and host lower-cased, the host in
        /// ASCII (an internationalised host as punycode), the rest as written.
        title: String,
        /// The link's words.
        children: Vec<Inline>,
    },
}

/// A table column's alignment.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Align {
    /// `:---`
    Left,
    /// `:---:`
    Center,
    /// `---:`
    Right,
}

/// A list item: its lines (a hard break apart), then what follows them inside the item.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListItem {
    /// The item's lines.
    pub lines: Vec<Vec<Inline>>,
    /// Nested lists and, in rich text, lines after a nested list, in document order.
    pub children: Vec<ListChild>,
}

/// What sits inside a list item after its lines.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ListChild {
    /// A nested list.
    List(List),
    /// Lines after a nested list (rich text's `<li>a<ul>…</ul>c</li>`), each a hard break apart.
    Lines(Vec<Vec<Inline>>),
}

/// A bulleted (`ordered: false`) or numbered list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct List {
    /// Numbered.
    pub ordered: bool,
    /// A numbered list's first number (1 for a bulleted list).
    pub start: u32,
    /// The items.
    pub items: Vec<ListItem>,
}

/// A block.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Block {
    /// A paragraph: its lines, each a hard break apart.
    Paragraph(Vec<Vec<Inline>>),
    /// `#` to `######`.
    Heading {
        /// 1 to 6, as written.
        level: u8,
        /// The heading's content.
        children: Vec<Inline>,
    },
    /// A list.
    List(List),
    /// `>` lines, read as blocks.
    Quote(Vec<Block>),
    /// Fenced code.
    Code {
        /// The info word, reduced to `[A-Za-z0-9_+#.-]`, at most 32 characters.
        lang: String,
        /// The code, verbatim.
        text: String,
    },
    /// `---`
    Rule,
    /// A GFM table.
    Table {
        /// Each column's alignment.
        align: Vec<Option<Align>>,
        /// The header cells.
        head: Vec<Vec<Inline>>,
        /// The body rows, each as wide as the header.
        rows: Vec<Vec<Vec<Inline>>>,
    },
}

/// Which link addresses are kept.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum MarkdownLinks {
    /// http, https, mailto, tel and relative addresses.
    #[default]
    Safe,
    /// https only.
    Https,
}

/// What `content` is.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum MarkdownSource {
    /// Markdown.
    #[default]
    Markdown,
    /// Rich-text HTML (an editor's), read by [`rich_text_blocks`].
    Html,
    /// Rich text when it holds an editor's tags ([`looks_like_rich_text`]), Markdown otherwise.
    Auto,
}

/// How deep blockquotes and lists nest before deeper ones are read flat.
pub const MAX_NESTING: usize = 8;
const MAX_INLINE_DEPTH: usize = 16;
const MAX_LABEL: usize = 1000;
const MAX_DEST: usize = 2048;
/// The scanning budget of one inline parse (`BUDGET_BASE + BUDGET_PER_CHAR` × its length): when
/// it runs out, markers still looking for a partner read as text, so hostile text cannot make
/// the work quadratic. The same numbers as `markdown-parse.ts`.
const BUDGET_BASE: usize = 100_000;
const BUDGET_PER_CHAR: usize = 32;

// ─── Classes (the same strings as `MARKDOWN_CLASSES` in markdown-parse.ts) ──────────────────

/// The classes each part carries; `tests/contract.rs` checks they match the TypeScript.
pub mod classes {
    /// The root.
    pub const ROOT: &str = "text-sm leading-relaxed text-foreground";
    /// A paragraph.
    pub const P: &str = "leading-7 [&:not(:first-child)]:mt-4";
    /// `h1` to `h6`.
    pub const H: [&str; 6] = [
        "font-serif text-3xl font-bold tracking-tight mt-8 mb-4 first:mt-0",
        "font-serif text-2xl font-semibold tracking-tight mt-6 mb-3 first:mt-0",
        "font-serif text-xl font-semibold mt-5 mb-2 first:mt-0",
        "text-lg font-semibold mt-4 mb-2 first:mt-0",
        "text-base font-semibold mt-3 mb-1 first:mt-0",
        "text-sm font-semibold mt-3 mb-1 first:mt-0 text-muted-foreground",
    ];
    /// A bulleted list.
    pub const UL: &str = "my-4 list-disc space-y-1 pl-6";
    /// A numbered list.
    pub const OL: &str = "my-4 list-decimal space-y-1 pl-6";
    /// Added to a nested list.
    pub const NESTED: &str = "mt-1 mb-0";
    /// A blockquote.
    pub const QUOTE: &str = "my-4 border-l-4 border-border pl-4 italic text-muted-foreground";
    /// Fenced code.
    pub const PRE: &str =
        "my-4 overflow-x-auto rounded-[var(--radius-xl,17px)] bg-muted/50 p-4 font-mono text-sm";
    /// A code span.
    pub const CODE: &str =
        "rounded-[var(--radius-md,12px)] bg-muted px-1.5 py-0.5 font-mono text-sm";
    /// A link.
    pub const A: &str = "text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
    /// A rule.
    pub const HR: &str = "my-6 border-border";
    /// The box a table scrolls in.
    pub const TABLE_WRAP: &str = "my-4 w-full overflow-x-auto";
    /// A table.
    pub const TABLE: &str = "w-full border-collapse text-sm";
    /// A header cell.
    pub const TH: &str = "border border-border px-3 py-2 font-medium";
    /// A body cell.
    pub const TD: &str = "border border-border px-3 py-2";
    /// Left, centre and right alignment.
    pub const LEFT: &str = "text-left";
    /// Centre.
    pub const CENTER: &str = "text-center";
    /// Right.
    pub const RIGHT: &str = "text-right";
}

fn cell_class(base: &str, align: Option<Align>) -> String {
    let a = match align {
        None | Some(Align::Left) => classes::LEFT,
        Some(Align::Center) => classes::CENTER,
        Some(Align::Right) => classes::RIGHT,
    };
    format!("{base} {a}")
}

/// The heading level (1–6) a Markdown level renders at, shifted by `heading_base`.
#[must_use]
pub fn heading_level(level: u8, heading_base: u8) -> u8 {
    let base = heading_base.clamp(1, 6);
    (level + base - 1).min(6)
}

// ─── Links ──────────────────────────────────────────────────────────────────────────────────

/// A kept link address: its `href`, and the address a reader is shown (its `title`).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MarkdownHref {
    /// The address as written (tabs, newlines and outer `<…>` removed).
    pub href: String,
    /// The address normalised for reading: scheme and host lower-cased and the host in ASCII,
    /// so an internationalised host shows as punycode (`https://аpple.com` →
    /// `https://xn--pple-43d.com`) and a look-alike cannot pass for the site it imitates. The
    /// rest is as written.
    pub title: String,
}

/// The address to put in an `href` and the one to show on hover, or `None` when it is refused.
///
/// Tabs and newlines anywhere, and C0 controls and spaces at either end, are removed first
/// (browsers ignore them, so `\tjavascript:` is `javascript:` to them). An address with other
/// whitespace still in it is refused. Then the scheme is checked against an allow-list. Under
/// [`MarkdownLinks::Safe`] an address with no scheme is kept; under [`MarkdownLinks::Https`]
/// only `https:` is. A web address needs a host the URL parser accepts, no credentials and no
/// port but a number up to 65535. A `mailto:` address's domains are shown as web hosts are (an
/// IDN as punycode), and one the URL parser rejects is refused.
#[must_use]
pub fn safe_link(raw: &str, policy: MarkdownLinks) -> Option<MarkdownHref> {
    let cleaned: String = raw
        .chars()
        .filter(|c| !matches!(c, '\t' | '\n' | '\r'))
        .collect();
    let mut url = cleaned.trim_matches(|c: char| (c as u32) <= 0x20);
    if url.starts_with('<') && url.ends_with('>') && url.len() >= 2 {
        url = &url[1..url.len() - 1];
    }
    // Empty, or whitespace or a control character left inside (even just inside `<…>`, where
    // `<\u{1}javascript:…>` would otherwise read as scheme-less): not one address.
    if url.is_empty() || url.chars().any(|c| is_ws(c) || c < ' ' || c == '\u{7f}') {
        return None;
    }
    let scheme = scheme_of(url).map(str::to_ascii_lowercase);
    let allowed = match (policy, scheme.as_deref()) {
        (MarkdownLinks::Https, Some("https")) => true,
        (MarkdownLinks::Https, _) => false,
        (MarkdownLinks::Safe, None | Some("http" | "https" | "mailto" | "tel")) => true,
        (MarkdownLinks::Safe, Some(_)) => false,
    };
    if !allowed {
        return None;
    }
    // The scheme, lower-cased, starts what a reader is shown.
    let shown = scheme
        .as_deref()
        .map_or(String::new(), |name| format!("{name}:"));
    // A web address needs a host and no credentials (`https://bank.example@evil.example`
    // shows one site and goes to another); so does a scheme-relative `//host` address.
    let rest = match scheme.as_deref() {
        Some(name @ ("http" | "https")) => Some(&url[name.len() + 1..]),
        // Browsers read `\` as `/` here, so `\\host` and `/\host` are scheme-relative too.
        None if scheme_relative(url) => Some(url),
        _ => None,
    };
    let Some(rest) = rest else {
        let after = &url[shown.len()..];
        let title = if scheme.as_deref() == Some("mailto") {
            mailto_title(after)?
        } else {
            after.to_owned()
        };
        return Some(MarkdownHref {
            href: url.to_owned(),
            title: format!("{shown}{title}"),
        });
    };
    let host = web_host(rest)?;
    let ascii = ascii_host(host)?;
    Some(MarkdownHref {
        href: url.to_owned(),
        title: format!("{shown}{}{ascii}{}", &rest[..2], &rest[2 + host.len()..]),
    })
}

/// The address to put in an `href`, or `None` when it is refused ([`safe_link`]'s `href`).
#[must_use]
pub fn safe_href(raw: &str, policy: MarkdownLinks) -> Option<String> {
    safe_link(raw, policy).map(|l| l.href)
}

/// Two slashes, either way round: a browser reads `\\host`, `/\host` and `//host` alike.
fn scheme_relative(url: &str) -> bool {
    let b = url.as_bytes();
    b.len() >= 2 && matches!(b[0], b'/' | b'\\') && matches!(b[1], b'/' | b'\\')
}

/// `//host[:port]…`: the host, when there is one, with no `user@` before it and no port the
/// URL parser rejects (anything but ASCII digits, or a number above 65535; an empty port is
/// allowed, as the parser allows it). The host ends at the first `:` outside `[…]` (an IPv6
/// address), as the URL parser reads it.
fn web_host(rest: &str) -> Option<&str> {
    if !scheme_relative(rest) {
        return None;
    }
    let after = &rest[2..];
    let authority = after.split(['/', '?', '#', '\\']).next().unwrap_or("");
    if authority.is_empty() || authority.contains('@') {
        return None;
    }
    let mut bracket = false;
    let mut end = authority.len();
    for (k, c) in authority.char_indices() {
        match c {
            '[' => bracket = true,
            ']' => bracket = false,
            ':' if !bracket => {
                end = k;
                break;
            }
            _ => {}
        }
    }
    let port = authority.get(end + 1..).unwrap_or("");
    let digits = port.trim_start_matches('0');
    let port_ok = port.bytes().all(|b| b.is_ascii_digit())
        && (digits.is_empty()
            || digits.len() <= 5 && digits.parse::<u32>().is_ok_and(|p| p <= 0xffff));
    port_ok.then(|| &authority[..end])
}

/// A `mailto:` address as a reader is shown it: the domain of each address (after its last
/// `@`, up to `,`, `?` or `#`) as the URL parser writes a host, so `help@аpple.com` (a Cyrillic
/// `а`) shows as `help@xn--pple-43d.com`. The rest is as written. `None` when a domain is
/// rejected.
fn mailto_title(after: &str) -> Option<String> {
    let end = after.find(['?', '#']).unwrap_or(after.len());
    let mut to = Vec::new();
    for address in after[..end].split(',') {
        match address.rfind('@') {
            None => to.push(address.to_owned()),
            Some(at) => to.push(format!(
                "{}{}",
                &address[..=at],
                ascii_host(&address[at + 1..])?
            )),
        }
    }
    Some(format!("{}{}", to.join(","), &after[end..]))
}

/// A host as the URL parser serialises it (the WHATWG URL `hostname`, which `markdown-parse.ts`
/// reads from `new URL()`): lower-cased, an internationalised name as punycode (the `idna`
/// crate, through `url`'s host parser), an IPv4 address in dotted decimal. `None` when the
/// parser rejects it (empty, a forbidden character, a bad IP address), since no browser could
/// follow the link either. A character that would end the host in a URL (`/ ? # \ @ :`, a space
/// or a control character) is one the host step rejects, as `markdown-parse.ts` refuses it.
fn ascii_host(host: &str) -> Option<String> {
    url::Host::parse(host).ok().map(|h| h.to_string())
}

/// `^[a-zA-Z][a-zA-Z0-9+.-]*:`
fn scheme_of(url: &str) -> Option<&str> {
    let mut chars = url.char_indices();
    let (_, first) = chars.next()?;
    if !first.is_ascii_alphabetic() {
        return None;
    }
    for (i, c) in chars {
        if c == ':' {
            return Some(&url[..i]);
        }
        if !(c.is_ascii_alphanumeric() || matches!(c, '+' | '.' | '-')) {
            return None;
        }
    }
    None
}

/// Whether a kept address leaves the site (it opens in a new tab).
#[must_use]
pub fn is_external(href: &str) -> bool {
    matches!(
        scheme_of(href).map(str::to_ascii_lowercase).as_deref(),
        Some("http" | "https")
    ) || scheme_relative(href)
}

// ─── Inlines ────────────────────────────────────────────────────────────────────────────────

/// Whitespace, as a fixed set shared with `markdown-parse.ts` (Rust's `char::is_whitespace`
/// and JavaScript's `\s` disagree on U+0085 and U+FEFF).
#[must_use]
pub fn is_ws(c: char) -> bool {
    matches!(
        c,
        '\t' | '\n' | '\u{b}' | '\u{c}' | '\r' | ' ' | '\u{85}' | '\u{a0}' | '\u{1680}' | '\u{2000}'
            ..='\u{200a}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202f}'
                | '\u{205f}'
                | '\u{3000}'
                | '\u{feff}'
    )
}

fn trim_ws(s: &str) -> &str {
    s.trim_matches(is_ws)
}

/// Every run of HTML whitespace (tab, newline, form feed, carriage return, space) as one
/// space. A non-breaking space is not collapsible, as in a browser.
fn collapse_html_ws(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut space = false;
    for c in s.chars() {
        if matches!(c, '\t' | '\n' | '\u{c}' | '\r' | ' ') {
            if !space {
                out.push(' ');
            }
            space = true;
        } else {
            out.push(c);
            space = false;
        }
    }
    out
}

fn is_space(c: Option<char>) -> bool {
    c.is_none_or(is_ws)
}

/// Alphabetic or numeric, as `[\p{Alphabetic}\p{N}]` in `markdown-parse.ts`.
fn is_word(c: Option<char>) -> bool {
    c.is_some_and(char::is_alphanumeric)
}

struct InlineParser<'a> {
    s: &'a [char],
    policy: MarkdownLinks,
    /// Per delimiter, the earliest position a search to the end of the text started from and
    /// found no partner (as `noCloserFrom` in `markdown-parse.ts`): a later search to the end
    /// that starts at or after it finds none either. A bounded search is never answered here.
    no_closer_from: std::collections::HashMap<(char, usize), usize>,
    code_ends: std::collections::HashMap<usize, Option<usize>>,
    unpaired: std::collections::HashSet<usize>,
    budget: isize,
}

struct LinkAt {
    label_end: usize,
    dest: String,
    end: usize,
}

impl<'a> InlineParser<'a> {
    fn new(s: &'a [char], policy: MarkdownLinks) -> Self {
        Self {
            s,
            policy,
            no_closer_from: std::collections::HashMap::new(),
            code_ends: std::collections::HashMap::new(),
            unpaired: std::collections::HashSet::new(),
            budget: isize::try_from(BUDGET_BASE + BUDGET_PER_CHAR * s.len()).unwrap_or(isize::MAX),
        }
    }

    /// Spend one scanning step; false when the budget is gone.
    fn step(&mut self) -> bool {
        self.budget -= 1;
        self.budget >= 0
    }

    /// The run of `c` at `i`, stopping at `to`; its length is charged to the budget.
    fn run(&mut self, i: usize, c: char, to: usize) -> usize {
        let to = to.min(self.s.len());
        let n = self.s[i.min(to)..to]
            .iter()
            .take_while(|&&x| x == c)
            .count();
        self.budget -= isize::try_from(n).unwrap_or(isize::MAX);
        n
    }

    /// Past a code span opening at `j` (a backtick run with a partner), or `None`.
    fn span_end(&mut self, j: usize) -> Option<usize> {
        let len = self.s.len();
        let n = self.run(j, '`', len);
        let mut k = j + n;
        while k < len {
            if !self.step() {
                return None;
            }
            if self.s[k] == '`' {
                let m = self.run(k, '`', len);
                if m == n {
                    return Some(k + m);
                }
                k += m;
            } else {
                k += 1;
            }
        }
        None
    }

    fn at(&self, i: usize) -> Option<char> {
        self.s.get(i).copied()
    }

    fn code_end(&mut self, j: usize) -> Option<usize> {
        if let Some(&end) = self.code_ends.get(&j) {
            return end;
        }
        let at_start = j == 0 || self.s[j - 1] != '`';
        let n = self.run(j, '`', self.s.len());
        let end = if at_start && self.unpaired.contains(&n) {
            None
        } else {
            self.span_end(j)
        };
        if end.is_none() && at_start {
            self.unpaired.insert(n);
        }
        self.code_ends.insert(j, end);
        end
    }

    fn closer(&mut self, c: char, n: usize, from: usize, to: usize) -> Option<usize> {
        let to_end = to == self.s.len();
        let known = self.no_closer_from.get(&(c, n)).copied();
        if to_end && known.is_some_and(|at| from >= at) {
            return None;
        }
        let mut j = from;
        while j < to {
            if !self.step() {
                return None;
            }
            let ch = self.s[j];
            if ch == '\\' {
                j += 2;
                continue;
            }
            if ch == '`' {
                j = match self.code_end(j) {
                    Some(end) => end,
                    None => j + self.run(j, '`', to),
                };
                continue;
            }
            if ch == c {
                let run = self.run(j, c, to);
                if run >= n && (n > 1 || run == 1) {
                    let at = if run == n { j } else { j + run - n };
                    let before = if at == 0 { None } else { self.at(at - 1) };
                    let after = self.at(at + n);
                    if at > from && !is_space(before) && !(c == '_' && is_word(after)) {
                        return Some(at);
                    }
                }
                j += run;
                continue;
            }
            j += 1;
        }
        if to_end {
            self.no_closer_from
                .entry((c, n))
                .and_modify(|at| *at = (*at).min(from))
                .or_insert(from);
        }
        None
    }

    fn parse(&mut self, from: usize, to: usize, depth: usize, in_link: bool) -> Vec<Inline> {
        let mut out: Vec<Inline> = Vec::new();
        let mut buf = String::new();
        fn flush(out: &mut Vec<Inline>, buf: &mut String) {
            if buf.is_empty() {
                return;
            }
            if let Some(Inline::Text(last)) = out.last_mut() {
                last.push_str(buf);
            } else {
                out.push(Inline::Text(buf.clone()));
            }
            buf.clear();
        }
        let mut i = from;
        while i < to {
            let ch = self.s[i];
            if ch == '\\' && i + 1 < to && self.s[i + 1].is_ascii_punctuation() {
                buf.push(self.s[i + 1]);
                i += 2;
                continue;
            }
            if ch == '`' {
                let n = self.run(i, '`', self.s.len());
                match self.code_end(i) {
                    Some(end) if end <= to => {
                        flush(&mut out, &mut buf);
                        let mut v: String = self.s[i + n..end - n].iter().collect();
                        if v.chars().count() > 1
                            && v.starts_with(' ')
                            && v.ends_with(' ')
                            && !trim_ws(&v).is_empty()
                        {
                            v = v[1..v.len() - 1].to_owned();
                        }
                        out.push(Inline::Code(v));
                        i = end;
                    }
                    _ => {
                        buf.extend(std::iter::repeat_n('`', n));
                        i += n;
                    }
                }
                continue;
            }
            if ch == '[' && depth < MAX_INLINE_DEPTH {
                if let Some(link) = self.link(i, to) {
                    let label = self.parse(i + 1, link.label_end, depth + 1, true);
                    let kept = if in_link {
                        None
                    } else {
                        safe_link(&link.dest, self.policy)
                    };
                    match kept {
                        Some(MarkdownHref { href, title }) => {
                            flush(&mut out, &mut buf);
                            out.push(Inline::Link {
                                href,
                                title,
                                children: label,
                            });
                        }
                        None => {
                            for x in label {
                                match x {
                                    Inline::Text(t) => buf.push_str(&t),
                                    other => {
                                        flush(&mut out, &mut buf);
                                        out.push(other);
                                    }
                                }
                            }
                        }
                    }
                    i = link.end;
                    continue;
                }
            }
            if (ch == '*' || ch == '_') && depth < MAX_INLINE_DEPTH {
                let run = self.run(i, ch, to);
                let before = if i == 0 { None } else { self.at(i - 1) };
                let opens = !is_space(self.at(i + run)) && !(ch == '_' && is_word(before));
                if opens {
                    let mut done = false;
                    for n in [3, 2, 1] {
                        if n > run {
                            continue;
                        }
                        let Some(close) = self.closer(ch, n, i + n, to) else {
                            continue;
                        };
                        buf.extend(std::iter::repeat_n(ch, run - n));
                        flush(&mut out, &mut buf);
                        let inner = self.parse(i + run, close, depth + 1, in_link);
                        out.push(match n {
                            3 => Inline::Strong(vec![Inline::Em(inner)]),
                            2 => Inline::Strong(inner),
                            _ => Inline::Em(inner),
                        });
                        i = close + n;
                        done = true;
                        break;
                    }
                    if done {
                        continue;
                    }
                }
                buf.extend(std::iter::repeat_n(ch, run));
                i += run;
                continue;
            }
            buf.push(ch);
            i += 1;
        }
        flush(&mut out, &mut buf);
        out
    }

    fn link(&mut self, i: usize, to: usize) -> Option<LinkAt> {
        let mut depth = 0usize;
        let mut j = i;
        let label_to = to.min(i + MAX_LABEL);
        while j < label_to {
            if !self.step() {
                return None;
            }
            let ch = self.s[j];
            if ch == '\\' {
                j += 2;
                continue;
            }
            if ch == '`' {
                j = match self.code_end(j) {
                    Some(end) if end <= label_to => end,
                    _ => j + self.run(j, '`', label_to),
                };
                continue;
            }
            if ch == '[' {
                depth += 1;
            } else if ch == ']' {
                depth -= 1;
                if depth == 0 {
                    break;
                }
            }
            j += 1;
        }
        if j >= label_to || self.at(j + 1) != Some('(') {
            return None;
        }
        let label_end = j;
        let mut parens = 0usize;
        let mut k = j + 2;
        let dest_to = to.min(k + MAX_DEST);
        while k < dest_to {
            if !self.step() {
                return None;
            }
            let ch = self.s[k];
            if ch == '\\' {
                k += 2;
                continue;
            }
            if ch == '(' {
                parens += 1;
            } else if ch == ')' {
                if parens == 0 {
                    break;
                }
                parens -= 1;
            }
            k += 1;
        }
        if k >= dest_to {
            return None;
        }
        // The address: `<…>`, or everything up to the first space or ASCII control character,
        // as CommonMark ends it (a tab or a line break ends it as a space does; what follows
        // is a title, which is dropped). Other whitespace, such as a no-break space, is part
        // of the address, and an address that runs into another control character is kept
        // whole, so `safe_link` refuses either rather than the link going to the part before
        // it. Then backslash escapes of ASCII punctuation are undone, as CommonMark reads them.
        let inside: String = self.s[label_end + 2..k].iter().collect();
        let inside = inside.trim_start_matches(is_dest_space);
        let dest = if inside.starts_with('<') && inside.contains('>') {
            &inside[..=inside.find('>').unwrap_or(0)]
        } else {
            match inside.find(ends_dest) {
                Some(end) if !inside[end..].starts_with(is_dest_space) => inside,
                Some(end) => &inside[..end],
                None => inside,
            }
        };
        Some(LinkAt {
            label_end,
            dest: unescape_punct(dest),
            end: k + 1,
        })
    }
}

/// A space or an ASCII control character: what ends a link's address in CommonMark.
fn ends_dest(c: char) -> bool {
    c <= ' ' || c == '\u{7f}'
}

/// A space, a tab or a line break: what may come between a link's address and its title.
fn is_dest_space(c: char) -> bool {
    matches!(c, ' ' | '\t' | '\n' | '\r')
}

/// Backslash escapes of ASCII punctuation undone (`\)` is `)`); any other backslash stays.
fn unescape_punct(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();
    while let Some(c) = chars.next() {
        match chars.peek() {
            Some(&next) if c == '\\' && next.is_ascii_punctuation() => {
                out.push(next);
                chars.next();
            }
            _ => out.push(c),
        }
    }
    out
}

/// Inline Markdown as data.
#[must_use]
pub fn parse_inlines(text: &str, policy: MarkdownLinks) -> Vec<Inline> {
    let s: Vec<char> = text.chars().collect();
    InlineParser::new(&s, policy).parse(0, s.len(), 0, false)
}

// ─── Blocks ─────────────────────────────────────────────────────────────────────────────────

fn blank(line: &str) -> bool {
    trim_ws(line).is_empty()
}

/// Up to three leading spaces off, or `None` when there are four or more.
fn up_to_three(line: &str) -> Option<&str> {
    let spaces = line.len() - line.trim_start_matches(' ').len();
    (spaces <= 3).then(|| &line[spaces..])
}

fn leading_ws(line: &str) -> usize {
    line.chars().take_while(|&c| is_ws(c)).count()
}

/// `^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[^`]*$` → (marker char, marker length, info word).
fn fence(line: &str) -> Option<(char, usize, String)> {
    let rest = up_to_three(line)?;
    let c = rest.chars().next()?;
    if c != '`' && c != '~' {
        return None;
    }
    let n = rest.chars().take_while(|&x| x == c).count();
    if n < 3 {
        return None;
    }
    let info = &rest[n..];
    if info.contains('`') {
        return None;
    }
    let word: String = info
        .trim_start_matches([' ', '\t'])
        .chars()
        .take_while(|&c| !is_ws(c))
        .collect();
    Some((c, n, word))
}

/// `^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$` → (level, text).
fn heading(line: &str) -> Option<(u8, String)> {
    let rest = up_to_three(line)?;
    let n = rest.chars().take_while(|&c| c == '#').count();
    if !(1..=6).contains(&n) {
        return None;
    }
    let after = &rest[n..];
    if !after.starts_with([' ', '\t']) {
        return None;
    }
    let mut text = after
        .trim_start_matches([' ', '\t'])
        .trim_end_matches([' ', '\t']);
    let without_hashes = text.trim_end_matches('#');
    if without_hashes.len() < text.len() && without_hashes.ends_with([' ', '\t']) {
        text = without_hashes.trim_end_matches([' ', '\t']);
    }
    Some((u8::try_from(n).unwrap_or(6), text.to_owned()))
}

/// `^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$`
fn rule(line: &str) -> bool {
    let Some(rest) = up_to_three(line) else {
        return false;
    };
    let Some(c) = rest.chars().next() else {
        return false;
    };
    if !matches!(c, '-' | '*' | '_') {
        return false;
    }
    rest.chars().all(|x| x == c || x == ' ' || x == '\t')
        && rest.chars().filter(|&x| x == c).count() >= 3
}

/// `^ {0,3}> ?(.*)$` → the quoted line.
fn quote(line: &str) -> Option<&str> {
    let rest = up_to_three(line)?.strip_prefix('>')?;
    Some(rest.strip_prefix(' ').unwrap_or(rest))
}

/// `^( *)([-*+•‣◦]|\d{1,9}[.)])[ \t]+(.*)$` → (indent, ordered, number, text).
fn list_item(line: &str) -> Option<(usize, bool, u32, &str)> {
    let indent = line.len() - line.trim_start_matches(' ').len();
    let rest = &line[indent..];
    let first = rest.chars().next()?;
    let (ordered, number, after) = if matches!(first, '-' | '*' | '+' | '•' | '‣' | '◦') {
        (false, 1, &rest[first.len_utf8()..])
    } else {
        let digits = rest.chars().take_while(char::is_ascii_digit).count();
        if !(1..=9).contains(&digits) {
            return None;
        }
        let after = &rest[digits..];
        let after = after.strip_prefix(['.', ')'])?;
        (true, rest[..digits].parse().ok()?, after)
    };
    if !after.starts_with([' ', '\t']) {
        return None;
    }
    Some((
        indent,
        ordered,
        number,
        after.trim_start_matches([' ', '\t']),
    ))
}

fn cells(line: &str) -> Vec<String> {
    let mut row = trim_ws(line);
    row = row.strip_prefix('|').unwrap_or(row);
    if row.ends_with('|') && !row.ends_with("\\|") {
        row = &row[..row.len() - 1];
    }
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut chars = row.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' && chars.peek() == Some(&'|') {
            cur.push('|');
            chars.next();
        } else if c == '|' {
            out.push(trim_ws(&cur).to_owned());
            cur.clear();
        } else {
            cur.push(c);
        }
    }
    out.push(trim_ws(&cur).to_owned());
    out
}

fn delimiter_row(line: &str) -> Option<Vec<Option<Align>>> {
    if !line.contains('|') || !line.contains('-') {
        return None;
    }
    let mut align = Vec::new();
    for c in cells(line) {
        let inner = c.strip_prefix(':').unwrap_or(&c);
        let inner = inner.strip_suffix(':').unwrap_or(inner);
        if inner.is_empty() || !inner.chars().all(|x| x == '-') {
            return None;
        }
        let (l, r) = (c.starts_with(':'), c.ends_with(':') && c.len() > 1);
        align.push(match (l, r) {
            (true, true) => Some(Align::Center),
            (false, true) => Some(Align::Right),
            (true, false) => Some(Align::Left),
            (false, false) => None,
        });
    }
    Some(align)
}

fn table_starts(lines: &[String], i: usize) -> Option<Vec<Option<Align>>> {
    if i + 1 >= lines.len() || !lines[i].contains('|') {
        return None;
    }
    let align = delimiter_row(&lines[i + 1])?;
    (cells(&lines[i]).len() == align.len()).then_some(align)
}

fn untab(line: &str) -> String {
    let lead = line.len() - line.trim_start_matches([' ', '\t']).len();
    if line[..lead].contains('\t') {
        format!("{}{}", line[..lead].replace('\t', "    "), &line[lead..])
    } else {
        line.to_owned()
    }
}

fn starts_block(lines: &[String], i: usize) -> bool {
    let line = &lines[i];
    fence(line).is_some()
        || heading(line).is_some()
        || rule(line)
        || quote(line).is_some()
        || list_item(line).is_some()
        || table_starts(lines, i).is_some()
}

struct BlockParser {
    policy: MarkdownLinks,
}

impl BlockParser {
    fn inl(&self, text: &str) -> Vec<Inline> {
        parse_inlines(text, self.policy)
    }

    fn parse(&self, lines: &[String], depth: usize) -> Vec<Block> {
        let mut out = Vec::new();
        let mut i = 0;
        while i < lines.len() {
            let line = &lines[i];
            if blank(line) {
                i += 1;
                continue;
            }
            if let Some((mark, len, word)) = fence(line) {
                let indent = leading_ws(line);
                let mut body = Vec::new();
                i += 1;
                while i < lines.len() {
                    let l = &lines[i];
                    let t = trim_ws(l);
                    if t.chars().count() >= len
                        && t.chars().all(|c| c == mark)
                        && leading_ws(l) <= 3
                    {
                        i += 1;
                        break;
                    }
                    let strip = l.len() - l.trim_start_matches(' ').len();
                    body.push(l[strip.min(indent)..].to_owned());
                    i += 1;
                }
                let lang: String = word
                    .chars()
                    .filter(|c| {
                        c.is_ascii_alphanumeric() || matches!(c, '_' | '+' | '#' | '.' | '-')
                    })
                    .take(32)
                    .collect();
                out.push(Block::Code {
                    lang,
                    text: body.join("\n"),
                });
                continue;
            }
            if let Some((level, text)) = heading(line) {
                out.push(Block::Heading {
                    level,
                    children: self.inl(&text),
                });
                i += 1;
                continue;
            }
            if rule(line) {
                out.push(Block::Rule);
                i += 1;
                continue;
            }
            if quote(line).is_some() {
                let mut inner = Vec::new();
                while i < lines.len() {
                    let Some(q) = quote(&lines[i]) else { break };
                    inner.push(q.to_owned());
                    i += 1;
                }
                if depth + 1 >= MAX_NESTING {
                    out.push(Block::Paragraph(
                        inner
                            .iter()
                            .filter(|l| !blank(l))
                            .map(|l| self.inl(trim_ws(l)))
                            .collect(),
                    ));
                } else {
                    out.push(Block::Quote(self.parse(&inner, depth + 1)));
                }
                continue;
            }
            if list_item(line).is_some() {
                i = self.list(lines, i, &mut out);
                continue;
            }
            if let Some(align) = table_starts(lines, i) {
                let width = align.len();
                let fit = |cs: Vec<String>| -> Vec<Vec<Inline>> {
                    (0..width)
                        .map(|k| self.inl(cs.get(k).map_or("", String::as_str)))
                        .collect()
                };
                let head = fit(cells(line));
                let mut rows = Vec::new();
                i += 2;
                while i < lines.len()
                    && !blank(&lines[i])
                    && lines[i].contains('|')
                    && !starts_block(lines, i)
                {
                    rows.push(fit(cells(&lines[i])));
                    i += 1;
                }
                out.push(Block::Table { align, head, rows });
                continue;
            }
            let mut para: Vec<&str> = Vec::new();
            while i < lines.len()
                && !blank(&lines[i])
                && (para.is_empty() || !starts_block(lines, i))
            {
                para.push(trim_ws(&lines[i]));
                i += 1;
            }
            // A backslash at the end of a line is a hard break only when another line follows
            // (every line break is one already, so it goes); on the last line it is text.
            let last = para.len() - 1;
            out.push(Block::Paragraph(
                para.iter()
                    .enumerate()
                    .map(|(k, t)| {
                        self.inl(if k < last {
                            t.strip_suffix('\\').unwrap_or(t)
                        } else {
                            t
                        })
                    })
                    .collect(),
            ));
        }
        out
    }

    /// Read a run of list items from `i` into `out`; returns the line after it.
    fn list(&self, lines: &[String], mut i: usize, out: &mut Vec<Block>) -> usize {
        // The open lists, outermost first, each with its indent. A nested list lives in the
        // last item of the list before it, so the stack is a path, rebuilt on each push.
        let mut stack: Vec<(usize, List)> = Vec::new();
        fn new_list(ordered: bool, number: u32) -> List {
            List {
                ordered,
                start: if ordered { number } else { 1 },
                items: Vec::new(),
            }
        }
        /// Fold the stack's top into the item it belongs to.
        fn close_top(stack: &mut Vec<(usize, List)>, out: &mut Vec<Block>) {
            let (_, list) = stack.pop().expect("an open list");
            match stack.last_mut() {
                Some((_, parent)) => parent
                    .items
                    .last_mut()
                    .expect("a nested list sits under an item")
                    .children
                    .push(ListChild::List(list)),
                None => out.push(Block::List(list)),
            }
        }
        while i < lines.len() {
            let line = &lines[i];
            if blank(line) {
                let mut k = i + 1;
                while k < lines.len() && blank(&lines[k]) {
                    k += 1;
                }
                if k < lines.len() && list_item(&lines[k]).is_some() {
                    i = k;
                    continue;
                }
                break;
            }
            let Some((indent, ordered, number, text)) = list_item(line) else {
                let continues = line.starts_with("  ")
                    && line
                        .trim_start_matches(' ')
                        .chars()
                        .next()
                        .is_some_and(|c| !is_ws(c))
                    && !starts_block(lines, i);
                // (No let chains: the workspace's rust-version is 1.85.)
                let item = stack.last_mut().and_then(|(_, top)| top.items.last_mut());
                match item {
                    Some(item) if continues => {
                        item.lines.push(self.inl(trim_ws(line)));
                        i += 1;
                        continue;
                    }
                    _ => break,
                }
            };
            let item = ListItem {
                lines: vec![self.inl(trim_ws(text))],
                children: Vec::new(),
            };
            if stack.is_empty() {
                stack.push((indent, new_list(ordered, number)));
            } else {
                while stack.len() > 1 && indent < stack[stack.len() - 1].0 {
                    close_top(&mut stack, out);
                }
                let (top_indent, top) = stack.last().expect("an open list");
                let top_indent = *top_indent;
                if indent >= top_indent + 2 && !top.items.is_empty() && stack.len() < MAX_NESTING {
                    stack.push((indent, new_list(ordered, number)));
                } else if top.ordered != ordered {
                    close_top(&mut stack, out);
                    stack.push((top_indent, new_list(ordered, number)));
                }
            }
            stack.last_mut().expect("an open list").1.items.push(item);
            i += 1;
        }
        while !stack.is_empty() {
            close_top(&mut stack, out);
        }
        i
    }
}

/// Markdown as data.
#[must_use]
pub fn parse_markdown(text: &str, policy: MarkdownLinks) -> Vec<Block> {
    let lines: Vec<String> = text
        .replace("\r\n", "\n")
        .replace('\r', "\n")
        .split('\n')
        .map(untab)
        .collect();
    BlockParser { policy }.parse(&lines, 0)
}

// ─── Rich text ──────────────────────────────────────────────────────────────────────────────
//
// The same reader as `markdown-parse.ts`: HTML into a tree of plain values (never a DOM, so
// nothing in it runs or loads), then straight into blocks and inlines, never into Markdown
// text, so text in rich text is always text. Elements nest at most `MAX_HTML_DEPTH` deep.

/// How deep rich-text elements nest; deeper start tags are ignored (their text is kept).
pub const MAX_HTML_DEPTH: usize = 32;

enum RichNode {
    Text(String),
    El {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<RichNode>,
    },
}

const VOID: &[&str] = &[
    "br", "hr", "img", "input", "meta", "link", "wbr", "area", "base", "col", "embed", "source",
    "track", "param",
];
const DROP: &[&str] = &[
    "script", "style", "template", "noscript", "iframe", "object", "textarea", "title", "xmp",
    "head", "svg", "math",
];
const CLOSES_P: &[&str] = &[
    "p",
    "div",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "pre",
    "hr",
    "table",
];
const CONTAINERS: &[&str] = &[
    "div", "html", "body", "main", "section", "article", "header", "footer", "aside", "nav",
    "figure", "center", "form", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
];
const BLOCKISH: &[&str] = &[
    "p",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "li",
    "ul",
    "ol",
    "pre",
    "tr",
    "td",
    "th",
];

/// Decode the character references editors write: `&amp; &lt; &gt; &quot; &apos; &nbsp;` and
/// numeric ones. Anything else stays as written.
#[must_use]
pub fn decode_entities(text: &str) -> String {
    let c: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    let mut i = 0;
    while i < c.len() {
        if c[i] == '&' {
            if let Some((decoded, len)) = entity_at(&c[i + 1..]) {
                out.push_str(&decoded);
                i += 1 + len;
                continue;
            }
        }
        out.push(c[i]);
        i += 1;
    }
    out
}

/// The reference after a `&`: its text and the characters it spans (including the `;`).
fn entity_at(c: &[char]) -> Option<(String, usize)> {
    let run = |from: usize, ok: fn(&char) -> bool| {
        c[from.min(c.len())..].iter().take_while(|x| ok(x)).count()
    };
    if c.first() == Some(&'#') {
        let (from, radix, max) = if matches!(c.get(1), Some('x' | 'X')) {
            (2, 16, 6)
        } else {
            (1, 10, 7)
        };
        let n = if radix == 16 {
            run(from, char::is_ascii_hexdigit)
        } else {
            run(from, char::is_ascii_digit)
        };
        if n == 0 || n > max || c.get(from + n) != Some(&';') {
            return None;
        }
        let digits: String = c[from..from + n].iter().collect();
        let code = u32::from_str_radix(&digits, radix).ok()?;
        let ch = if code > 0 { char::from_u32(code) } else { None }.unwrap_or('\u{fffd}');
        return Some((ch.to_string(), from + n + 1));
    }
    let n = run(0, char::is_ascii_alphabetic);
    if !(2..=6).contains(&n) || c.get(n) != Some(&';') {
        return None;
    }
    let name: String = c[..n].iter().collect();
    let v = match name.as_str() {
        "amp" => "&",
        "lt" => "<",
        "gt" => ">",
        "quot" => "\"",
        "apos" => "'",
        "nbsp" => "\u{a0}",
        _ => return Some((format!("&{name};"), n + 1)),
    };
    Some((v.to_owned(), n + 1))
}

/// An open element while reading: tag, attributes, children.
type Open = (String, Vec<(String, String)>, Vec<RichNode>);

fn close_to(stack: &mut Vec<Open>, k: usize) {
    while stack.len() > k {
        let (tag, attrs, children) = stack.pop().expect("an open element");
        stack.last_mut().expect("the root").2.push(RichNode::El {
            tag,
            attrs,
            children,
        });
    }
}

/// HTML whitespace: tab, newline, form feed, carriage return, space.
fn is_html_ws(c: char) -> bool {
    matches!(c, '\t' | '\n' | '\u{c}' | '\r' | ' ')
}

/// Where a tag name that starts at `j` ends, as the tokenizer reads it: at whitespace, `/` or
/// `>`.
fn tag_name_end(h: &[char], mut j: usize) -> usize {
    while j < h.len() && !is_html_ws(h[j]) && h[j] != '/' && h[j] != '>' {
        j += 1;
    }
    j
}

/// The rest of a tag, read as the HTML tokenizer reads it (as `scanTag` in `markdown-parse.ts`).
struct TagRest {
    /// The index of the `>` that ends it (the length when none does).
    end: usize,
    /// Whether it ends `/>`.
    self_closing: bool,
    /// The attribute names (lower-cased) with their raw values, the first of each name.
    attrs: Vec<(String, String)>,
}

/// The rest of a tag from `j` (just after its name), read as the HTML tokenizer reads it, with
/// only HTML whitespace between attributes, so a `>` ends the tag exactly where it ends it for
/// a browser.
fn scan_tag(h: &[char], mut j: usize) -> TagRest {
    let n = h.len();
    let mut attrs: Vec<(String, String)> = Vec::new();
    let cut = |attrs| TagRest {
        end: n,
        self_closing: false,
        attrs,
    };
    loop {
        while j < n && is_html_ws(h[j]) {
            j += 1;
        }
        if j >= n {
            return cut(attrs);
        }
        if h[j] == '>' {
            return TagRest {
                end: j,
                self_closing: false,
                attrs,
            };
        }
        if h[j] == '/' {
            if h.get(j + 1) == Some(&'>') {
                return TagRest {
                    end: j + 1,
                    self_closing: true,
                    attrs,
                };
            }
            j += 1;
            continue;
        }
        // A name: its first character may be `=`; it ends at whitespace, `/`, `>` or `=`.
        let from = j;
        j += 1;
        while j < n && !is_html_ws(h[j]) && !matches!(h[j], '/' | '>' | '=') {
            j += 1;
        }
        let key: String = h[from..j].iter().map(char::to_ascii_lowercase).collect();
        while j < n && is_html_ws(h[j]) {
            j += 1;
        }
        let mut value = String::new();
        if h.get(j) == Some(&'=') {
            j += 1;
            while j < n && is_html_ws(h[j]) {
                j += 1;
            }
            match h.get(j) {
                Some(&q) if q == '"' || q == '\'' => {
                    let Some(close) = (j + 1..n).find(|&e| h[e] == q) else {
                        return cut(attrs);
                    };
                    value = h[j + 1..close].iter().collect();
                    j = close + 1;
                }
                _ => {
                    let v = j;
                    while j < n && !is_html_ws(h[j]) && h[j] != '>' {
                        j += 1;
                    }
                    value = h[v..j].iter().collect();
                }
            }
        }
        if !attrs.iter().any(|(a, _)| *a == key) {
            attrs.push((key, value));
        }
    }
}

/// Elements whose content a browser reads as text, ending only at their own end tag.
const RAW_TEXT: &[&str] = &[
    "script",
    "style",
    "textarea",
    "title",
    "xmp",
    "iframe",
    "noscript",
    "noembed",
    "noframes",
    "plaintext",
];

/// Whether `h` at `k` is `name` (any case) followed by whitespace, `/` or `>`.
fn tag_name_at(h: &[char], k: usize, name: &str) -> bool {
    let n = name.chars().count();
    k + n < h.len()
        && h[k..k + n]
            .iter()
            .zip(name.chars())
            .all(|(a, b)| a.to_ascii_lowercase() == b)
        && matches!(h[k + n], '\t' | '\n' | '\u{c}' | '\r' | ' ' | '/' | '>')
}

/// Where `pat` next starts in `h`, at or after `from`.
fn find_at(h: &[char], from: usize, pat: &str) -> Option<usize> {
    let p: Vec<char> = pat.chars().collect();
    (from..h.len()).find(|&k| h[k..].starts_with(&p))
}

/// Just after the end tag `</name…>` that starts at `k` (a quoted `>` does not end it).
fn after_end_tag(h: &[char], k: usize, name: &str) -> usize {
    (scan_tag(h, k + 2 + name.chars().count()).end + 1).min(h.len())
}

/// Just after a comment that starts at `k` (`<!--`): at `-->` or `--!>`, or at once for the
/// empty `<!-->` and `<!--->`, as the HTML tokenizer ends it; the length when it has no end.
fn comment_end(h: &[char], k: usize) -> usize {
    if h.get(k + 4) == Some(&'>') {
        return k + 5;
    }
    if h.get(k + 4) == Some(&'-') && h.get(k + 5) == Some(&'>') {
        return k + 6;
    }
    let mut d = k + 4;
    while d + 1 < h.len() {
        if h[d] == '-' && h[d + 1] == '-' {
            if h.get(d + 2) == Some(&'>') {
                return d + 3;
            }
            if h.get(d + 2) == Some(&'!') && h.get(d + 3) == Some(&'>') {
                return d + 4;
            }
        }
        d += 1;
    }
    h.len()
}

/// Just after a bogus comment that starts at `k` (`<!…>` other than a comment, `<?…>`, or `</`
/// not followed by a letter): at the first `>`, as the HTML tokenizer ends it. `</>` is nothing.
/// The length when it has no end; `k` itself when there is none at `k`.
fn bogus_comment_end(h: &[char], k: usize) -> usize {
    let bogus = match h.get(k + 1) {
        Some('!' | '?') => true,
        Some('/') => h.get(k + 2).is_some_and(|c| !c.is_ascii_alphabetic()),
        _ => false,
    };
    if !bogus {
        return k;
    }
    (k + 2..h.len())
        .find(|&e| h[e] == '>')
        .map_or(h.len(), |e| e + 1)
}

/// Dropped elements that can nest, and `<table>`, inside which `</object>` is ignored.
const NESTING: &[&str] = &["template", "svg", "math", "object", "head", "table"];

/// Start tags that end SVG or MathML content (back to HTML), as the HTML parser lists them.
const BREAKOUT: &[&str] = &[
    "b",
    "big",
    "blockquote",
    "body",
    "br",
    "center",
    "code",
    "dd",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "hr",
    "i",
    "img",
    "li",
    "listing",
    "menu",
    "meta",
    "nobr",
    "ol",
    "p",
    "pre",
    "ruby",
    "s",
    "small",
    "span",
    "strong",
    "strike",
    "sub",
    "sup",
    "table",
    "tt",
    "u",
    "ul",
    "var",
];

/// HTML elements that cannot have content (beyond [`VOID`]).
const EMPTY_TOO: &[&str] = &["basefont", "bgsound", "frame", "keygen"];

/// An element open while a dropped element is skipped, and how its content is read (as `Open`
/// in `markdown-parse.ts`).
struct OpenEl {
    tag: String,
    /// Its namespace: "svg" or "math" for SVG and MathML elements, else "html".
    ns: &'static str,
    /// Whether its content is HTML: an HTML element, an SVG or MathML element whose content is
    /// HTML (`<foreignObject>`, `<mi>`, …), or one a tag such as `<p>` has closed for a browser.
    html: bool,
    /// Whether it is one of those SVG or MathML elements whose content is HTML.
    point: bool,
    /// Whether it or an element around it is one.
    in_point: bool,
}

/// Where a dropped element `name` that started before `i` ends: just after its end tag, or the
/// length when it has none, the way a browser ends it (as `droppedEnd` in `markdown-parse.ts`).
///
/// - A text element (`<style>`, `<textarea>`, …) ends at the first `</name` followed by
///   whitespace, `/` or `>`, so `</scripts>` inside it is still text.
/// - `<script>` too, except inside `<!--`, where a nested `<script>` needs its own `</script>`
///   first (the HTML tokenizer's escaped and double-escaped script states).
/// - Any other (`<template>`, `<svg>`, …) ends at the end tag that matches it. The elements in
///   it that can hide its end tag are followed: another of these (a nested `<name>` needs its
///   own `</name>` first), a `<table>`, every SVG and MathML element (closed as a browser
///   closes them, `/>` included), and the HTML elements inside an SVG or MathML element whose
///   content is HTML (`<foreignObject>`, `<mi>`, …). An end tag inside a comment, a CDATA
///   section, an attribute value or a nested text element is not one, and inside SVG or MathML
///   a `<script>` or `<style>` is not a text element until a tag such as `<p>` or `<b>` returns
///   to HTML.
///
/// Where a browser would end it sooner (an HTML tag inside `<svg>`, a `<head>` it ignores, an
/// end tag across an element still open), it is dropped to the later end, and an end tag inside
/// SVG or MathML that could close an element around it drops the rest of the text: never the
/// earlier end.
fn dropped_end(h: &[char], i: usize, name: &str) -> usize {
    let len = h.len();
    if name == "script" {
        return script_end(h, i);
    }
    if name == "plaintext" {
        return len;
    }
    if RAW_TEXT.contains(&name) {
        let mut from = i;
        while let Some(k) = find_at(h, from, "</") {
            if tag_name_at(h, k + 2, name) {
                return after_end_tag(h, k, name);
            }
            from = k + 2;
        }
        return len;
    }
    let ns_of = |tag: &str| if tag == "svg" { "svg" } else { "math" };
    let foreign = name == "svg" || name == "math";
    let mut open: Vec<OpenEl> = vec![OpenEl {
        tag: name.to_owned(),
        ns: if foreign { ns_of(name) } else { "html" },
        html: !foreign,
        point: false,
        in_point: false,
    }];
    // A tag that returns to HTML: the SVG and MathML elements still open are closed to a
    // browser, so what follows them is HTML (they stay here, so the drop still ends only at
    // their end tag).
    let break_out = |open: &mut Vec<OpenEl>| {
        for o in open.iter_mut().rev() {
            if o.html {
                break;
            }
            o.html = true;
        }
    };
    let letter = |k: usize| h.get(k).is_some_and(char::is_ascii_alphabetic);
    let mut j = i;
    while j < len {
        let Some(k) = (j..len).find(|&k| h[k] == '<') else {
            return len;
        };
        let top_html = open.last().is_none_or(|o| o.html);
        if h[k..].starts_with(&['<', '!', '-', '-']) {
            j = comment_end(h, k);
            continue;
        }
        // CDATA is text in SVG and MathML; in HTML it is a bogus comment, ended by `>`.
        if !top_html && h[k..].starts_with(&['<', '!', '[', 'C', 'D', 'A', 'T', 'A', '[']) {
            let Some(end) = find_at(h, k + 9, "]]>") else {
                return len;
            };
            j = end + 3;
            continue;
        }
        let bogus = bogus_comment_end(h, k);
        if bogus > k {
            j = bogus;
            continue;
        }
        let close = h.get(k + 1) == Some(&'/');
        let from = if close { k + 2 } else { k + 1 };
        if !letter(from) {
            j = k + 1;
            continue;
        }
        let e = tag_name_end(h, from);
        let tag: String = h[from..e].iter().map(char::to_ascii_lowercase).collect();
        let rest = scan_tag(h, e);
        if rest.end >= len {
            return len;
        }
        j = rest.end + 1;
        let (cur_html, cur_point, cur_tag_matches) = open
            .last()
            .map_or((true, false, false), |o| (o.html, o.point, o.tag == tag));
        if close {
            if !cur_html && !cur_point && (tag == "br" || tag == "p") {
                break_out(&mut open);
            }
            if open.last().is_some_and(|o| !o.html) {
                // SVG or MathML: the innermost open element of that name, as a browser closes
                // it, passing only SVG and MathML elements still open.
                let at = open.iter().rposition(|o| o.html || o.tag == tag);
                // None, and nothing in between: the end tag could close an element around it.
                let Some(at) = at else {
                    return len;
                };
                if open[at].html {
                    continue;
                }
                open.truncate(at);
            } else if cur_tag_matches {
                open.pop();
            } else {
                continue;
            }
            if open.is_empty() {
                return j;
            }
            continue;
        }
        if !cur_html
            && !cur_point
            && (BREAKOUT.contains(&tag.as_str())
                || (tag == "font"
                    && rest
                        .attrs
                        .iter()
                        .any(|(a, _)| matches!(a.as_str(), "color" | "face" | "size"))))
        {
            break_out(&mut open);
        }
        let (parent_html, parent_point, parent_ns, parent_in_point) =
            open.last().map_or((true, false, "html", false), |o| {
                (o.html, o.point, o.ns, o.in_point)
            });
        if tag == "svg" || tag == "math" {
            if !rest.self_closing {
                open.push(OpenEl {
                    ns: ns_of(&tag),
                    tag,
                    html: false,
                    point: false,
                    in_point: parent_in_point,
                });
            }
        } else if !parent_html && !parent_point {
            // SVG or MathML: every element is followed; those whose content is HTML are marked.
            if rest.self_closing {
                continue;
            }
            let encoding = rest
                .attrs
                .iter()
                .find(|(a, _)| a == "encoding")
                .map(|(_, v)| decode_entities(v).to_ascii_lowercase())
                .unwrap_or_default();
            let point = if parent_ns == "svg" {
                matches!(tag.as_str(), "foreignobject" | "desc" | "title")
            } else {
                matches!(tag.as_str(), "mi" | "mo" | "mn" | "ms" | "mtext")
                    || (tag == "annotation-xml"
                        && (encoding == "text/html" || encoding == "application/xhtml+xml"))
            };
            open.push(OpenEl {
                tag,
                ns: parent_ns,
                html: false,
                point,
                in_point: parent_in_point || point,
            });
        } else if RAW_TEXT.contains(&tag.as_str()) {
            j = dropped_end(h, j, &tag);
        } else if NESTING.contains(&tag.as_str())
            || (!VOID.contains(&tag.as_str())
                && !EMPTY_TOO.contains(&tag.as_str())
                && parent_in_point)
        {
            // Inside `<foreignObject>` and the like, an open HTML element hides its end tag.
            open.push(OpenEl {
                tag,
                ns: "html",
                html: true,
                point: false,
                in_point: parent_in_point,
            });
        }
    }
    len
}

/// Where a `<script>` that started before `i` ends. Its text ends at the first `</script`
/// followed by whitespace, `/` or `>`, except that after `<!--` (until `-->`) a `<script>`
/// opens a part that the next `</script>` only closes, as the HTML tokenizer's script states
/// read it: `<script><!--<script></script>x</script>` is one script.
fn script_end(h: &[char], i: usize) -> usize {
    let len = h.len();
    // 0: script data; 1: escaped (after `<!--`); 2: double escaped (after `<script>` there).
    let mut state = 0u8;
    let mut dashes = 0usize;
    let mut j = i;
    while j < len {
        let c = h[j];
        if state == 0 {
            if c == '<' && h.get(j + 1) == Some(&'/') && tag_name_at(h, j + 2, "script") {
                return after_end_tag(h, j, "script");
            }
            if h[j..].starts_with(&['<', '!', '-', '-']) {
                state = 1;
                dashes = 2;
                j += 4;
            } else {
                j += 1;
            }
            continue;
        }
        if c == '-' {
            dashes += 1;
            j += 1;
            continue;
        }
        if c == '>' && dashes >= 2 {
            state = 0;
            dashes = 0;
            j += 1;
            continue;
        }
        dashes = 0;
        if c != '<' {
            j += 1;
            continue;
        }
        let close = h.get(j + 1) == Some(&'/');
        if state == 1 && close && tag_name_at(h, j + 2, "script") {
            return after_end_tag(h, j, "script");
        }
        let from = if close { j + 2 } else { j + 1 };
        // `<script` (escaped) or `</script` (double escaped), then whitespace, `/` or `>`,
        // moves between the two; the letters and that character are text either way.
        if (state == 1) != close {
            let mut e = from;
            while e < len && h[e].is_ascii_alphabetic() {
                e += 1;
            }
            if e > from
                && matches!(
                    h.get(e),
                    Some('\t' | '\n' | '\u{c}' | '\r' | ' ' | '/' | '>')
                )
            {
                if h[from..e]
                    .iter()
                    .map(char::to_ascii_lowercase)
                    .eq("script".chars())
                {
                    state = 3 - state;
                }
                j = e + 1;
            } else {
                j = e;
            }
            continue;
        }
        j = from;
    }
    len
}

fn read_html(html: &str) -> Vec<RichNode> {
    let h: Vec<char> = html.chars().collect();
    let len = h.len();
    let lower =
        |a: usize, b: usize| -> String { h[a..b].iter().map(char::to_ascii_lowercase).collect() };
    let letter = |k: usize| h.get(k).is_some_and(char::is_ascii_alphabetic);
    let mut stack: Vec<Open> = vec![("#root".into(), Vec::new(), Vec::new())];
    let mut text = String::new();
    let flush = |stack: &mut Vec<Open>, text: &mut String| {
        if !text.is_empty() {
            let t = decode_entities(text);
            stack
                .last_mut()
                .expect("the root")
                .2
                .push(RichNode::Text(t));
            text.clear();
        }
    };
    let mut i = 0;
    while i < len {
        let c = h[i];
        if c == '<' && h[i..].starts_with(&['<', '!', '-', '-']) {
            flush(&mut stack, &mut text);
            i = comment_end(&h, i);
            continue;
        }
        // `<!DOCTYPE …>`, `<?…>`, `</ …>`: bogus comments a browser does not show.
        if c == '<' && bogus_comment_end(&h, i) > i {
            flush(&mut stack, &mut text);
            i = bogus_comment_end(&h, i);
            continue;
        }
        if c == '<' && h.get(i + 1) == Some(&'/') && letter(i + 2) {
            flush(&mut stack, &mut text);
            let j = tag_name_end(&h, i + 2);
            let name = lower(i + 2, j);
            i = (scan_tag(&h, j).end + 1).min(len);
            if let Some(k) = (1..stack.len()).rev().find(|&k| stack[k].0 == name) {
                close_to(&mut stack, k);
            }
            continue;
        }
        if c == '<' && letter(i + 1) {
            flush(&mut stack, &mut text);
            let j = tag_name_end(&h, i + 1);
            let name = lower(i + 1, j);
            let tag = scan_tag(&h, j);
            // A tag cut off by the end of the text is not a tag, as in a browser.
            if tag.end >= len {
                break;
            }
            i = tag.end + 1;
            if DROP.contains(&name.as_str()) {
                // `<svg/>` and `<math/>` are empty; any other dropped element runs to its end tag.
                if !((name == "svg" || name == "math") && tag.self_closing) {
                    i = dropped_end(&h, i, &name);
                }
                continue;
            }
            let attrs: Vec<(String, String)> = tag
                .attrs
                .into_iter()
                .map(|(k, v)| (k, decode_entities(&v)))
                .collect();
            if CLOSES_P.contains(&name.as_str())
                && stack.len() > 1
                && stack[stack.len() - 1].0 == "p"
            {
                let top = stack.len() - 1;
                close_to(&mut stack, top);
            }
            if name == "li" {
                for k in (1..stack.len()).rev() {
                    let t = stack[k].0.as_str();
                    if t == "ul" || t == "ol" {
                        break;
                    }
                    if t == "li" {
                        close_to(&mut stack, k);
                        break;
                    }
                }
            }
            if VOID.contains(&name.as_str()) {
                stack.last_mut().expect("the root").2.push(RichNode::El {
                    tag: name,
                    attrs,
                    children: Vec::new(),
                });
            } else if stack.len() <= MAX_HTML_DEPTH {
                stack.push((name, attrs, Vec::new()));
            }
            continue;
        }
        text.push(c);
        i += 1;
    }
    flush(&mut stack, &mut text);
    close_to(&mut stack, 1);
    stack
        .pop()
        .map(|(_, _, children)| children)
        .unwrap_or_default()
}

fn text_of(n: &RichNode) -> String {
    match n {
        RichNode::Text(t) => t.clone(),
        RichNode::El { children, .. } => children.iter().map(text_of).collect(),
    }
}

/// An inline of rich text, or a line break before lines are split.
enum Piece {
    Inline(Inline),
    Break,
}

/// Wrap each break-separated run of `pieces` in a mark, keeping the breaks between them: a
/// break inside bold text splits the bold, so both lines stay bold.
fn wrap_runs(pieces: Vec<Piece>, wrap: &dyn Fn(Vec<Inline>) -> Inline, out: &mut Vec<Piece>) {
    let mut run = Vec::new();
    for p in pieces {
        match p {
            Piece::Break => {
                out.push(Piece::Inline(wrap(std::mem::take(&mut run))));
                out.push(Piece::Break);
            }
            Piece::Inline(x) => run.push(x),
        }
    }
    out.push(Piece::Inline(wrap(run)));
}

fn text_piece(v: &str) -> Piece {
    Piece::Inline(Inline::Text(v.to_owned()))
}

/// Where rich inlines are read: whether `<br>` breaks the line, and the marks already open.
#[derive(Clone, Copy)]
struct RichContext {
    breaks: bool,
    strong: bool,
    em: bool,
    link: bool,
}

const LINE: RichContext = RichContext {
    breaks: true,
    strong: false,
    em: false,
    link: false,
};
const ONE_LINE: RichContext = RichContext {
    breaks: false,
    ..LINE
};

/// A mark nested in a mark of the same kind adds nothing (bold inside bold is bold), so a
/// `<br>` splitting marks stays linear in the input.
fn rich_inlines(nodes: &[RichNode], policy: MarkdownLinks, ctx: RichContext) -> Vec<Piece> {
    let mut out = Vec::new();
    for n in nodes {
        let RichNode::El {
            tag,
            attrs,
            children,
        } = n
        else {
            if let RichNode::Text(t) = n {
                out.push(text_piece(t));
            }
            continue;
        };
        match tag.as_str() {
            "br" => out.push(if ctx.breaks {
                Piece::Break
            } else {
                text_piece(" ")
            }),
            "strong" | "b" => {
                let pieces = rich_inlines(
                    children,
                    policy,
                    RichContext {
                        strong: true,
                        ..ctx
                    },
                );
                if ctx.strong {
                    out.extend(pieces);
                } else {
                    wrap_runs(pieces, &Inline::Strong, &mut out);
                }
            }
            "em" | "i" => {
                let pieces = rich_inlines(children, policy, RichContext { em: true, ..ctx });
                if ctx.em {
                    out.extend(pieces);
                } else {
                    wrap_runs(pieces, &Inline::Em, &mut out);
                }
            }
            "code" => out.push(Piece::Inline(Inline::Code(collapse_html_ws(&text_of(n))))),
            "a" => {
                let href = if ctx.link {
                    None
                } else {
                    let raw = attrs
                        .iter()
                        .find(|(k, _)| k == "href")
                        .map_or("", |(_, v)| v.as_str());
                    safe_link(raw, policy)
                };
                let pieces = rich_inlines(children, policy, RichContext { link: true, ..ctx });
                match href {
                    Some(MarkdownHref { href, title }) => wrap_runs(
                        pieces,
                        &|c| Inline::Link {
                            href: href.clone(),
                            title: title.clone(),
                            children: c,
                        },
                        &mut out,
                    ),
                    None => out.extend(pieces),
                }
            }
            t if BLOCKISH.contains(&t) => {
                out.push(text_piece(" "));
                out.extend(rich_inlines(children, policy, ctx));
                out.push(text_piece(" "));
            }
            _ => out.extend(rich_inlines(children, policy, ctx)),
        }
    }
    out
}

/// Whitespace as a browser shows it: HTML whitespace runs as one space, none after a space,
/// none at the start; non-breaking spaces kept.
fn normalize(items: Vec<Inline>, space: &mut bool) -> Vec<Inline> {
    let mut out: Vec<Inline> = Vec::new();
    for x in items {
        match x {
            Inline::Text(v) => {
                let mut v = collapse_html_ws(&v);
                if *space && v.starts_with(' ') {
                    v.remove(0);
                }
                if v.is_empty() {
                    continue;
                }
                *space = v.ends_with(' ');
                if let Some(Inline::Text(last)) = out.last_mut() {
                    last.push_str(&v);
                } else {
                    out.push(Inline::Text(v));
                }
            }
            Inline::Code(v) => {
                if v.is_empty() {
                    continue;
                }
                *space = false;
                out.push(Inline::Code(v));
            }
            Inline::Strong(c) => {
                let c = normalize(c, space);
                if !c.is_empty() {
                    out.push(Inline::Strong(c));
                }
            }
            Inline::Em(c) => {
                let c = normalize(c, space);
                if !c.is_empty() {
                    out.push(Inline::Em(c));
                }
            }
            Inline::Link {
                href,
                title,
                children,
            } => {
                let c = normalize(children, space);
                if !c.is_empty() {
                    out.push(Inline::Link {
                        href,
                        title,
                        children: c,
                    });
                }
            }
        }
    }
    out
}

/// Drop trailing whitespace from the end of a line, into its marks.
fn trim_end(mut items: Vec<Inline>) -> Vec<Inline> {
    while let Some(last) = items.last_mut() {
        let keep = match last {
            Inline::Text(v) => {
                if v.ends_with(' ') {
                    v.pop();
                }
                !v.is_empty()
            }
            Inline::Code(_) => true,
            Inline::Strong(c) | Inline::Em(c) | Inline::Link { children: c, .. } => {
                *c = trim_end(std::mem::take(c));
                !c.is_empty()
            }
        };
        if keep {
            break;
        }
        items.pop();
    }
    items
}

fn to_lines(pieces: Vec<Piece>) -> Vec<Vec<Inline>> {
    let mut lines = Vec::new();
    let mut cur = Vec::new();
    let mut end = |cur: &mut Vec<Inline>| {
        let mut space = true;
        let line = trim_end(normalize(std::mem::take(cur), &mut space));
        if !line.is_empty() {
            lines.push(line);
        }
    };
    for p in pieces {
        match p {
            Piece::Break => end(&mut cur),
            Piece::Inline(x) => cur.push(x),
        }
    }
    end(&mut cur);
    lines
}

fn to_line(nodes: &[RichNode], policy: MarkdownLinks) -> Option<Vec<Inline>> {
    to_lines(rich_inlines(nodes, policy, ONE_LINE))
        .into_iter()
        .next()
}

/// `<ol start>`, when it is a plain number (as a Markdown list's first number is).
fn list_start(attrs: &[(String, String)]) -> u32 {
    let raw = attrs
        .iter()
        .find(|(k, _)| k == "start")
        .map_or("", |(_, v)| trim_ws(v));
    if (1..=9).contains(&raw.len()) && raw.chars().all(|c| c.is_ascii_digit()) {
        raw.parse().unwrap_or(1)
    } else {
        1
    }
}

/// A rich-text `<ul>` or `<ol>`: each `<li>` is one line (its paragraphs joined), and a list
/// directly inside it stays a nested list, up to `MAX_NESTING` deep (deeper ones join the line).
fn rich_list(el: &RichNode, policy: MarkdownLinks, depth: usize) -> Option<List> {
    let RichNode::El {
        tag,
        attrs,
        children,
    } = el
    else {
        return None;
    };
    let mut items = Vec::new();
    for li in children {
        let RichNode::El {
            tag: t,
            children: c,
            ..
        } = li
        else {
            continue;
        };
        if t != "li" {
            continue;
        }
        // The item's text up to its first nested list is its line; a nested list and any text
        // after it follow in document order, so `a<ul>…</ul>c` keeps `c` after the list.
        let mut pieces = Vec::new();
        let mut line: Option<Vec<Inline>> = None;
        let mut nested_yet = false;
        let mut subs: Vec<ListChild> = Vec::new();
        let end_run = |pieces: &mut Vec<Piece>,
                       nested_yet: bool,
                       line: &mut Option<Vec<Inline>>,
                       subs: &mut Vec<ListChild>| {
            let l = to_lines(std::mem::take(pieces)).into_iter().next();
            if !nested_yet {
                *line = l;
            } else if let Some(l) = l {
                subs.push(ListChild::Lines(vec![l]));
            }
        };
        for node in c {
            let nested = matches!(node, RichNode::El { tag, .. } if tag == "ul" || tag == "ol");
            if nested && depth + 1 < MAX_NESTING {
                if let Some(sub) = rich_list(node, policy, depth + 1) {
                    end_run(&mut pieces, nested_yet, &mut line, &mut subs);
                    nested_yet = true;
                    subs.push(ListChild::List(sub));
                }
            } else {
                pieces.extend(rich_inlines(std::slice::from_ref(node), policy, ONE_LINE));
            }
        }
        end_run(&mut pieces, nested_yet, &mut line, &mut subs);
        if line.is_some() || !subs.is_empty() {
            items.push(ListItem {
                lines: line.into_iter().collect(),
                children: subs,
            });
        }
    }
    if items.is_empty() {
        return None;
    }
    let ordered = tag == "ol";
    Some(List {
        ordered,
        start: if ordered { list_start(attrs) } else { 1 },
        items,
    })
}

fn rich_blocks(nodes: &[RichNode], policy: MarkdownLinks, out: &mut Vec<Block>) {
    let mut pending: Vec<&RichNode> = Vec::new();
    let flush = |pending: &mut Vec<&RichNode>, out: &mut Vec<Block>| {
        let mut pieces = Vec::new();
        for n in pending.drain(..) {
            pieces.extend(rich_inlines(std::slice::from_ref(n), policy, LINE));
        }
        let lines = to_lines(pieces);
        if !lines.is_empty() {
            out.push(Block::Paragraph(lines));
        }
    };
    for n in nodes {
        let RichNode::El { tag, children, .. } = n else {
            pending.push(n);
            continue;
        };
        let tag = tag.as_str();
        if tag == "ul" || tag == "ol" {
            flush(&mut pending, out);
            if let Some(list) = rich_list(n, policy, 0) {
                out.push(Block::List(list));
            }
        } else if tag.len() == 2 && tag.starts_with('h') && matches!(tag.as_bytes()[1], b'1'..=b'6')
        {
            flush(&mut pending, out);
            if let Some(line) = to_line(children, policy) {
                out.push(Block::Heading {
                    level: tag.as_bytes()[1] - b'0',
                    children: line,
                });
            }
        } else if tag == "pre" {
            flush(&mut pending, out);
            let all = text_of(n);
            let t = all.strip_prefix('\n').unwrap_or(&all);
            let t = t.strip_suffix('\n').unwrap_or(t);
            if !trim_ws(t).is_empty() {
                out.push(Block::Code {
                    lang: String::new(),
                    text: t.to_owned(),
                });
            }
        } else if tag == "hr" {
            flush(&mut pending, out);
            out.push(Block::Rule);
        } else if tag == "p" {
            flush(&mut pending, out);
            let lines = to_lines(rich_inlines(children, policy, LINE));
            if !lines.is_empty() {
                out.push(Block::Paragraph(lines));
            }
        } else if tag == "blockquote" {
            flush(&mut pending, out);
            let mut inner = Vec::new();
            rich_blocks(children, policy, &mut inner);
            if !inner.is_empty() {
                out.push(Block::Quote(inner));
            }
        } else if CONTAINERS.contains(&tag) {
            flush(&mut pending, out);
            rich_blocks(children, policy, out);
        } else {
            pending.push(n);
        }
    }
    flush(&mut pending, out);
}

/// Rich text (an editor's HTML) as blocks, as `richTextBlocks` in `markdown-parse.ts` reads it.
#[must_use]
pub fn rich_text_blocks(html: &str, policy: MarkdownLinks) -> Vec<Block> {
    let mut out = Vec::new();
    rich_blocks(&read_html(html), policy, &mut out);
    out
}

/// Whether text reads as rich text: it holds an editor's block or inline tags.
#[must_use]
pub fn looks_like_rich_text(text: &str) -> bool {
    const TAGS: &[&str] = &[
        "p",
        "br",
        "div",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "span",
        "a",
        "blockquote",
        "pre",
        "code",
    ];
    let c: Vec<char> = text.chars().collect();
    let Some(last_gt) = c.iter().rposition(|&x| x == '>') else {
        return false;
    };
    (0..c.len()).any(|i| {
        if c[i] != '<' {
            return false;
        }
        let from = if c.get(i + 1) == Some(&'/') {
            i + 2
        } else {
            i + 1
        };
        let n = c[from.min(c.len())..]
            .iter()
            .take_while(|x| x.is_ascii_alphanumeric())
            .count();
        let name: String = c[from..from + n]
            .iter()
            .collect::<String>()
            .to_ascii_lowercase();
        n > 0
            && TAGS.contains(&name.as_str())
            && c.get(from + n) != Some(&'_')
            && last_gt >= from + n
    })
}

/// The tree for a renderer's props: rich text read as rich text where `from` asks.
#[must_use]
pub fn markdown_blocks(content: &str, links: MarkdownLinks, from: MarkdownSource) -> Vec<Block> {
    let rich = match from {
        MarkdownSource::Markdown => false,
        MarkdownSource::Html => true,
        MarkdownSource::Auto => looks_like_rich_text(content),
    };
    if rich {
        rich_text_blocks(content, links)
    } else {
        parse_markdown(content, links)
    }
}

// ─── Rendering ──────────────────────────────────────────────────────────────────────────────

fn render_inlines(c: &[Inline]) -> Element {
    rsx! {
        for x in c.iter() {
            {render_inline(x)}
        }
    }
}

fn render_inline(x: &Inline) -> Element {
    match x {
        Inline::Text(v) => rsx! { "{v}" },
        Inline::Code(v) => rsx! { code { class: classes::CODE, "{v}" } },
        Inline::Strong(c) => rsx! { strong { {render_inlines(c)} } },
        Inline::Em(c) => rsx! { em { {render_inlines(c)} } },
        Inline::Link {
            href,
            title,
            children,
        } => {
            if is_external(href) {
                rsx! {
                    a {
                        href: "{href}",
                        title: "{title}",
                        class: classes::A,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        {render_inlines(children)}
                    }
                }
            } else {
                rsx! { a { href: "{href}", title: "{title}", class: classes::A, {render_inlines(children)} } }
            }
        }
    }
}

fn render_lines(lines: &[Vec<Inline>]) -> Element {
    rsx! {
        for (j, l) in lines.iter().enumerate() {
            if j > 0 {
                br {}
            }
            {render_inlines(l)}
        }
    }
}

fn render_list_child(child: &ListChild) -> Element {
    match child {
        ListChild::List(sub) => render_list(sub, true),
        ListChild::Lines(lines) => render_lines(lines),
    }
}

fn render_list(list: &List, nested: bool) -> Element {
    let class = match (list.ordered, nested) {
        (true, false) => classes::OL.to_owned(),
        (true, true) => format!("{} {}", classes::OL, classes::NESTED),
        (false, false) => classes::UL.to_owned(),
        (false, true) => format!("{} {}", classes::UL, classes::NESTED),
    };
    let items = rsx! {
        for it in list.items.iter() {
            li {
                {render_lines(&it.lines)}
                for sub in it.children.iter() {
                    {render_list_child(sub)}
                }
            }
        }
    };
    if !list.ordered {
        rsx! { ul { class, {items} } }
    } else if list.start == 1 {
        rsx! { ol { class, {items} } }
    } else {
        let start = list.start.to_string();
        rsx! { ol { class, start, {items} } }
    }
}

fn render_heading(level: u8, c: &[Inline]) -> Element {
    let inner = render_inlines(c);
    let class = classes::H[usize::from(level.clamp(1, 6)) - 1];
    match level {
        1 => rsx! { h1 { class, {inner} } },
        2 => rsx! { h2 { class, {inner} } },
        3 => rsx! { h3 { class, {inner} } },
        4 => rsx! { h4 { class, {inner} } },
        5 => rsx! { h5 { class, {inner} } },
        _ => rsx! { h6 { class, {inner} } },
    }
}

fn render_blocks(blocks: &[Block], heading_base: u8) -> Element {
    rsx! {
        for b in blocks.iter() {
            {render_block(b, heading_base)}
        }
    }
}

fn render_block(b: &Block, heading_base: u8) -> Element {
    match b {
        Block::Paragraph(lines) => rsx! { p { class: classes::P, {render_lines(lines)} } },
        Block::Heading { level, children } => {
            render_heading(heading_level(*level, heading_base), children)
        }
        Block::List(list) => render_list(list, false),
        Block::Quote(children) => rsx! {
            blockquote { class: classes::QUOTE, {render_blocks(children, heading_base)} }
        },
        Block::Code { lang, text } => {
            if lang.is_empty() {
                rsx! { pre { class: classes::PRE, code { "{text}" } } }
            } else {
                rsx! { pre { class: classes::PRE, code { "data-language": "{lang}", "{text}" } } }
            }
        }
        Block::Rule => rsx! { hr { class: classes::HR } },
        Block::Table { align, head, rows } => {
            let col = |k: usize| align.get(k).copied().flatten();
            rsx! {
                div { class: classes::TABLE_WRAP,
                    table { class: classes::TABLE,
                        thead {
                            tr {
                                for (k, cell) in head.iter().enumerate() {
                                    th { scope: "col", class: cell_class(classes::TH, col(k)), {render_inlines(cell)} }
                                }
                            }
                        }
                        tbody {
                            for row in rows.iter() {
                                tr {
                                    for (k, cell) in row.iter().enumerate() {
                                        td { class: cell_class(classes::TD, col(k)), {render_inlines(cell)} }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`MarkdownRenderer`].
#[derive(Props, Clone, PartialEq)]
pub struct MarkdownRendererProps {
    /// The Markdown to show. Untrusted text is fine: it is never parsed as HTML.
    #[props(into)]
    pub content: String,
    /// Which link addresses are kept.
    #[props(default)]
    pub links: MarkdownLinks,
    /// What `content` is: Markdown, or an editor's HTML read into Markdown first.
    #[props(default)]
    pub from: MarkdownSource,
    /// The heading level a `#` heading renders at (1–6).
    #[props(default = 1)]
    pub heading_base: u8,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// Markdown, parsed into a typed tree and rendered as elements.
#[component]
pub fn MarkdownRenderer(props: MarkdownRendererProps) -> Element {
    let blocks = markdown_blocks(&props.content, props.links, props.from);
    rsx! {
        div {
            "data-slot": "markdown-renderer",
            "data-portal": "https://mzizi.dev/components/markdown-renderer",
            class: join(classes::ROOT, &props.class),
            ..props.attributes,
            {render_blocks(&blocks, props.heading_base)}
        }
    }
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/markdown-renderer.contract.json`, the one contract the Astro, React and Rust
/// builds share: edit the contract file, never this copy.
pub const CONTRACT: &str = r#"contract
  slot is "markdown-renderer"
  portal is "https://mzizi.dev/components/markdown-renderer"
  class contains "text-foreground"
  when default shows h1 "Field notes"
  when default shows strong "mzizi"
  when default shows em "one"
  when default shows blockquote "A quote with"
  when default shows th "Name"
  when default shows pre "const ok = 1 < 2"
  when xss shows p "<img src=x onerror=alert(1)>"
  when xss shows td "<script>alert(4)</script>"
  when xss shows p "<script>alert(6)</script>"
  when xss shows p "js tab split data vb"
  when base shows h3 "Section"
  when base shows h6 "Deep"
  when rich shows strong "now"
  when rich shows p "Plan now"
  when titles shows p "look-alike loud notes mail"
end"#;

#[cfg(test)]
mod tests {
    use super::*;

    fn t(v: &str) -> Inline {
        Inline::Text(v.to_owned())
    }

    fn p(lines: Vec<Vec<Inline>>) -> Block {
        Block::Paragraph(lines)
    }

    fn items(xs: &[&str]) -> Vec<ListItem> {
        xs.iter()
            .map(|x| ListItem {
                lines: vec![vec![t(x)]],
                children: Vec::new(),
            })
            .collect()
    }

    // The cases of the Toddle extension's `flag-text.test.ts`, which this component replaces.

    #[test]
    fn one_line_is_one_paragraph() {
        assert_eq!(
            parse_markdown("Sits at the front.", MarkdownLinks::Safe),
            vec![p(vec![vec![t("Sits at the front.")]])]
        );
    }

    #[test]
    fn line_breaks_are_kept_and_blank_lines_split_paragraphs() {
        assert_eq!(
            parse_markdown(
                "First line\r\nSecond line\n\n  \nNew paragraph",
                MarkdownLinks::Safe
            ),
            vec![
                p(vec![vec![t("First line")], vec![t("Second line")]]),
                p(vec![vec![t("New paragraph")]]),
            ]
        );
    }

    #[test]
    fn headings_and_lists() {
        assert_eq!(
            parse_markdown(
                "## Plan\n- water bottle\n* extra time\n1. step one\n2) step two\nAfter",
                MarkdownLinks::Safe
            ),
            vec![
                Block::Heading {
                    level: 2,
                    children: vec![t("Plan")]
                },
                Block::List(List {
                    ordered: false,
                    start: 1,
                    items: items(&["water bottle", "extra time"])
                }),
                Block::List(List {
                    ordered: true,
                    start: 1,
                    items: items(&["step one", "step two"])
                }),
                p(vec![vec![t("After")]]),
            ]
        );
    }

    #[test]
    fn text_that_mentions_angle_brackets_is_text() {
        assert_eq!(
            parse_markdown("Score < 5 or > 9", MarkdownLinks::Safe),
            vec![p(vec![vec![t("Score < 5 or > 9")]])]
        );
    }

    #[test]
    fn raw_html_stays_text() {
        assert_eq!(
            parse_markdown("<img src=x onerror=alert(1)>", MarkdownLinks::Safe),
            vec![p(vec![vec![t("<img src=x onerror=alert(1)>")]])]
        );
    }

    #[test]
    fn whitespace_only_is_nothing() {
        assert_eq!(parse_markdown("  \n \n", MarkdownLinks::Safe), Vec::new());
    }

    #[test]
    fn bold_italic_code() {
        assert_eq!(
            parse_inlines(
                "**Epi-pen** in *bag*, code `B12`, _quiet_",
                MarkdownLinks::Safe
            ),
            vec![
                Inline::Strong(vec![t("Epi-pen")]),
                t(" in "),
                Inline::Em(vec![t("bag")]),
                t(", code "),
                Inline::Code("B12".into()),
                t(", "),
                Inline::Em(vec![t("quiet")]),
            ]
        );
    }

    #[test]
    fn https_policy_keeps_only_https_links_and_the_words_of_the_rest() {
        assert_eq!(
            parse_inlines(
                "[plan](https://example.org/p) and [x](javascript:alert`1`) and [y](http://plain.example)",
                MarkdownLinks::Https
            ),
            vec![
                Inline::Link {
                    href: "https://example.org/p".into(),
                    title: "https://example.org/p".into(),
                    children: vec![t("plan")]
                },
                t(" and x and y"),
            ]
        );
    }

    #[test]
    fn unclosed_marks_and_snake_case_stay_text() {
        assert_eq!(
            parse_inlines("2 * 3 and file_name_here and **open", MarkdownLinks::Safe),
            vec![t("2 * 3 and file_name_here and **open")]
        );
    }

    // XSS payloads.

    #[test]
    fn hostile_addresses_are_refused() {
        for raw in [
            "javascript:alert(1)",
            "\tjavascript:alert(1)",
            "java\tscript:alert(1)",
            "JaVaScRiPt:alert(1)",
            " \u{1}javascript:alert(1)",
            "data:text/html;base64,PHNjcmlwdD4=",
            "vbscript:msgbox(1)",
            "<javascript:alert(1)>",
        ] {
            assert_eq!(safe_href(raw, MarkdownLinks::Safe), None, "{raw:?}");
        }
        for raw in [
            "https://x.org",
            "http://x.org",
            "mailto:a@b.c",
            "tel:+1",
            "/a",
            "#b",
            "?c",
            "d/e",
        ] {
            assert!(safe_href(raw, MarkdownLinks::Safe).is_some(), "{raw:?}");
        }
        assert_eq!(safe_href("/a", MarkdownLinks::Https), None);
        assert_eq!(safe_href("http://x.org", MarkdownLinks::Https), None);
        assert_eq!(
            safe_href("HTTPS://x.org", MarkdownLinks::Https).as_deref(),
            Some("HTTPS://x.org")
        );
    }

    #[test]
    fn html_in_a_table_cell_is_text() {
        let blocks = parse_markdown(
            "| a | b |\n| - | - |\n| <script>alert(1)</script> | <img src=x onerror=alert(2)> |",
            MarkdownLinks::Safe,
        );
        let Block::Table { rows, .. } = &blocks[0] else {
            panic!("not a table: {blocks:?}")
        };
        assert_eq!(rows[0][0], vec![t("<script>alert(1)</script>")]);
        assert_eq!(rows[0][1], vec![t("<img src=x onerror=alert(2)>")]);
    }

    #[test]
    fn nested_lists_quotes_code_and_tables() {
        let blocks = parse_markdown(
            "- a\n  - b\n    1. c\n- d\n\n> q1\n> - li\n\n```js\nx < 1\n```\n\n| A | B |\n|:-|-:|\n| x | **y** |\n\n---",
            MarkdownLinks::Safe,
        );
        assert_eq!(blocks.len(), 5, "{blocks:?}");
        let Block::List(list) = &blocks[0] else {
            panic!()
        };
        assert_eq!(list.items.len(), 2);
        let ListChild::List(b) = &list.items[0].children[0] else {
            panic!("not a list: {list:?}")
        };
        assert!(matches!(&b.items[0].children[0], ListChild::List(c) if c.ordered));
        assert!(matches!(&blocks[1], Block::Quote(children) if children.len() == 2));
        assert_eq!(
            blocks[2],
            Block::Code {
                lang: "js".into(),
                text: "x < 1".into()
            }
        );
        assert!(
            matches!(&blocks[3], Block::Table { align, .. } if align == &vec![Some(Align::Left), Some(Align::Right)])
        );
        assert_eq!(blocks[4], Block::Rule);
    }

    /// A named input and the size it is timed from: (what it is, n, the input at a size).
    type ScalingCase = (&'static str, usize, fn(usize) -> String);

    /// Linear time measured as scaling, not wall-clock (as `__tests__/helpers/linear-scaling.ts`):
    /// the work is timed at n, 2n and 4n, five rounds each with the order of the sizes rotating,
    /// and the median at 4n may cost at most 2.5 x 2.5 times the median at n (a quadratic costs
    /// 16 times). A busy host gets three attempts; a quadratic fails all three. The only absolute
    /// number is the hang guard: 30 s for one attempt.
    fn linear_violations(
        build: impl Fn(usize) -> String,
        run: impl Fn(&str),
        n: usize,
    ) -> Vec<String> {
        const LIMIT: f64 = 2.5;
        const RUNS: usize = 5;
        const SAMPLE: std::time::Duration = std::time::Duration::from_millis(15);
        const SLACK_MS: f64 = 1.0;
        const CEILING: std::time::Duration = std::time::Duration::from_secs(30);
        let sizes = [n, 2 * n, 4 * n];
        let inputs: Vec<String> = sizes.iter().map(|&size| build(size)).collect();
        let mut failures = Vec::new();
        for attempt in 1..=3 {
            let started = std::time::Instant::now();
            // Before every run, with that run's expected cost: a quadratic is stopped before the
            // run that would take it past the ceiling, not minutes after.
            let over = |next: std::time::Duration| started.elapsed() + next > CEILING;
            let hang = || {
                vec![format!(
                    "hang guard: would still be measuring after {CEILING:?} (sizes {sizes:?})"
                )]
            };
            // Warm up every size once, smallest first; each run may cost up to 4x the one before.
            let mut warm: Vec<std::time::Duration> = Vec::new();
            for input in &inputs {
                if over(warm.last().map_or(std::time::Duration::ZERO, |&d| d * 4)) {
                    return hang();
                }
                let t0 = std::time::Instant::now();
                run(input);
                warm.push(t0.elapsed());
            }
            let reps = (SAMPLE.as_secs_f64() / warm[0].as_secs_f64().max(1e-5))
                .ceil()
                .clamp(1.0, 1000.0) as usize;
            let mut samples = [Vec::new(), Vec::new(), Vec::new()];
            for round in 0..RUNS {
                for k in 0..sizes.len() {
                    let i = (round + k) % sizes.len();
                    let t0 = std::time::Instant::now();
                    for _ in 0..reps {
                        if over(warm[i]) {
                            return hang();
                        }
                        run(&inputs[i]);
                    }
                    samples[i].push(t0.elapsed().as_secs_f64() * 1000.0);
                }
            }
            let medians: Vec<f64> = samples
                .iter_mut()
                .map(|v| {
                    v.sort_by(f64::total_cmp);
                    v[v.len() / 2]
                })
                .collect();
            if medians[2] <= LIMIT * LIMIT * medians[0] + SLACK_MS {
                return Vec::new();
            }
            failures.push(format!(
                "attempt {attempt}: cost x{:.2} per doubling: n={}: {:.1} ms, n={}: {:.1} ms, n={}: {:.1} ms [{reps} run(s) per sample]",
                (medians[2] / medians[0].max(f64::EPSILON)).sqrt(),
                sizes[0],
                medians[0],
                sizes[1],
                medians[1],
                sizes[2],
                medians[2]
            ));
        }
        failures
    }

    #[test]
    fn hostile_inlines_parse_in_linear_time() {
        // Unmatched markers inside a bold run, a line of `[`, a long backtick run, and K markers
        // before L closers: each would be quadratic without the scan budget.
        let cases: [ScalingCase; 6] = [
            ("markers, brackets and backticks", 5_000, |n| {
                "*a ".repeat(n) + &"[".repeat(n) + &"`".repeat(n / 4)
            }),
            ("unmatched italics inside bold", 8_000, |n| {
                "**".to_owned() + &"*x ".repeat(n) + "y**"
            }),
            ("unmatched underscores inside bold", 8_000, |n| {
                "**".to_owned() + &"_x ".repeat(n) + "y**"
            }),
            ("unmatched bolds inside italic", 8_000, |n| {
                "*".to_owned() + &"**x ".repeat(n) + "y*"
            }),
            ("unmatched italics inside a link", 8_000, |n| {
                "[".to_owned() + &"*x ".repeat(n) + "](https://x.org)"
            }),
            ("K markers before L closers", 250_000, |n| {
                "**".to_owned() + &"*a ".repeat(n / 500) + "a" + &"*".repeat(n)
            }),
        ];
        for (say, n, build) in cases {
            let violations = linear_violations(
                build,
                |s| {
                    std::hint::black_box(parse_inlines(s, MarkdownLinks::Safe));
                },
                n,
            );
            assert!(violations.is_empty(), "{say}: {violations:#?}");
        }
    }

    #[test]
    fn hostile_rich_text_reads_in_linear_time() {
        let cases: [ScalingCase; 9] = [
            ("unclosed tags and comments", 5_000, |n| {
                "<a <b <p>x<!--".repeat(n)
            }),
            ("deep bold", 1_250, |n| "<b>".repeat(n) + "x"),
            ("spans closed by divs", 5_000, |n| {
                "<span>".repeat(n) + &"</div>".repeat(n)
            }),
            ("nested marks split at <br>", 10_000, |n| {
                "<b><i><a href=\"https://x.org\">".repeat(11) + &"x<br>".repeat(n)
            }),
            // Dropped elements: nested, full of comments, tags and attributes, or never closed.
            ("nested templates", 5_000, |n| {
                "<template>".to_owned() + &"<template><!-- x --><a title='>'>".repeat(n)
            }),
            ("comments in a paragraph", 12_500, |n| {
                "<p>".to_owned() + &"<!--x-->".repeat(n) + "</p>"
            }),
            ("bold in foreignObject", 12_500, |n| {
                "<svg><foreignObject>".to_owned() + &"<b>".repeat(n) + &"</svg>".repeat(n / 50)
            }),
            ("deep svg groups", 12_500, |n| {
                "<svg>".to_owned() + &"<g>".repeat(n) + &"</g>".repeat(n) + "</svg>x"
            }),
            ("script look-alikes", 12_500, |n| {
                "<script><!--<script>".to_owned() + &"</script>-".repeat(n)
            }),
        ];
        for (say, n, build) in cases {
            let violations = linear_violations(
                build,
                |s| {
                    std::hint::black_box(rich_text_blocks(s, MarkdownLinks::Safe));
                },
                n,
            );
            assert!(violations.is_empty(), "{say}: {violations:#?}");
        }
    }

    #[test]
    fn deciding_auto_is_linear() {
        let cases: [(ScalingCase, bool); 4] = [
            (("a run of `<`", 40_000, |n| "<".repeat(n)), false),
            (
                ("tag openers with no `>`", 40_000, |n| "<p ".repeat(n)),
                false,
            ),
            // A `>` first, then only tag openers: every candidate is read, none may rescan the rest.
            (
                ("tag openers after the only `>`", 40_000, |n| {
                    ">".to_owned() + &"<p ".repeat(n)
                }),
                false,
            ),
            (
                ("tag openers before the last `>`", 40_000, |n| {
                    "<p ".repeat(n) + ">"
                }),
                true,
            ),
        ];
        for ((say, n, build), rich) in cases {
            assert_eq!(looks_like_rich_text(&build(n)), rich, "{say}");
            let violations = linear_violations(
                build,
                |s| {
                    std::hint::black_box(looks_like_rich_text(s));
                },
                n,
            );
            assert!(violations.is_empty(), "{say}: {violations:#?}");
        }
    }

    #[test]
    fn huge_and_deep_rich_text_has_no_stack_overflow() {
        let _ = rich_text_blocks(&("<b>".repeat(5_000) + "x"), MarkdownLinks::Safe);
        let nested = "<b><i><a href=\"https://x.org\">".repeat(11) + &"x<br>".repeat(100_000);
        let blocks = rich_text_blocks(&nested, MarkdownLinks::Safe);
        let Block::Paragraph(lines) = &blocks[0] else {
            panic!("not a paragraph")
        };
        assert_eq!(lines.len(), 100_000);
        let deep = "<svg>".to_owned() + &"<g>".repeat(50_000) + &"</g>".repeat(50_000) + "</svg>x";
        assert!(!rich_text_blocks(&deep, MarkdownLinks::Safe).is_empty());
    }

    #[test]
    fn rendered_markup_has_no_html_from_the_source() {
        fn app() -> Element {
            rsx! {
                MarkdownRenderer {
                    content: "<script>alert(1)</script>\n\n[x](javascript:alert(2)) <img src=x onerror=alert(3)>"
                }
            }
        }
        let mut dom = VirtualDom::new(app);
        dom.rebuild_in_place();
        let html = dioxus_ssr::render(&dom);
        assert!(!html.contains("<script"), "{html}");
        assert!(!html.contains("<img"), "{html}");
        assert!(!html.contains("javascript:"), "{html}");
        // The text is there, escaped (dioxus-ssr writes numeric references).
        assert!(html.contains("&#60;script&#62;alert(1)"), "{html}");
    }

    #[test]
    fn a_link_title_is_its_address_normalised() {
        for (raw, title) in [
            (
                "https://\u{430}pple.com/login",
                "https://xn--pple-43d.com/login",
            ),
            (
                "HTTPS://Example.ORG/Docs?Q=A#X",
                "https://example.org/Docs?Q=A#X",
            ),
            ("//B\u{fc}cher.example/x", "//xn--bcher-kva.example/x"),
            ("https://EXAMPLE.org:8443/a", "https://example.org:8443/a"),
            ("https://0x7f.1/", "https://127.0.0.1/"),
            ("MAILTO:a@B.c", "mailto:a@b.c"),
            (
                "mailto:help@\u{430}pple.com",
                "mailto:help@xn--pple-43d.com",
            ),
            (
                "mailto:a@x.org,b@\u{430}.com?cc=c@\u{430}.com#x",
                "mailto:a@x.org,b@xn--80a.com?cc=c@\u{430}.com#x",
            ),
            ("mailto:Someone", "mailto:Someone"),
            ("tel:+263-77-000", "tel:+263-77-000"),
            ("https://example.com:65535/a", "https://example.com:65535/a"),
            ("https://example.com:/a", "https://example.com:/a"),
            ("//Example.com:0443/", "//example.com:0443/"),
            ("https://[::1]:8080/", "https://[::1]:8080/"),
            ("/Rel/Path", "/Rel/Path"),
        ] {
            assert_eq!(
                safe_link(raw, MarkdownLinks::Safe),
                Some(MarkdownHref {
                    href: raw.to_owned(),
                    title: title.to_owned()
                }),
                "{raw:?}"
            );
        }
        for raw in [
            "https://a<b/",
            "https://1.2.3.999/",
            "//:80/x",
            "https://ex%2Fa/",
        ] {
            assert_eq!(safe_link(raw, MarkdownLinks::Safe), None, "{raw:?}");
        }
    }

    #[test]
    fn a_port_must_be_a_number_up_to_65535() {
        for raw in [
            "https://example.com:abc/",
            "https://example.com:99999/",
            "https://example.com:65536/",
            "https://example.com:-1/",
            "https://example.com:1e3/",
            "//example.com:8a/",
        ] {
            // The url crate refuses them, as new URL() does.
            if !raw.starts_with("//") {
                assert!(url::Url::parse(raw).is_err(), "{raw:?}");
            }
            assert_eq!(safe_link(raw, MarkdownLinks::Safe), None, "{raw:?}");
        }
    }

    #[test]
    fn a_mailto_domain_the_url_parser_rejects_is_refused() {
        for raw in [
            "mailto:a@",
            "mailto:a@b<c.com",
            "mailto:a@1.2.3.999",
            "mailto:x@b.com,y@[1.2.3.4]",
        ] {
            assert_eq!(safe_link(raw, MarkdownLinks::Safe), None, "{raw:?}");
        }
    }

    #[test]
    fn a_closer_inside_a_mark_is_found_after_a_full_search_found_none() {
        assert_eq!(
            parse_inlines("*x **a *b***", MarkdownLinks::Safe),
            vec![
                t("*x "),
                Inline::Strong(vec![t("a "), Inline::Em(vec![t("b")])])
            ]
        );
        assert_eq!(
            parse_inlines("*a* b *c **d *e***", MarkdownLinks::Safe),
            vec![
                Inline::Em(vec![t("a")]),
                t(" b *c "),
                Inline::Strong(vec![t("d "), Inline::Em(vec![t("e")])])
            ]
        );
    }

    #[test]
    fn a_trailing_backslash_on_the_last_line_is_text() {
        assert_eq!(
            parse_markdown("Save it to C:\\", MarkdownLinks::Safe),
            vec![p(vec![vec![t("Save it to C:\\")]])]
        );
        assert_eq!(
            parse_markdown("a\\\nb", MarkdownLinks::Safe),
            vec![p(vec![vec![t("a")], vec![t("b")]])]
        );
    }

    #[test]
    fn a_link_address_is_not_cut_at_other_whitespace_or_a_control_character() {
        // CommonMark keeps a no-break space in the address; an address with whitespace in it
        // is refused, as before, rather than linked to the part before the space.
        for ws in [
            "\u{a0}", "\u{2000}", "\u{200a}", "\u{3000}", "\u{1}", "\u{b}", "\u{7f}",
        ] {
            assert_eq!(
                parse_inlines(&format!("[a](https://x.com/a{ws}b)"), MarkdownLinks::Safe),
                vec![t("a")],
                "{ws:?}"
            );
        }
        assert_eq!(
            parse_inlines("[a](\u{a0}https://x.com)", MarkdownLinks::Safe),
            vec![t("a")]
        );
    }

    #[test]
    fn a_link_address_ends_at_whitespace_and_its_escapes_are_undone() {
        let link = |href: &str| {
            vec![Inline::Link {
                href: href.into(),
                title: href.into(),
                children: vec![t("a")],
            }]
        };
        assert_eq!(
            parse_inlines("[a](http://x.com\t\"title\")", MarkdownLinks::Safe),
            link("http://x.com")
        );
        assert_eq!(
            parse_inlines("[a](http://x.com/\\(y\\))", MarkdownLinks::Safe),
            link("http://x.com/(y)")
        );
    }

    #[test]
    fn a_dropped_element_ends_only_at_its_own_end_tag() {
        assert_eq!(
            rich_text_blocks(
                "<p>a</p><script>var s=\"</scripts>\"; secret()</script><p>b</p>",
                MarkdownLinks::Safe
            ),
            vec![p(vec![vec![t("a")]]), p(vec![vec![t("b")]])]
        );
    }

    #[test]
    fn a_dropped_element_ends_where_a_browser_ends_it() {
        for dropped in [
            "<template><template></template>secret</template>",
            "<svg><svg></svg>secret</svg>",
            "<math><math></math>secret</math>",
            "<template><!-- </template> -->secret</template>",
            "<template><a title=\"</template>\">secret</template>",
            "<template><script>\"</template>\"</script>secret</template>",
            "<template></ x </template>secret</template>",
            "<svg><![CDATA[</svg>]]>secret</svg>",
            "<svg><foreignObject><b></svg>secret</b></foreignObject></svg>",
            "<svg><b><iframe></svg>secret</iframe></svg>",
            "<script><!--<script></script>secret</script>",
            "<script>x</script a=\">secret\">",
            "<!-- --!><script>x-->secret</script>",
        ] {
            assert_eq!(
                rich_text_blocks(&format!("<p>a</p>{dropped}<p>b</p>"), MarkdownLinks::Safe),
                vec![p(vec![vec![t("a")]]), p(vec![vec![t("b")]])],
                "{dropped:?}"
            );
        }
    }

    #[test]
    fn comments_a_doctype_and_tags_are_read_as_a_browser_reads_them() {
        assert_eq!(
            rich_text_blocks(
                "<!DOCTYPE html><p>a</p><!--><p>b</p><?xml x?><p>c</p><svg/><p>d</p><p><svg-x>e</svg-x></p>",
                MarkdownLinks::Safe
            ),
            ["a", "b", "c", "d", "e"]
                .iter()
                .map(|v| p(vec![vec![t(v)]]))
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn text_after_a_nested_list_stays_after_it() {
        assert_eq!(
            rich_text_blocks(
                "<ul><li>a<ul><li>b</li></ul>c</li></ul>",
                MarkdownLinks::Safe
            ),
            vec![Block::List(List {
                ordered: false,
                start: 1,
                items: vec![ListItem {
                    lines: vec![vec![t("a")]],
                    children: vec![
                        ListChild::List(List {
                            ordered: false,
                            start: 1,
                            items: items(&["b"]),
                        }),
                        ListChild::Lines(vec![vec![t("c")]]),
                    ],
                }],
            })]
        );
    }

    #[test]
    fn a_link_shows_its_normalised_address_on_hover() {
        fn app() -> Element {
            rsx! { MarkdownRenderer { content: "[look-alike](https://\u{430}pple.com/login)" } }
        }
        let mut dom = VirtualDom::new(app);
        dom.rebuild_in_place();
        let html = dioxus_ssr::render(&dom);
        assert!(
            html.contains("title=\"https://xn--pple-43d.com/login\""),
            "{html}"
        );
    }
}
