/**
 * The contract runner. Canonical here, in mzizi-registry; mzizi-dev/packages-npm
 * syncs a copy (`pnpm registry:sync`) so its package tests run offline.
 *
 * Evaluates a Mzizi component contract (contracts/schema/
 * component-contract.schema.json) against rendered HTML.
 *
 * Three parts are evaluated, and nothing is ever skipped: a clause, check or
 * density row this runner cannot evaluate is a FAILURE, never a pass (the
 * language's RFC-0006, FM-12 "the silently inapplicable assertion").
 *
 * - `contract`: the `contract … end` block, in the clause grammar of
 *   mzizi-dev/mzizi design/RFC-0006, the subset that applies to rendered
 *   markup (the same subset mzizi-brand's tests/contract.rs evaluates on
 *   dioxus-ssr output):
 *     slot | role | label | class | portal  <predicate>   (root element)
 *     <element> "<text>" min_height <n>                   (every state)
 *     uses <data-slot>                                     (default state)
 *     when <state> shows <element> "<text>"
 *     when <state> <root subject> <predicate>
 *   Predicates: is "<s>", contains "<s>" (a substring), has "<token>" (one
 *   whole whitespace-separated token: `has "line-through"` is not satisfied
 *   by `hover:line-through`), not_empty, in "<a>" "<b>" …,
 *   uses "--token" (the class reads var(--token…)), and `not <predicate>`,
 *   which negates any one of them (`not contains "line-through"`, `not has
 *   "uppercase"`). Every operand is quoted and a predicate takes exactly the
 *   operands it names: an unquoted operand, an extra one, or (for `in`) none
 *   at all makes the predicate unevaluable. `not` of an unevaluable
 *   predicate, or of an attribute the element does not carry, fails: it
 *   never passes by default.
 * - `checks`: CSS-selector assertions (count, min, absent, attr, text).
 * - `density`: heights in px read from classes by the spacing scale, for a
 *   fine pointer (no prefix) and a coarse one (`pointer-coarse:`).
 */
import { selectAll } from "css-select";
import type { AnyNode, Document, Element } from "domhandler";
import { getChildren, isTag, textContent } from "domutils";
import { parseDocument } from "htmlparser2";

export interface Contract {
  name: string;
  title: string;
  version: string;
  states: Record<
    string,
    {
      description?: string;
      props?: Record<string, unknown>;
      slots?: Record<string, string>;
    }
  >;
  contract: string;
  checks: Check[];
  density: DensityRow[];
  theming: { tokens: string[]; brandOverlay: string; statusColours: string[] };
  noJs: { script: "none" | "enhancement"; without: string; with?: string };
  props: {
    name: string;
    type: string;
    required: boolean;
    default?: unknown;
    values?: unknown[];
  }[];
  slots: { name: string }[];
  implementations: {
    astro: {
      registry?: string;
      package: string;
      export: string;
      since: string;
    } | null;
    tsx?: { registry: string; identity: string } | null;
    rs?: { registry: string; identity: string } | null;
  };
}
export interface Check {
  say: string;
  state?: string;
  select: string;
  count?: number;
  min?: number;
  absent?: boolean;
  attr?: Record<string, string | boolean>;
  text?: string;
}
export interface DensityRow {
  part: string;
  state?: string;
  select: string;
  fine: number;
  coarse: number;
}

/** Rendered HTML for each named state. */
export type Rendered = Record<string, string>;

const SKIP = new Set(["style", "script", "link", "meta"]);

/**
 * Parse rendered HTML; entities in text and attributes are decoded, and
 * attribute names are lower-cased as a browser's HTML parser does, so a React
 * build's `noValidate=""` and an Astro build's `novalidate` are one attribute.
 */
export function doc(html: string): Document {
  return parseDocument(html, {
    decodeEntities: true,
    lowerCaseAttributeNames: true,
  });
}

function elements(node: AnyNode): Element[] {
  const out: Element[] = [];
  const walk = (n: AnyNode) => {
    if (isTag(n)) out.push(n);
    for (const child of getChildren(n)) walk(child);
  };
  walk(node);
  return out;
}

export function text(node: AnyNode): string {
  return textContent(node);
}

function select(html: string, selector: string): Element[] {
  return selectAll<AnyNode, Element>(selector, doc(html));
}

/** The component's own root: the first element that is not a style or script. */
function root(html: string): Element {
  const el = doc(html).children.find(
    (n): n is Element => isTag(n) && !SKIP.has(n.name),
  );
  if (!el) throw new Error("rendered nothing");
  return el;
}

/** Whether an element carries a text, in its content or as its aria-label. */
function carries(el: Element, want: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return (
    norm(text(el)).includes(want) ||
    norm(el.attribs["aria-label"] ?? "").includes(want)
  );
}

/**
 * Height in px from a class list, by the spacing scale RFC-0006 §5 pins
 * (Tailwind v4, --spacing: 0.25rem): bracketed `h-[Npx]` / `min-h-[Npx]`
 * first, then `h-N`, `min-h-N` or `size-N` as N × 4. `prefix` selects the
 * variant (`""` for none, `"pointer-coarse:"` for touch).
 */
export function heightOf(classes: string, prefix = ""): number | null {
  const tokens = classes.split(/\s+/).filter(Boolean);
  const own = tokens
    .filter((t) => (prefix === "" ? !t.includes(":") : t.startsWith(prefix)))
    .map((t) => t.slice(prefix.length));
  for (const t of own) {
    const m = /^(?:min-h|h)-\[(\d+)px\]$/.exec(t);
    if (m) return Number(m[1]);
  }
  for (const t of own) {
    const m = /^(?:min-h|h|size)-(\d+)$/.exec(t);
    if (m) return Number(m[1]) * 4;
  }
  return null;
}

type Outcome = { ok: true } | { ok: false; say: string };
const pass: Outcome = { ok: true };
const fail = (say: string): Outcome => ({ ok: false, say });

/**
 * A value predicate's verdict, in the shape of `holds` in
 * mzizi-rs/contract-eval/contract_eval.rs (`Result<bool, String>`): it held,
 * it did not, or the runner cannot evaluate it. "Cannot evaluate" is its own
 * variant, not a flag on a failure, so `not` can only negate a verdict and
 * never turns an unevaluable predicate into a pass.
 */
export type Verdict = { ok: boolean } | { unevaluable: string };
const held = (ok: boolean): Verdict => ({ ok });
const cannot = (why: string): Verdict => ({ unevaluable: why });

/**
 * Split a predicate into words and quoted strings, the way `tokens` in
 * contract_eval.rs splits a clause: a quoted string is one token, quotes
 * kept; a quote left open runs to the end and is not closed, so it does not
 * count as quoted.
 */
function predicateTokens(pred: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < pred.length) {
    const c = pred.charAt(i);
    if (/\s/.test(c)) {
      i += 1;
    } else if (c === '"') {
      const close = pred.indexOf('"', i + 1);
      const end = close === -1 ? pred.length : close + 1;
      out.push(pred.slice(i, end));
      i = end;
    } else {
      let j = i;
      while (j < pred.length && !/\s/.test(pred.charAt(j))) j += 1;
      out.push(pred.slice(i, j));
      i = j;
    }
  }
  return out;
}

/** The text inside a quoted token, or undefined when the token is not quoted. */
function quoted(token: string | undefined): string | undefined {
  return token !== undefined &&
    token.length >= 2 &&
    token.startsWith('"') &&
    token.endsWith('"')
    ? token.slice(1, -1)
    : undefined;
}

/** The one quoted operand a predicate takes; any other shape is unevaluable. */
function oneQuoted(name: string, operands: string[]): string | Verdict {
  const want = operands.length === 1 ? quoted(operands[0]) : undefined;
  return want ?? cannot(`\`${name}\` takes exactly one quoted operand`);
}

/**
 * Evaluate a value predicate against an attribute value. The grammar and
 * every verdict, malformed operands included, match `holds` in
 * contract_eval.rs; `__tests__/contracts/fixtures/predicates.json` holds both
 * runners to the same cases.
 */
export function evaluatePredicate(value: string, pred: string): Verdict {
  return holds(value, predicateTokens(pred));
}

function holds(value: string, tokens: string[]): Verdict {
  const [head, ...operands] = tokens;
  switch (head) {
    case "not": {
      if (operands.length === 0) return cannot("`not` needs a predicate");
      if (operands[0] === "not") return cannot("`not not`: one `not` only");
      const inner = holds(value, operands);
      return "ok" in inner ? held(!inner.ok) : inner;
    }
    case "is": {
      const want = oneQuoted(head, operands);
      return typeof want === "string" ? held(value === want) : want;
    }
    case "contains": {
      const want = oneQuoted(head, operands);
      return typeof want === "string" ? held(value.includes(want)) : want;
    }
    case "has": {
      const want = oneQuoted(head, operands);
      if (typeof want !== "string") return want;
      if (want === "" || /\s/.test(want))
        return cannot("`has` takes one class token, with no whitespace");
      return held(value.split(/\s+/).includes(want));
    }
    case "not_empty":
      return operands.length === 0
        ? held(value.trim() !== "")
        : cannot("`not_empty` takes no operand");
    case "in": {
      const set = operands.map(quoted);
      if (set.length === 0 || set.some((s) => s === undefined))
        return cannot("`in` takes one or more quoted operands, and only those");
      return held(set.includes(value));
    }
    case "uses": {
      const token = oneQuoted(head, operands);
      if (typeof token !== "string") return token;
      if (!token.startsWith("--")) return cannot('`uses` takes "--token"');
      return held(value.includes(`var(${token}`));
    }
    default:
      return cannot(
        `\`${head ?? ""}\` is not a predicate this runner evaluates`,
      );
  }
}

const ROOT_ATTR: Record<string, string> = {
  slot: "data-slot",
  role: "role",
  label: "aria-label",
  class: "class",
  portal: "data-portal",
};

/** Evaluate every clause of `contract.contract`. Returns one line per failure. */
export function evaluateClauses(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const lines = contract.contract.split("\n");
  if (lines[0] !== "contract" || lines.at(-1) !== "end")
    return ["the contract block must start with `contract` and end with `end`"];
  const failures: string[] = [];
  for (const raw of lines.slice(1, -1)) {
    const clause = raw.trim();
    const out = evaluateClause(clause, rendered);
    if (!out.ok) failures.push(`\`${clause}\`: ${out.say}`);
  }
  return failures;
}

function evaluateClause(clause: string, rendered: Rendered): Outcome {
  let state = "default";
  let body = clause;
  const when = /^when ([a-z][a-z0-9_-]*) (.+)$/.exec(clause);
  if (when) {
    state = when[1] ?? "";
    body = when[2] ?? "";
    if (!(state in rendered))
      return fail(`no state "${state}" in this contract`);
  }
  const html = rendered[state] ?? "";

  const shows = /^shows ([a-z0-9]+) "([^"]*)"$/.exec(body);
  if (shows) {
    if (!when) return fail("`shows` needs a `when <state>` subject");
    const [, tag, want] = shows;
    const found = elements(doc(html)).some(
      (el) => el.name === tag && carries(el, want ?? ""),
    );
    return found
      ? pass
      : fail(`state "${state}" renders no <${tag}> carrying "${want}"`);
  }

  const uses = /^uses ([a-z0-9-]+)$/.exec(body);
  if (uses) {
    const slot = uses[1];
    return select(html, `[data-slot="${slot}"]`).length > 0
      ? pass
      : fail(`state "${state}" does not compose data-slot="${slot}"`);
  }

  const minH = /^([a-z0-9]+) "([^"]*)" min_height (\d+)$/.exec(body);
  if (minH) {
    if (when)
      return fail(
        "an element subject is evaluated in every state; drop the `when`",
      );
    const [, tag, want, n] = minH;
    let seen = 0;
    for (const [name, h] of Object.entries(rendered)) {
      for (const el of elements(doc(h))) {
        if (el.name !== tag || !carries(el, want ?? "")) continue;
        seen += 1;
        const px = heightOf(el.attribs.class ?? "");
        if (px === null)
          return fail(
            `<${tag}> "${want}" in "${name}" declares no height a runner can read`,
          );
        if (px < Number(n))
          return fail(`<${tag}> "${want}" in "${name}" is ${px}px, below ${n}`);
      }
    }
    return seen > 0
      ? pass
      : fail(`no state renders a <${tag}> carrying "${want}"`);
  }

  const attr = /^(slot|role|label|class|portal) (.+)$/.exec(body);
  if (attr) {
    const [, subject, pred] = attr;
    const name = ROOT_ATTR[subject ?? ""] ?? "";
    const value = root(html).attribs[name];
    const what = `${subject} (state "${state}")`;
    // An attribute the root does not carry is unevaluable, as in contract_eval.rs.
    if (value === undefined)
      return fail(
        `${what}: \`${pred}\` is not evaluable (the root has no ${name})`,
      );
    const verdict = evaluatePredicate(value, pred ?? "");
    if ("unevaluable" in verdict)
      return fail(
        `${what}: \`${pred}\` is not evaluable (${verdict.unevaluable})`,
      );
    return verdict.ok
      ? pass
      : fail(
          `${what} is ${JSON.stringify(value)}, which does not satisfy \`${pred}\``,
        );
  }

  return fail("not a clause form this runner evaluates");
}

function statesFor(check: { state?: string }, rendered: Rendered): string[] {
  if (check.state === "*") return Object.keys(rendered);
  return [check.state ?? "default"];
}

/** Evaluate every selector check. Returns one line per failure. */
export function evaluateChecks(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const failures: string[] = [];
  for (const check of contract.checks) {
    const kinds = ["count", "min", "absent"].filter((k) => k in check).length;
    if (kinds > 1 || (kinds === 0 && !check.attr)) {
      failures.push(
        `${check.say}: needs exactly one of count, min, absent, or attr`,
      );
      continue;
    }
    for (const state of statesFor(check, rendered)) {
      const html = rendered[state];
      if (html === undefined) {
        failures.push(`${check.say}: no state "${state}"`);
        continue;
      }
      let found: Element[];
      try {
        found = select(html, check.select);
      } catch (e) {
        failures.push(
          `${check.say}: selector \`${check.select}\` is not evaluable (${String(e)})`,
        );
        continue;
      }
      const at = `[${state}] ${check.say} (\`${check.select}\`)`;
      if (check.absent) {
        if (found.length > 0)
          failures.push(`${at}: expected none, found ${found.length}`);
        continue;
      }
      if (check.count !== undefined && found.length !== check.count)
        failures.push(`${at}: expected ${check.count}, found ${found.length}`);
      if (check.min !== undefined && found.length < check.min)
        failures.push(
          `${at}: expected at least ${check.min}, found ${found.length}`,
        );
      if (found.length === 0) {
        if (check.count !== 0) failures.push(`${at}: matched nothing`);
        continue;
      }
      for (const el of found) {
        for (const [name, want] of Object.entries(check.attr ?? {})) {
          const value = el.attribs[name];
          const has = value !== undefined;
          if (want === true && !has) failures.push(`${at}: missing ${name}`);
          else if (want === false && has)
            failures.push(`${at}: has ${name}="${value}"`);
          else if (typeof want === "string" && value !== want)
            failures.push(
              `${at}: ${name} is ${JSON.stringify(value ?? null)}, not "${want}"`,
            );
        }
        if (
          check.text !== undefined &&
          !text(el).replace(/\s+/g, " ").includes(check.text)
        )
          failures.push(`${at}: text does not contain "${check.text}"`);
      }
    }
  }
  return failures;
}

/** Evaluate every density row. */
export function evaluateDensity(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const failures: string[] = [];
  for (const row of contract.density) {
    const state = row.state ?? "default";
    const html = rendered[state];
    if (html === undefined) {
      failures.push(`density ${row.part}: no state "${state}"`);
      continue;
    }
    const found = select(html, row.select);
    if (found.length === 0)
      failures.push(
        `density ${row.part}: \`${row.select}\` matched nothing in "${state}"`,
      );
    for (const el of found) {
      const cls = el.attribs.class ?? "";
      const fine = heightOf(cls);
      const coarse = heightOf(cls, "pointer-coarse:") ?? fine;
      if (fine === null)
        failures.push(
          `density ${row.part}: declares no height a runner can read ("${cls}")`,
        );
      else if (fine !== row.fine)
        failures.push(
          `density ${row.part}: fine pointer is ${fine}px, the contract says ${row.fine}`,
        );
      if (coarse !== null && coarse !== row.coarse)
        failures.push(
          `density ${row.part}: coarse pointer is ${coarse}px, the contract says ${row.coarse}`,
        );
    }
  }
  return failures;
}

const MINERALS = [
  "cobalt",
  "tanzanite",
  "malachite",
  "gold",
  "terracotta",
  "sodalite",
  "copper",
];
const MINERAL_CLASS = new RegExp(
  `(?:^|:|-\\[|\\s)(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration)-(${MINERALS.join("|")})(?:-[a-z-]+)?\\b`,
  "g",
);

/**
 * CSP rule: no element carries an inline `style` attribute, in any state.
 * Custom properties and sizes go through classes, data attributes or SVG
 * geometry, so a page's Content-Security-Policy keeps `style-src 'self'` with
 * no `style-src-attr 'unsafe-inline'` (#444: a strip coloured by `style=`
 * rendered colourless under such a CSP).
 *
 * This rendered check is the rule: it reads the markup a build actually
 * emits, so it sees every way of writing one (React's `style={{…}}`, a spread
 * props object, `createElement(…, { style })`, Astro's `{style}` shorthand
 * and `<style define:vars>`). `evaluateTheming` applies it.
 */
export interface InlineStyle {
  state: string;
  tag: string;
  /** The attribute's value, as rendered. */
  style: string;
}

/**
 * The message `evaluateTheming` gives for an inline style. Its text is a
 * contract with @bundu/ui's synced copy of this runner, whose tests match it
 * exactly; the style's value is in `inlineStyles`, not in the message.
 */
const inlineStyleMessage = (state: string, tag: string) =>
  `[${state}] an inline style attribute on <${tag}> (needs style-src-attr 'unsafe-inline')`;

/** Every element, in every state, that carries a `style` attribute. */
export function inlineStyles(rendered: Rendered): InlineStyle[] {
  const out: InlineStyle[] = [];
  for (const [state, html] of Object.entries(rendered))
    for (const el of elements(doc(html)))
      if (el.attribs.style !== undefined)
        out.push({ state, tag: el.name, style: el.attribs.style });
  return out;
}

/** The CSP rule alone, with `evaluateTheming`'s messages. */
export function evaluateInlineStyles(rendered: Rendered): string[] {
  return inlineStyles(rendered).map((s) => inlineStyleMessage(s.state, s.tag));
}

// ─── The source scan: best effort, a backstop for the rendered check ────────
//
// It reports only what is unambiguous, so it never fails a build for a style
// that is not one: in .astro and .tsx a `style` attribute inside a tag's
// attribute list, or a `style` key in a call that makes an element; in .rs a
// `style` attribute of a lowercase element inside `rsx! { … }`. It catches an
// empty React `style={{}}`, which renders nothing, and a style no contract
// state renders. Anything it misses, the rendered check catches when a state
// renders it.

/** Skip a quoted string or template literal opening at `i`; returns the index after it. */
function skipJsString(src: string, i: number): number {
  const q = src.charAt(i);
  let j = i + 1;
  while (j < src.length && src.charAt(j) !== q) {
    if (src.charAt(j) === "\\") j += 1;
    j += 1;
  }
  return j + 1;
}

/** The end (exclusive) of a bracketed JS expression opening at `i`, strings respected. */
function skipJsBalanced(src: string, i: number): number {
  const open = src.charAt(i);
  const close = open === "(" ? ")" : open === "[" ? "]" : "}";
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const c = src.charAt(j);
    if (c === '"' || c === "'" || c === "`") {
      j = skipJsString(src, j);
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) return j + 1;
    }
    j += 1;
  }
  return src.length;
}

/** A `style` key of an object literal, quoted or not, in key position (`{ style`, `, "style":`). */
const STYLE_KEY = /[{,]\s*(["']?)style\1\s*[:,}]/;

/** Offsets of `style` attributes in the attribute lists of the tags in `src`. */
function markupStyleOffsets(src: string): number[] {
  const out: number[] = [];
  const tag = /<([A-Za-z][\w.:-]*)/g;
  for (let m = tag.exec(src); m; m = tag.exec(src)) {
    // A tag opens after a non-identifier: `Record<string, X>` and `a<b` are not tags.
    if (m.index > 0 && /[\w$)\]]/.test(src.charAt(m.index - 1))) continue;
    const name = m[1] ?? "";
    let i = m.index + m[0].length;
    while (i < src.length) {
      const c = src.charAt(i);
      if (c === ">" || src.startsWith("/>", i)) break;
      if (/\s/.test(c)) {
        i += 1;
        continue;
      }
      const at = i;
      if (c === "{") {
        // `{style}` shorthand, or `{...{ style: s }}` / `{...{ "style": s }}`.
        const end = skipJsBalanced(src, i);
        const inner = src.slice(i + 1, end - 1).trim();
        if (
          inner === "style" ||
          (/^\.\.\.\s*\{/.test(inner) && STYLE_KEY.test(inner.slice(3).trim()))
        )
          out.push(at);
        i = end;
        continue;
      }
      if (c === '"' || c === "'") {
        i = skipJsString(src, i);
        continue;
      }
      let j = i;
      while (j < src.length && !/[\s=>{"'`]/.test(src.charAt(j)) && !src.startsWith("/>", j))
        j += 1;
      if (j === i) j += 1;
      const attr = src.slice(i, j);
      let k = j;
      while (/\s/.test(src.charAt(k))) k += 1;
      let valued = false;
      if (src.charAt(k) === "=") {
        k += 1;
        while (/\s/.test(src.charAt(k))) k += 1;
        const v = src.charAt(k);
        valued = true;
        if (v === '"' || v === "'" || v === "`") k = skipJsString(src, k);
        else if (v === "{") k = skipJsBalanced(src, k);
        else while (k < src.length && !/[\s>]/.test(src.charAt(k))) k += 1;
        i = k;
      } else i = j;
      if (attr === "style" && valued) out.push(at);
      if (name === "style" && attr === "define:vars") out.push(at);
    }
  }
  return out;
}

/** Offsets of calls that make an element with a `style` prop, and of `setAttribute("style", …)`. */
function callStyleOffsets(src: string): number[] {
  const out: number[] = [];
  const call = /\b(?:createElement|cloneElement|jsxs?|jsxDEV|_jsxs?)\s*\(/g;
  for (let m = call.exec(src); m; m = call.exec(src)) {
    const open = m.index + m[0].length - 1;
    const args = src.slice(open, skipJsBalanced(src, open));
    if (STYLE_KEY.test(args)) out.push(m.index);
  }
  for (const m of src.matchAll(/\bsetAttribute\(\s*["'`]style["'`]/g)) out.push(m.index);
  return out;
}

/**
 * Rust source with comments blanked and every string literal's contents
 * blanked, at the same length (so an offset in it is an offset in `src`). A
 * string that is exactly `"style"` is kept, so the quoted attribute form
 * stays visible; raw strings are blanked whole.
 */
function rustCode(src: string): string {
  let out = "";
  let i = 0;
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  while (i < src.length) {
    if (src.startsWith("//", i)) {
      const end = src.indexOf("\n", i);
      const j = end === -1 ? src.length : end;
      out += blank(src.slice(i, j));
      i = j;
    } else if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      const j = end === -1 ? src.length : end + 2;
      out += blank(src.slice(i, j));
      i = j;
    } else if (/^r#*"/.test(src.slice(i, i + 8)) && !/\w/.test(src.charAt(i - 1))) {
      const hashes = /^r(#*)"/.exec(src.slice(i))?.[1] ?? "";
      const close = `"${hashes}`;
      const end = src.indexOf(close, i + 2 + hashes.length);
      const j = end === -1 ? src.length : end + close.length;
      out += blank(src.slice(i, j));
      i = j;
    } else if (src.charAt(i) === '"') {
      let j = i + 1;
      while (j < src.length && src.charAt(j) !== '"') {
        if (src.charAt(j) === "\\") j += 1;
        j += 1;
      }
      j += 1;
      const lit = src.slice(i, j);
      out += lit === '"style"' ? lit : `"${blank(lit.slice(1, -1))}"`;
      i = j;
    } else if (/^'(?:\\.|[^\\'])'/.test(src.slice(i, i + 4))) {
      const lit = /^'(?:\\.|[^\\'])'/.exec(src.slice(i))?.[0] ?? "''";
      out += blank(lit);
      i += lit.length;
    } else {
      out += src.charAt(i);
      i += 1;
    }
  }
  return out;
}

/** The index of the last non-whitespace character before `i`, not before `floor`. */
function lastNonSpace(code: string, i: number, floor: number): number {
  let j = i - 1;
  while (j > floor && /\s/.test(code.charAt(j))) j -= 1;
  return j;
}

/** The identifier that ends right before `i` (skipping whitespace), if any. */
function identBefore(code: string, i: number, floor: number): string | undefined {
  const end = lastNonSpace(code, i, floor) + 1;
  let start = end;
  while (start > floor + 1 && /[\w-]/.test(code.charAt(start - 1))) start -= 1;
  const ident = code.slice(start, end);
  return /^[A-Za-z_][\w-]*$/.test(ident) ? ident : undefined;
}

const RUST_KEYWORDS = new Set(["if", "else", "for", "in", "match", "move", "while", "loop", "async", "unsafe"]);

/**
 * Offsets of `style:` / `"style":` attributes on lowercase elements inside
 * `rsx! { … }`. A field (`pub style: …`), a binding, a parameter, a struct
 * literal (`Props { style: x }`), a component prop (`Card { style: x }`) and
 * a comment are not element attributes.
 */
function rsxStyleOffsets(src: string): number[] {
  const code = rustCode(src);
  const out: number[] = [];
  for (const m of code.matchAll(/\brsx!\s*[{([]/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const end = skipJsBalanced(code, open);
    // A stack of the element each `{` opens (null for an expression block).
    const stack: (string | null)[] = [];
    for (let i = open; i < end; i += 1) {
      const c = code.charAt(i);
      if (c === "{" || c === "(" || c === "[") {
        const ident = c === "{" ? identBefore(code, i, open) : undefined;
        stack.push(ident && !RUST_KEYWORDS.has(ident) ? ident : null);
      } else if (c === "}" || c === ")" || c === "]") stack.pop();
      else if (c === "s" || c === '"') {
        const hit = /^(?:style|"style")\s*:(?!:)/.exec(code.slice(i, i + 16));
        if (!hit || /[\w.]/.test(code.charAt(i - 1))) continue;
        const element = stack.at(-1);
        // An attribute starts an element's body or follows a `,`.
        const prev = code.charAt(lastNonSpace(code, i, open));
        if (element && /^[a-z]/.test(element) && (prev === "{" || prev === ","))
          out.push(i);
      }
    }
  }
  return out;
}

/**
 * The source scan, best effort (the rendered check is the rule): `line N: …`
 * for each line of an implementation's source (`.astro`, `.tsx` or `.rs`)
 * that writes an inline `style` unambiguously.
 */
export function inlineStylesInSource(
  source: string,
  kind: "astro" | "tsx" | "rs",
): string[] {
  const offsets =
    kind === "rs"
      ? rsxStyleOffsets(source)
      : [...markupStyleOffsets(source), ...callStyleOffsets(source)];
  const lines = source.split("\n");
  const seen = new Set<number>();
  for (const at of offsets) seen.add(source.slice(0, at).split("\n").length);
  return [...seen]
    .sort((a, b) => a - b)
    .map((n) => `line ${n}: an inline style (${(lines[n - 1] ?? "").trim()})`);
}

/**
 * Brand overlay rule: a component names no colour value and no brand
 * mineral. Colour comes from semantic tokens (`--primary`, `--ring`, …), so
 * the brand overlay is the only thing that changes it; minerals appear only
 * as declared status colours.
 *
 * CSP rule (see `inlineStyles`), in the same pass: no element carries an
 * inline `style` attribute. A colour value inside one fails as a colour too.
 * The messages are a contract with @bundu/ui's synced copy of this runner;
 * `__tests__/contracts/runner-theming.test.ts` pins them.
 */
export function evaluateTheming(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const failures: string[] = [];
  for (const [state, html] of Object.entries(rendered)) {
    for (const el of elements(doc(html))) {
      const cls = el.attribs.class ?? "";
      const style = el.attribs.style ?? "";
      if (el.attribs.style !== undefined)
        failures.push(inlineStyleMessage(state, el.name));
      if (/#[0-9a-fA-F]{3,8}\b/.test(cls) || /#[0-9a-fA-F]{3,8}\b/.test(style))
        failures.push(`[${state}] a literal hex colour on <${el.name}>`);
      if (
        /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/.test(style) ||
        /\b(?:rgb|hsl|oklch)\(/.test(cls)
      )
        failures.push(`[${state}] a literal colour function on <${el.name}>`);
      for (const m of cls.matchAll(MINERAL_CLASS)) {
        if (!contract.theming.statusColours.includes(m[1] ?? ""))
          failures.push(
            `[${state}] <${el.name}> names the mineral "${m[1]}" (${m[0].trim()}), which is not one of its declared status colours`,
          );
      }
    }
  }
  return failures;
}

/** Turn a state's fixture props into component props (`{ $url }` → URL). */
export function hydrate(
  props: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    out[k] =
      v !== null && typeof v === "object" && "$url" in v
        ? new URL(String((v as { $url: string }).$url))
        : v;
  }
  return out;
}

/** The prop names an .astro file's `interface Props` declares (null for `type Props = …`). */
export function declaredProps(source: string): string[] | null {
  const block = /interface Props \{([\s\S]*?)\n\}/.exec(source);
  if (!block) return null;
  return [...(block[1] ?? "").matchAll(/^\s{2}([A-Za-z_$][\w$]*)\??:/gm)].map(
    (m) => m[1] ?? "",
  );
}

/** The slot names an .astro file renders (`default` for the unnamed slot). */
export function declaredSlots(source: string): string[] {
  const names = new Set<string>();
  for (const m of source.matchAll(/<slot(?:\s+name="([^"]+)")?\s*\/>/g))
    names.add(m[1] ?? "default");
  return [...names].sort();
}
