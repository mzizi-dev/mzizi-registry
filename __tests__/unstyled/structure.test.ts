// THE STRUCTURE GATE (B0, docs/unstyled/decisions.md). A component source under components/registry/ may
// carry styling only if it is listed in contracts/unstyled-baseline.json. The list is a ratchet: it may
// only shrink. A file that is NOT listed must not style, and a listed file that no longer styles must be
// removed from the list, so the list always matches the tree. Heuristic: __tests__/unstyled/styling-scan.ts.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { SOURCE_EXTENSIONS, stylingReasons } from "./styling-scan";

const ROOT = join(__dirname, "..", "..");
const REGISTRY = join(ROOT, "components", "registry");
const BASELINE_PATH = join(ROOT, "contracts", "unstyled-baseline.json");

type Baseline = { files: string[] };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE_EXTENSIONS.some((ext) => name.endsWith(ext)))
      out.push(full);
  }
  return out;
}

/** Repo-relative path with forward slashes, the form the baseline stores. */
const rel = (abs: string) => relative(ROOT, abs).split(sep).join("/");

const baseline: Baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const listed = new Set(baseline.files);

const sources = walk(REGISTRY).map((abs) => {
  const src = readFileSync(abs, "utf8");
  return { path: rel(abs), reasons: stylingReasons(src) };
});
const styled = sources.filter((s) => s.reasons.length > 0).map((s) => s.path);
const styledSet = new Set(styled);

describe("unstyled baseline: the ratchet", () => {
  it("is sorted, unique and points at files that exist", () => {
    expect(baseline.files).toEqual([...baseline.files].sort());
    expect(new Set(baseline.files).size).toBe(baseline.files.length);
    const missing = baseline.files.filter((f) => !existsSync(join(ROOT, f)));
    expect(
      missing,
      "baseline entries that no longer exist: remove them",
    ).toEqual([]);
  });

  it("lists no file that has already been unstyled (a listed file must still style)", () => {
    const stale = baseline.files.filter((f) => !styledSet.has(f));
    expect(
      stale,
      "these no longer carry styling: delete them from contracts/unstyled-baseline.json",
    ).toEqual([]);
  });

  it("never grows: every styled file is listed", () => {
    const unlisted = styled.filter((f) => !listed.has(f));
    expect(
      unlisted,
      "new styling in these files. Components are unstyled: emit data-slot, data-variant, data-size, data-state, data-orientation and data-mineral, no class, style, colour literal or brand reference (docs/unstyled/decisions.md). Do not add entries to the baseline.",
    ).toEqual([]);
  });
});

describe("unstyled components pass the structure gate", () => {
  const ALREADY_UNSTYLED = [
    "components/registry/n2-primitives/button.tsx",
    "components/registry/n2-primitives/button.astro",
    "components/registry/n2-primitives/button.rs",
    "components/registry/n2-primitives/aspect-ratio.tsx",
    "components/registry/n2-primitives/collapsible.tsx",
    "components/registry/n2-primitives/direction.tsx",
    "components/registry/n2-primitives/alert.rs",
    "components/registry/n2-primitives/badge.rs",
    "components/registry/n2-primitives/card.rs",
    "components/registry/n2-primitives/chart.rs",
    "components/registry/n2-primitives/progress.rs",
    "components/registry/n2-primitives/separator.rs",
    "components/registry/n6-pages/discover-meta.tsx",
    "components/registry/n6-pages/discover-meta.astro",
    "components/registry/n4-safety/ai-safety.tsx",
    "components/registry/n8-assurance/mzizi-chaos.tsx",
  ];

  it.each(ALREADY_UNSTYLED)(
    "%s is listed nowhere and styles nothing",
    (path) => {
      expect(existsSync(join(ROOT, path)), path).toBe(true);
      expect(listed.has(path), `${path} must not be in the baseline`).toBe(
        false,
      );
      expect(stylingReasons(readFileSync(join(ROOT, path), "utf8"))).toEqual(
        [],
      );
    },
  );
});
