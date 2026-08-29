/**
 * Skills, served from the generated bundle.
 *
 * Skills are authored as `SKILL.md` files in `nyuchi/mzizi-tools/mzizi-skills/`
 * and published as `@nyuchi/mzizi-skills`. `scripts/generate-skills.mjs` inlines
 * that package into `lib/skills.generated.ts` at build time; this module reads
 * it. Nothing here touches Supabase.
 *
 * WHY THE DATABASE COPY IS GONE. Skills used to resolve through four hops:
 *
 *   git (mzizi-tools) → a MANUAL sync → Supabase → these routes → consumers
 *
 * The sync was a script somebody had to remember to run, and it was not run. So
 * `/api/v1/skills` served text instructing agents to author components into a
 * database column that had been cleared — for weeks, while the package was
 * correct the entire time. Repairing it took a hand-written `UPDATE` per skill.
 *
 * The sync script was never the problem. A skill existed in two places at once,
 * which is the same defect the component-source migration removed from this
 * system: a representation that drifts from the thing it represents while still
 * looking authoritative. A post-merge sync job keeps that copy and adds
 * machinery to police it.
 *
 * WHY GENERATED RATHER THAN READ AT RUNTIME. The first version of this file
 * resolved the package through `createRequire(import.meta.url)`. It typechecked,
 * all tests passed, and `next build` failed with `EBADF: bad file descriptor` —
 * Turbopack rewrites `import.meta.url` in the server bundle, so the require it
 * builds no longer reaches the filesystem. Runtime package resolution is not
 * available here. The generated artifact is better regardless: the content ships
 * with the deployment, so a missing package fails the build rather than a
 * request.
 */

import { SKILLS, SKILLS_VERSION, type GeneratedSkill } from "./skills.generated"

export interface SkillSummary {
  name: string
  description: string
  /** Where the skill is authored, for anyone following it back. */
  source: string
}

export type Skill = GeneratedSkill

/** The bundle version this deployment was built against. */
export function skillsVersion(): string {
  return SKILLS_VERSION
}

/**
 * Every skill, without bodies.
 *
 * The list is for choosing, not reading — nine full bodies is ~60 kB, and a
 * client asking what exists does not want them.
 */
export function listSkills(): SkillSummary[] {
  return SKILLS.map(({ name, description, source }) => ({ name, description, source }))
}

/** One skill in full, or null. */
export function getSkill(name: string): Skill | null {
  return SKILLS.find((s) => s.name === name) ?? null
}

/** Every skill name, for `generateStaticParams`. */
export function listSkillNames(): string[] {
  return SKILLS.map((s) => s.name)
}
