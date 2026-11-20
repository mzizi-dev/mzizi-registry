// THE SPACING FLOOR (owner, 2026-11-04, #617): minimum padding, gaps and leading that nothing can go under.
// One definition, `BUNDU_FLOOR.spacing` in lib/tokens/roles.source.ts; every test here reads it and fails when
// a generated default, a density layer, a brand block or a copy of the floor breaks it.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { isTag, type Element } from "domhandler";
import { parseDocument } from "htmlparser2";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type SpacingLayer,
  COMPONENT_LAYERS,
  SPACING_LAYER_FLOORS,
  GAP_FLOOR_PX,
  INSET_FLOOR_PX,
  LEADING_FLOOR,
  SPACING_GAPS,
  spaceOf,
  spacingViolations,
} from "../contracts/runner";
import { brandMeta } from "../lib/tokens/brand.source";
import { primitives } from "../lib/tokens";
import {
  BUNDU_FLOOR,
  DENSITY_DESKTOP_QUERY,
  DENSITY_TABLET_QUERY,
  ROLES,
} from "../lib/tokens/roles.source";

const ROOT = join(__dirname, "..");
const CSS = readFileSync(
  join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8",
);
const normalised = CSS.replace(/\s+/g, " ");
const px = (v: string) =>
  v.endsWith("rem") ? parseFloat(v) * 16 : parseFloat(v);
const decls = (block: string) =>
  Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1]!,
      m[2]!.trim(),
    ]),
  );
function body(header: string): string {
  const start = CSS.indexOf(header);
  expect(start, header).toBeGreaterThan(-1);
  return CSS.slice(start, CSS.indexOf("\n}", start));
}
const { spacing } = BUNDU_FLOOR;
/** The controls layer's dense inline floor (`--space-control-x-dense`, 12px): the least a control's label is inset. */
const CONTROL_DENSE_PX = BUNDU_FLOOR.spacing.layers.controlX.dense;

describe("BUNDU_FLOOR.spacing: the one definition", () => {
  it("holds the owner's numbers, all on the 7px unit", () => {
    expect(spacing).toEqual({
      layers: {
        pageX: { px: 17 },
        pageXWide: { px: 28, dense: 21 },
        section: { px: 49, dense: 28 },
        containerPadding: { px: 28, dense: 21 },
        containerGap: { px: 21, dense: 14 },
        cardPadding: { px: 21, dense: 14 },
        cardGap: { px: 14, dense: 7 },
        cardStack: { px: 7, dense: 7 },
        controlX: { px: 17, dense: 12 },
        fieldX: { px: 17, dense: 12 },
        controlGap: { px: 9, dense: 7 },
        controlBetween: { px: 9, dense: 9 },
        chipX: { px: 12, dense: 9 },
        pillX: { px: 9, dense: 5 },
        pillGap: { px: 5, dense: 3 },
        labelGap: { px: 7, dense: 5 },
      },
      insetPx: 14,
      gapPx: 7,
      controlGapPx: 9,
      labelGapPx: 7,
      itemGapPx: 7,
      leadingBody: 1.5,
    });
    // the fallback floors for a component with no known layer are today's 14 and 7 (owner 2026-11-19: never weaker)
    expect(spacing.insetPx).toBe(14);
    expect(spacing.gapPx).toBe(7);
    // the label floor is the global 7 (layer-blind guards read it); its dense step is confirmed by the owner (2026-11-20)
    expect(spacing.labelGapPx).toBe(spacing.layers.labelGap.px);
    expect(spacing.itemGapPx).toBe(spacing.layers.cardGap.dense);
    expect(spacing.controlGapPx).toBe(spacing.layers.controlBetween.px);
    // the Mzizi number rule (owner 2026-11-19): a multiple of 3, a multiple of 7, or a prime
    const isPrime = (n: number) => n > 1 && [...Array(Math.floor(Math.sqrt(n)) - 1)].every((_, i) => n % (i + 2) !== 0);
    const mzizi = (n: number) => n % 3 === 0 || n % 7 === 0 || isPrime(n);
    for (const [name, l] of Object.entries(spacing.layers)) {
      expect(mzizi(l.px), `${name} default ${l.px}`).toBe(true);
      if ("dense" in l) {
        expect(mzizi(l.dense), `${name} dense ${l.dense}`).toBe(true);
        expect(l.dense, `${name}: dense never above default`).toBeLessThanOrEqual(l.px);
      }
    }
  });
  it("is what canon (/v1/brand accessibility) carries", () => {
    const a = brandMeta.accessibility;
    expect(a.minInset).toBe(spacing.insetPx);
    expect(a.minControlGap).toBe(spacing.controlGapPx);
    expect(a.minLabelGap).toBe(spacing.labelGapPx);
    expect(a.minItemGap).toBe(spacing.itemGapPx);
    expect(a.minBodyLeading).toBe(spacing.leadingBody);
  });
  it("carries the pointer-aware desktop tier in canon too", () => {
    const a = brandMeta.accessibility;
    expect(a.minTouchTargetPointerFine).toBe(BUNDU_FLOOR.pointerFine.hitAreaPx);
    expect(a.bodyPxPointerFine).toBe(BUNDU_FLOOR.pointerFine.bodyPx);
    expect(a.minTouchTarget).toBe(BUNDU_FLOOR.hitAreaPx);
  });
  it("is what /v1/tokens (lib/tokens primitives) carries", () => {
    const f = primitives.spacingFloor;
    expect(f.inset.value).toBe(`${spacing.insetPx}px`);
    expect(f.gap.value).toBe(`${spacing.gapPx}px`);
    expect(f.controlGap.value).toBe(`${spacing.controlGapPx}px`);
    expect(f.labelGap.value).toBe(`${spacing.labelGapPx}px`);
    expect(f.itemGap.value).toBe(`${spacing.itemGapPx}px`);
    expect(f.leadingBody.value).toBe(`${spacing.leadingBody}`);
  });
  it("is two fixed size roles, which no brand pack can move", () => {
    const by = Object.fromEntries(ROLES.map((r) => [r.name, r]));
    for (const [name, want] of [
      ["spacing-inset-floor", spacing.insetPx],
      ["spacing-gap-floor", spacing.gapPx],
    ] as const) {
      expect((by[name]!.default as { px: number }).px, name).toBe(want);
      expect(by[name]!.fixed, name).toBe(true);
    }
  });
});

describe("the stylesheet: --inset-floor, --gap-floor, --leading-floor", () => {
  const root = decls(body(":root {"));
  it("declares the three variables at the floor", () => {
    expect(px(root["--inset-floor"]!)).toBe(spacing.insetPx);
    expect(px(root["--gap-floor"]!)).toBe(spacing.gapPx);
    expect(Number(root["--leading-floor"]!.split(" ")[0])).toBe(
      spacing.leadingBody,
    );
  });
  it("registers the two size roles on the variables, so one opt-out moves both", () => {
    expect(normalised).toMatch(
      /--spacing-inset-floor: var\( ?--inset-floor ?\)/,
    );
    expect(normalised).toMatch(/--spacing-gap-floor: var\( ?--gap-floor ?\)/);
  });
  it("no density layer lowers a floor", () => {
    for (const q of [DENSITY_TABLET_QUERY, DENSITY_DESKTOP_QUERY]) {
      const keys = Object.keys(decls(body(`@media ${q} {`)));
      for (const k of ["--inset-floor", "--gap-floor", "--leading-floor"])
        expect(keys, `${q} must not move ${k}`).not.toContain(k);
    }
  });
  it("the default body line height meets the leading floor", () => {
    expect(Number(decls(body(":root {"))["--lh-body"])).toBeGreaterThanOrEqual(
      spacing.leadingBody,
    );
    expect(Number(root["--lh-small"])).toBeGreaterThanOrEqual(
      spacing.leadingBody,
    );
  });
  it("only the legacy opt-out steps out of the floor", () => {
    const legacy = decls(body(':root[data-mzizi-sizes="legacy"] {'));
    expect(px(legacy["--inset-floor"]!)).toBe(0);
    expect(px(legacy["--gap-floor"]!)).toBe(0);
    expect(Number(legacy["--leading-floor"])).toBe(1);
  });
});

describe("the rendered geometry guard spec", () => {
  const g = JSON.parse(
    readFileSync(join(ROOT, "contracts/spacing-geometry.json"), "utf8"),
  ) as {
    floor: Record<string, number>;
    measure: { id: string; min: string }[];
    stress: Record<string, number | string>;
  };
  it("carries the floor, equal to BUNDU_FLOOR.spacing", () => {
    expect(g.floor).toEqual(spacing);
  });
  it("measures every floor and names its minimum from the floor", () => {
    expect(g.measure.map((m) => m.id)).toEqual([
      "control-gap",
      "label-gap",
      "item-gap",
      "text-inset",
      "body-leading",
    ]);
    for (const m of g.measure) expect(g.floor, m.id).toHaveProperty(m.min);
  });
  it("stresses WCAG 1.4.12: line height 1.5, paragraph spacing 2x, letter 0.12em, word 0.16em", () => {
    expect(g.stress.lineHeight).toBe(1.5);
    expect(g.stress.paragraphSpacingEm).toBe(2);
    expect(g.stress.letterSpacingEm).toBe(0.12);
    expect(g.stress.wordSpacingEm).toBe(0.16);
  });
});

describe("the base layer enforces the floor on a component with no padding", () => {
  it("sets body leading from --leading-floor", () => {
    expect(normalised).toMatch(
      /body \{ line-height: max\(var\(--lh-body\), var\(--leading-floor\)\);/,
    );
  });
  it("insets a bare control's label, inline axis, at the controls layer's dense floor", () => {
    expect(normalised).toMatch(
      /\) \{ padding-inline: var\(--space-control-x-dense\); \}/,
    );
    for (const sel of ["button", '[role="button"]', "select", "textarea"])
      expect(normalised, sel).toContain(sel);
  });
  it("insets a bare text surface (no structured children), both axes, at the cards and containers dense floors", () => {
    expect(normalised).toMatch(/\) \{ padding: var\(--space-card-dense\); \}/);
    expect(normalised).toMatch(/\) \{ padding: var\(--space-container-dense\); \}/);
    expect(normalised).toContain('[data-slot="card"]');
  });
  it("gives list, group and toolbar containers a --gap-floor gap", () => {
    expect(normalised).toMatch(/\) \{ gap: var\(--gap-floor\); \}/);
    expect(normalised).toContain('[role="toolbar"]');
  });
  it("is in the base layer, so a utility is the author's own value", () => {
    const at = CSS.indexOf("THE SPACING FLOOR");
    expect(at).toBeGreaterThan(-1);
    expect(CSS.slice(at, at + 4000)).toContain("@layer base {");
  });
});

describe("the platform files carry the spacing floor", () => {
  it("every platform file has the inset and gap roles at the fallback floors (14 and 7)", () => {
    for (const f of [
      "swift.swift",
      "kotlin.kt",
      "python.py",
      "react-native.ts",
      "arkts.ets",
      "rust.rs",
    ]) {
      const src = readFileSync(
        join(ROOT, `components/registry/n1-tokens/mzizi-tokens-${f}`),
        "utf8",
      );
      expect(src, `${f} inset`).toMatch(
        new RegExp(
          `spacing_?inset_?floor\\W+(?:[A-Za-z0-9]+\\W+)?${spacing.insetPx}\\b`,
          "i",
        ),
      );
      expect(src, `${f} gap`).toMatch(
        new RegExp(
          `spacing_?gap_?floor\\W+(?:[A-Za-z0-9]+\\W+)?${spacing.gapPx}\\b`,
          "i",
        ),
      );
    }
  });
});

// ─── The contract runner, and its Rust twin ─────────────────────────────────────────────────

describe("the contract runner holds the spacing floor", () => {
  it("an unknown layer is an error, not a silent fallback (the Rust evaluator panics with the same sentence)", () => {
    const el = parseDocument('<div class="flex gap-2"><span>a</span><span>b</span></div>').children[0] as Element;
    expect(() => spacingViolations(el, "nonsense" as SpacingLayer)).toThrow('unknown spacing layer "nonsense"');
  });
  it("keeps a copy of BUNDU_FLOOR.spacing, equal to the source", () => {
    expect(INSET_FLOOR_PX).toBe(spacing.insetPx);
    expect(GAP_FLOOR_PX).toBe(spacing.gapPx);
    expect(LEADING_FLOOR).toBe(spacing.leadingBody);
  });
  it("reads spacing utilities on the 4px scale", () => {
    expect(spaceOf("1.75")).toBe(7);
    expect(spaceOf("3.5")).toBe(14);
    expect(spaceOf("px")).toBe(1);
    expect(spaceOf("[7px]")).toBe(7);
    expect(spaceOf("[0.875rem]")).toBe(14);
    expect(spaceOf("md")).toBe(12);
    expect(spaceOf("[var(--x)]")).toBeNull();
    expect(spaceOf("floor")).toBeNull();
  });
  it("answers every shared case as mzizi-rs/contract-eval does", () => {
    const table = JSON.parse(
      readFileSync(join(ROOT, "contracts/spacing-cases.json"), "utf8"),
    ) as {
      cases: {
        name: string;
        html: string;
        violations: number;
        layer?: SpacingLayer;
      }[];
    };
    expect(table.cases.length).toBeGreaterThan(15);
    for (const c of table.cases) {
      const first = parseDocument(c.html).children.find((n): n is Element =>
        isTag(n),
      );
      expect(first, c.name).toBeDefined();
      expect(spacingViolations(first!, c.layer).length, c.name).toBe(
        c.violations,
      );
    }
  });
  it("holds the shell and page controls #625 named to the control floor, dense 12px inline (owner 2026-11-19)", () => {
    // Source-level and precise: a bare `px-<n>` (no variant) under INSET_FLOOR_PX on the line that carries the control's
    // classes. The rendered contracts cannot see these (the label sits in a child span), so the source is pinned.
    // Block-axis padding and the fixed heights (45px touch hit regions) are exempt, as the rule says.
    const N6 = "components/registry/n6-pages";
    const N7 = "components/registry/n7-shell";
    const controls: [string, string][] = [
      ["app-toolbar-menu", "<summary"],
      ["app-data-table", "<summary"],
      ["app-quick-search", "transition-colors hover:bg-muted"],
      ["app-top-bar-action", "inline-flex h-control-sm"],
      ["app-command-palette", "gap-2.5 rounded-sm"],
      ["app-command-palette", "text-caption font-medium text-muted-foreground"],
      ["app-side-nav", "nav-group-label"],
    ];
    for (const [name, anchor] of controls) {
      for (const ext of ["astro", "tsx"]) {
        const dir =
          name.startsWith("app-toolbar") || name === "app-data-table" ? N6 : N7;
        const file = `${dir}/${name}.${ext}`;
        const lines = readFileSync(join(ROOT, file), "utf8")
          .split("\n")
          .filter((l) => l.includes(anchor));
        expect(lines.length, `${file}: ${anchor}`).toBeGreaterThan(0);
        for (const line of lines) {
          const under = (
            line.match(/(?<![\w:[-])px-(?:\d+(?:\.\d+)?|px)(?![\w.-])/g) ?? []
          ).filter(
            (t) =>
              (spaceOf(t.slice(3)) ?? CONTROL_DENSE_PX) < CONTROL_DENSE_PX,
          );
          expect(under, `${file}: ${anchor}`).toEqual([]);
        }
      }
    }
  });
  it("holds a label chip or pill on its inline axis, and says so (#625)", () => {
    const run = (html: string, layer?: SpacingLayer) =>
      spacingViolations(
        parseDocument(html).children.find((n): n is Element => isTag(n))!,
        layer,
      );
    // A pill at its default inline inset (px-pill-x, 9px) with a line-height block axis, or a fixed height, holds.
    expect(
      run('<p class="w-fit rounded-full border px-2.5 py-1">Phase 0</p>', "pills"),
    ).toEqual([]);
    expect(
      run(
        '<span class="inline-flex h-6 rounded-md border px-3.5 py-0.5">B</span>',
        "pills",
      ),
    ).toEqual([]);
    // Under the pill's dense inline floor (5px) fails, whatever the block axis (owner 2026-11-19: the pills layer).
    expect(
      run('<p class="w-fit rounded-full border px-1 py-1">Phase 0</p>', "pills"),
    ).toHaveLength(1);
    expect(
      run(
        '<span class="inline-flex h-6 rounded-md border px-0.5 py-0.5">B</span>',
        "pills",
      ),
    ).toHaveLength(1);
    // With no known layer the 14px fallback applies: the same 10px pill is under it.
    expect(
      run('<p class="w-fit rounded-full border px-2.5 py-1">Phase 0</p>'),
    ).toHaveLength(1);
    // The rule is written where people read the floor.
    const docs = readFileSync(join(ROOT, "docs/sizes-and-density.md"), "utf8");
    expect(docs).toMatch(/label chip or pill is held on its inline axis/);
    const src = readFileSync(join(ROOT, "lib/tokens/roles.source.ts"), "utf8");
    expect(src).toMatch(/label chip or pill/);
  });
  it("pins the exceptions equal to the Rust copy, each with a reason", () => {
    const rs = readFileSync(
      join(ROOT, "mzizi-rs/contract-eval/contract_eval.rs"),
      "utf8",
    );
    const block = /pub const SPACING_GAPS: &\[&str\] = &\[([\s\S]*?)\];/.exec(
      rs,
    )![1]!;
    const rust = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]!).sort();
    expect(rust).toEqual(Object.keys(SPACING_GAPS).sort());
    for (const [k, why] of Object.entries(SPACING_GAPS))
      expect(why.length, k).toBeGreaterThan(30);
  });
  it("an exception names a class that its own contract's components still carry", () => {
    const all = new Map<string, string[]>();
    (function walk(d: string) {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx|astro|rs)$/.test(f))
          all.set(f.replace(/\.[a-z]+$/, ""), [
            ...(all.get(f.replace(/\.[a-z]+$/, "")) ?? []),
            readFileSync(p, "utf8"),
          ]);
      }
    })(join(ROOT, "components/registry"));
    // markdown-renderer's classes live in its shared parser, markdown-parse.ts (not walked above,
    // which reads .tsx, .astro and .rs), which its .tsx and .astro import: a class there is its class.
    all.set("markdown-renderer", [
      ...(all.get("markdown-renderer") ?? []),
      readFileSync(join(ROOT, "components/registry/n2-primitives/markdown-parse.ts"), "utf8"),
    ]);
    for (const key of Object.keys(SPACING_GAPS)) {
      const [name, ...rest] = key.split(":");
      const c = JSON.parse(
        readFileSync(join(ROOT, `contracts/${name}.contract.json`), "utf8"),
      ) as { implementations: Record<string, { registry?: string }> };
      const src = Object.values(c.implementations)
        .flatMap((i) => all.get(i?.registry ?? "") ?? [])
        .join("\n");
      expect(
        src,
        `${key} is stale: its components no longer carry the class`,
      ).toContain(rest.join(":"));
    }
  });
});

// ─── The layer-aware checker: one table, in TypeScript and in Rust ──────────────────────────

const isSpace = (c: string | undefined): boolean => c !== undefined && /\s/.test(c);

/** Index of the last non-whitespace character at or before `i` (-1 when there is none). */
function skipSpaceBack(s: string, i: number): number {
  let j = i;
  while (j >= 0 && isSpace(s[j])) j--;
  return j;
}

/**
 * Reads the `"contract" | "contract" => Some("layer")` arms of a Rust match. Each `=>` that is
 * followed by `Some("layer")` takes the run of quoted names directly before it, walking back over
 * whitespace and optional `|` separators. A plain loop, not a regex with a nested quantifier.
 */
function rustComponentLayers(fn: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (let arrow = fn.indexOf("=>"); arrow !== -1; arrow = fn.indexOf("=>", arrow + 2)) {
    const layer = /^\s*\{?\s*Some\("(\w+)"\)/.exec(fn.slice(arrow + 2));
    if (!layer) continue;
    const names: string[] = [];
    let i = skipSpaceBack(fn, arrow - 1);
    while (fn[i] === '"') {
      const open = i === 0 ? -1 : fn.lastIndexOf('"', i - 1);
      const name = open === -1 ? "" : fn.slice(open + 1, i);
      if (!/^[\w/-]+$/.test(name)) break;
      names.unshift(name);
      i = skipSpaceBack(fn, open - 1);
      if (fn[i] === "|") i = skipSpaceBack(fn, i - 1);
    }
    for (const name of names) out[name] = layer[1]!;
  }
  return out;
}

describe("the layer-aware checker holds the same table in the runner and the Rust evaluator", () => {
  const rs = readFileSync(join(ROOT, "mzizi-rs/contract-eval/contract_eval.rs"), "utf8");
  it("every COMPONENT_LAYERS entry is in component_layer(), with the same layer", () => {
    const from = rs.indexOf("pub fn component_layer");
    const fn = rs.slice(from, rs.indexOf("\n}\n", from));
    const rustMap = rustComponentLayers(fn);
    expect(rustMap).toEqual(COMPONENT_LAYERS);
  });
  it("every layer's padding floor in layer_padding_floor() is the runner's", () => {
    for (const [layer, f] of Object.entries(SPACING_LAYER_FLOORS)) {
      const m = new RegExp(`"${layer}" => Some\\((\\d+)\\.0\\)`).exec(rs);
      expect(Number(m?.[1]), layer).toBe(f.padding);
    }
  });
  it("the between-controls and pill gap constants are the runner's", () => {
    expect(rs).toMatch(new RegExp(`CONTROLS_BETWEEN_PX: f32 = ${SPACING_LAYER_FLOORS.controls.between}\\.0`));
    expect(rs).toMatch(new RegExp(`PILLS_GAP_PX: f32 = ${SPACING_LAYER_FLOORS.pills.gap}\\.0`));
  });
});

// ─── Every registry component: the lint-style ratchet ───────────────────────────────────────
//
// The contract runner reads rendered markup, so it covers the components under a contract. This reads the
// SOURCE of every registry component for the three things that are wrong wherever they sit: a gap under 7px
// (`gap-0`, `gap-px`, `gap-1`, `space-y-1`), a zero-padding reset (`p-0`, `px-0`, `py-0`...) and a negative
// margin. Each is counted per file against `spacing-floor-baseline.json`, which holds what predates the floor:
// a file may not exceed its baseline, and a file below it must lower it, so the list only shrinks. A line that
// carries `spacing-floor: exception <reason>` (or follows one) is not counted. Regenerate with
// `UPDATE_SPACING_BASELINE=1 pnpm vitest run __tests__/spacing-floor.test.ts`.

const BASELINE_FILE = join(__dirname, "spacing-floor-baseline.json");
type Counts = { gap?: number; padZero?: number; negMargin?: number };

function scanSource(src: string): Counts {
  const counts: Counts = {};
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (
      /spacing-floor: exception \S/.test(line) ||
      /spacing-floor: exception \S/.test(lines[i - 1] ?? "")
    )
      return;
    for (const m of line.matchAll(
      /(?<![\w.[-])((?:[^\s"'`]+:)?)(-?)(gap-x|gap-y|gap|space-x|space-y|px|py|pt|pb|pl|pr|ps|pe|p|mx|my|mt|mb|ml|mr|ms|me|m)-(px|\d+(?:\.\d+)?)(?![\w.[%-])/g,
    )) {
      const [, , neg, kind, v] = m as unknown as [
        string,
        string,
        string,
        string,
        string,
      ];
      const px = spaceOf(v);
      if (px === null) continue;
      if (neg && kind.startsWith("m") && px > 0)
        counts.negMargin = (counts.negMargin ?? 0) + 1;
      else if (!neg && /^(gap|space)/.test(kind) && px < GAP_FLOOR_PX)
        counts.gap = (counts.gap ?? 0) + 1;
      else if (!neg && /^p/.test(kind) && px === 0)
        counts.padZero = (counts.padZero ?? 0) + 1;
    }
  });
  return counts;
}

describe("every registry component: gaps, zero padding and negative margins are ratcheted", () => {
  const files: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx|astro|rs|ts)$/.test(f)) files.push(p);
    }
  })(join(ROOT, "components/registry"));
  const now: Record<string, Counts> = {};
  for (const f of files) {
    const c = scanSource(readFileSync(f, "utf8"));
    if (Object.keys(c).length) now[f.slice(ROOT.length + 1)] = c;
  }
  if (process.env.UPDATE_SPACING_BASELINE)
    writeFileSync(BASELINE_FILE, JSON.stringify(now, null, 2) + "\n");
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Record<
    string,
    Counts
  >;

  it("no file has more than its baseline, so nothing new goes under the floor", () => {
    const over: string[] = [];
    for (const [f, c] of Object.entries(now))
      for (const k of ["gap", "padZero", "negMargin"] as const)
        if ((c[k] ?? 0) > (baseline[f]?.[k] ?? 0))
          over.push(`${f}: ${k} ${c[k]} > baseline ${baseline[f]?.[k] ?? 0}`);
    expect(over).toEqual([]);
  });
  it("no baseline is stale: a file that improved lowers its entry", () => {
    const stale: string[] = [];
    for (const [f, b] of Object.entries(baseline))
      for (const k of ["gap", "padZero", "negMargin"] as const)
        if ((b[k] ?? 0) > (now[f]?.[k] ?? 0))
          stale.push(`${f}: ${k} baseline ${b[k]} > ${now[f]?.[k] ?? 0}`);
    expect(stale).toEqual([]);
  });
  it("the scanner finds what it should and honours an exception comment", () => {
    expect(scanSource('<div className="flex gap-1 p-0 -mx-2">')).toEqual({
      gap: 1,
      padZero: 1,
      negMargin: 1,
    });
    // the 7px fallback floor is a boundary: 6px is under it, 8px holds
    expect(scanSource('<div className="flex gap-1.5">')).toEqual({ gap: 1 });
    expect(scanSource('<div className="flex gap-2">')).toEqual({});
    expect(scanSource('<div className="flex gap-2 p-3.5">')).toEqual({});
    expect(
      scanSource(
        '// spacing-floor: exception hairline grid\n<div className="grid gap-px">',
      ),
    ).toEqual({});
  });
});
