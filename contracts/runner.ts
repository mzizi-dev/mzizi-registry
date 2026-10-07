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
 * This is the authoritative check: it reads the markup a build actually
 * emits, so it sees every way of writing one (React's `style={{…}}`, Astro's
 * `style`, `{style}` shorthand and `<style define:vars>`, a spread props
 * object, `createElement(…, { style })`). `evaluateTheming` applies it.
 */
function inlineStyle(state: string, el: Element): string | null {
  const style = el.attribs.style;
  return style === undefined
    ? null
    : `[${state}] an inline style attribute on <${el.name}> (style="${style}"; needs style-src-attr 'unsafe-inline')`;
}

/** The CSP rule alone: one line per element with a `style` attribute. */
export function evaluateInlineStyles(rendered: Rendered): string[] {
  const failures: string[] = [];
  for (const [state, html] of Object.entries(rendered))
    for (const el of elements(doc(html))) {
      const found = inlineStyle(state, el);
      if (found) failures.push(found);
    }
  return failures;
}

/**
 * Inline `style` written in source, in element-attribute positions only, so
 * `const style = {…}`, `let style: String` or `fn Foo(style: Option<String>)`
 * do not match. A backstop for what no contract state renders (and for an
 * empty React `style={{}}`, which renders nothing); the rendered rule is the
 * guarantee. Comments are not stripped (stripping them without a real
 * tokenizer blanks code): a commented-out `style="…"` must go too, and prose
 * names the attribute without a value (`style=`).
 */
const MARKUP_STYLE: RegExp[] = [
  // `style="…"`, `style='…'`, `style={…}` (React's `style={{…}}`, Astro's object form).
  /(?<![\w$.:-])(?<!\b(?:const|let|var)\s+)style=(?=["'{])/,
  // Astro's shorthand attribute `<span {style}>` (not `const { style } = …`).
  /(?:^|\s)\{\s*style\s*\}(?=\s*\/?>|\s*$|\s+[\w{])/,
  // A spread object literal: `{...{ style: s }}`, `{...{ style }}`.
  /\{\s*\.\.\.\s*\{[^}]*(?<![\w$])style\s*[:,}]/,
  // `createElement("span", { style })` or `{ style: … }`.
  /createElement\([^;]*[{,]\s*style\s*[:,}]/,
  // `<style define:vars={…}>` compiles to a style attribute on every element.
  /<style\b[^>]*\bdefine:vars\b/,
  /setAttribute\(\s*["'`]style["'`]/,
];
const RSX_STYLE: RegExp[] = [
  // Dioxus rsx! `style: "…"`, `style: {…}`, `style: f(…)`, `style: format!(…)`,
  // `style: if …`, `style: value,`; not a binding, a parameter or a field type.
  /(?<![\w.])(?<!\blet\s+(?:mut\s+)?)style\s*:\s*(?:["{]|(?:if|match)\b|[a-z_][\w:]*!?\s*\(|(?!(?:[iu](?:8|16|32|64|128|size)|f32|f64|bool|char|str)\b)[a-z_]\w*\s*(?:,|\}|$))/,
  // The quoted attribute form `"style": …`.
  /"style"\s*:/,
];

/**
 * The CSP rule on an implementation's source (`.astro`, `.tsx` or `.rs`):
 * `line N: …` for each line that writes an inline `style`.
 */
export function inlineStylesInSource(
  source: string,
  kind: "astro" | "tsx" | "rs",
): string[] {
  const patterns = kind === "rs" ? RSX_STYLE : MARKUP_STYLE;
  const failures: string[] = [];
  source.split("\n").forEach((line, i) => {
    if (patterns.some((re) => re.test(line)))
      failures.push(`line ${i + 1}: an inline style (${line.trim()})`);
  });
  return failures;
}

/**
 * Brand overlay rule: a component names no colour value and no brand
 * mineral. Colour comes from semantic tokens (`--primary`, `--ring`, …), so
 * the brand overlay is the only thing that changes it; minerals appear only
 * as declared status colours. Applies the CSP rule (`evaluateInlineStyles`)
 * in the same pass, so a colour in a `style` attribute fails there.
 */
export function evaluateTheming(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const failures: string[] = [];
  for (const [state, html] of Object.entries(rendered)) {
    for (const el of elements(doc(html))) {
      const style = inlineStyle(state, el);
      if (style) failures.push(style);
      const cls = el.attribs.class ?? "";
      if (/#[0-9a-fA-F]{3,8}\b/.test(cls))
        failures.push(`[${state}] a literal hex colour on <${el.name}>`);
      if (/\b(?:rgb|hsl|oklch)\(/.test(cls))
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
