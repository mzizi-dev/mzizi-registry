// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/markdown-renderer.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MARKDOWN RENDERER — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/markdown-renderer.contract.json`, beside
//! `markdown-renderer.astro` and `markdown-renderer.tsx` (which share `markdown-parse.ts`).
//!
//! Safe by construction. The Markdown is parsed into a typed tree ([`Block`], [`Inline`]) and
//! the tree is rendered as Dioxus elements, so every piece of text is a text node and every
//! address an attribute, both escaped by the renderer. There is no HTML string and no
//! `dangerous_inner_html`. Raw HTML in the source is text. Links pass [`safe_href`], an
//! allow-list of schemes; a refused link keeps its words and loses its address.
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
    /// `[words](address)`, the address already checked by [`safe_href`].
    Link {
        /// The kept address.
        href: String,
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

/// A list item: its lines (a hard break apart) and the lists nested under it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListItem {
    /// The item's lines.
    pub lines: Vec<Vec<Inline>>,
    /// Lists nested under the item.
    pub children: Vec<List>,
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

/// The address to put in an `href`, or `None` when it is refused.
///
/// Tabs and newlines anywhere, and C0 controls and spaces at either end, are removed first
/// (browsers ignore them, so `\tjavascript:` is `javascript:` to them). Then the scheme is
/// checked against an allow-list. Under [`MarkdownLinks::Safe`] an address with no scheme is
/// kept; under [`MarkdownLinks::Https`] only `https:` is.
#[must_use]
pub fn safe_href(raw: &str, policy: MarkdownLinks) -> Option<String> {
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
    // A web address needs a host and no credentials (`https://bank.example@evil.example`
    // shows one site and goes to another); so does a scheme-relative `//host` address.
    let rest = match scheme.as_deref() {
        Some(name @ ("http" | "https")) => Some(&url[name.len() + 1..]),
        // Browsers read `\` as `/` here, so `\\host` and `/\host` are scheme-relative too.
        None if scheme_relative(url) => Some(url),
        _ => None,
    };
    if let Some(rest) = rest {
        if !web_authority_ok(rest) {
            return None;
        }
    }
    Some(url.to_owned())
}

/// Two slashes, either way round: a browser reads `\\host`, `/\host` and `//host` alike.
fn scheme_relative(url: &str) -> bool {
    let b = url.as_bytes();
    b.len() >= 2 && matches!(b[0], b'/' | b'\\') && matches!(b[1], b'/' | b'\\')
}

/// `//host…`: a host is there, and no `user@` before it.
fn web_authority_ok(rest: &str) -> bool {
    if !scheme_relative(rest) {
        return false;
    }
    let after = &rest[2..];
    let authority = after.split(['/', '?', '#', '\\']).next().unwrap_or("");
    !authority.is_empty() && !authority.contains('@')
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
    no_closer: Vec<(char, usize)>,
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
            no_closer: Vec::new(),
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
        if self.no_closer.contains(&(c, n)) {
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
        if to == self.s.len() {
            self.no_closer.push((c, n));
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
                    let href = if in_link {
                        None
                    } else {
                        safe_href(&link.dest, self.policy)
                    };
                    match href {
                        Some(href) => {
                            flush(&mut out, &mut buf);
                            out.push(Inline::Link {
                                href,
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
        let inside: String = self.s[label_end + 2..k].iter().collect();
        let inside = inside.trim_start_matches([' ', '\t', '\n']);
        let dest = if inside.starts_with('<') && inside.contains('>') {
            inside[..=inside.find('>').unwrap_or(0)].to_owned()
        } else {
            inside.split([' ', '\n']).next().unwrap_or("").to_owned()
        };
        Some(LinkAt {
            label_end,
            dest,
            end: k + 1,
        })
    }
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
            let mut para = Vec::new();
            while i < lines.len()
                && !blank(&lines[i])
                && (para.is_empty() || !starts_block(lines, i))
            {
                let t = trim_ws(&lines[i]);
                para.push(self.inl(t.strip_suffix('\\').unwrap_or(t)));
                i += 1;
            }
            out.push(Block::Paragraph(para));
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
                    .push(list),
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

fn read_html(html: &str) -> Vec<RichNode> {
    let h: Vec<char> = html.chars().collect();
    let len = h.len();
    let find = |from: usize, pat: char| (from..len).find(|&k| h[k] == pat);
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
            i = (i + 4..len)
                .find(|&k| h[k..].starts_with(&['-', '-', '>']))
                .map_or(len, |e| e + 3);
            continue;
        }
        if c == '<' && h.get(i + 1) == Some(&'/') && letter(i + 2) {
            flush(&mut stack, &mut text);
            let mut j = i + 2;
            while j < len && h[j].is_ascii_alphanumeric() {
                j += 1;
            }
            let name = lower(i + 2, j);
            i = find(j, '>').map_or(len, |e| e + 1);
            if let Some(k) = (1..stack.len()).rev().find(|&k| stack[k].0 == name) {
                close_to(&mut stack, k);
            }
            continue;
        }
        if c == '<' && letter(i + 1) {
            flush(&mut stack, &mut text);
            let mut j = i + 1;
            while j < len && h[j].is_ascii_alphanumeric() {
                j += 1;
            }
            let name = lower(i + 1, j);
            let mut attrs: Vec<(String, String)> = Vec::new();
            while j < len && h[j] != '>' {
                if is_ws(h[j]) || h[j] == '/' {
                    j += 1;
                    continue;
                }
                let mut k = j;
                while k < len && !(is_ws(h[k]) || matches!(h[k], '/' | '>' | '=')) {
                    k += 1;
                }
                let key = lower(j, k);
                let mut value = String::new();
                while k < len && is_ws(h[k]) {
                    k += 1;
                }
                if h.get(k) == Some(&'=') {
                    k += 1;
                    while k < len && is_ws(h[k]) {
                        k += 1;
                    }
                    match h.get(k) {
                        Some(&q) if q == '"' || q == '\'' => {
                            let stop = find(k + 1, q).unwrap_or(len);
                            value = h[k + 1..stop].iter().collect();
                            k = stop + 1;
                        }
                        _ => {
                            let from = k;
                            while k < len && !(is_ws(h[k]) || h[k] == '>') {
                                k += 1;
                            }
                            value = h[from..k].iter().collect();
                        }
                    }
                }
                if !key.is_empty() && !attrs.iter().any(|(a, _)| *a == key) {
                    attrs.push((key, decode_entities(&value)));
                }
                j = k.max(j + 1);
            }
            i = j + 1;
            if DROP.contains(&name.as_str()) {
                if !VOID.contains(&name.as_str()) {
                    // `</name`, in any case.
                    let pat: Vec<char> = format!("</{name}").chars().collect();
                    let close = (i..len).find(|&k| {
                        k + pat.len() <= len
                            && h[k..k + pat.len()]
                                .iter()
                                .zip(&pat)
                                .all(|(a, b)| a.to_ascii_lowercase() == *b)
                    });
                    i = close.and_then(|c| find(c, '>')).map_or(len, |e| e + 1);
                }
                continue;
            }
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
                    safe_href(raw, policy)
                };
                let pieces = rich_inlines(children, policy, RichContext { link: true, ..ctx });
                match href {
                    Some(href) => wrap_runs(
                        pieces,
                        &|c| Inline::Link {
                            href: href.clone(),
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
            Inline::Link { href, children } => {
                let c = normalize(children, space);
                if !c.is_empty() {
                    out.push(Inline::Link { href, children: c });
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
        let mut pieces = Vec::new();
        let mut subs = Vec::new();
        for node in c {
            let nested = matches!(node, RichNode::El { tag, .. } if tag == "ul" || tag == "ol");
            if nested && depth + 1 < MAX_NESTING {
                if let Some(sub) = rich_list(node, policy, depth + 1) {
                    subs.push(sub);
                }
            } else {
                pieces.extend(rich_inlines(std::slice::from_ref(node), policy, ONE_LINE));
            }
        }
        let line = to_lines(pieces).into_iter().next();
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
        Inline::Link { href, children } => {
            if is_external(href) {
                rsx! {
                    a {
                        href: "{href}",
                        class: classes::A,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        {render_inlines(children)}
                    }
                }
            } else {
                rsx! { a { href: "{href}", class: classes::A, {render_inlines(children)} } }
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
                    {render_list(sub, true)}
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
        assert!(list.items[0].children[0].items[0].children[0].ordered);
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

    #[test]
    fn pathological_input_stays_fast() {
        // Unmatched markers inside a bold run, a line of `[`, a long backtick run, and
        // rich text full of unclosed tags: each would be quadratic without the scan budget.
        let inputs = [
            "*a ".repeat(20_000) + &"[".repeat(20_000) + &"`".repeat(5_000),
            "**".to_owned() + &"*x ".repeat(32_000) + "y**",
            "**".to_owned() + &"_x ".repeat(32_000) + "y**",
            "*".to_owned() + &"**x ".repeat(32_000) + "y*",
            "[".to_owned() + &"*x ".repeat(32_000) + "](https://x.org)",
        ];
        for s in &inputs {
            let started = std::time::Instant::now();
            let _ = parse_inlines(s, MarkdownLinks::Safe);
            assert!(
                started.elapsed().as_secs() < 2,
                "took {:?}",
                started.elapsed()
            );
        }
        let started = std::time::Instant::now();
        let _ = rich_text_blocks(&"<a <b <p>x<!--".repeat(20_000), MarkdownLinks::Safe);
        let _ = rich_text_blocks(&("<b>".repeat(5_000) + "x"), MarkdownLinks::Safe);
        let nested = "<b><i><a href=\"https://x.org\">".repeat(11) + &"x<br>".repeat(100_000);
        let blocks = rich_text_blocks(&nested, MarkdownLinks::Safe);
        let Block::Paragraph(lines) = &blocks[0] else {
            panic!("not a paragraph")
        };
        assert_eq!(lines.len(), 100_000);
        let _ = rich_text_blocks(
            &("<span>".repeat(20_000) + &"</div>".repeat(20_000)),
            MarkdownLinks::Safe,
        );
        let k_by_l = "**".to_owned() + &"*a ".repeat(2_000) + "a" + &"*".repeat(1_000_000);
        let _ = parse_inlines(&k_by_l, MarkdownLinks::Safe);
        let _ = looks_like_rich_text(&"<".repeat(50_000));
        assert!(
            started.elapsed().as_secs() < 2,
            "took {:?}",
            started.elapsed()
        );
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
}
