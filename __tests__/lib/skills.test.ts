// @vitest-environment node
// Reads the published bundle off disk — must run in Node.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { getSkill, listSkills, listSkillNames, skillsVersion } from "@/lib/skills"

/**
 * The site must serve exactly what `@nyuchi/mzizi-skills` publishes.
 *
 * Skills used to come from a Supabase projection of that package, kept in step
 * by a sync script. The script was not run, so `/api/v1/skills` served text
 * telling agents to author components into a database column that had been
 * cleared — for weeks, while the package was correct the whole time.
 *
 * WHAT THIS SUITE ACTUALLY GUARDS, stated precisely because it is easy to
 * overclaim: it is NOT a drift check. Mutating a SKILL.md in the package moves
 * both the reader and these assertions together, so nothing fails — and that is
 * correct, because after this change there is no second copy left to drift
 * from. Drift is prevented structurally, not by a test.
 *
 * What it guards is the READER: that `lib/skills.ts` parses the package
 * faithfully. Verified by mutation against the reader rather than the fixture —
 * making frontmatter leak into the body fails the byte-identity spec, and
 * flipping the description precedence to prefer frontmatter fails the
 * description spec. That second one is not hypothetical: it is the exact bug
 * that shipped, where a fix applied only to the frontmatter left "Next.js
 * bootstrap" on a skill whose body bootstraps Astro.
 */

const require_ = createRequire(import.meta.url)
const bundle = JSON.parse(
  readFileSync(require_.resolve("@nyuchi/mzizi-skills/index.json"), "utf8")
) as { version: string; skills: { name: string; file: string; description: string }[] }

/** Strip frontmatter exactly as the reader does. */
function bodyOf(file: string): string {
  const raw = readFileSync(require_.resolve(`@nyuchi/mzizi-skills/${file}`), "utf8")
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  return (m ? raw.slice(m[0].length) : raw).trim()
}

describe("lib/skills serves the published bundle", () => {
  it("lists every skill the package declares, and no others", () => {
    expect(listSkillNames().sort()).toEqual(bundle.skills.map((s) => s.name).sort())
  })

  it("serves each body byte-identical to the package", () => {
    for (const entry of bundle.skills) {
      // Not a whitespace-normalised compare. The old drift checker normalised,
      // which is how genuinely diverged text passed it — and a parser that
      // leaves frontmatter in the body only shows up under an exact compare.
      expect(getSkill(entry.name)?.body_mdx, `${entry.name} body`).toBe(bodyOf(entry.file))
    }
  })

  it("serves index.json's description — the one that ships", () => {
    // The bundle resolves `entry.description || frontmatter.description`, and
    // index.json is what ships. Getting this precedence backwards is the bug
    // that actually shipped — mutation-tested by flipping it, which fails here.
    for (const entry of bundle.skills) {
      expect(getSkill(entry.name)?.description, `${entry.name} description`).toBe(entry.description)
    }
  })

  it("omits bodies from the list", () => {
    // Nine full bodies is ~60 kB. A client asking what exists is choosing, not
    // reading, and the list route is cached at the edge.
    for (const s of listSkills()) {
      expect(s).not.toHaveProperty("body_mdx")
    }
  })

  it("reports the bundle version", () => {
    expect(skillsVersion()).toBe(bundle.version)
  })

  it("returns null for an unknown skill rather than throwing", () => {
    expect(getSkill("no-such-skill")).toBeNull()
  })

  it("does not carry the frozen envelope fields", () => {
    // requires_mcp / applies_to / status / version were columns nothing wrote
    // after row creation, so they froze and went stale. Reintroducing them here
    // would recreate a field that looks authoritative and is not.
    const skill = getSkill(bundle.skills[0]!.name)!
    for (const dead of ["requires_mcp", "applies_to", "status", "version", "agents"]) {
      expect(skill, dead).not.toHaveProperty(dead)
    }
  })
})
