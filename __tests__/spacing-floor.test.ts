// THE SPACING FLOOR (owner, 2026-11-04, #617): minimum padding, gaps and leading that nothing can go under.
// One definition, `BUNDU_FLOOR.spacing` in lib/tokens/roles.source.ts; every test here reads it and fails when
// a generated default, a density layer, a brand block or a copy of the floor breaks it.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { isTag, type Element } from "domhandler";
import { parseDocument } from "htmlparser2";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
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

describe("BUNDU_FLOOR.spacing: the one definition", () => {
  it("holds the owner's numbers, all on the 7px unit", () => {
    expect(spacing).toEqual({
      insetPx: 14,
      controlGapPx: 7,
      labelGapPx: 7,
      itemGapPx: 7,
      leadingBody: 1.5,
    });
    expect(spacing.insetPx).toBe(2 * BUNDU_FLOOR.unitPx);
    for (const k of ["controlGapPx", "labelGapPx", "itemGapPx"] as const)
      expect(spacing[k]).toBe(BUNDU_FLOOR.unitPx);
  });
  it("is what canon (/v1/brand accessibility) carries", () => {
    const a = brandMeta.accessibility;
    expect(a.minInset).toBe(spacing.insetPx);
    expect(a.minControlGap).toBe(spacing.controlGapPx);
    expect(a.minLabelGap).toBe(spacing.labelGapPx);
    expect(a.minItemGap).toBe(spacing.itemGapPx);
    expect(a.minBodyLeading).toBe(spacing.leadingBody);
  });
  it("is what /v1/tokens (lib/tokens primitives) carries", () => {
    const f = primitives.spacingFloor;
    expect(f.inset.value).toBe(`${spacing.insetPx}px`);
    expect(f.controlGap.value).toBe(`${spacing.controlGapPx}px`);
    expect(f.labelGap.value).toBe(`${spacing.labelGapPx}px`);
    expect(f.itemGap.value).toBe(`${spacing.itemGapPx}px`);
    expect(f.leadingBody.value).toBe(`${spacing.leadingBody}`);
  });
  it("is two fixed size roles, which no brand pack can move", () => {
    const by = Object.fromEntries(ROLES.map((r) => [r.name, r]));
    for (const [name, want] of [
      ["spacing-inset-floor", spacing.insetPx],
      ["spacing-gap-floor", spacing.controlGapPx],
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
    expect(px(root["--gap-floor"]!)).toBe(spacing.controlGapPx);
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
  it("insets a bare control's label, inline axis, from --inset-floor", () => {
    expect(normalised).toMatch(
      /\) \{ padding-inline: var\(--inset-floor\); \}/,
    );
    for (const sel of ["button", '[role="button"]', "select", "textarea"])
      expect(normalised, sel).toContain(sel);
  });
  it("insets a bare text surface (no structured children), both axes", () => {
    expect(normalised).toMatch(/\) \{ padding: var\(--inset-floor\); \}/);
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
  it("every platform file has the inset and gap roles at 14 and 7", () => {
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
          `spacing_?gap_?floor\\W+(?:[A-Za-z0-9]+\\W+)?${spacing.controlGapPx}\\b`,
          "i",
        ),
      );
    }
  });
});

// ─── The contract runner, and its Rust twin ─────────────────────────────────────────────────

describe("the contract runner holds the spacing floor", () => {
  it("keeps a copy of BUNDU_FLOOR.spacing, equal to the source", () => {
    expect(INSET_FLOOR_PX).toBe(spacing.insetPx);
    expect(GAP_FLOOR_PX).toBe(spacing.controlGapPx);
    expect(GAP_FLOOR_PX).toBe(spacing.labelGapPx);
    expect(GAP_FLOOR_PX).toBe(spacing.itemGapPx);
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
    ) as { cases: { name: string; html: string; violations: number }[] };
    expect(table.cases.length).toBeGreaterThan(15);
    for (const c of table.cases) {
      const first = parseDocument(c.html).children.find((n): n is Element =>
        isTag(n),
      );
      expect(first, c.name).toBeDefined();
      expect(spacingViolations(first!).length, c.name).toBe(c.violations);
    }
  });
  it("holds a label chip or pill on its inline axis, and says so (#625)", () => {
    const run = (html: string) =>
      spacingViolations(
        parseDocument(html).children.find((n): n is Element => isTag(n))!,
      );
    // 14px inline with a line-height block axis (py-1) or a fixed height holds.
    expect(
      run('<p class="w-fit rounded-full border px-3.5 py-1">Phase 0</p>'),
    ).toEqual([]);
    expect(
      run(
        '<span class="inline-flex h-6 rounded-md border px-3.5 py-0.5">B</span>',
      ),
    ).toEqual([]);
    // Under 14px inline fails, whatever the block axis.
    expect(
      run('<p class="w-fit rounded-full border px-3 py-1">Phase 0</p>'),
    ).toHaveLength(1);
    expect(
      run(
        '<span class="inline-flex h-6 rounded-md border px-2 py-0.5">B</span>',
      ),
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
    expect(scanSource('<div className="flex gap-2 p-3.5">')).toEqual({});
    expect(
      scanSource(
        '// spacing-floor: exception hairline grid\n<div className="grid gap-px">',
      ),
    ).toEqual({});
  });
});
