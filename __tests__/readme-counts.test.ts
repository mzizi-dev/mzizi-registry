import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const items: { type: string }[] = JSON.parse(
  readFileSync(join(ROOT, "registry.json"), "utf8"),
).items;

describe("the README's counts are read from the files they describe", () => {
  it("states the registry.json item total and its ui and block counts", () => {
    const ui = items.filter((i) => i.type === "registry:ui").length;
    const block = items.filter((i) => i.type === "registry:block").length;
    const rest = items.length - ui - block;
    expect(readme).toContain(
      `**${items.length} registry items** (\`registry.json\`: ${ui} \`registry:ui\`, ${block} \`registry:block\` and ${rest} libraries, hooks and other items)`,
    );
  });

  it("states the number of app contracts in contracts/app", () => {
    const n = readdirSync(join(ROOT, "contracts/app")).filter((f) =>
      f.endsWith(".contract.json"),
    ).length;
    expect(readme).toContain(`${n} in \`contracts/app/\``);
  });
});
