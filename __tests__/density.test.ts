// Density and Apple alignment (owner decision 2026-11-01, #597): sizes follow Apple's HIG on
// touch and step DOWN as screens grow. The floors below fail the build when a token or a
// component breaks them, and the copies of the values (the contract runner, the platform files,
// tokens.json) must agree with the one source, lib/tokens/roles.source.ts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROLE_HEIGHTS } from "../contracts/runner";
import {
  BODY_FLOOR_FINE_PX,
  DENSITY_DESKTOP_QUERY,
  DENSITY_TABLET_QUERY,
  DESKTOP_SIZES,
  FLOOR_COARSE_PX,
  FLOOR_FINE_PX,
  LEGACY_SIZES,
  ROLES,
} from "../lib/tokens/roles.source";
import {
  experimentalColors,
  heritageColors,
  minerals,
} from "../lib/tokens/palette.source";
import {
  renderGlobalsJson,
  TYPE,
  TYPE_STEPS,
} from "../scripts/render-globals-css";

const ROOT = join(__dirname, "..");
const CSS = readFileSync(
  join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8",
);
const px = (v: string) =>
  v.endsWith("rem") ? parseFloat(v) * 16 : parseFloat(v);

/** The body of the `@media <query> { :root { … } }` block. */
function mediaRoot(query: string): string {
  const start = CSS.indexOf(`@media ${query} {`);
  expect(start, `@media ${query}`).toBeGreaterThan(-1);
  return CSS.slice(start, CSS.indexOf("\n}\n", start));
}
const decls = (block: string) =>
  [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
    (m) => [m[1]!, m[2]!.trim()] as const,
  );

describe("touch (coarse pointer): Apple HIG", () => {
  it("floors every target at 44px (Buttons: a hit region of at least 44x44 pt)", () => {
    expect(FLOOR_COARSE_PX).toBe(44);
    for (const r of ROLES.filter((x) => x.kind === "size" && x.floor)) {
      expect((r.default as { px: number }).px, r.name).toBeGreaterThanOrEqual(
        FLOOR_COARSE_PX,
      );
    }
  });
  it("keeps body at Apple's 17pt and nothing under the 11pt minimum", () => {
    expect(Object.fromEntries(TYPE.map(([n, , p]) => [n, p])).body).toBe(17);
    for (const [n, , p] of TYPE) expect(p, n).toBeGreaterThanOrEqual(11);
  });
});

describe("desktop density (fine pointer + hover)", () => {
  const query = DENSITY_DESKTOP_QUERY;
  it("is gated on a fine pointer, hover and a wide viewport, never a network signal", () => {
    expect(query).toContain("(pointer: fine)");
    expect(query).toContain("(hover: hover)");
    expect(query).toMatch(/min-width/);
    expect(CSS).not.toMatch(
      /save-data|prefers-reduced-data|effective-?type|downlink|navigator\.connection/i,
    );
  });
  it("keeps every target at 24px or more (WCAG 2.2 SC 2.5.8) and steps down from touch", () => {
    for (const [name, v] of Object.entries(DESKTOP_SIZES)) {
      expect(v, name).toBeGreaterThanOrEqual(FLOOR_FINE_PX);
      const role = ROLES.find((r) => r.name === name)!;
      expect(v, `${name} steps down`).toBeLessThanOrEqual(
        (role.default as { px: number }).px,
      );
    }
    const block = decls(mediaRoot(query));
    expect(Object.fromEntries(block)["--target-floor"]).toBe("1.5rem");
    for (const [k, v] of block.filter(([k]) => k.startsWith("--size-")))
      expect(px(v), k).toBeGreaterThanOrEqual(FLOOR_FINE_PX);
  });
  it("keeps body text at 14px or more and captions at 11px or more", () => {
    const type = Object.fromEntries(TYPE.map(([n, , p]) => [n, p])) as Record<
      string,
      number
    >;
    for (const layer of [TYPE_STEPS.tablet, TYPE_STEPS.desktop] as Record<
      string,
      readonly [string, number]
    >[]) {
      const at = (n: string) => layer[n]?.[1] ?? type[n]!;
      expect(at("body")).toBeGreaterThanOrEqual(BODY_FLOOR_FINE_PX);
      expect(at("small")).toBeGreaterThanOrEqual(BODY_FLOOR_FINE_PX);
      expect(at("caption")).toBeGreaterThanOrEqual(11);
    }
    for (const [k, v] of decls(mediaRoot(query)).filter(([k]) =>
      k.startsWith("--fs-"),
    ))
      expect(px(v), k).toBeGreaterThanOrEqual(11);
  });
  it("steps tablet type down on any pointer, and leaves touch targets alone there", () => {
    const tablet = decls(mediaRoot(DENSITY_TABLET_QUERY));
    expect(
      tablet.some(([k]) => k.startsWith("--size-") || k === "--target-floor"),
    ).toBe(false);
    expect(Object.fromEntries(tablet)["--fs-body"]).toBe("1rem");
  });
  it("does not turn off zoom or reduced motion", () => {
    expect(CSS).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i);
  });
});

describe("opt-out for consumers who have not migrated", () => {
  it('restores the pre-2026-11-01 sizes under :root[data-mzizi-sizes="legacy"], after every media block', () => {
    const at = CSS.indexOf(':root[data-mzizi-sizes="legacy"] {');
    expect(at).toBeGreaterThan(
      CSS.indexOf(`@media ${DENSITY_DESKTOP_QUERY} {`),
    );
    const legacy = Object.fromEntries(
      decls(CSS.slice(at, CSS.indexOf("\n}", at))),
    );
    expect(legacy["--size-control"]).toBe("3.5rem");
    expect(legacy["--target-floor"]).toBe("3rem");
    expect(legacy["--fs-body"]).toBe("1rem");
    for (const [name, v] of Object.entries(LEGACY_SIZES))
      expect(px(legacy[`--${name.replace(/^spacing-/, "size-")}`]!), name).toBe(
        v,
      );
  });
});

describe("one definition, every copy agrees", () => {
  it("contracts/runner.ts ROLE_HEIGHTS equals the role defaults and DESKTOP_SIZES", () => {
    for (const [suffix, [coarse, fine]] of Object.entries(ROLE_HEIGHTS)) {
      if (suffix === "touch-min") {
        expect([coarse, fine]).toEqual([FLOOR_COARSE_PX, FLOOR_FINE_PX]);
        continue;
      }
      const role = ROLES.find((r) => r.name === `spacing-${suffix}`)!;
      expect(coarse, `${suffix} coarse`).toBe(
        (role.default as { px: number }).px,
      );
      expect(fine, `${suffix} desktop`).toBe(
        DESKTOP_SIZES[`spacing-${suffix}`],
      );
    }
  });
  it("mzizi-rs/contract-eval holds the same table", () => {
    const rs = readFileSync(
      join(ROOT, "mzizi-rs/contract-eval/contract_eval.rs"),
      "utf8",
    );
    const rows = [...rs.matchAll(/\("([\w-]+)", (\d+), (\d+)\)/g)].map(
      (m) => [m[1]!, Number(m[2]), Number(m[3])] as const,
    );
    expect(Object.fromEntries(rows.map(([n, c, f]) => [n, [c, f]]))).toEqual(
      ROLE_HEIGHTS,
    );
  });
  it("the machine-readable twin carries the density layer", () => {
    const j = JSON.parse(
      renderGlobalsJson(minerals, heritageColors, experimentalColors),
    );
    expect(j.scale.density.floorPx).toEqual({
      coarse: 44,
      fine: 24,
      bodyFine: 14,
    });
    expect(j.scale.density.desktopPx).toEqual(DESKTOP_SIZES);
  });
  it("lib/tokens/index.ts (the /v1/tokens copy) agrees with the role source", () => {
    const idx = readFileSync(join(ROOT, "lib/tokens/index.ts"), "utf8");
    expect(idx).toMatch(
      /default: \{ value: "44px", description: "Default interactive element height/,
    );
    expect(idx).toMatch(
      /button: \{ height: "44px", heightSm: "44px", heightLg: "48px" \}/,
    );
    const minTouch = ROLES.find((r) => r.name === "spacing-touch-min")!
      .default as { px: number };
    expect(minTouch.px).toBe(FLOOR_COARSE_PX);
  });
});

describe("components take their size from the roles", () => {
  const files = [
    "button.tsx",
    "button.astro",
    "button.rs",
    "input.tsx",
    "input.astro",
    "input.rs",
    "ui-variants.ts",
  ];
  it("button and input carry no hard-coded 48px or 56px height", () => {
    for (const f of files) {
      const src = readFileSync(
        join(ROOT, "components/registry/n2-primitives", f),
        "utf8",
      );
      const classes = [
        ...src.matchAll(/"([^"\n]*\b(?:h|size)-(?:12|14)\b[^"\n]*)"/g),
      ].map((m) => m[1]);
      const own =
        f === "ui-variants.ts"
          ? classes.filter((c) => !c!.includes("pointer-coarse:"))
          : classes;
      // ui-variants' app-density rows (pointer-coarse:h-12) are the Dashboard Standard's own, a follow-up in #597.
      expect(own, f).toEqual([]);
    }
  });
});

describe("review findings on #598 stay fixed", () => {
  it("a touchscreen laptop (any-pointer: coarse) does not get desktop density", () => {
    expect(DENSITY_DESKTOP_QUERY).toContain("(not (any-pointer: coarse))");
  });
  it("the type table and the emitted --lh-* line heights agree", () => {
    for (const [n, , , lh] of TYPE.filter(([k]) => CSS.includes(`--lh-${k}:`)))
      expect(CSS, n).toMatch(
        new RegExp(`--lh-${n}: ${lh.replace(".", "\\.")};`),
      );
  });
  it("the legacy alias restores the SIZING variables too, and desktop density moves them", () => {
    const at = CSS.indexOf(':root[data-mzizi-sizes="legacy"] {');
    const legacy = Object.fromEntries(
      decls(CSS.slice(at, CSS.indexOf("\n}", at))),
    );
    expect(legacy["--touch-target-lg"]).toBe("56px");
    expect(legacy["--h-input"]).toBe("3.5rem");
    expect(legacy["--size-touch-min"]).toBe("3rem");
    const desktop = Object.fromEntries(decls(mediaRoot(DENSITY_DESKTOP_QUERY)));
    expect(desktop["--h-input"]).toBe("2.25rem");
    expect(desktop["--size-touch-min"]).toBe("1.5rem");
  });
  it("no doctrine page repeats a heading", () => {
    const dir = join(ROOT, "content/doctrine/documentation");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".mdx"))) {
      const heads = readFileSync(join(dir, f), "utf8")
        .split("\n")
        .filter((l) => /^#{2,3} /.test(l));
      expect(
        heads.filter((h, i) => heads.indexOf(h) !== i),
        f,
      ).toEqual([]);
    }
  });
});
