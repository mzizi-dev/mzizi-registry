// THE SPACING FLOOR (owner, 2026-11-04, #617): minimum padding, gaps and leading that nothing can go under.
// One definition, `BUNDU_FLOOR.spacing` in lib/tokens/roles.source.ts; every test here reads it and fails when
// a generated default, a density layer, a brand block or a copy of the floor breaks it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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
