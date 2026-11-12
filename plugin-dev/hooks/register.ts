import type { Register } from "claude-code";

// The rules the owner keeps repeating, given to the model once per session.
const HOUSE_RULES = [
  "Mzizi house rules (from the mzizi-dev plugin):",
  "- Check remote state before acting or asking: fetch the branch, read the open issues and PRs, and read the coordination board (nyuchi/nyuchi-api#407). Work moves between sessions; never plan from memory.",
  "- Mzizi is the rule. Colours, spacing, radius and type come from Mzizi tokens (mzizi_get_tokens on the Mzizi MCP, or @bundu/ui). Never type a raw hex or invent a value; if a token is missing, add it to mzizi-registry first.",
  "- Every PR adds a CHANGELOG entry under [Unreleased] and references its issue (Refs #n).",
  "- Merge through the merge queue (squash, auto-merge once ready). Never use --admin. Never close a conflicting PR: resolve it.",
  "- Report what was measured and say what was not verified.",
].join("\n");

// Files where a literal colour is the point: token sources, brand assets, SVG.
const HEX_ALLOWED =
  /(^|\/)(tokens?|palette|brand|minerals|generated|fixtures?)(\/|[-._])|\.svg$|\.json$|\.md$|CHANGELOG/i;
const STYLED = /\.(css|scss|tsx|jsx|astro|svelte|vue|html)$/i;
const RAW_HEX =
  /(?<![\w&-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const OPT_OUT = "mzizi-allow-hex";

function rawHex(path: string, text: string): string | undefined {
  if (!STYLED.test(path) || HEX_ALLOWED.test(path) || text.includes(OPT_OUT))
    return undefined;
  return text.match(RAW_HEX)?.[0];
}

const deny = (path: string, hex: string) => ({
  deny:
    `mzizi: ${hex} in ${path} is a raw colour. Use a Mzizi token (mzizi_get_tokens on the Mzizi MCP, or the @bundu/ui CSS variables). ` +
    `If the token does not exist, add it to mzizi-registry first. A deliberate literal can carry a "${OPT_OUT}" comment.`,
});

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    await $.command.register({
      name: "mzizi",
      description: "Mzizi house rules and where to look first",
    });
    return next(e);
  });

  // Attached beside each typed prompt. prompt.compose and prompt.context are
  // both answered first by another installed plugin (cc-plugin-sec-default)
  // that never calls next, so neither carries the rules here.
  on("prompt.submit", ($, e, next) =>
    e.command || e.isMeta
      ? next(e)
      : next({ ...e, context: [...(e.context ?? []), HOUSE_RULES] }),
  );

  on("tool.call", { tool: "Write" }, ($, e, next) => {
    const hex = rawHex(e.file_path, e.content);
    return hex ? deny(e.file_path, hex) : next(e);
  }).catch(($, e, next) => (next.called ? next(e) : next(e)));

  on("tool.call", { tool: "Edit" }, ($, e, next) => {
    // Only a colour the edit introduces counts, not one already in the file.
    const hex = rawHex(e.file_path, e.new_string);
    return hex && !e.old_string.includes(hex)
      ? deny(e.file_path, hex)
      : next(e);
  }).catch(($, e, next) => (next.called ? next(e) : next(e)));

  on("command.run", { command: "mzizi" }, () => ({
    text: [
      HOUSE_RULES,
      "",
      "Where to look first:",
      "- Coordination board: https://github.com/nyuchi/nyuchi-api/issues/407",
      "- Tokens and components: the Mzizi MCP (mcp.mzizi.dev/mcp) or https://api.mzizi.dev/v1/brand",
      "- Docs: https://docs.mzizi.dev",
    ].join("\n"),
  }));
};
