/**
 * `nyuchi-design skills install [name]` — fetch agent-skill MDX bodies
 * from the Nyuchi Design Portal API and write them to ./.claude/skills/.
 *
 * Without arguments, installs every published skill. With a name,
 * installs only that one. Idempotent — re-running rewrites with the
 * latest version from the API.
 *
 * `nyuchi-design skills update` — re-fetches the summary endpoint, diffs
 * against the local manifest at .nyuchi-design.json, and rewrites only
 * the skills whose version on the portal is newer than the local copy.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import kleur from "kleur"

const DEFAULT_API_BASE = "https://design.nyuchi.com/api/v1"
const SKILLS_DIR = ".claude/skills"
const MANIFEST_FILE = ".nyuchi-design.json"

interface SkillSummary {
  name: string
  description: string
  version: string
  agents: string[]
}

interface SkillFull extends SkillSummary {
  body_mdx: string
}

interface LocalManifest {
  /** Map of skill name → installed version */
  skills: Record<string, string>
}

interface SkillsOptions {
  /** Override the API base URL (for staging/local testing) */
  apiBase?: string
  /** Target directory (defaults to process.cwd()) */
  cwd?: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} → ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

function readManifest(cwd: string): LocalManifest {
  const path = join(cwd, MANIFEST_FILE)
  if (!existsSync(path)) return { skills: {} }
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"))
    return { skills: data.skills ?? {} }
  } catch {
    return { skills: {} }
  }
}

function writeManifest(cwd: string, manifest: LocalManifest): void {
  const path = join(cwd, MANIFEST_FILE)
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n")
}

function writeSkill(cwd: string, skill: SkillFull): void {
  const dest = join(cwd, SKILLS_DIR, `${skill.name}.md`)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, skill.body_mdx)
}

export async function runSkillsInstall(
  name: string | undefined,
  options: SkillsOptions = {}
): Promise<{ installed: string[] }> {
  const apiBase = options.apiBase ?? DEFAULT_API_BASE
  const cwd = options.cwd ?? process.cwd()
  const manifest = readManifest(cwd)
  const installed: string[] = []

  if (name) {
    const skill = await fetchJson<{ data: SkillFull }>(`${apiBase}/skills/${name}`)
    writeSkill(cwd, skill.data)
    manifest.skills[skill.data.name] = skill.data.version
    installed.push(skill.data.name)
    console.log(kleur.green(`  install  ${skill.data.name}@${skill.data.version}`))
  } else {
    const list = await fetchJson<{ data: SkillSummary[] }>(`${apiBase}/skills`)
    for (const summary of list.data) {
      const skill = await fetchJson<{ data: SkillFull }>(`${apiBase}/skills/${summary.name}`)
      writeSkill(cwd, skill.data)
      manifest.skills[skill.data.name] = skill.data.version
      installed.push(skill.data.name)
      console.log(kleur.green(`  install  ${skill.data.name}@${skill.data.version}`))
    }
  }

  writeManifest(cwd, manifest)
  console.log()
  console.log(kleur.gray(`Wrote ${installed.length} skill(s) to ${SKILLS_DIR}/`))

  return { installed }
}

export async function runSkillsUpdate(
  options: SkillsOptions = {}
): Promise<{ updated: string[]; unchanged: string[] }> {
  const apiBase = options.apiBase ?? DEFAULT_API_BASE
  const cwd = options.cwd ?? process.cwd()
  const manifest = readManifest(cwd)
  const updated: string[] = []
  const unchanged: string[] = []

  const summary = await fetchJson<{ data: SkillSummary[] }>(`${apiBase}/skills/summary`)

  for (const skill of summary.data) {
    const localVersion = manifest.skills[skill.name]
    if (localVersion === skill.version) {
      unchanged.push(skill.name)
      continue
    }
    const full = await fetchJson<{ data: SkillFull }>(`${apiBase}/skills/${skill.name}`)
    writeSkill(cwd, full.data)
    manifest.skills[skill.name] = full.data.version
    updated.push(skill.name)
    console.log(
      kleur.green(
        `  update   ${full.data.name}@${full.data.version}` +
          (localVersion ? kleur.gray(` (was ${localVersion})`) : kleur.gray(" (new)"))
      )
    )
  }

  writeManifest(cwd, manifest)

  if (updated.length === 0) {
    console.log(kleur.gray(`All ${unchanged.length} skill(s) already up to date.`))
  } else {
    console.log()
    console.log(kleur.gray(`${updated.length} updated, ${unchanged.length} unchanged.`))
  }

  return { updated, unchanged }
}
