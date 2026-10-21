/**
 * MARKDOWN PARSE — the framework-free half of `markdown-renderer` (contracts/ui/markdown-renderer).
 *
 * Markdown in, a typed tree out. Nothing here builds HTML: the `.astro` and `.tsx` builds
 * draw the tree as elements, so every piece of text reaches the page as a text node and every
 * address as an attribute the framework escapes. The Rust build (`markdown-renderer.rs`)
 * implements the same parser, rule for rule; its tests run the same cases.
 *
 * - Blocks: paragraphs (every line break kept as a hard break), ATX headings, bulleted and
 *   numbered lists (nested by indentation), blockquotes, fenced code, horizontal rules and
 *   GFM tables.
 * - Inlines: code spans, links, **bold**, *italic* / _italic_, backslash escapes. A marker
 *   with no partner stays text, and so does `snake_case`.
 * - Raw HTML is text. A `<script>` in the source is shown, never parsed.
 * - Links pass `safeLink`: an allow-list of schemes, a host and no credentials. A refused link
 *   keeps its words and loses its address; a kept one carries the address normalised for a
 *   reader (scheme and host lower-cased, the host as punycode) for its `title`.
 * - Rich-text HTML (from editors that store HTML) is read into the same tree by
 *   `richTextBlocks`, a reader that builds plain data and never a DOM, so nothing in it runs.
 */

/** Inline content, as data. */
export type MarkdownInline =
  | { t: "text"; v: string }
  | { t: "strong"; c: MarkdownInline[] }
  | { t: "em"; c: MarkdownInline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; title: string; c: MarkdownInline[] };

/** A table column's alignment, from its delimiter row. */
export type MarkdownAlign = "left" | "center" | "right" | null;

/**
 * A list item: its lines (each a hard break apart), then what follows them inside the item:
 * nested lists and, in rich text, lines after a nested list, in document order.
 */
export interface MarkdownListItem {
  lines: MarkdownInline[][];
  children: MarkdownListChild[];
}

/** What sits inside a list item after its lines: a nested list, or more lines. */
export type MarkdownListChild =
  MarkdownList | { kind: "lines"; lines: MarkdownInline[][] };

/** A bulleted or numbered list. */
export type MarkdownList =
  | { kind: "ul"; items: MarkdownListItem[] }
  | { kind: "ol"; start: number; items: MarkdownListItem[] };

/** A block, as data. */
export type MarkdownBlock =
  | { kind: "p"; lines: MarkdownInline[][] }
  | { kind: "h"; level: 1 | 2 | 3 | 4 | 5 | 6; c: MarkdownInline[] }
  | MarkdownList
  | { kind: "quote"; children: MarkdownBlock[] }
  | { kind: "code"; lang: string; v: string }
  | { kind: "hr" }
  | {
      kind: "table";
      align: MarkdownAlign[];
      head: MarkdownInline[][];
      rows: MarkdownInline[][][];
    };

/**
 * Which link addresses are kept. `safe`: http, https, mailto, tel and relative addresses.
 * `https`: https only.
 */
export type MarkdownLinkPolicy = "safe" | "https";

/**
 * What `content` is. `markdown`; `html`, rich text read by `richTextBlocks`; `auto`, rich
 * text when it holds an editor's block or inline tags, Markdown otherwise.
 */
export type MarkdownSource = "markdown" | "html" | "auto";

export interface MarkdownOptions {
  links?: MarkdownLinkPolicy;
  from?: MarkdownSource;
}

/** How deep blockquotes and lists nest before deeper ones are read flat. */
export const MAX_NESTING = 8;
/** How deep inline marks nest before deeper markers are read as text. */
const MAX_INLINE_DEPTH = 16;
/** How far a link's label and address are looked for (keeps a line of `[` linear). */
const MAX_LABEL = 1000;
const MAX_DEST = 2048;
/**
 * The scanning budget of one inline parse: steps spent looking for a closing marker or a
 * link's end, at most `BUDGET_BASE + BUDGET_PER_CHAR` × the text's length. Ordinary text uses
 * a small fraction; hostile text (thousands of unmatched markers inside one bold run) would
 * otherwise rescan its range once per marker. When it runs out, every marker still looking
 * for its partner reads as text, so the work stays linear in the input.
 */
const BUDGET_BASE = 100_000;
const BUDGET_PER_CHAR = 32;

// ─── Classes ──────────────────────────────────────────────────────────────────────────────
//
// One table of classes for the Astro and React builds; the Rust build carries the same
// strings and `tests/contract.rs` checks they match. Colour is tokens only.

export const MARKDOWN_CLASSES = {
  root: "text-sm leading-relaxed text-foreground",
  p: "leading-7 [&:not(:first-child)]:mt-4",
  h1: "font-serif text-3xl font-bold tracking-tight mt-8 mb-4 first:mt-0",
  h2: "font-serif text-2xl font-semibold tracking-tight mt-6 mb-3 first:mt-0",
  h3: "font-serif text-xl font-semibold mt-5 mb-2 first:mt-0",
  h4: "text-lg font-semibold mt-4 mb-2 first:mt-0",
  h5: "text-base font-semibold mt-3 mb-1 first:mt-0",
  h6: "text-sm font-semibold mt-3 mb-1 first:mt-0 text-muted-foreground",
  ul: "my-4 list-disc space-y-1 pl-6",
  ol: "my-4 list-decimal space-y-1 pl-6",
  nested: "mt-1 mb-0",
  quote: "my-4 border-l-4 border-border pl-4 italic text-muted-foreground",
  pre: "my-4 overflow-x-auto rounded-[var(--radius-xl,17px)] bg-muted/50 p-4 font-mono text-sm",
  code: "rounded-[var(--radius-md,12px)] bg-muted px-1.5 py-0.5 font-mono text-sm",
  a: "text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  hr: "my-6 border-border",
  tableWrap: "my-4 w-full overflow-x-auto",
  table: "w-full border-collapse text-sm",
  th: "border border-border px-3 py-2 font-medium",
  td: "border border-border px-3 py-2",
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/** The class for a cell with this alignment (left when none is given). */
export function cellClass(part: "th" | "td", align: MarkdownAlign): string {
  return `${MARKDOWN_CLASSES[part]} ${MARKDOWN_CLASSES[align ?? "left"]}`;
}

/** The heading tag for a Markdown level, shifted by `headingBase` and capped at h6. */
export function headingTag(
  level: number,
  headingBase = 1,
): "h1" | "h2" | "h3" | "h4" | "h5" | "h6" {
  const base = Number.isFinite(headingBase)
    ? Math.min(Math.max(Math.trunc(headingBase), 1), 6)
    : 1;
  const n = Math.min(level + base - 1, 6);
  return `h${n}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

// ─── Links ────────────────────────────────────────────────────────────────────────────────

const SAFE_SCHEMES = ["http", "https", "mailto", "tel"];

/** A kept link address: its `href`, and the address a reader is shown (its `title`). */
export interface MarkdownHref {
  /** The address as written (tabs, newlines and outer `<…>` removed). */
  href: string;
  /**
   * The address normalised for reading: scheme and host lower-cased and the host in ASCII, so
   * an internationalised host shows as punycode (`https://аpple.com` → `https://xn--pple-43d.com`)
   * and a look-alike cannot pass for the site it imitates. The rest is as written.
   */
  title: string;
}

/**
 * The address to put in an `href` and the one to show on hover, or null when it is refused.
 *
 * Browsers drop tabs and newlines anywhere in a URL and C0 controls and spaces at either
 * end, so `\tjavascript:` and `java\nscript:` are `javascript:` to them: those characters
 * are removed first. An address with other whitespace still in it is refused, and so is a web
 * address with no host, with credentials (`https://bank.example@evil.example`), with a host
 * the URL parser rejects or with a port that is not a number up to 65535. Then the scheme is
 * checked against an allow-list, never a deny-list (`javascript:`, `vbscript:`, `data:` and
 * the next one are refused alike). Under `safe` an address with no scheme (relative,
 * root-relative, `#anchor`, `?query`) is kept; under `https` only `https:` is. A `mailto:`
 * address's domains are shown as web hosts are (an IDN as punycode), and one the URL parser
 * rejects is refused.
 */
export function safeLink(
  raw: string,
  policy: MarkdownLinkPolicy = "safe",
): MarkdownHref | null {
  let url = raw.replace(/[\t\n\r]/g, "");
  let start = 0;
  let end = url.length;
  while (start < end && url.charCodeAt(start) <= 0x20) start++;
  while (end > start && url.charCodeAt(end - 1) <= 0x20) end--;
  url = url.slice(start, end);
  if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1);
  if (url === "") return null;
  // An address with whitespace or a control character left in it (even just inside `<…>`,
  // where `<\u0001javascript:…>` would otherwise read as scheme-less) is not one address.
  for (const c of url)
    if (isWs(c) || c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f)
      return null;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  const name = scheme ? (scheme[1] ?? "").toLowerCase() : null;
  if (
    policy === "https"
      ? name !== "https"
      : name !== null && !SAFE_SCHEMES.includes(name)
  )
    return null;
  // The scheme, lower-cased, starts what a reader is shown.
  const shown = name === null ? "" : `${name}:`;
  // A web address needs a host and no credentials: `https://bank.example@evil.example` shows
  // one site and goes to another. The same holds for a scheme-relative `//host` address.
  // Browsers read `\` as `/` here, so `\\host` and `/\host` are scheme-relative too.
  const rest =
    name === "http" || name === "https"
      ? url.slice(name.length + 1)
      : name === null && SCHEME_RELATIVE.test(url)
        ? url
        : null;
  if (rest === null) {
    const after = url.slice(shown.length);
    const title = name === "mailto" ? mailtoTitle(after) : after;
    return title === null ? null : { href: url, title: shown + title };
  }
  const authority = webAuthority(rest);
  if (authority === null) return null;
  const host = asciiHost(authority.host);
  if (host === null) return null;
  return {
    href: url,
    title:
      shown + rest.slice(0, 2) + host + rest.slice(2 + authority.host.length),
  };
}

/** The address to put in an `href`, or null when it is refused (`safeLink`'s `href`). */
export function safeHref(
  raw: string,
  policy: MarkdownLinkPolicy = "safe",
): string | null {
  return safeLink(raw, policy)?.href ?? null;
}

/** Two slashes, either way round: a browser reads `\\host`, `/\host` and `//host` alike. */
const SCHEME_RELATIVE = /^[/\\]{2}/;

/**
 * `//host[:port]…`: the host, when there is one, with no `user@` before it and no port the URL
 * parser rejects (anything but ASCII digits, or a number above 65535; an empty port is
 * allowed, as the parser allows it). The host ends at the first `:` outside `[…]` (an IPv6
 * address), as the URL parser reads it.
 */
function webAuthority(rest: string): { host: string } | null {
  if (!SCHEME_RELATIVE.test(rest)) return null;
  let end = 2;
  while (end < rest.length && !"/?#\\".includes(rest.charAt(end))) end++;
  const authority = rest.slice(2, end);
  if (authority === "" || authority.includes("@")) return null;
  let bracket = false;
  let k = 0;
  for (; k < authority.length; k++) {
    const c = authority.charAt(k);
    if (c === "[") bracket = true;
    else if (c === "]") bracket = false;
    else if (c === ":" && !bracket) break;
  }
  const port = authority.slice(k + 1);
  if (!/^[0-9]*$/.test(port) || Number(port) > 0xffff) return null;
  return { host: authority.slice(0, k) };
}

/**
 * A `mailto:` address as a reader is shown it: the domain of each address (after its last
 * `@`, up to `,`, `?` or `#`) as the URL parser writes a host, so `help@аpple.com` (a Cyrillic
 * `а`) shows as `help@xn--pple-43d.com`. The rest is as written. Null when a domain is
 * rejected.
 */
function mailtoTitle(after: string): string | null {
  const stop = after.search(/[?#]/);
  const end = stop < 0 ? after.length : stop;
  const to: string[] = [];
  for (const address of after.slice(0, end).split(",")) {
    const at = address.lastIndexOf("@");
    if (at < 0) {
      to.push(address);
      continue;
    }
    const host = asciiHost(address.slice(at + 1));
    if (host === null) return null;
    to.push(address.slice(0, at + 1) + host);
  }
  return to.join(",") + after.slice(end);
}

/**
 * A host as the URL parser serialises it (the WHATWG URL `hostname`): lower-cased, an
 * internationalised name as punycode, an IPv4 address in dotted decimal. Null when the parser
 * rejects it (empty, a forbidden character, a bad IP address), since no browser could follow
 * the link either. A character that would end the host inside `http://…/` (`/ ? # \ @`, a `:`
 * outside `[…]`, a space or a control character) is refused first, so the answer is the host
 * step's alone, as `url::Host::parse` gives it in the Rust build.
 *
 * Without a `URL` global (every browser, Node, Deno and Workers has one), `plainHost` keeps
 * only the hosts whose serialisation it can write exactly, so a kept link has the same title
 * in every runtime.
 */
function asciiHost(host: string): string | null {
  if (host === "") return null;
  for (const c of host) {
    const code = c.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || "/?#\\@".includes(c)) return null;
  }
  if (host.includes(":") && !(host.startsWith("[") && host.endsWith("]")))
    return null;
  if (typeof URL !== "function") return plainHost(host);
  try {
    return new URL(`http://${host}/`).hostname;
  } catch {
    return null;
  }
}

/**
 * The URL parser's answer for a host made only of ASCII letters, digits and `-` in non-empty
 * dot-separated labels (and at most one trailing dot), or null for any other host. Such a name
 * is only lower-cased, except that a name ending in a number is an IPv4 address (kept only in
 * canonical dotted decimal, `1.2.3.4`) and an `xn--` label must decode as punycode (refused).
 */
function plainHost(host: string): string | null {
  const name = host.toLowerCase();
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.?$/.test(name)) return null;
  const labels = name.split(".");
  if (labels[labels.length - 1] === "") labels.pop();
  if (labels.some((l) => l.startsWith("xn--"))) return null;
  if (!/^(?:[0-9]+|0x[0-9a-f]*)$/.test(labels[labels.length - 1] ?? ""))
    return name;
  const canonical =
    labels.length === 4 &&
    !name.endsWith(".") &&
    labels.every((l) => /^(?:0|[1-9][0-9]{0,2})$/.test(l) && Number(l) <= 255);
  return canonical ? name : null;
}

/** Whether a kept address leaves the site (it opens in a new tab). */
export function isExternal(href: string): boolean {
  return /^https?:/i.test(href) || SCHEME_RELATIVE.test(href);
}

// ─── Whitespace ───────────────────────────────────────────────────────────────────────────
//
// Defined once, as a fixed set, so the TypeScript and Rust builds agree on every character
// (JavaScript's `\s` and Rust's `char::is_whitespace` differ on U+0085 and U+FEFF).

const WS = new Set([
  // One UTF-16 unit each, so split("") is exact here.
  ..."\t\n\v\f\r \u0085\u00a0\u1680\u2028\u2029\u202f\u205f\u3000\ufeff".split(
    "",
  ),
  ...Array.from({ length: 11 }, (_, k) => String.fromCharCode(0x2000 + k)),
]);

/** Whether a character is whitespace. */
export const isWs = (c: string | undefined): boolean =>
  c !== undefined && WS.has(c);

/** Whitespace off both ends. */
export function trimWs(s: string): string {
  let a = 0;
  let b = s.length;
  while (a < b && WS.has(s.charAt(a))) a++;
  while (b > a && WS.has(s.charAt(b - 1))) b--;
  return s.slice(a, b);
}

/** How many whitespace characters a line starts with. */
const leadingWs = (s: string): number => {
  let n = 0;
  while (n < s.length && WS.has(s.charAt(n))) n++;
  return n;
};

/** HTML's collapsible whitespace (tab, newline, form feed, carriage return, space); a
    non-breaking space is not collapsible, as in a browser. */
const HTML_WS = new Set(["\t", "\n", "\f", "\r", " "]);

/** Every run of HTML whitespace as one space. */
export function collapseHtmlWs(s: string): string {
  let out = "";
  let space = false;
  for (const c of s) {
    if (HTML_WS.has(c)) {
      if (!space) out += " ";
      space = true;
    } else {
      out += c;
      space = false;
    }
  }
  return out;
}

// ─── Inlines ──────────────────────────────────────────────────────────────────────────────

const PUNCT = new Set(Array.from("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"));
const isSpace = (c: string | undefined) => c === undefined || isWs(c);
/** A word character: Unicode Alphabetic or Number, as Rust's `char::is_alphanumeric`. */
const isWord = (c: string | undefined) =>
  c !== undefined && /[\p{Alphabetic}\p{N}]/u.test(c);

class InlineParser {
  private readonly s: string[];
  private readonly policy: MarkdownLinkPolicy;
  /**
   * Per delimiter (`*` × 1, `_` × 2, …), the earliest position a search to the end of the text
   * started from and found no partner (keeps scans linear). A later search to the end that
   * starts at or after it finds none either: it walks the same runs, escapes and code spans
   * from there on, with fewer candidates. A search that stops short of the end (inside a mark
   * or a link's words) is never answered from here, since its closer can sit where a longer
   * run was measured before.
   */
  private readonly noCloserFrom = new Map<string, number>();
  private readonly codeEnds = new Map<number, number | null>();
  /** Backtick run lengths with no partner after some run start (none after a later one). */
  private readonly unpaired = new Set<number>();
  private budget: number;

  constructor(s: string[], policy: MarkdownLinkPolicy) {
    this.s = s;
    this.policy = policy;
    this.budget = BUDGET_BASE + BUDGET_PER_CHAR * s.length;
  }

  /** The run of `c` at `i`, stopping at `to`; its length is charged to the budget. */
  private run(i: number, c: string, to: number): number {
    let n = 0;
    while (i + n < to && this.s[i + n] === c) n++;
    this.budget -= n;
    return n;
  }

  /** Past a code span opening at `j` (a backtick run with a partner), or null. */
  private spanEnd(j: number): number | null {
    const s = this.s;
    const n = this.run(j, "`", s.length);
    for (let k = j + n; k < s.length;) {
      if (--this.budget < 0) return null;
      if (s[k] === "`") {
        const m = this.run(k, "`", s.length);
        if (m === n) return k + m;
        k += m;
      } else k++;
    }
    return null;
  }

  /** `codeSpanEnd`, remembered per position, so no backtick run is measured twice. */
  private codeEnd(j: number): number | null {
    let end = this.codeEnds.get(j);
    if (end === undefined) {
      const atStart = this.s[j - 1] !== "`";
      const n = this.run(j, "`", this.s.length);
      end = atStart && this.unpaired.has(n) ? null : this.spanEnd(j);
      if (end === null && atStart) this.unpaired.add(n);
      this.codeEnds.set(j, end);
    }
    return end;
  }

  /** Find the closer of an emphasis run of `n` × `c`, scanning [from, to). */
  private closer(
    c: string,
    n: number,
    from: number,
    to: number,
  ): number | null {
    const s = this.s;
    const key = `${c}${n}`;
    const toEnd = to === s.length;
    const known = this.noCloserFrom.get(key);
    if (toEnd && known !== undefined && from >= known) return null;
    for (let j = from; j < to;) {
      if (--this.budget < 0) return null;
      const ch = s[j];
      if (ch === "\\") {
        j += 2;
        continue;
      }
      if (ch === "`") {
        j = this.codeEnd(j) ?? j + this.run(j, "`", to);
        continue;
      }
      if (ch === c) {
        const run = this.run(j, c, to);
        // A single marker closes only on a single marker: `**` inside `*…*` is a nested bold.
        if (run >= n && (n > 1 || run === 1)) {
          // The closer: `n` markers, not after whitespace, not before a word for `_`.
          const at = run === n ? j : j + run - n;
          const before = s[at - 1];
          const after = s[at + n];
          if (at > from && !isSpace(before) && !(c === "_" && isWord(after)))
            return at;
        }
        j += run;
        continue;
      }
      j++;
    }
    if (toEnd && (known === undefined || from < known))
      this.noCloserFrom.set(key, from);
    return null;
  }

  parse(
    from: number,
    to: number,
    depth: number,
    inLink: boolean,
  ): MarkdownInline[] {
    const s = this.s;
    const out: MarkdownInline[] = [];
    let buf = "";
    const flush = () => {
      if (!buf) return;
      const last = out[out.length - 1];
      if (last?.t === "text") last.v += buf;
      else out.push({ t: "text", v: buf });
      buf = "";
    };
    const pushAll = (xs: MarkdownInline[]) => {
      for (const x of xs) {
        if (x.t === "text") buf += x.v;
        else {
          flush();
          out.push(x);
        }
      }
    };
    let i = from;
    while (i < to) {
      const ch = s[i];
      if (ch === "\\" && i + 1 < to && PUNCT.has(s[i + 1] ?? "")) {
        buf += s[i + 1];
        i += 2;
        continue;
      }
      if (ch === "`") {
        const n = this.run(i, "`", s.length);
        const end = this.codeEnd(i);
        if (end !== null && end <= to) {
          flush();
          let v = s.slice(i + n, end - n).join("");
          if (
            v.length > 1 &&
            v.startsWith(" ") &&
            v.endsWith(" ") &&
            trimWs(v) !== ""
          )
            v = v.slice(1, -1);
          out.push({ t: "code", v });
          i = end;
        } else {
          buf += "`".repeat(n);
          i += n;
        }
        continue;
      }
      if (ch === "[" && depth < MAX_INLINE_DEPTH) {
        const link = this.link(i, to);
        if (link) {
          const label = this.parse(i + 1, link.labelEnd, depth + 1, true);
          const kept = inLink ? null : safeLink(link.dest, this.policy);
          if (kept !== null) {
            flush();
            out.push({
              t: "link",
              href: kept.href,
              title: kept.title,
              c: label,
            });
          } else pushAll(label);
          i = link.end;
          continue;
        }
      }
      if ((ch === "*" || ch === "_") && depth < MAX_INLINE_DEPTH) {
        const run = this.run(i, ch, to);
        const opens = !isSpace(s[i + run]) && !(ch === "_" && isWord(s[i - 1]));
        if (opens) {
          let done = false;
          for (const n of [3, 2, 1]) {
            if (n > run) continue;
            const close = this.closer(ch, n, i + n, to);
            if (close === null) continue;
            const literal = ch.repeat(run - n);
            buf += literal;
            flush();
            const inner = this.parse(i + run, close, depth + 1, inLink);
            if (n === 3) out.push({ t: "strong", c: [{ t: "em", c: inner }] });
            else out.push({ t: n === 2 ? "strong" : "em", c: inner });
            i = close + n;
            done = true;
            break;
          }
          if (done) continue;
        }
        buf += ch.repeat(run);
        i += run;
        continue;
      }
      buf += ch;
      i++;
    }
    flush();
    return out;
  }

  /** A link at `i`: `[label](dest "title")`, with balanced brackets and parentheses. */
  private link(
    i: number,
    to: number,
  ): { labelEnd: number; dest: string; end: number } | null {
    const s = this.s;
    let depth = 0;
    let j = i;
    const labelTo = Math.min(to, i + MAX_LABEL);
    for (; j < labelTo; j++) {
      if (--this.budget < 0) return null;
      const ch = s[j];
      if (ch === "\\") {
        j++;
        continue;
      }
      if (ch === "`") {
        const end = this.codeEnd(j);
        j =
          (end !== null && end <= labelTo
            ? end
            : j + this.run(j, "`", labelTo)) - 1;
        continue;
      }
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (j >= labelTo || s[j + 1] !== "(") return null;
    const labelEnd = j;
    let parens = 0;
    let k = j + 2;
    const destTo = Math.min(to, k + MAX_DEST);
    for (; k < destTo; k++) {
      if (--this.budget < 0) return null;
      const ch = s[k];
      if (ch === "\\") {
        k++;
        continue;
      }
      if (ch === "(") parens++;
      else if (ch === ")") {
        if (parens === 0) break;
        parens--;
      }
    }
    if (k >= destTo) return null;
    // The address: `<…>`, or everything up to the first space or ASCII control character, as
    // CommonMark ends it (a tab or a line break ends it as a space does; what follows is a
    // title, which is dropped). Other whitespace, such as a no-break space, is part of the
    // address, and an address that runs into another control character is kept whole, so
    // `safeLink` refuses either rather than the link going to the part before it. Then
    // backslash escapes of ASCII punctuation are undone, as CommonMark reads them: `\(` is `(`
    // and `\\` is `\`.
    const inside = s.slice(labelEnd + 2, k).join("");
    let from = 0;
    while (from < inside.length && isDestSpace(inside.charAt(from))) from++;
    let dest = /^<[^>]*>/.exec(inside.slice(from))?.[0];
    if (dest === undefined) {
      let end = from;
      while (end < inside.length && !endsDest(inside.charCodeAt(end))) end++;
      dest =
        end === inside.length || isDestSpace(inside.charAt(end))
          ? inside.slice(from, end)
          : inside.slice(from);
    }
    return { labelEnd, dest: unescapePunct(dest), end: k + 1 };
  }
}

/** A space or an ASCII control character: what ends a link's address in CommonMark. */
const endsDest = (code: number): boolean => code <= 0x20 || code === 0x7f;

/** A space, a tab or a line break: what may come between a link's address and its title. */
const isDestSpace = (c: string): boolean =>
  c === " " || c === "\t" || c === "\n" || c === "\r";

/** Backslash escapes of ASCII punctuation undone (`\)` is `)`); any other backslash stays. */
function unescapePunct(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    const next = text.charAt(i + 1);
    if (c === "\\" && PUNCT.has(next)) {
      out += next;
      i++;
    } else out += c;
  }
  return out;
}

/** Inline Markdown as data. */
export function parseInlines(
  text: string,
  policy: MarkdownLinkPolicy = "safe",
): MarkdownInline[] {
  const s = Array.from(text);
  return new InlineParser(s, policy).parse(0, s.length, 0, false);
}

// ─── Blocks ───────────────────────────────────────────────────────────────────────────────

/** A fence line: its marker and its info word, or null. */
function fence(line: string): { mark: string; word: string } | null {
  const m = /^ {0,3}(`{3,}|~{3,})([^]*)$/.exec(line);
  if (!m || (m[2] ?? "").includes("`")) return null;
  const info = (m[2] ?? "").replace(/^[ \t]*/, "");
  let word = "";
  for (const c of info) {
    if (WS.has(c)) break;
    word += c;
  }
  return { mark: m[1] ?? "", word };
}
const HEADING_OPEN = /^ {0,3}(#{1,6})/;
const isSpaceOrTab = (c: string | undefined) => c === " " || c === "\t";
/* An ATX heading: [level marks, text], or null. What
   /^ {0,3}(#{1,6})[ \t]+([^]*?)(?:[ \t]+#+)?[ \t]*$/ matched, read in one pass: that
   expression backtracks quadratically on a long run of spaces. The text keeps any character
   (U+2028 and U+2029 too); a closing run of #s is dropped only after a space or tab, and a
   text of #s alone is kept. */
export function atxHeading(line: string): [string, string] | null {
  const open = HEADING_OPEN.exec(line);
  if (!open) return null;
  const rest = line.slice(open[0].length);
  let start = 0;
  while (start < rest.length && isSpaceOrTab(rest[start])) start++;
  if (start === 0) return null;
  let end = rest.length;
  while (end > start && isSpaceOrTab(rest[end - 1])) end--;
  let marks = end;
  while (marks > start && rest[marks - 1] === "#") marks--;
  if (marks < end) {
    let text = marks;
    while (text > start && isSpaceOrTab(rest[text - 1])) text--;
    if (text < marks) end = text;
  }
  return [open[1] ?? "#", rest.slice(start, end)];
}
const HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?([^]*)$/;
const LIST_ITEM = /^( *)([-*+•‣◦]|\d{1,9}[.)])[ \t]+([^]*)$/;
const DELIM_CELL = /^:?-+:?$/;

const blank = (line: string) => trimWs(line) === "";

/** Split a table row into its cells: outer pipes dropped, `\|` kept as a pipe. */
function cells(line: string): string[] {
  let row = trimWs(line);
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < row.length; i++) {
    if (row[i] === "\\" && row[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (row[i] === "|") {
      out.push(trimWs(cur));
      cur = "";
    } else cur += row[i];
  }
  out.push(trimWs(cur));
  return out;
}

function delimiterRow(line: string): MarkdownAlign[] | null {
  if (!line.includes("|") || !line.includes("-")) return null;
  const cs = cells(line);
  if (!cs.every((c) => DELIM_CELL.test(c))) return null;
  return cs.map((c) =>
    c.startsWith(":") && c.endsWith(":")
      ? "center"
      : c.endsWith(":")
        ? "right"
        : c.startsWith(":")
          ? "left"
          : null,
  );
}

function tableStarts(lines: string[], i: number): MarkdownAlign[] | null {
  const line = lines[i] ?? "";
  if (i + 1 >= lines.length || !line.includes("|")) return null;
  const align = delimiterRow(lines[i + 1] ?? "");
  return align && cells(line).length === align.length ? align : null;
}

/** Leading tabs as four spaces, so indentation reads one way. */
function untab(line: string): string {
  const m = /^[ \t]*/.exec(line)?.[0] ?? "";
  return m.includes("\t")
    ? m.replace(/\t/g, "    ") + line.slice(m.length)
    : line;
}

/**
 * Whether a list item (its marker and its text) may start a list that interrupts a paragraph:
 * as in CommonMark, only when it has text and, if numbered, is numbered 1, so
 * "1984. was a year" on a paragraph's second line stays text.
 */
const interrupts = (marker: string, text: string): boolean =>
  !blank(text) && (!/\d/.test(marker) || Number.parseInt(marker, 10) === 1);

/** Whether `line` starts a list (one that interrupts a paragraph, with `paragraph`). */
function listStarts(line: string, paragraph: boolean): boolean {
  const m = LIST_ITEM.exec(line);
  return m !== null && (!paragraph || interrupts(m[2] ?? "", m[3] ?? ""));
}

/** Whether line `i` starts a block; with `paragraph`, whether it ends the paragraph before it. */
function startsBlock(lines: string[], i: number, paragraph = false): boolean {
  const line = lines[i] ?? "";
  return (
    fence(line) !== null ||
    atxHeading(line) !== null ||
    HR.test(line) ||
    QUOTE.test(line) ||
    listStarts(line, paragraph) ||
    tableStarts(lines, i) !== null
  );
}

class BlockParser {
  private readonly policy: MarkdownLinkPolicy;

  constructor(policy: MarkdownLinkPolicy) {
    this.policy = policy;
  }

  private inl(text: string): MarkdownInline[] {
    return parseInlines(text, this.policy);
  }

  parse(lines: string[], depth: number): MarkdownBlock[] {
    const out: MarkdownBlock[] = [];
    const at = (k: number) => lines[k] ?? "";
    let i = 0;
    while (i < lines.length) {
      const line = at(i);
      if (blank(line)) {
        i++;
        continue;
      }
      const f = fence(line);
      if (f) {
        const mark = f.mark;
        const indent = leadingWs(line);
        const body: string[] = [];
        i++;
        while (i < lines.length) {
          const l = at(i);
          const t = trimWs(l);
          if (
            t.length >= mark.length &&
            t === mark.charAt(0).repeat(t.length) &&
            leadingWs(l) <= 3
          ) {
            i++;
            break;
          }
          body.push(l.replace(new RegExp(`^ {0,${indent}}`), ""));
          i++;
        }
        out.push({
          kind: "code",
          lang: f.word.replace(/[^A-Za-z0-9_+#.-]/g, "").slice(0, 32),
          v: body.join("\n"),
        });
        continue;
      }
      const heading = atxHeading(line);
      if (heading) {
        out.push({
          kind: "h",
          level: heading[0].length as 1 | 2 | 3 | 4 | 5 | 6,
          c: this.inl(heading[1]),
        });
        i++;
        continue;
      }
      if (HR.test(line)) {
        out.push({ kind: "hr" });
        i++;
        continue;
      }
      if (QUOTE.test(line)) {
        const inner: string[] = [];
        while (i < lines.length && QUOTE.test(at(i))) {
          inner.push(QUOTE.exec(at(i))?.[1] ?? "");
          i++;
        }
        if (depth + 1 >= MAX_NESTING)
          out.push({
            kind: "p",
            lines: inner
              .filter((l) => !blank(l))
              .map((l) => this.inl(trimWs(l))),
          });
        else
          out.push({ kind: "quote", children: this.parse(inner, depth + 1) });
        continue;
      }
      if (LIST_ITEM.test(line)) {
        i = this.list(lines, i, out);
        continue;
      }
      const align = tableStarts(lines, i);
      if (align) {
        const width = align.length;
        const fit = (cs: string[]) =>
          Array.from({ length: width }, (_, k) => this.inl(cs[k] ?? ""));
        const head = fit(cells(line));
        const rows: MarkdownInline[][][] = [];
        i += 2;
        while (
          i < lines.length &&
          !blank(at(i)) &&
          at(i).includes("|") &&
          !startsBlock(lines, i)
        ) {
          rows.push(fit(cells(at(i))));
          i++;
        }
        out.push({ kind: "table", align, head, rows });
        continue;
      }
      const para: string[] = [];
      while (
        i < lines.length &&
        !blank(at(i)) &&
        (para.length === 0 || !startsBlock(lines, i, true))
      ) {
        para.push(trimWs(at(i)));
        i++;
      }
      // A backslash at the end of a line is a hard break only when another line follows
      // (every line break is one already, so it goes); on the last line it is text.
      out.push({
        kind: "p",
        lines: para.map((l, k) =>
          this.inl(k < para.length - 1 ? l.replace(/\\$/, "") : l),
        ),
      });
    }
    return out;
  }

  /** Read a run of list items from `i` into `out`; returns the line after it. */
  private list(lines: string[], i: number, out: MarkdownBlock[]): number {
    const at = (k: number) => lines[k] ?? "";
    const stack: { indent: number; list: MarkdownList }[] = [];
    /** The innermost open list (the stack is never empty where this is called). */
    const peek = () => {
      const top = stack[stack.length - 1];
      if (!top) throw new Error("markdown-parse: no open list");
      return top;
    };
    const lastItem = (list: MarkdownList) => list.items[list.items.length - 1];
    const newList = (ordered: boolean, marker: string): MarkdownList =>
      ordered
        ? { kind: "ol", start: Number.parseInt(marker, 10), items: [] }
        : { kind: "ul", items: [] };
    let afterBlank = false;
    while (i < lines.length) {
      const line = at(i);
      if (blank(line)) {
        let k = i + 1;
        while (k < lines.length && blank(at(k))) k++;
        if (k < lines.length && LIST_ITEM.test(at(k))) {
          i = k;
          afterBlank = true;
          continue;
        }
        break;
      }
      const wasAfterBlank = afterBlank;
      afterBlank = false;
      const m = LIST_ITEM.exec(line);
      if (!m) {
        const top = stack[stack.length - 1];
        const item = top ? lastItem(top.list) : undefined;
        const rest = line.replace(/^ */, "");
        if (
          item &&
          line.length - rest.length >= 2 &&
          rest !== "" &&
          !isWs(rest.charAt(0)) &&
          !startsBlock(lines, i)
        ) {
          item.lines.push(this.inl(trimWs(line)));
          i++;
          continue;
        }
        break;
      }
      const indent = (m[1] ?? "").length;
      const marker = m[2] ?? "";
      const ordered = /\d/.test(marker);
      const kind = ordered ? "ol" : "ul";
      const item: MarkdownListItem = {
        lines: [this.inl(trimWs(m[3] ?? ""))],
        children: [],
      };
      if (stack.length === 0) {
        const list = newList(ordered, marker);
        out.push(list);
        stack.push({ indent, list });
      } else {
        // Where the item goes: the open lists it stays in (`keep`), and whether it joins the
        // innermost of them at its own indent (an item indented between that list and the one
        // it sits in, of the same kind), starts a list nested in the last item, or starts a
        // list of the other kind.
        let keep = stack.length;
        let joins = false;
        while (keep > 1) {
          const open = stack[keep - 1];
          const parent = stack[keep - 2];
          if (!open || !parent || indent >= open.indent) break;
          if (indent >= parent.indent + 2 && open.list.kind === kind) {
            joins = true;
            break;
          }
          keep--;
        }
        const top = stack[keep - 1] ?? peek();
        const last = lastItem(top.list);
        const nests =
          !joins &&
          indent >= top.indent + 2 &&
          last !== undefined &&
          keep < MAX_NESTING;
        const switches = !joins && !nests && top.list.kind !== kind;
        // A new list right after an item's text (no blank line between) interrupts that text,
        // so it must be one that may interrupt a paragraph; otherwise the line continues it.
        if (
          (nests || switches) &&
          !wasAfterBlank &&
          !interrupts(marker, m[3] ?? "")
        ) {
          lastItem(peek().list)?.lines.push(this.inl(trimWs(line)));
          i++;
          continue;
        }
        stack.length = keep;
        if (joins) peek().indent = indent;
        else if (nests && last) {
          const list = newList(ordered, marker);
          last.children.push(list);
          stack.push({ indent, list });
        } else if (switches) {
          const list = newList(ordered, marker);
          const parent =
            stack.length === 1 ? undefined : stack[stack.length - 2];
          if (!parent) out.push(list);
          else lastItem(parent.list)?.children.push(list);
          stack[stack.length - 1] = { indent: top.indent, list };
        }
      }
      peek().list.items.push(item);
      i++;
    }
    return i;
  }
}

/** Markdown as data. */
export function parseMarkdown(
  text: string,
  policy: MarkdownLinkPolicy = "safe",
): MarkdownBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map(untab);
  return new BlockParser(policy).parse(lines, 0);
}

// ─── Rich text ────────────────────────────────────────────────────────────────────────────
//
// Rich text from editors that store HTML is read by a small reader of its own, not the
// platform's DOMParser: it builds a tree of plain objects and never touches a DOM, so nothing
// in the HTML can run or load, and the result is the same on a server, in a browser and in the
// Rust build (which has the same reader). The tree is turned straight into blocks and inlines,
// never into Markdown text, so text in rich text is always text. Only the tags an editor writes
// carry meaning; every other tag is a plain container, and script-like elements are dropped
// whole. Elements nest at most `MAX_HTML_DEPTH` deep; deeper start tags are ignored.

/** A node of rich text as data. */
type RichNode =
  | { tag: string; attrs: Record<string, string>; children: RichNode[] }
  | { text: string };
type RichElement = Extract<RichNode, { tag: string }>;

/** How deep rich-text elements nest; deeper start tags are ignored (their text is kept). */
export const MAX_HTML_DEPTH = 32;

const VOID = new Set([
  "br",
  "hr",
  "img",
  "input",
  "meta",
  "link",
  "wbr",
  "area",
  "base",
  "col",
  "embed",
  "source",
  "track",
  "param",
]);
/** Elements dropped with their content. */
const DROP = new Set([
  "script",
  "style",
  "template",
  "noscript",
  "iframe",
  "object",
  "textarea",
  "title",
  "xmp",
  "head",
  "svg",
  "math",
]);
/** Elements that close an open paragraph. */
const CLOSES_P = new Set([
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
]);
/** Elements read as a container of blocks. */
const CONTAINERS = new Set([
  "div",
  "html",
  "body",
  "main",
  "section",
  "article",
  "header",
  "footer",
  "aside",
  "nav",
  "figure",
  "center",
  "form",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
]);
/** Block elements met inside a line: their content, a space either side. */
const BLOCKISH = new Set([
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
]);

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode the character references editors write: the common named ones and numeric ones. */
export function decodeEntities(text: string): string {
  return text.replace(
    /&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{2,6});/g,
    (whole, ref: string) => {
      if (ref[0] !== "#") return NAMED[ref] ?? whole;
      const code =
        ref[1] === "x" || ref[1] === "X"
          ? Number.parseInt(ref.slice(2), 16)
          : Number.parseInt(ref.slice(1), 10);
      return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff)
        ? String.fromCodePoint(code)
        : "�";
    },
  );
}

const isAsciiLetter = (c: string | undefined) =>
  c !== undefined && /[A-Za-z]/.test(c);
const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

/** Elements whose content a browser reads as text, ending only at their own end tag. */
const RAW_TEXT = new Set([
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
]);

/** Whether `html` at `k` is `name` (any case) followed by whitespace, `/` or `>`. */
function tagNameAt(html: string, k: number, name: string): boolean {
  return (
    asciiLower(html.slice(k, k + name.length)) === name &&
    /[\t\n\f\r />]/.test(html.charAt(k + name.length))
  );
}

const isHtmlWs = (c: string | undefined) => c !== undefined && HTML_WS.has(c);

/** Where a tag name that starts at `j` ends, as the tokenizer reads it: at whitespace, `/` or `>`. */
function tagNameEnd(html: string, j: number): number {
  while (
    j < html.length &&
    !isHtmlWs(html[j]) &&
    html[j] !== "/" &&
    html[j] !== ">"
  )
    j++;
  return j;
}

/**
 * The rest of a tag from `j` (just after its name), read as the HTML tokenizer reads it, with
 * only HTML whitespace between attributes, so a `>` ends the tag exactly where it ends it for
 * a browser: `end` is the index of that `>` (the length when none does), `selfClosing` whether
 * it ends `/>`, and `attrs` the attribute names (lower-cased) with their raw values, the first
 * of each name.
 */
function scanTag(
  html: string,
  j: number,
): { end: number; selfClosing: boolean; attrs: Record<string, string> } {
  const attrs: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  const n = html.length;
  for (;;) {
    while (j < n && isHtmlWs(html[j])) j++;
    if (j >= n) return { end: n, selfClosing: false, attrs };
    if (html[j] === ">") return { end: j, selfClosing: false, attrs };
    if (html[j] === "/") {
      if (html[j + 1] === ">") return { end: j + 1, selfClosing: true, attrs };
      j++;
      continue;
    }
    // A name: its first character may be `=`; it ends at whitespace, `/`, `>` or `=`.
    const from = j++;
    while (j < n && !isHtmlWs(html[j]) && !"/>=".includes(html[j] ?? "")) j++;
    const key = asciiLower(html.slice(from, j));
    while (j < n && isHtmlWs(html[j])) j++;
    let value = "";
    if (html[j] === "=") {
      j++;
      while (j < n && isHtmlWs(html[j])) j++;
      const q = html[j];
      if (q === '"' || q === "'") {
        const close = html.indexOf(q, j + 1);
        if (close < 0) return { end: n, selfClosing: false, attrs };
        value = html.slice(j + 1, close);
        j = close + 1;
      } else {
        const v = j;
        while (j < n && !isHtmlWs(html[j]) && html[j] !== ">") j++;
        value = html.slice(v, j);
      }
    }
    if (!(key in attrs)) attrs[key] = value;
  }
}

/** Just after the end tag `</name…>` that starts at `k` (a quoted `>` does not end it). */
const afterEndTag = (html: string, k: number, name: string): number =>
  Math.min(scanTag(html, k + 2 + name.length).end + 1, html.length);

/**
 * Just after a comment that starts at `k` (`<!--`): at `-->` or `--!>`, or at once for the
 * empty `<!-->` and `<!--->`, as the HTML tokenizer ends it; the length when it has no end.
 */
function commentEnd(html: string, k: number): number {
  if (html.startsWith(">", k + 4)) return k + 5;
  if (html.startsWith("->", k + 4)) return k + 6;
  for (
    let d = html.indexOf("--", k + 4);
    d >= 0;
    d = html.indexOf("--", d + 1)
  ) {
    if (html[d + 2] === ">") return d + 3;
    if (html[d + 2] === "!" && html[d + 3] === ">") return d + 4;
  }
  return html.length;
}

/**
 * Just after a bogus comment that starts at `k` (`<!…>` other than a comment, `<?…>`, or `</`
 * not followed by a letter): at the first `>`, as the HTML tokenizer ends it. `</>` is nothing.
 * The length when it has no end; `k` itself when there is none at `k`.
 */
function bogusCommentEnd(html: string, k: number): number {
  const next = html[k + 1];
  const bogus =
    next === "!" ||
    next === "?" ||
    (next === "/" && k + 2 < html.length && !isAsciiLetter(html[k + 2]));
  if (!bogus) return k;
  const end = html.indexOf(">", k + 2);
  return end < 0 ? html.length : end + 1;
}

/** Dropped elements that can nest, and `<table>`, inside which `</object>` is ignored. */
const NESTING = new Set(["template", "svg", "math", "object", "head", "table"]);

/** Start tags that end SVG or MathML content (back to HTML), as the HTML parser lists them. */
const BREAKOUT = new Set(
  (
    "b big blockquote body br center code dd div dl dt em embed h1 h2 h3 h4 h5 h6 head hr i img " +
    "li listing menu meta nobr ol p pre ruby s small span strong strike sub sup table tt u ul var"
  ).split(" "),
);

/** An element open while a dropped element is skipped, and how its content is read. */
interface Open {
  tag: string;
  /** Its namespace: "svg" or "math" for SVG and MathML elements, else "html". */
  ns: string;
  /**
   * Whether its content is HTML: an HTML element, an SVG or MathML element whose content is
   * HTML (`<foreignObject>`, `<mi>`, …), or one a tag such as `<p>` has closed for a browser.
   */
  html: boolean;
  /** Whether it is one of those SVG or MathML elements whose content is HTML. */
  point: boolean;
  /** Whether it or an element around it is one. */
  inPoint: boolean;
}

/** HTML elements that cannot have content. */
const EMPTY = new Set([...VOID, "basefont", "bgsound", "frame", "keygen"]);

/**
 * Where a dropped element `name` that started before `i` ends: just after its end tag, or the
 * length when it has none, the way a browser ends it.
 *
 * - A text element (`<style>`, `<textarea>`, …) ends at the first `</name` followed by
 *   whitespace, `/` or `>`, so `</scripts>` inside it is still text.
 * - `<script>` too, except inside `<!--`, where a nested `<script>` needs its own `</script>`
 *   first (the HTML tokenizer's escaped and double-escaped script states).
 * - Any other (`<template>`, `<svg>`, …) ends at the end tag that matches it. The elements in
 *   it that can hide its end tag are followed: another of these (a nested `<name>` needs its
 *   own `</name>` first), a `<table>`, every SVG and MathML element (closed as a browser closes
 *   them, `/>` included), and the HTML elements inside an SVG or MathML element whose content
 *   is HTML (`<foreignObject>`, `<mi>`, …). An end tag inside a comment, a CDATA section, an
 *   attribute value or a nested text element is not one, and inside SVG or MathML a `<script>`
 *   or `<style>` is not a text element until a tag such as `<p>` or `<b>` returns to HTML.
 *
 * Where a browser would end it sooner (an HTML tag inside `<svg>`, a `<head>` it ignores, an end
 * tag across an element still open), it is dropped to the later end, and an end tag inside SVG
 * or MathML that could close an element around it drops the rest of the text: never the
 * earlier end.
 */
function droppedEnd(html: string, i: number, name: string): number {
  if (name === "script") return scriptEnd(html, i);
  if (name === "plaintext") return html.length;
  if (RAW_TEXT.has(name)) {
    for (let k = html.indexOf("</", i); k >= 0; k = html.indexOf("</", k + 2))
      if (tagNameAt(html, k + 2, name)) return afterEndTag(html, k, name);
    return html.length;
  }
  const foreign = name === "svg" || name === "math";
  const open: Open[] = [
    {
      tag: name,
      ns: foreign ? name : "html",
      html: !foreign,
      point: false,
      inPoint: false,
    },
  ];
  const top = (): Open =>
    open[open.length - 1] ?? {
      tag: "",
      ns: "html",
      html: true,
      point: false,
      inPoint: false,
    };
  // A tag that returns to HTML: the SVG and MathML elements still open are closed to a browser,
  // so what follows them is HTML (they stay here, so the drop still ends only at their end tag).
  const breakOut = () => {
    for (let k = open.length - 1; k >= 0; k--) {
      const o = open[k];
      if (!o || o.html) break;
      o.html = true;
    }
  };
  let j = i;
  while (j < html.length) {
    const k = html.indexOf("<", j);
    if (k < 0) return html.length;
    if (html.startsWith("<!--", k)) {
      j = commentEnd(html, k);
      continue;
    }
    // CDATA is text in SVG and MathML; in HTML it is a bogus comment, ended by `>`.
    if (!top().html && html.startsWith("<![CDATA[", k)) {
      const end = html.indexOf("]]>", k + 9);
      if (end < 0) return html.length;
      j = end + 3;
      continue;
    }
    const bogus = bogusCommentEnd(html, k);
    if (bogus > k) {
      j = bogus;
      continue;
    }
    const close = html[k + 1] === "/";
    const from = close ? k + 2 : k + 1;
    if (!isAsciiLetter(html[from])) {
      j = k + 1;
      continue;
    }
    const e = tagNameEnd(html, from);
    const tag = asciiLower(html.slice(from, e));
    const rest = scanTag(html, e);
    if (rest.end >= html.length) return html.length;
    j = rest.end + 1;
    if (close) {
      const current = top();
      if (!current.html && !current.point && (tag === "br" || tag === "p"))
        breakOut();
      if (!top().html) {
        // SVG or MathML: the innermost open element of that name, as a browser closes it,
        // passing only SVG and MathML elements still open.
        let at = open.length - 1;
        while (at >= 0 && open[at]?.html === false && open[at]?.tag !== tag)
          at--;
        // None, and nothing in between: the end tag could close an element around it.
        if (at < 0) return html.length;
        if (open[at]?.html) continue;
        open.length = at;
      } else if (current.tag === tag) open.pop();
      else continue;
      if (open.length === 0) return j;
      continue;
    }
    const current = top();
    if (
      !current.html &&
      !current.point &&
      (BREAKOUT.has(tag) ||
        (tag === "font" &&
          ["color", "face", "size"].some((a) => a in rest.attrs)))
    )
      breakOut();
    const parent = top();
    if (tag === "svg" || tag === "math") {
      if (!rest.selfClosing)
        open.push({
          tag,
          ns: tag,
          html: false,
          point: false,
          inPoint: parent.inPoint,
        });
    } else if (!parent.html && !parent.point) {
      // SVG or MathML: every element is followed; those whose content is HTML are marked.
      if (rest.selfClosing) continue;
      const encoding = asciiLower(decodeEntities(rest.attrs.encoding ?? ""));
      const point =
        parent.ns === "svg"
          ? tag === "foreignobject" || tag === "desc" || tag === "title"
          : ["mi", "mo", "mn", "ms", "mtext"].includes(tag) ||
            (tag === "annotation-xml" &&
              (encoding === "text/html" ||
                encoding === "application/xhtml+xml"));
      open.push({
        tag,
        ns: parent.ns,
        html: false,
        point,
        inPoint: parent.inPoint || point,
      });
    } else if (RAW_TEXT.has(tag)) j = droppedEnd(html, j, tag);
    else if (NESTING.has(tag) || (!EMPTY.has(tag) && parent.inPoint))
      // Inside `<foreignObject>` and the like, an open HTML element hides its end tag.
      open.push({
        tag,
        ns: "html",
        html: true,
        point: false,
        inPoint: parent.inPoint,
      });
  }
  return html.length;
}

/**
 * Where a `<script>` that started before `i` ends. Its text ends at the first `</script`
 * followed by whitespace, `/` or `>`, except that after `<!--` (until `-->`) a `<script>` opens
 * a part that the next `</script>` only closes, as the HTML tokenizer's script states read it:
 * `<script><!--<script></script>x</script>` is one script.
 */
function scriptEnd(html: string, i: number): number {
  /** 0: script data; 1: escaped (after `<!--`); 2: double escaped (after `<script>` there). */
  let state = 0;
  let dashes = 0;
  let j = i;
  while (j < html.length) {
    const c = html[j];
    if (state === 0) {
      if (c === "<" && html[j + 1] === "/" && tagNameAt(html, j + 2, "script"))
        return afterEndTag(html, j, "script");
      if (html.startsWith("<!--", j)) {
        state = 1;
        dashes = 2;
        j += 4;
      } else j++;
      continue;
    }
    if (c === "-") {
      dashes++;
      j++;
      continue;
    }
    if (c === ">" && dashes >= 2) {
      state = 0;
      dashes = 0;
      j++;
      continue;
    }
    dashes = 0;
    if (c !== "<") {
      j++;
      continue;
    }
    const close = html[j + 1] === "/";
    if (state === 1 && close && tagNameAt(html, j + 2, "script"))
      return afterEndTag(html, j, "script");
    const from = close ? j + 2 : j + 1;
    // `<script` (escaped) or `</script` (double escaped), then whitespace, `/` or `>`, moves
    // between the two; the letters and that character are text either way.
    if (state === 1 ? !close : close) {
      let e = from;
      while (e < html.length && isAsciiLetter(html[e])) e++;
      if (e > from && /[\t\n\f\r />]/.test(html.charAt(e))) {
        if (asciiLower(html.slice(from, e)) === "script") state = 3 - state;
        j = e + 1;
      } else j = e;
      continue;
    }
    j = from;
  }
  return html.length;
}

/** Read HTML into a tree of plain objects (never a DOM). */
function readHtml(html: string): RichElement {
  const root: RichElement = { tag: "#root", attrs: {}, children: [] };
  const stack: RichElement[] = [root];
  const top = () => stack[stack.length - 1] ?? root;
  let i = 0;
  let text = "";
  const flushText = () => {
    if (text) top().children.push({ text: decodeEntities(text) });
    text = "";
  };
  while (i < html.length) {
    const c = html[i];
    if (c === "<" && html.startsWith("<!--", i)) {
      flushText();
      i = commentEnd(html, i);
      continue;
    }
    // `<!DOCTYPE …>`, `<?…>`, `</ …>`: bogus comments a browser does not show.
    const bogus = c === "<" ? bogusCommentEnd(html, i) : i;
    if (bogus > i) {
      flushText();
      i = bogus;
      continue;
    }
    if (c === "<" && html[i + 1] === "/" && isAsciiLetter(html[i + 2])) {
      flushText();
      const j = tagNameEnd(html, i + 2);
      const name = asciiLower(html.slice(i + 2, j));
      i = Math.min(scanTag(html, j).end + 1, html.length);
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k]?.tag === name) {
          stack.length = k;
          break;
        }
      }
      continue;
    }
    if (c === "<" && isAsciiLetter(html[i + 1])) {
      flushText();
      const j = tagNameEnd(html, i + 1);
      const name = asciiLower(html.slice(i + 1, j));
      const tag = scanTag(html, j);
      // A tag cut off by the end of the text is not a tag, as in a browser.
      if (tag.end >= html.length) break;
      i = tag.end + 1;
      if (DROP.has(name)) {
        // `<svg/>` and `<math/>` are empty; any other dropped element runs to its end tag.
        if (!((name === "svg" || name === "math") && tag.selfClosing))
          i = droppedEnd(html, i, name);
        continue;
      }
      const attrs = tag.attrs;
      for (const k in attrs) attrs[k] = decodeEntities(attrs[k] ?? "");
      if (CLOSES_P.has(name) && top().tag === "p") stack.pop();
      if (name === "li") {
        for (let k = stack.length - 1; k > 0; k--) {
          const t = stack[k]?.tag;
          if (t === "ul" || t === "ol") break;
          if (t === "li") {
            stack.length = k;
            break;
          }
        }
      }
      if (VOID.has(name))
        top().children.push({ tag: name, attrs, children: [] });
      else if (stack.length <= MAX_HTML_DEPTH) {
        const el: RichElement = { tag: name, attrs, children: [] };
        top().children.push(el);
        stack.push(el);
      }
      continue;
    }
    text += c;
    i++;
  }
  flushText();
  return root;
}

/** An element's text, with each `<br>` a line break (so `<pre>` keeps its lines), or nothing. */
const textOf = (n: RichNode, br = "\n"): string =>
  "text" in n
    ? n.text
    : n.tag === "br"
      ? br
      : n.children.map((c) => textOf(c, br)).join("");

/** A line break inside rich text, before lines are split. */
const BREAK = null;

/** Wrap each break-separated run of `pieces` in a mark, keeping the breaks between them. */
function wrapRuns(
  pieces: (MarkdownInline | null)[],
  wrap: (c: MarkdownInline[]) => MarkdownInline,
  out: (MarkdownInline | null)[],
): void {
  let run: MarkdownInline[] = [];
  for (const p of pieces) {
    if (p === BREAK) {
      out.push(wrap(run), BREAK);
      run = [];
    } else run.push(p);
  }
  out.push(wrap(run));
}

/** Push every item (no spread: a long child list must not become a long argument list). */
function pushAll<T>(out: T[], items: T[]): void {
  for (const x of items) out.push(x);
}

/** Where rich inlines are read: whether `<br>` breaks the line, and the marks already open. */
interface RichContext {
  breaks: boolean;
  strong: boolean;
  em: boolean;
  link: boolean;
}

/**
 * Rich text's inline content as data: marks kept, links checked, `<br>` a break where `breaks`.
 * A break inside a mark splits the mark, so bold text with a Shift+Enter keeps its two lines.
 * A mark nested in a mark of the same kind adds nothing, so splitting stays linear in the input.
 */
function richInlines(
  nodes: RichNode[],
  policy: MarkdownLinkPolicy,
  ctx: RichContext,
): (MarkdownInline | null)[] {
  const out: (MarkdownInline | null)[] = [];
  for (const n of nodes) {
    if ("text" in n) {
      out.push({ t: "text", v: n.text });
      continue;
    }
    const tag = n.tag;
    if (tag === "br") out.push(ctx.breaks ? BREAK : { t: "text", v: " " });
    else if (tag === "strong" || tag === "b") {
      const pieces = richInlines(n.children, policy, { ...ctx, strong: true });
      // Bold inside bold is bold: no second wrapper, so a mark wraps at most once per kind.
      if (ctx.strong) pushAll(out, pieces);
      else wrapRuns(pieces, (c) => ({ t: "strong", c }), out);
    } else if (tag === "em" || tag === "i") {
      const pieces = richInlines(n.children, policy, { ...ctx, em: true });
      if (ctx.em) pushAll(out, pieces);
      else wrapRuns(pieces, (c) => ({ t: "em", c }), out);
    } else if (tag === "code")
      out.push({ t: "code", v: collapseHtmlWs(textOf(n)) });
    else if (tag === "a") {
      const kept = ctx.link ? null : safeLink(n.attrs.href ?? "", policy);
      const pieces = richInlines(n.children, policy, { ...ctx, link: true });
      if (kept !== null)
        wrapRuns(pieces, (c) => ({ t: "link", ...kept, c }), out);
      else pushAll(out, pieces);
    } else if (BLOCKISH.has(tag)) {
      out.push({ t: "text", v: " " });
      pushAll(out, richInlines(n.children, policy, ctx));
      out.push({ t: "text", v: " " });
    } else pushAll(out, richInlines(n.children, policy, ctx));
  }
  return out;
}

const LINE: RichContext = {
  breaks: true,
  strong: false,
  em: false,
  link: false,
};
const ONE_LINE: RichContext = { ...LINE, breaks: false };

/** Whitespace as a browser shows it: HTML whitespace runs as one space, none after a space,
    none at the start; non-breaking spaces kept. */
function normalize(
  items: MarkdownInline[],
  state: { space: boolean },
): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  for (const x of items) {
    if (x.t === "text") {
      let v = collapseHtmlWs(x.v);
      if (state.space && v.startsWith(" ")) v = v.slice(1);
      if (v === "") continue;
      state.space = v.endsWith(" ");
      const last = out[out.length - 1];
      if (last?.t === "text") last.v += v;
      else out.push({ t: "text", v });
    } else if (x.t === "code") {
      if (x.v === "") continue;
      state.space = false;
      out.push(x);
    } else {
      const c = normalize(x.c, state);
      if (c.length > 0) out.push({ ...x, c });
    }
  }
  return out;
}

/** Drop trailing whitespace from the end of a line, into its marks. */
function trimEnd(items: MarkdownInline[]): MarkdownInline[] {
  for (
    let last = items[items.length - 1];
    last;
    last = items[items.length - 1]
  ) {
    if (last.t === "text") {
      last.v = last.v.replace(/ $/, "");
      if (last.v !== "") break;
    } else if (last.t === "code") break;
    else {
      last.c = trimEnd(last.c);
      if (last.c.length > 0) break;
    }
    items.pop();
  }
  return items;
}

/** Split rich inlines at breaks into lines; empty lines are dropped. */
function toLines(items: (MarkdownInline | null)[]): MarkdownInline[][] {
  const lines: MarkdownInline[][] = [];
  let cur: MarkdownInline[] = [];
  const end = () => {
    const line = trimEnd(normalize(cur, { space: true }));
    if (line.length > 0) lines.push(line);
    cur = [];
  };
  for (const x of items) {
    if (x === BREAK) end();
    else cur.push(x);
  }
  end();
  return lines;
}

/** One line of rich inlines (breaks are spaces), or null when it is empty. */
const toLine = (nodes: RichNode[], policy: MarkdownLinkPolicy) =>
  toLines(richInlines(nodes, policy, ONE_LINE))[0] ?? null;

/** `<ol start>`, when it is a plain number (as a Markdown list's first number is). */
function listStart(el: RichElement): number {
  const raw = trimWs(el.attrs.start ?? "");
  return /^[0-9]{1,9}$/.test(raw) ? Number(raw) : 1;
}

/**
 * A rich-text `<ul>` or `<ol>`: each `<li>` is one line (its paragraphs joined), and a list
 * inside it stays a nested list, up to `MAX_NESTING` deep (deeper ones join the line). A list
 * placed directly in the list, between its items (as Google Docs and Word paste one), belongs
 * to the item before it, or to an item of its own when it comes first.
 */
function richList(
  el: RichElement,
  policy: MarkdownLinkPolicy,
  depth: number,
): MarkdownList | null {
  const groups: RichNode[][] = [];
  for (const c of el.children) {
    if ("text" in c) continue;
    if (c.tag === "li") groups.push([...c.children]);
    else if (c.tag === "ul" || c.tag === "ol") {
      const last = groups[groups.length - 1];
      if (last) last.push(c);
      else groups.push([c]);
    }
  }
  const items: MarkdownListItem[] = [];
  for (const group of groups) {
    // The item's text up to its first nested list is its line; a nested list and any text
    // after it follow in document order, so `a<ul>…</ul>c` keeps `c` after the list.
    let inline: RichNode[] = [];
    let line: MarkdownInline[] | null = null;
    let nestedYet = false;
    const children: MarkdownListChild[] = [];
    const endRun = () => {
      const l = toLine(inline, policy);
      inline = [];
      if (!nestedYet) line = l;
      else if (l) children.push({ kind: "lines", lines: [l] });
    };
    for (const c of group) {
      if (
        !("text" in c) &&
        (c.tag === "ul" || c.tag === "ol") &&
        depth + 1 < MAX_NESTING
      ) {
        const sub = richList(c, policy, depth + 1);
        if (sub) {
          endRun();
          nestedYet = true;
          children.push(sub);
        }
      } else inline.push(c);
    }
    endRun();
    if (line || children.length > 0)
      items.push({ lines: line ? [line] : [], children });
  }
  if (items.length === 0) return null;
  return el.tag === "ol"
    ? { kind: "ol", start: listStart(el), items }
    : { kind: "ul", items };
}

function richBlocks(
  nodes: RichNode[],
  policy: MarkdownLinkPolicy,
  out: MarkdownBlock[],
): void {
  let pending: RichNode[] = [];
  const flush = () => {
    const lines = toLines(richInlines(pending, policy, LINE));
    if (lines.length > 0) out.push({ kind: "p", lines });
    pending = [];
  };
  for (const n of nodes) {
    if ("text" in n) {
      pending.push(n);
      continue;
    }
    const tag = n.tag;
    if (tag === "ul" || tag === "ol") {
      flush();
      const list = richList(n, policy, 0);
      if (list) out.push(list);
    } else if (/^h[1-6]$/.test(tag)) {
      flush();
      const line = toLine(n.children, policy);
      if (line)
        out.push({
          kind: "h",
          level: Number(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6,
          c: line,
        });
    } else if (tag === "pre") {
      flush();
      // One newline in the source after the start tag is dropped, as a browser drops it (a
      // `<br>` there is a blank first line), and one at the end, as no line follows it.
      let t = textOf(n);
      if (t.startsWith("\n") && textOf(n, "").startsWith("\n")) t = t.slice(1);
      if (t.endsWith("\n")) t = t.slice(0, -1);
      if (trimWs(t) !== "") out.push({ kind: "code", lang: "", v: t });
    } else if (tag === "hr") {
      flush();
      out.push({ kind: "hr" });
    } else if (tag === "p") {
      flush();
      const lines = toLines(richInlines(n.children, policy, LINE));
      if (lines.length > 0) out.push({ kind: "p", lines });
    } else if (tag === "blockquote") {
      flush();
      const inner: MarkdownBlock[] = [];
      richBlocks(n.children, policy, inner);
      if (inner.length > 0) out.push({ kind: "quote", children: inner });
    } else if (CONTAINERS.has(tag)) {
      flush();
      richBlocks(n.children, policy, out);
    } else pending.push(n);
  }
  flush();
}

/**
 * Rich text (an editor's HTML) as blocks. Block elements and `<br>` end a line and source
 * newlines are spaces; a list item is one line (its own paragraphs joined, as editors such as
 * ProseMirror wrap them) with its nested lists kept, and `<ol start>` is kept; bold, italic and code keep their meaning, links their checked
 * address (a refused one keeps its words). Text is text: Markdown typed into an editor is shown
 * as typed.
 */
export function richTextBlocks(
  html: string,
  policy: MarkdownLinkPolicy = "safe",
): MarkdownBlock[] {
  const out: MarkdownBlock[] = [];
  richBlocks(readHtml(html).children, policy, out);
  return out;
}

const RICH_TAG =
  /<\/?(?:p|br|div|ul|ol|li|h[1-6]|strong|em|b|i|u|span|a|blockquote|pre|code)\b/gi;

/** Whether text reads as rich-text HTML: it holds an editor's block or inline tags. */
export function looksLikeRichText(text: string): boolean {
  // An editor's tag with a `>` somewhere after it. The last `>` is found once, so the check
  // stays linear (a `[^>]*>` per candidate rescans the text when no `>` follows).
  const lastGt = text.lastIndexOf(">");
  if (lastGt < 0) return false;
  RICH_TAG.lastIndex = 0;
  for (let m = RICH_TAG.exec(text); m; m = RICH_TAG.exec(text)) {
    if (m.index + m[0].length <= lastGt) return true;
  }
  return false;
}

/**
 * The tree for a `markdown-renderer`'s props: rich text first read into Markdown where `from`
 * asks for it (`html`, or `auto` when the text holds an editor's tags). The same on every
 * platform, so a server render and a browser hydration agree.
 */
export function markdownBlocks(
  content: string,
  options: MarkdownOptions = {},
): MarkdownBlock[] {
  const { links = "safe", from = "markdown" } = options;
  const text = typeof content === "string" ? content : "";
  const rich = from === "html" || (from === "auto" && looksLikeRichText(text));
  return rich ? richTextBlocks(text, links) : parseMarkdown(text, links);
}
