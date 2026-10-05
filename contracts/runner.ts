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
 *   Predicates: is "<s>", contains "<s>", not_empty, in "<a>" "<b>" …,
 *   uses "--token" (the class reads var(--token…)).
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

/** Parse rendered HTML; entities in text and attributes are decoded. */
export function doc(html: string): Document {
  return parseDocument(html, {
    decodeEntities: true,
    lowerCaseAttributeNames: false,
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

function stringsAfter(rest: string): string[] {
  return [...rest.matchAll(/"([^"]*)"/g)].map((m) => m[1] ?? "");
}

function predicate(
  value: string | undefined,
  pred: string,
  what: string,
): Outcome {
  const v = value ?? "";
  if (pred.startsWith("is ")) {
    const [want] = stringsAfter(pred);
    if (want === undefined)
      return fail(
        `${what}: \`${pred}\` is not evaluable (is takes a quoted string)`,
      );
    return value === want
      ? pass
      : fail(`${what} is ${JSON.stringify(value ?? null)}, not "${want}"`);
  }
  if (pred.startsWith("contains ")) {
    const [want] = stringsAfter(pred);
    if (want === undefined)
      return fail(`${what}: \`${pred}\` is not evaluable`);
    return v.includes(want) ? pass : fail(`${what} does not contain "${want}"`);
  }
  if (pred === "not_empty")
    return v.trim() !== "" ? pass : fail(`${what} is empty`);
  if (pred.startsWith("in ")) {
    const set = stringsAfter(pred);
    return set.includes(v)
      ? pass
      : fail(`${what} is "${v}", not one of ${set.join(", ")}`);
  }
  if (pred.startsWith("uses ")) {
    const [token] = stringsAfter(pred);
    if (!token?.startsWith("--"))
      return fail(
        `${what}: \`${pred}\` is not evaluable (uses takes "--token")`,
      );
    return v.includes(`var(${token}`)
      ? pass
      : fail(`${what} does not read var(${token})`);
  }
  return fail(
    `${what}: predicate \`${pred}\` is not one this runner evaluates`,
  );
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
    const el = root(html);
    const value = el.attribs[ROOT_ATTR[subject ?? ""] ?? ""];
    return predicate(value, pred ?? "", `${subject} (state "${state}")`);
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
 * Brand overlay rule: a component names no colour value and no brand
 * mineral. Colour comes from semantic tokens (`--primary`, `--ring`, …), so
 * the brand overlay is the only thing that changes it; minerals appear only
 * as declared status colours.
 *
 * CSP rule: no element carries an inline `style` attribute. Custom
 * properties and sizes go through classes, data attributes or SVG geometry,
 * so a page's Content-Security-Policy keeps `style-src 'self'` with no
 * `style-src-attr 'unsafe-inline'`.
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
        failures.push(
          `[${state}] an inline style attribute on <${el.name}> (needs style-src-attr 'unsafe-inline')`,
        );
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
