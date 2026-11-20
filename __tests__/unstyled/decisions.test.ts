// The floor numbers written in docs/unstyled/decisions.md must be the ones in BUNDU_FLOOR, never a copy.
// Every layer row is checked against BUNDU_FLOOR.spacing.layers, and the hit areas against their own keys.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUNDU_FLOOR } from "../../lib/tokens/roles.source";

const DOC = readFileSync(
  join(__dirname, "..", "..", "docs", "unstyled", "decisions.md"),
  "utf8",
);

/** The layer key in BUNDU_FLOOR for each `--space-<name>` token in the doc's layer table. */
const LAYER_TOKENS: Record<string, keyof typeof BUNDU_FLOOR.spacing.layers> = {
  "page-x": "pageX",
  "page-x-wide": "pageXWide",
  section: "section",
  container: "containerPadding",
  "container-gap": "containerGap",
  card: "cardPadding",
  "card-gap": "cardGap",
  "card-stack": "cardStack",
  "control-x": "controlX",
  "field-x": "fieldX",
  "control-gap": "controlGap",
  "control-between": "controlBetween",
  "chip-x": "chipX",
  "pill-x": "pillX",
  "pill-gap": "pillGap",
  "label-gap": "labelGap",
};

/** The cells of the table row whose first cell is `--space-<name>`, trimmed. */
function row(token: string): string[] {
  const line = DOC.split("\n").find(
    (l) => l.split("|")[1]?.trim() === `\`--space-${token}\``,
  );
  expect(line, `doc row for --space-${token}`).toBeDefined();
  return line!
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

describe("decisions.md states BUNDU_FLOOR, not a copy of it", () => {
  it("states the touch and desktop hit areas and the desktop drawn minimum", () => {
    for (const px of [
      BUNDU_FLOOR.hitAreaPx,
      BUNDU_FLOOR.pointerFine.hitAreaPx,
      BUNDU_FLOOR.visibleControlMinPx,
    ]) {
      expect(DOC, `a table cell stating ${px}px`).toMatch(
        new RegExp(`\\|\\s*${px}px\\s*\\|`),
      );
    }
  });

  it.each(Object.entries(LAYER_TOKENS))(
    "--space-%s matches BUNDU_FLOOR.spacing.layers.%s",
    (token, key) => {
      const layer = BUNDU_FLOOR.spacing.layers[key] as {
        px: number;
        dense?: number;
      };
      const cells = row(token);
      expect(cells[1], `default of --space-${token}`).toBe(String(layer.px));
      expect(cells[2], `dense of --space-${token}`).toBe(
        layer.dense === undefined ? "none" : String(layer.dense),
      );
    },
  );

  it("lists every layer in BUNDU_FLOOR", () => {
    expect(new Set(Object.values(LAYER_TOKENS))).toEqual(
      new Set(Object.keys(BUNDU_FLOOR.spacing.layers)),
    );
  });
});
