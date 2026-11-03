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
import { isTag, type AnyNode, type Document, type Element } from "domhandler";
import { getChildren, textContent } from "domutils";
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
  // A size role (`h-control`, `h-field-sm`, `min-h-touch-min`…): the token layer sets it, so the
  // answer depends on the pointer. `prefix === "pointer-coarse:"` is a touch device; none is
  // desktop density (fine pointer, hover, >= 64rem).
  for (const t of own) {
    const m = /^(?:min-h|h|size)-([a-z-]+)$/.exec(t);
    const row = m ? ROLE_HEIGHTS[m[1] ?? ""] : undefined;
    if (row) return prefix === "pointer-coarse:" ? row[0] : row[1];
  }
  // A role utility with no `pointer-coarse:` variant still has a touch value: the token layer
  // gives it one. So on a coarse pointer an unprefixed role answers with its coarse height.
  if (prefix === "pointer-coarse:") {
    for (const t of tokens.filter((x) => !x.includes(":"))) {
      const m = /^(?:min-h|h|size)-([a-z-]+)$/.exec(t);
      const row = m ? ROLE_HEIGHTS[m[1] ?? ""] : undefined;
      if (row) return row[0];
    }
  }
  return null;
}

/**
 * The size roles' heights in px, `[coarse pointer, desktop density]`, by utility suffix
 * (`h-control` is `--spacing-control`). A copy of `lib/tokens/roles.source.ts` (the roles'
 * defaults and `DESKTOP_SIZES`) so this file stays free of imports; `__tests__/density.test.ts`
 * fails when the two disagree, and mzizi-rs/contract-eval holds the same table.
 */
export const ROLE_HEIGHTS: Readonly<Record<string, readonly [number, number]>> =
  {
    touch: [49, 36],
    "touch-min": [49, 49],
    control: [49, 36],
    "control-sm": [49, 32],
    "control-lg": [56, 40],
    "control-icon": [49, 36],
    "control-dense": [32, 28],
    field: [49, 49],
    "field-sm": [49, 49],
  };

/**
 * THE BUNDU FLOOR, as the runner holds it (owner ruling 2026-11-02): a copy of `BUNDU_FLOOR` in
 * `lib/tokens/roles.source.ts`, kept here so this file stays free of imports; `__tests__/density.test.ts`
 * fails when the two disagree, and mzizi-rs/contract-eval holds the same numbers.
 * `HIT_AREA_PX` is the hit region every interactive control keeps on every device, desktop included;
 * `VISIBLE_FINE_MIN_PX` is the smallest a control is DRAWN at desktop density.
 */
export const HIT_AREA_PX = 49;
export const VISIBLE_FINE_MIN_PX = 28;

/**
 * Roles the token layer's `hit-area` rule grows to HIT_AREA_PX with a pseudo-element (see `densityLayer()` in
 * render-globals-css.ts). Composite rows (`menuitem*`, `option`) are NOT here: a 49px overlay on a 28 to 36px
 * row would overlap its neighbours, so the token layer gives them `min-height` instead.
 */
const HIT_AREA_ROLES = new Set(["button", "tab", "switch"]);
const COMPOSITE_ROW_ROLES = new Set([
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
]);

const classOf = (el: Element) => el.attribs.class ?? "";
/** An element that draws its own `after:` pseudo-element: the hit-area rule steps aside (`:not([class*="after:"])`). */
const hasOwnAfter = (el: Element) => classOf(el).includes("after:");
/** An element that clips its overflow also clips a pseudo-element that extends past its box. */
const clips = (el: Element) =>
  /(?:^|[\s:])overflow(?:-[xy])?-(?:hidden|clip)(?:\s|$)/.test(classOf(el));
/** A composite row whose token-layer `min-height` is overridden by its own `min-h-*` utility. */
const ownMinHeight = (el: Element) => /(?:^|[\s:])min-h-/.test(classOf(el));

/**
 * An element the token layer's `hit-area` rule covers with a pseudo-element: a button, a `summary`, a button-like
 * role, or a `.hit-area` element, that carries no `after:` utility of its own and is not a calendar day
 * (`[data-day]`, a grid cell). Mirrors the selector in `densityLayer()`.
 */
export function carriesHitArea(el: Element): boolean {
  if (hasOwnAfter(el) || el.attribs["data-day"] !== undefined) return false;
  if (el.name === "button" || el.name === "summary") return true;
  if (HIT_AREA_ROLES.has(el.attribs.role ?? "")) return true;
  return classOf(el).split(/\s+/).includes("hit-area");
}

/** A composite row: the token layer gives it `min-height` at the hit area instead of a pseudo-element. */
export function isCompositeRow(el: Element): boolean {
  return COMPOSITE_ROW_ROLES.has(el.attribs.role ?? "");
}

/** Whether an element is an interactive control the Bundu hit-area floor applies to. */
export function isInteractive(el: Element): boolean {
  if (carriesHitArea(el) || isCompositeRow(el)) return true;
  if (el.name === "button" || el.name === "summary") return true;
  if (HIT_AREA_ROLES.has(el.attribs.role ?? "")) return true;
  if (el.name === "a") return el.attribs.href !== undefined;
  if (el.name === "input") return el.attribs.type !== "hidden";
  return el.name === "select" || el.name === "textarea";
}

/**
 * The hit region, in px, an interactive control has at one pointer. It is the drawn height, raised to
 * HIT_AREA_PX only where the token layer's rule provably does it: a button-like control with no `after:` utility
 * of its own and no overflow clipping (the pseudo-element), or a composite row with no `min-h-*` of its own
 * (`min-height`). The runner cannot see static positioning or a page without the stylesheet, so it assumes the
 * stylesheet is there; everything else is the drawn box.
 */
export function hitRegion(el: Element, drawn: number): number {
  if (isCompositeRow(el))
    return ownMinHeight(el) ? drawn : Math.max(drawn, HIT_AREA_PX);
  if (carriesHitArea(el) && !clips(el)) return Math.max(drawn, HIT_AREA_PX);
  return drawn;
}

/**
 * What a density row's control violates of the Bundu floor, as sentences (none for a row the runner cannot read:
 * `fine` null). `evaluateDensity` and mzizi-rs/contract-eval's `hit_violations` return the same list for the same
 * markup; `contracts/hit-region-cases.json` is the shared table both are tested against.
 */
export function hitViolations(
  el: Element,
  fine: number | null,
  coarse: number | null,
): string[] {
  if (fine === null || !isInteractive(el)) return [];
  const at = coarse ?? fine;
  const under: string[] = [];
  if (hitRegion(el, fine) < HIT_AREA_PX)
    under.push(
      `hit region is ${hitRegion(el, fine)}px on a fine pointer, below the ${HIT_AREA_PX}px Bundu floor`,
    );
  if (hitRegion(el, at) < HIT_AREA_PX)
    under.push(
      `hit region is ${hitRegion(el, at)}px on a coarse pointer, below the ${HIT_AREA_PX}px Bundu floor`,
    );
  if (carriesHitArea(el) && !clips(el) && fine < VISIBLE_FINE_MIN_PX)
    under.push(
      `drawn at ${fine}px on a fine pointer, below the ${VISIBLE_FINE_MIN_PX}px smallest a control is drawn`,
    );
  return under;
}

/**
 * Density rows whose control is a known, pinned gap against the Bundu floor: `<contract name>:<row part>`.
 * Each is a link, or a control drawn on a literal Tailwind height (`h-12`, 48px) or smaller than the desktop
 * minimum, that predates the floor. The set is pinned by `__tests__/density.test.ts`, which also holds it equal to the Rust copy;
 * the follow-up moves each onto a size role.
 */
export const HIT_AREA_GAPS: readonly string[] = [
  "app/button:sm",
  "app/command-palette:result row",
  "app/command-palette:search box",
  "app/confirm-action:typed confirm box",
  "app/data-table:menu item",
  "app/filter-bar:field",
  "app/form-field:input",
  "app/form-field:select",
  "app/info-tip:button",
  "app/input:input",
  "app/page-header:docs pill",
  "app/pagination:page link",
  "app/plan-summary:action link",
  "app/side-nav:nav row",
  "app/tier-status:evidence link",
  "app/toolbar-menu:choice",
  "app/toolbar:search box",
  "app/top-bar-action:action",
  "app/workspace-switcher:menu item",
  "discover/breadcrumb:crumb link",
  "discover/category-chip:chip",
  "discover/category-chips:chip",
  "discover/detail-actions:secondary action",
  "discover/detail-actions:share link",
  "discover/discover-card:app link",
  "discover/discover-section:see all",
  "discover/discover-shell:home link",
  "discover/discover-shell:nav link",
  "discover/load-more:link",
  "discover/meta-list:linked value",
  "discover/open-in-app:link",
  "discover/related-rail:see all",
  "site/hero:call to action",
  "site/hero:call to action (centred)",
  "site/social-icon:link",
  "ui/address-code:link",
  "ui/address-private-row:link",
  "ui/address-share-card:link",
];

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
        // The Bundu hit area (49px) is judged on a coarse pointer here; a fine pointer's hit region is
        // held by the density rows (`evaluateDensity`) and __tests__/density.test.ts.
        const cls = el.attribs.class ?? "";
        const px = heightOf(cls, "pointer-coarse:") ?? heightOf(cls);
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
      // The Bundu floor (owner ruling 2026-11-02): every interactive control keeps a HIT_AREA_PX hit
      // region on every device, desktop included. A button-like control keeps it through the
      // `hit-area` pseudo-element and may be drawn down to VISIBLE_FINE_MIN_PX; a native field or a
      // link has only its box, so it is drawn at the floor.
      const gap = HIT_AREA_GAPS.includes(`${contract.name}:${row.part}`);
      if (!gap)
        for (const u of hitViolations(el, fine, coarse))
          failures.push(`density ${row.part}: ${u}`);
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
 * and `<style define:vars>`). `evaluateInlineStyles` is the one place it is
 * applied, and `evaluateTheming` calls it. The registry's source-side
 * backstop, `contracts/source-scan.ts`, is not part of this runner.
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

/**
 * The CSP rule: one message per element with a `style` attribute, state by
 * state. `evaluateTheming` calls this for its CSP failures, so the rule and
 * its messages live in one place; `runner-theming.test.ts` pins both.
 */
export function evaluateInlineStyles(rendered: Rendered): string[] {
  return inlineStyles(rendered).map((s) => inlineStyleMessage(s.state, s.tag));
}

/**
 * Brand overlay rule: a component names no colour value and no brand
 * mineral. Colour comes from semantic tokens (`--primary`, `--ring`, …), so
 * the brand overlay is the only thing that changes it; minerals appear only
 * as declared status colours.
 *
 * CSP rule, in the same pass: each state's `evaluateInlineStyles` failures
 * come first, then its colour failures. A colour value inside a style
 * attribute fails as a colour too.
 * The messages are a contract with @bundu/ui's synced copy of this runner;
 * `__tests__/contracts/runner-theming.test.ts` pins them.
 */
export function evaluateTheming(
  contract: Contract,
  rendered: Rendered,
): string[] {
  const failures: string[] = [];
  for (const [state, html] of Object.entries(rendered)) {
    failures.push(...evaluateInlineStyles({ [state]: html }));
    for (const el of elements(doc(html))) {
      const cls = el.attribs.class ?? "";
      const style = el.attribs.style ?? "";
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
