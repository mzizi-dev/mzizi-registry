import type { Metadata } from "next"
import Link from "next/link"

import { listSkills, isSupabaseConfigured } from "@/lib/db"
import { CopyCommand } from "@/components/landing/copy-command"

// SKILLS INDEX — mzizi.dev/skills
//
// The public instruction surface for the Mzizi agent skills. Skills are
// stored in the Supabase `skills` collection and served from here and via
// MCP `get_skill`; they are authored in git as
// `mzizi-skills/skills/<name>/SKILL.md` in nyuchi/mzizi-tools and published
// to npm as @nyuchi/mzizi-skills. All three surfaces carry the same body —
// this page is the human-readable one.
//
// The list is read live from the DB. Never hardcode the skill set here
// (CLAUDE.md §11) — a baked-in list guarantees drift the moment a skill ships.

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Skills — Mzizi",
  description:
    "Mzizi agent skills for AI assistants: install the @nyuchi/mzizi-skills bundle, the mzizi Claude Code plugin, or read any skill over HTTP and MCP.",
}

const NPM_PACKAGE = "@nyuchi/mzizi-skills"

export default async function SkillsPage() {
  const skills = isSupabaseConfigured() ? await listSkills().catch(() => []) : []

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 py-8">
      <header className="space-y-3">
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          Skills
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Agent skills
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Doctrine an AI assistant can load on demand — the design system, the brand constellation,
          and the engineering patterns behind the bundu ecosystem. Install the bundle once and any
          assistant working in the repo has the rules on hand instead of guessing at them.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">Install</h2>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Every skill, as files in <code className="font-mono text-xs">.claude/skills/</code>:
            </p>
            <CopyCommand command={`npx skills add ${NPM_PACKAGE}`} />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Or the whole toolchain as a Claude Code plugin — the skills, the{" "}
              <code className="font-mono text-xs">fundi</code> agent, the registry MCP, and the{" "}
              <code className="font-mono text-xs">/mzizi:*</code> commands:
            </p>
            <CopyCommand command="/plugin marketplace add nyuchi/mzizi-tools" />
            <CopyCommand command="/plugin install mzizi@mzizi-tools" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            The skills
          </h2>
          <p className="text-sm text-muted-foreground">
            Read live from the registry — {skills.length} published.
          </p>
        </div>

        {skills.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            The skills registry is unavailable right now. Install the bundle with{" "}
            <code className="font-mono text-xs">npx skills add {NPM_PACKAGE}</code>, or read the
            source at{" "}
            <a
              className="underline hover:text-foreground"
              href="https://github.com/nyuchi/mzizi-tools/tree/main/mzizi-skills/skills"
            >
              nyuchi/mzizi-tools
            </a>
            .
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {skills.map((skill) => (
              <li key={skill.name}>
                <Link
                  href={`/skills/${skill.name}`}
                  className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                >
                  <span className="font-mono text-sm font-medium text-foreground">
                    {skill.name}
                  </span>
                  {skill.description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {skill.description}
                    </p>
                  ) : null}
                  {skill.requires_mcp ? (
                    <span className="mt-auto pt-2 font-mono text-[10px] text-muted-foreground uppercase">
                      pairs with the MCP
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Read a skill programmatically
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The same bodies are available over HTTP and MCP, so an agent can pull one at runtime
          rather than shipping a copy.
        </p>
        <div className="space-y-2">
          <CopyCommand command="curl -s https://mzizi.dev/api/v1/skills" />
          <CopyCommand command="curl -s https://mzizi.dev/api/v1/skills/nyuchi-design" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Over MCP, connect <code className="font-mono text-xs">https://mcp.mzizi.dev/mcp</code> and
          call <code className="font-mono text-xs">list_skills</code> or{" "}
          <code className="font-mono text-xs">get_skill</code>. See{" "}
          <Link className="underline hover:text-foreground" href="/tools">
            Tools
          </Link>{" "}
          for the MCP and{" "}
          <Link className="underline hover:text-foreground" href="/cli">
            CLI
          </Link>{" "}
          surfaces.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Contributing a skill
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Skills are authored in git, in{" "}
          <a
            className="underline hover:text-foreground"
            href="https://github.com/nyuchi/mzizi-tools/tree/main/mzizi-skills"
          >
            nyuchi/mzizi-tools
          </a>{" "}
          under <code className="font-mono text-xs">mzizi-skills/skills/&lt;name&gt;/SKILL.md</code>
          , and projected into this registry from there. Open a PR against that repo — never edit a
          published copy or a registry row directly, because the next sync overwrites it.
        </p>
      </section>
    </article>
  )
}
