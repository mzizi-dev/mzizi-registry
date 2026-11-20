/**
 * THE STYLING HEURISTIC (B0, docs/unstyled/decisions.md). A component source file "carries styling" when
 * its code, comments removed, does any of:
 *   - a class attribute with a literal or an expression other than a bare pass-through
 *     (`className="…"`, `class="…"`, `className={cn(…)}`, `class:list={…}`, `class: "…"`);
 *   - a class-composition helper: `cn(`, `cva(`, `clsx(`, `twMerge`, or a `class-variance-authority` import;
 *   - an inline style: `style={…}`, `style="…"`, `style: "…"`;
 *   - a colour literal: `#rgb`, `#rrggbb`, `#rrggbbaa` (anchors in `href` and `url(#…)` are not colours),
 *     `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`;
 *   - a length literal in code: `12px`, `0.75rem`;
 *   - a brand reference: `--mineral-*`, `--brand-*`, the word `mineral`, or a brand wordmark.
 * A pass-through is a class attribute whose value is one bare identifier from PASS_THROUGH_NAMES. Such a
 * component takes the adopter's classes and emits none of its own, so it is not styling.
 * Counts are a heuristic (about ±5%). The ratchet in structure.test.ts is the contract, not the count.
 */

/** Source extensions a component can ship in. `.css` is styling by definition. */
export const SOURCE_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".astro",
  ".rs",
  ".css",
] as const;

/** Bare identifiers that name a class pass-through prop or variable. */
export const PASS_THROUGH_NAMES = new Set([
  "className",
  "class",
  "cls",
  "extra",
  "klass",
  "props.className",
]);

const BRAND_RE =
  /--(?:mineral|brand)-[\w-]+|\bmineral\b|\b(?:mukoko|nyuchi|bundu|kweli|shamwari)\b/i;
const COLOUR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;
const LENGTH_RE = /(?<![\w.-])\d+(?:\.\d+)?(?:px|rem)\b/;
const COMPOSE_RE =
  /\b(?:cn|cva|clsx|twMerge)\s*\(|from\s+["']class-variance-authority["']/;
const INLINE_STYLE_RE = /(?<![\w-])style\s*(?:=|:)\s*(?:\{|["'`])/;
const CLASS_ATTR_RE =
  /(?<![\w-])(?:className|class)\s*(?::\s*list\s*)?=\s*(\{|["'`])/g;
/** A Roots `pub const CONTRACT` is a copy of the contract file (data, written by contracts:sync), not component code. */
const ROOTS_CONTRACT_COPY_RE = /pub const CONTRACT: &str = r#"[\s\S]*?"#;/g;
/** A Tailwind utility in a string: an optional variant prefix (`hover:`, `md:`) then a known utility. */
const TAILWIND_PREFIX =
  "(?:bg|text|border|rounded|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|h|w|min-h|min-w|max-w|max-h|size|gap|space-x|space-y|flex|grid|items|justify|font|leading|tracking|shadow|ring|opacity|overflow|inset|top|left|right|bottom|z|translate|transition|duration|fill|stroke|outline|peer-disabled|placeholder|divide|col|row|order|basis|grow|shrink|aspect|line-clamp|whitespace|break|object|cursor|select|pointer-events|animate|backdrop|blur|from|to|via)-[\\w\\[\\]/.%(),#:-]+";
const TAILWIND_KEYWORD =
  "(?:flex|grid|block|inline-flex|inline-block|inline|hidden|relative|absolute|fixed|sticky|truncate|underline|italic|uppercase|lowercase|capitalize|sr-only|isolate|contents|visible|invisible)";
const TAILWIND_TOKEN_RE = new RegExp(
  `^(?:[\\w-]+:)*(?:${TAILWIND_PREFIX}|${TAILWIND_KEYWORD})$`,
);
const STRING_RE = /"((?:[^"\\\n]|\\.)*)"/g;

/** Remove comments, keeping string literals and line structure. Handles // and /* *\/ and HTML comments. */
export function stripComments(src: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i]!;
    const next = src[i + 1];
    if (quote) {
      // A string ends at its line. An apostrophe in JSX text, a Rust lifetime or a regex literal such as
      // /```/ must not swallow the rest of the file; the cost is that a multi-line template is read as code.
      if (c === "\n") {
        quote = null;
        out += c;
        i++;
        continue;
      }
      out += c;
      if (c === "\\") {
        out += src[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    if (c === "<" && src.startsWith("<!--", i)) {
      const end = src.indexOf("-->", i + 4);
      const stop = end === -1 ? src.length : end + 3;
      out += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** The reasons a source carries styling. Empty means unstyled. */
export function stylingReasons(src: string): string[] {
  const code = stripComments(src).replace(ROOTS_CONTRACT_COPY_RE, "");
  const reasons: string[] = [];

  for (const m of code.matchAll(CLASS_ATTR_RE)) {
    const start = m.index! + m[0].length - 1;
    if (m[1] === "{") {
      const close = matchBrace(code, start);
      const expr = code.slice(start + 1, close).trim();
      if (!PASS_THROUGH_NAMES.has(expr)) {
        reasons.push(`class expression ${expr.slice(0, 40)}`);
        break;
      }
    } else {
      reasons.push("class literal");
      break;
    }
  }
  if (COMPOSE_RE.test(code)) reasons.push("class composition (cn/cva/clsx)");
  if (INLINE_STYLE_RE.test(code)) reasons.push("inline style");
  if (lineMatches(code, COLOUR_RE, /href\s*=|url\(#/))
    reasons.push("colour literal");
  if (lineMatches(code, LENGTH_RE, null)) reasons.push("length literal");
  if (BRAND_RE.test(code)) reasons.push("brand reference");
  if (hasTailwindString(code)) reasons.push("tailwind class string");
  return reasons;
}

/** True when a file that has styling is not already reported as a class table by the others. */
export function carriesStyling(src: string): boolean {
  return stylingReasons(src).length > 0;
}

/** True when a string literal holds a run of Tailwind utilities (a class table or a class recipe). */
export function hasTailwindString(code: string): boolean {
  for (const m of code.matchAll(STRING_RE)) {
    const tokens = m[1]!.split(/\s+/).filter(Boolean);
    const hits = tokens.filter((t) => TAILWIND_TOKEN_RE.test(t)).length;
    // Two or more utilities, a majority of the string: one bare word such as a data-slot value is not a class run.
    if (hits >= 2 && hits / tokens.length >= 0.5) return true;
  }
  return false;
}

function lineMatches(code: string, re: RegExp, skip: RegExp | null): boolean {
  for (const line of code.split("\n")) {
    if (skip && skip.test(line)) continue;
    if (re.test(line)) return true;
  }
  return false;
}

function matchBrace(code: string, open: number): number {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return code.length;
}
