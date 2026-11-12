// Density and Apple alignment (owner decision 2026-11-01, #597): sizes follow Apple's HIG on
// touch and step DOWN as screens grow. The floors below fail the build when a token or a
// component breaks them, and the copies of the values (the contract runner, the platform files,
// tokens.json) must agree with the one source, lib/tokens/roles.source.ts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocument } from "htmlparser2";
import { isTag, type Element } from "domhandler";
import {
  HIT_AREA_GAPS,
  HIT_AREA_FINE_PX,
  HIT_AREA_PX,
  hitRegion,
  hitViolations,
  ROLE_HEIGHTS,
  VISIBLE_FINE_MIN_PX,
} from "../contracts/runner";
import {
  BODY_FLOOR_FINE_PX,
  BODY_FLOOR_PX,
  BUNDU_FLOOR,
  CAPTION_FLOOR_PX,
  DENSITY_DESKTOP_QUERY,
  DENSITY_TABLET_QUERY,
  DESKTOP_SIZES,
  FLOOR_COARSE_PX,
  FLOOR_FINE_HIT_PX,
  FLOOR_VISIBLE_FINE_PX,
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

describe("touch (coarse pointer): the Bundu hit area", () => {
  it("floors every target at 49px (above Apple's 44x44 pt hit region)", () => {
    expect(FLOOR_COARSE_PX).toBe(49);
    for (const r of ROLES.filter((x) => x.kind === "size" && x.floor)) {
      expect((r.default as { px: number }).px, r.name).toBeGreaterThanOrEqual(
        FLOOR_COARSE_PX,
      );
    }
  });
  it("keeps body at 17px and nothing under the 14px caption floor", () => {
    expect(Object.fromEntries(TYPE.map(([n, , p]) => [n, p])).body).toBe(17);
    for (const [n, , p] of TYPE) expect(p, n).toBeGreaterThanOrEqual(14);
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
  it("draws controls at 28px or more, steps them down from touch, and lowers the hit region to the 28px desktop floor and no lower", () => {
    for (const [name, v] of Object.entries(DESKTOP_SIZES)) {
      expect(v, name).toBeGreaterThanOrEqual(FLOOR_VISIBLE_FINE_PX);
      const role = ROLES.find((r) => r.name === name)!;
      expect(v, `${name} steps down`).toBeLessThanOrEqual(
        (role.default as { px: number }).px,
      );
    }
    const block = decls(mediaRoot(query));
    expect(Object.fromEntries(block)["--control-floor"]).toBe("1.75rem");
    expect(Object.fromEntries(block)["--target-floor"]).toBe(
      `${FLOOR_FINE_HIT_PX / 16}rem`,
    );
    expect(FLOOR_FINE_HIT_PX).toBe(28);
    expect(block.some(([k]) => k === "--size-touch-min")).toBe(false);
    for (const [k, v] of block.filter(([k]) => k.startsWith("--size-")))
      expect(px(v), k).toBeGreaterThanOrEqual(FLOOR_VISIBLE_FINE_PX);
  });
  it("holds body at 17px on touch, 15px on a desktop, and captions at 14px in every layer", () => {
    const type = Object.fromEntries(TYPE.map(([n, , p]) => [n, p])) as Record<
      string,
      number
    >;
    for (const [layer, bodyFloor] of [
      [TYPE_STEPS.tablet, BODY_FLOOR_PX],
      [TYPE_STEPS.desktop, BODY_FLOOR_FINE_PX],
    ] as [Record<string, readonly [string, number]>, number][]) {
      const at = (n: string) => layer[n]?.[1] ?? type[n]!;
      expect(at("body")).toBeGreaterThanOrEqual(bodyFloor);
      expect(at("small")).toBeGreaterThanOrEqual(CAPTION_FLOOR_PX);
      expect(at("caption")).toBeGreaterThanOrEqual(CAPTION_FLOOR_PX);
    }
    // the desktop tier: body 15px (owner, #660); nothing in the desktop media block under it
    expect(BODY_FLOOR_FINE_PX).toBe(15);
    expect(TYPE_STEPS.desktop.body[1]).toBe(BODY_FLOOR_FINE_PX);
    for (const [k, v] of decls(mediaRoot(query)).filter(([k]) =>
      k.startsWith("--fs-"),
    ))
      expect(px(v), k).toBeGreaterThanOrEqual(BODY_FLOOR_FINE_PX);
  });
  it("steps only display type down at tablet width, and leaves touch targets and body alone there", () => {
    const tablet = decls(mediaRoot(DENSITY_TABLET_QUERY));
    expect(
      tablet.some(([k]) => k.startsWith("--size-") || k === "--target-floor"),
    ).toBe(false);
    expect(tablet.map(([k]) => k).sort()).toEqual([
      "--fs-display",
      "--fs-display-sm",
    ]);
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
    expect(legacy["--control-floor"]).toBe("3rem");
    expect(legacy["--fs-body"]).toBe("1rem");
    expect(legacy["--fs-caption"]).toBe("0.75rem");
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
        expect([coarse, fine]).toEqual([FLOOR_COARSE_PX, FLOOR_FINE_HIT_PX]);
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
      hitArea: 49,
      hitAreaFine: 28,
      visibleFine: 28,
      body: 17,
      bodyFine: 15,
      caption: 14,
      inset: 14,
      gap: 7,
      leading: 1.5,
      // deprecated aliases of the 4.21.0 keys: the hit region on each pointer
      coarse: 49,
      fine: 28,
    });
    expect(j.scale.density.bunduFloor).toEqual(BUNDU_FLOOR);
    expect(j.scale.density.desktopPx).toEqual(DESKTOP_SIZES);
  });
  it("lib/tokens/index.ts (the /v1/tokens copy) agrees with the role source", () => {
    const idx = readFileSync(join(ROOT, "lib/tokens/index.ts"), "utf8");
    expect(idx).toMatch(
      /default: \{ value: "49px", description: "Default interactive element height/,
    );
    expect(idx).toMatch(
      /button: \{ height: "49px", heightSm: "49px", heightLg: "56px" \}/,
    );
    const minTouch = ROLES.find((r) => r.name === "spacing-touch-min")!
      .default as { px: number };
    expect(minTouch.px).toBe(FLOOR_COARSE_PX);
  });
});

describe("the runner and the Rust evaluator hold the Bundu floor too", () => {
  const rs = readFileSync(
    join(ROOT, "mzizi-rs/contract-eval/contract_eval.rs"),
    "utf8",
  );
  it("the runner copies BUNDU_FLOOR", () => {
    expect(HIT_AREA_PX).toBe(BUNDU_FLOOR.hitAreaPx);
    expect(HIT_AREA_FINE_PX).toBe(BUNDU_FLOOR.pointerFine.hitAreaPx);
    expect(HIT_AREA_FINE_PX).toBe(VISIBLE_FINE_MIN_PX);
    expect(VISIBLE_FINE_MIN_PX).toBe(BUNDU_FLOOR.visibleControlMinPx);
  });
  it("the Rust evaluator copies BUNDU_FLOOR", () => {
    expect(rs).toContain(
      `pub const HIT_AREA_PX: u32 = ${BUNDU_FLOOR.hitAreaPx};`,
    );
    expect(rs).toContain(
      `pub const HIT_AREA_FINE_PX: u32 = ${BUNDU_FLOOR.pointerFine.hitAreaPx};`,
    );
    expect(rs).toContain(
      `pub const VISIBLE_FINE_MIN_PX: u32 = ${BUNDU_FLOOR.visibleControlMinPx};`,
    );
  });
  it("both pin the same known gaps, and every gap is still a gap", () => {
    const block = rs.slice(rs.indexOf("pub const HIT_AREA_GAPS"));
    const rsGaps = [
      ...block.slice(0, block.indexOf("];")).matchAll(/"([^"]+)"/g),
    ].map((m) => m[1]!);
    expect([...rsGaps].sort()).toEqual([...HIT_AREA_GAPS].sort());
    expect(new Set(HIT_AREA_GAPS).size).toBe(HIT_AREA_GAPS.length);
    for (const g of HIT_AREA_GAPS) {
      const [name, part] = [
        g.slice(0, g.indexOf(":")),
        g.slice(g.indexOf(":") + 1),
      ];
      const c = JSON.parse(
        readFileSync(join(ROOT, `contracts/${name}.contract.json`), "utf8"),
      );
      expect(
        c.density.some((r: { part: string }) => r.part === part),
        g,
      ).toBe(true);
    }
  });
});

describe("hit-region rules: the runner and the Rust evaluator answer the same cases", () => {
  const cases = JSON.parse(
    readFileSync(join(ROOT, "contracts/hit-region-cases.json"), "utf8"),
  ).cases as {
    name: string;
    html: string;
    fine: number | null;
    coarse: number | null;
    violations: number;
  }[];
  const first = (html: string) =>
    parseDocument(html).children.find((n) => isTag(n)) as Element;
  for (const c of cases)
    it(c.name, () => {
      expect(hitViolations(first(c.html), c.fine, c.coarse)).toHaveLength(
        c.violations,
      );
    });
  it("a covered button is raised to the floor, a link is its drawn box", () => {
    expect(hitRegion(first('<button class="h-9">x</button>'), 36)).toBe(49);
    expect(
      hitRegion(first('<button class="h-5">x</button>'), 20, HIT_AREA_FINE_PX),
    ).toBe(28);
    expect(hitRegion(first('<a href="/" class="h-9">x</a>'), 36)).toBe(36);
  });
  it("the Rust evaluator's table is this file", () => {
    const rs = readFileSync(
      join(ROOT, "mzizi-rs/crates/mzizi-ui/tests/contracts_json.rs"),
      "utf8",
    );
    expect(rs).toContain("hit-region-cases.json");
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
    expect(legacy["--size-touch-min"]).toBeUndefined();
    expect(legacy["--target-floor"]).toBe("3rem");
    const desktop = Object.fromEntries(decls(mediaRoot(DENSITY_DESKTOP_QUERY)));
    expect(desktop["--h-button-default"]).toBe("2.25rem");
    expect(desktop["--h-input"]).toBe("2.25rem");
    expect(desktop["--size-touch-min"]).toBeUndefined();
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
