import { expect, test } from "claude-code/testing";

// Nothing sits beneath the plugin in a test: the hooks below stand for the
// engine, so a call the guard lets through is answered here.
const answer = (on: Parameters<Parameters<typeof test>[1]>[1]) => {
  on("tool.call", () => ({ result: {} }));
  on("prompt.submit", (_, e) => ({ text: e.text, context: e.context ?? [] }));
};

const refused = (r: { deny?: string; isError?: boolean; text?: string }) =>
  r.deny ?? (r.isError ? r.text : undefined) ?? "";

test("a raw hex colour written into a styled file is refused", async ($, on) => {
  answer(on);
  const r = await $.tool.call({
    tool: "Write",
    file_path: "src/components/card.tsx",
    content: 'const c = { color: "#FF0000" }\n',
  });
  expect(refused(r)).toContain("raw colour");
});

test("token, palette and generated files, svg, json and md may hold a hex", async ($, on) => {
  answer(on);
  for (const file_path of [
    "styles/tokens/palette.css",
    "lib/tokens/minerals.css",
    "src/generated/theme.tsx",
    "public/icon.svg",
    "palette.json",
    "README.md",
  ]) {
    const r = await $.tool.call({
      tool: "Write",
      file_path,
      content: ".x { color: #FF0000 }\n",
    });
    expect(refused(r), file_path).toBe("");
  }
});

test("a deliberate literal can opt out with mzizi-allow-hex", async ($, on) => {
  answer(on);
  const r = await $.tool.call({
    tool: "Write",
    file_path: "src/app.css",
    content:
      "/* mzizi-allow-hex: a third-party brand colour */\n.x { color: #1DA1F2 }\n",
  });
  expect(refused(r)).toBe("");
});

test("an edit is refused only for a colour it introduces", async ($, on) => {
  answer(on);
  const added = await $.tool.call({
    tool: "Edit",
    file_path: "src/app.css",
    old_string: ".x { color: var(--primary) }",
    new_string: ".x { color: #123456 }",
  });
  expect(refused(added)).toContain("#123456");
  const kept = await $.tool.call({
    tool: "Edit",
    file_path: "src/app.css",
    old_string: ".x { color: #123456; margin: 0 }",
    new_string: ".x { color: #123456; margin: 4px }",
  });
  expect(refused(kept)).toBe("");
});

test("a typed prompt carries the house rules", async ($, on) => {
  answer(on);
  const typed = await $.prompt.submit({ text: "add a card" });
  expect((typed.context ?? []).join("\n")).toContain("Mzizi house rules");
});
