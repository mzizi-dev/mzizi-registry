// THE BUNDU FLOOR (owner rulings, 2026-11-02): hard minimums in the token layer. Bundu sets the standard for
// outdoor reading and for people who find technology hard, so these are as high as they can be:
// body text 17px, captions and secondary labels 14px, a 49px hit region on every interactive control on
// touch, contrast 7:1 / 4.5:1 / 3:1. The floor has two pointer tiers (owner ruling 2026-11-12, #660): a desktop
// (a fine pointer with hover) keeps a 28px hit region and 15px body, captions still 14px. One definition,
// `BUNDU_FLOOR` in lib/tokens/roles.source.ts; every test here reads it and fails when a default breaks it.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROLE_HEIGHTS } from "../contracts/runner";
import { brandMeta, typography } from "../lib/tokens/brand.source";
import {
  BODY,
  BUNDU_FLOOR,
  CAPTION_STEPS,
  DENSITY_DESKTOP_QUERY,
  DENSITY_TABLET_QUERY,
  DESKTOP_SIZES,
  NATIVE_HIT_ROLES,
  NON_BODY,
  ROLES,
  UI,
  WCAG_BODY,
  WCAG_NON_BODY,
  WCAG_UI,
} from "../lib/tokens/roles.source";
import { TYPE, TYPE_STEPS } from "../scripts/render-globals-css";

const ROOT = join(__dirname, "..");
const CSS = readFileSync(
  join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8",
);
const px = (v: string) =>
  v.endsWith("rem") ? parseFloat(v) * 16 : parseFloat(v);
const decls = (block: string) =>
  [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
    (m) => [m[1]!, m[2]!.trim()] as const,
  );
/** The `{ … }` body of the first rule whose header starts with `header`. */
function body(header: string): string {
  const start = CSS.indexOf(header);
  expect(start, header).toBeGreaterThan(-1);
  return CSS.slice(start, CSS.indexOf("\n}", start));
}
const normalised = CSS.replace(/\s+/g, " ");

/** The floor one type step answers to: secondary text 14px, everything else 17px on touch and 15px on a desktop. */
const floorFor = (name: string, desktop = false) =>
  CAPTION_STEPS.includes(name)
    ? BUNDU_FLOOR.captionPx
    : desktop
      ? BUNDU_FLOOR.pointerFine.bodyPx
      : BUNDU_FLOOR.bodyPx;

describe("BUNDU_FLOOR: the one definition", () => {
  it("holds the owner's numbers, each derived from the 7px unit", () => {
    expect(BUNDU_FLOOR).toEqual({
      unitPx: 7,
      bodyPx: 17,
      captionPx: 14,
      hitAreaPx: 49,
      visibleControlMinPx: 28,
      pointerFine: { hitAreaPx: 28, bodyPx: 15 },
      spacing: {
        insetPx: 14,
        controlGapPx: 7,
        labelGapPx: 7,
        itemGapPx: 7,
        leadingBody: 1.5,
      },
      contrast: { body: 7, nonBody: 4.5, ui: 3 },
      apca: { body: 75, nonBody: 60, ui: 30 },
    });
    expect(BUNDU_FLOOR.captionPx).toBe(2 * BUNDU_FLOOR.unitPx);
    expect(BUNDU_FLOOR.hitAreaPx).toBe(BUNDU_FLOOR.unitPx ** 2);
    expect(BUNDU_FLOOR.visibleControlMinPx).toBe(4 * BUNDU_FLOOR.unitPx);
    // the desktop tier: the drawn box is the hit region, so the two minimums are the same 28px
    expect(BUNDU_FLOOR.pointerFine.hitAreaPx).toBe(
      BUNDU_FLOOR.visibleControlMinPx,
    );
    expect(BUNDU_FLOOR.pointerFine.bodyPx).toBeLessThan(BUNDU_FLOOR.bodyPx);
    expect(BUNDU_FLOOR.pointerFine.bodyPx).toBeGreaterThan(
      BUNDU_FLOOR.captionPx,
    );
    expect(BUNDU_FLOOR.spacing.insetPx).toBe(2 * BUNDU_FLOOR.unitPx);
    for (const k of ["controlGapPx", "labelGapPx", "itemGapPx"] as const)
      expect(BUNDU_FLOOR.spacing[k]).toBe(BUNDU_FLOOR.unitPx);
  });
  it("is what the contrast constants read", () => {
    expect([WCAG_BODY, WCAG_NON_BODY, WCAG_UI]).toEqual([
      BUNDU_FLOOR.contrast.body,
      BUNDU_FLOOR.contrast.nonBody,
      BUNDU_FLOOR.contrast.ui,
    ]);
    expect([BODY, NON_BODY, UI]).toEqual([
      BUNDU_FLOOR.apca.body,
      BUNDU_FLOOR.apca.nonBody,
      BUNDU_FLOOR.apca.ui,
    ]);
  });
  it("is what canon (/v1/brand) carries, and the radius unit is 7px", () => {
    expect(brandMeta.accessibility.minTouchTarget).toBe(BUNDU_FLOOR.hitAreaPx);
    expect(brandMeta.accessibility.defaultTouchTarget).toBe(
      BUNDU_FLOOR.hitAreaPx,
    );
    expect(CSS).toContain(`--radius-unit: ${BUNDU_FLOOR.unitPx}px;`);
    for (const spec of brandMeta.componentSpecs)
      expect(
        (spec as { minTouchTarget?: number }).minTouchTarget,
        String(spec.name),
      ).toBe(BUNDU_FLOOR.hitAreaPx);
  });
  it("leaves the radius order exactly as it was: 4/7/12/14/17 and a pill", () => {
    const px = Object.entries(brandMeta.radii)
      .map(([, v]) => parseFloat(v as string))
      .filter((n) => n < 1000)
      .sort((x, y) => x - y);
    expect([...new Set(px)]).toEqual(
      expect.arrayContaining([4, 7, 12, 14, 17]),
    );
    expect(brandMeta.radii.full).toBeDefined();
  });
});

describe("type: nothing readable under the floor, in any layer", () => {
  it("every default type step meets its floor", () => {
    for (const [name, , size] of TYPE)
      expect(size, `--fs-${name}`).toBeGreaterThanOrEqual(floorFor(name));
  });
  it("body is exactly 17px and a caption exactly 14px", () => {
    const at = Object.fromEntries(TYPE.map(([n, , p]) => [n, p]));
    expect(at.body).toBe(BUNDU_FLOOR.bodyPx);
    expect(at.small).toBe(BUNDU_FLOOR.captionPx);
    expect(at.caption).toBe(BUNDU_FLOOR.captionPx);
  });
  it("no tablet or desktop step drops a size under its tier's floor", () => {
    for (const layer of ["tablet", "desktop"] as const)
      for (const [name, [, size]] of Object.entries(TYPE_STEPS[layer]))
        expect(size, `${layer} --fs-${name}`).toBeGreaterThanOrEqual(
          floorFor(name, layer === "desktop"),
        );
  });
  it("secondary text never steps down, and body steps down only on a desktop, to 15px", () => {
    for (const layer of ["tablet", "desktop"] as const)
      for (const name of ["small", "caption", "code"])
        expect(
          Object.keys(TYPE_STEPS[layer]),
          `${layer} must not move ${name}`,
        ).not.toContain(name);
    expect(Object.keys(TYPE_STEPS.tablet)).not.toContain("body");
    expect(
      (TYPE_STEPS.desktop as Record<string, readonly [string, number]>)
        .body![1],
    ).toBe(BUNDU_FLOOR.pointerFine.bodyPx);
  });
  it("every emitted --fs-* in the default layers meets its floor (the legacy opt-out is excluded)", () => {
    const legacyAt = CSS.indexOf(':root[data-mzizi-sizes="legacy"]');
    expect(legacyAt).toBeGreaterThan(-1);
    const desktopAt = CSS.indexOf(`@media ${DENSITY_DESKTOP_QUERY} {`);
    expect(desktopAt).toBeGreaterThan(-1);
    const touch = CSS.slice(0, desktopAt);
    const found = decls(touch).filter(([k]) => k.startsWith("--fs-"));
    expect(found.length).toBeGreaterThan(TYPE.length);
    for (const [k, v] of found)
      expect(px(v), k).toBeGreaterThanOrEqual(floorFor(k.replace("--fs-", "")));
    // the desktop block is held to the desktop tier
    const desktop = decls(CSS.slice(desktopAt, legacyAt)).filter(([k]) =>
      k.startsWith("--fs-"),
    );
    for (const [k, v] of desktop)
      expect(px(v), `desktop ${k}`).toBeGreaterThanOrEqual(
        floorFor(k.replace("--fs-", ""), true),
      );
  });
  it("Tailwind's own text-xs, text-sm and text-base resolve to the floor", () => {
    expect(normalised).toContain("--text-xs: var( --fs-caption )");
    expect(normalised).toContain("--text-sm: var(--fs-small)");
    expect(normalised).toContain("--text-base: var( --fs-body )");
    const at = Object.fromEntries(TYPE.map(([n, , p]) => [n, p]));
    expect(at.caption).toBeGreaterThanOrEqual(BUNDU_FLOOR.captionPx);
    expect(at.small).toBeGreaterThanOrEqual(BUNDU_FLOOR.captionPx);
    expect(at.body).toBeGreaterThanOrEqual(BUNDU_FLOOR.bodyPx);
  });
});

describe("hit region: 49px on touch, 28px on a desktop, on every interactive control", () => {
  it("every floored size role is at least 49px on touch", () => {
    for (const r of ROLES.filter((x) => x.kind === "size" && x.floor))
      expect((r.default as { px: number }).px, r.name).toBeGreaterThanOrEqual(
        BUNDU_FLOOR.hitAreaPx,
      );
  });
  it("--target-floor is 49px, and only the desktop density layer lowers it, to 28px", () => {
    expect(Object.fromEntries(decls(body(":root {")))["--target-floor"]).toBe(
      `${BUNDU_FLOOR.hitAreaPx / 16}rem`,
    );
    const tablet = decls(body(`@media ${DENSITY_TABLET_QUERY} {`));
    expect(tablet.map(([k]) => k)).not.toContain("--target-floor");
    const desktop = decls(body(`@media ${DENSITY_DESKTOP_QUERY} {`));
    expect(Object.fromEntries(desktop)["--target-floor"]).toBe(
      `${BUNDU_FLOOR.pointerFine.hitAreaPx / 16}rem`,
    );
    for (const block of [tablet, desktop])
      expect(block.map(([k]) => k)).not.toContain("--size-touch-min");
  });
  it("the tiers switch on the pointer, not the viewport alone", () => {
    expect(DENSITY_DESKTOP_QUERY).toContain("(pointer: fine)");
    expect(DENSITY_DESKTOP_QUERY).toContain("(hover: hover)");
    expect(DENSITY_DESKTOP_QUERY).toContain("(not (any-pointer: coarse))");
  });
  it("floored size roles are clamped to the control floor, which stays 49px except where a control is drawn smaller", () => {
    expect(normalised).toMatch(
      /--spacing-control: max\( ?var\(--size-control\), var\(--control-floor\) ?\)/,
    );
    expect(normalised).toMatch(
      /--spacing-touch-min: var\( ?--target-floor ?\)/,
    );
    const desktop = Object.fromEntries(
      decls(body(`@media ${DENSITY_DESKTOP_QUERY} {`)),
    );
    expect(px(desktop["--control-floor"]!)).toBe(
      BUNDU_FLOOR.visibleControlMinPx,
    );
  });
  it("every desktop control keeps a 28px hit region (and touch keeps 49px)", () => {
    // Button-like controls: the hit-area pseudo-element, at least --target-floor, in the base layer.
    expect(normalised).toMatch(/@layer base \{/);
    expect(normalised).toMatch(
      /width: max\(100%, var\(--target-floor\)\);\s*height: max\(100%, var\(--target-floor\)\)/,
    );
    for (const sel of [
      "button",
      '[role="button"]',
      '[role="tab"]',
      "summary",
      ".hit-area",
    ])
      expect(normalised, sel).toContain(sel);
    for (const [name, drawn] of Object.entries(DESKTOP_SIZES)) {
      expect(drawn, `${name} drawn`).toBeGreaterThanOrEqual(
        BUNDU_FLOOR.visibleControlMinPx,
      );
      // A native field cannot carry the pseudo-element: its drawn box is its hit region.
      if (NATIVE_HIT_ROLES.includes(name))
        expect(drawn, `${name} (native field)`).toBeGreaterThanOrEqual(
          BUNDU_FLOOR.pointerFine.hitAreaPx,
        );
    }
    expect(NATIVE_HIT_ROLES).toEqual(["spacing-field", "spacing-field-sm"]);
  });
  it("the contract runner's role table agrees", () => {
    for (const [suffix, [coarse, fine]] of Object.entries(ROLE_HEIGHTS)) {
      const name = `spacing-${suffix}`;
      if (suffix === "control-dense") continue; // fine pointer only; the hit region comes from the rule
      expect(coarse, `${suffix} coarse`).toBeGreaterThanOrEqual(
        BUNDU_FLOOR.hitAreaPx,
      );
      if (NATIVE_HIT_ROLES.includes(name))
        expect(fine, `${suffix} fine (native)`).toBeGreaterThanOrEqual(
          BUNDU_FLOOR.pointerFine.hitAreaPx,
        );
      else
        expect(fine, `${suffix} fine drawn`).toBeGreaterThanOrEqual(
          BUNDU_FLOOR.visibleControlMinPx,
        );
    }
  });
});

describe("components: no arbitrary text size under the caption floor", () => {
  const files: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx|astro|rs|ts)$/.test(f)) files.push(p);
    }
  })(join(ROOT, "components/registry"));
  it("no `text-[Npx]`, chart `fontSize` or `font-size` under 14px", () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/text-\[(\d+(?:\.\d+)?)(px|rem)\]/g)) {
        const size =
          m[2] === "rem" ? parseFloat(m[1]!) * 16 : parseFloat(m[1]!);
        // 8rem and 12rem are display sizes, not text under the floor.
        if (size < BUNDU_FLOOR.captionPx) bad.push(`${f}: ${m[0]}`);
      }
      for (const m of src.matchAll(/fontSize[=:]\s*\{?\s*(\d+)\b/g))
        if (
          Number(m[1]) < BUNDU_FLOOR.captionPx &&
          !/useState|setFontSize/.test(src.slice(m.index! - 40, m.index! + 20))
        )
          bad.push(`${f}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("the hit-area rule steps aside where it would collide", () => {
  const rule = CSS.replace(/\s+/g, " ");
  const selectors =
    '[role="button"], [role="tab"], [role="switch"], summary, .hit-area )';
  it("excludes elements that draw their own after: pseudo-element, and calendar days", () => {
    expect(rule).toContain(':not([class*="after:"], [data-day])');
    expect(rule).toContain(selectors.replace(/ \)$/, ""));
  });
  it("covers neither menu rows nor listbox options with a pseudo-element; they take min-height", () => {
    expect(rule).not.toMatch(/\[role="(menuitem|option)"\][^{]*::after/);
    expect(rule).toMatch(
      /\[role="menuitem"\], \[role="menuitemcheckbox"\], \[role="menuitemradio"\], \[role="option"\] \) \{ min-height: var\( ?--target-floor ?\);/,
    );
  });
  it("the components that draw their own after: still do, so the rule must not apply to them", () => {
    for (const f of ["checkbox", "switch", "radio-group", "tabs"]) {
      const src = readFileSync(
        join(ROOT, `components/registry/n2-primitives/${f}.tsx`),
        "utf8",
      );
      expect(src, f).toMatch(/after:/);
    }
  });
});

describe("components: no 14px+ text in a box under 24px", () => {
  const SMALL = new Set(["size-3", "size-4", "size-5", "h-3", "h-4", "h-5"]);
  const TEXT = new Set([
    "text-sm",
    "text-base",
    "text-lg",
    "text-xs",
    "text-body",
    "text-body-sm",
  ]);
  const files: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx|astro|rs)$/.test(f)) files.push(p);
    }
  })(join(ROOT, "components/registry"));
  const plain = (cls: string) =>
    cls.split(/\s+/).filter((t) => t && !t.includes(":") && !t.startsWith("["));
  it("no class string sets a size-3..5 or h-3..5 box and a text size together", () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/"([^"\n]*)"/g)) {
        const t = plain(m[1]!);
        if (t.some((x) => SMALL.has(x)) && t.some((x) => TEXT.has(x)))
          bad.push(`${f}: ${m[1]!.slice(0, 80)}`);
      }
      // An element with such a box that holds text directly (an unread count, an initial).
      for (const m of src.matchAll(
        /<(\w+)\b[^<>]*?className="([^"]*)"[^<>]*>([^<]*)<\/\1>/g,
      )) {
        const body = m[3]!.trim();
        if (
          plain(m[2]!).some((x) => SMALL.has(x)) &&
          /[A-Za-z0-9+]/.test(body) &&
          !/icon/i.test(body)
        )
          bad.push(`${f}: ${m[2]!.slice(0, 60)} holds ${body.slice(0, 30)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("canon and the hand-kept token files carry the floor", () => {
  it("canon's type scale (/v1/brand typography) meets it", () => {
    const rows = typography.filter((t) => t.entryType === "scale");
    expect(rows.length).toBeGreaterThan(8);
    for (const t of rows)
      expect(t.sizePx, t.name).toBeGreaterThanOrEqual(
        ["Body Small", "Caption", "Code"].includes(t.name)
          ? BUNDU_FLOOR.captionPx
          : BUNDU_FLOOR.bodyPx,
      );
    const by = Object.fromEntries(rows.map((t) => [t.name, t.sizePx]));
    expect(by.Body).toBe(BUNDU_FLOOR.bodyPx);
    expect(by.Caption).toBe(BUNDU_FLOOR.captionPx);
  });
  it("design-system/tokens.json carries the same type scale", () => {
    const j = JSON.parse(
      readFileSync(join(ROOT, "design-system/tokens.json"), "utf8"),
    ) as {
      type: { groups: { styles: { name?: string; fontSize: string }[] }[] };
    };
    const sizes = j.type.groups.flatMap((g) =>
      g.styles.map((x) => parseFloat(x.fontSize)),
    );
    expect(sizes.length).toBeGreaterThan(10);
    for (const n of sizes)
      expect(n).toBeGreaterThanOrEqual(BUNDU_FLOOR.captionPx);
    expect(
      sizes.filter((n) => n < BUNDU_FLOOR.bodyPx).length,
    ).toBeLessThanOrEqual(4);
  });
  it("mzizi-tokens-typescript.ts (the copy a consumer installs) meets it", () => {
    const src = readFileSync(
      join(ROOT, "components/registry/n1-tokens/mzizi-tokens-typescript.ts"),
      "utf8",
    ).replace(/\s+/g, " ");
    const size = (k: string) =>
      Number(new RegExp(`${k}: \\{ value: "(\\d+)px"`).exec(src)?.[1]);
    expect(size("caption")).toBeGreaterThanOrEqual(BUNDU_FLOOR.captionPx);
    expect(size("bodySmall")).toBeGreaterThanOrEqual(BUNDU_FLOOR.captionPx);
    expect(size("body")).toBeGreaterThanOrEqual(BUNDU_FLOOR.bodyPx);
    expect(src).toMatch(
      new RegExp(`default: \\{ value: "${BUNDU_FLOOR.hitAreaPx}px"`),
    );
    expect(src).toMatch(
      new RegExp(`sm: \\{ value: "${BUNDU_FLOOR.hitAreaPx}px"`),
    );
    expect(src).toContain(`input: { height: "${BUNDU_FLOOR.hitAreaPx}px" }`);
    expect(src).toContain(
      `button: { height: "${BUNDU_FLOOR.hitAreaPx}px", heightSm: "${BUNDU_FLOOR.hitAreaPx}px"`,
    );
    expect(src).toContain(`fontSize: "${BUNDU_FLOOR.captionPx}px" }`);
  });
  it("the platform files carry the 49px roles", () => {
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
      expect(src, f).toMatch(
        new RegExp(
          `spacing_?touch_?min\\W+(?:[A-Za-z0-9]+\\W+)?${BUNDU_FLOOR.hitAreaPx}\\b`,
          "i",
        ),
      );
    }
  });
});
