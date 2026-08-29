import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getSkill, listSkillNames, skillsVersion } from "@/lib/skills"
import { CopyCommand } from "@/components/landing/copy-command"

// SKILL DETAIL — mzizi.dev/skills/[name]
//
// Renders one skill's full body. The body is stored in the Supabase `skills`
// collection and authored in git (`mzizi-skills/skills/<name>/SKILL.md` in
// nyuchi/mzizi-tools), so what renders here is what an assistant loads.
//
// The body is plain Markdown/MDX text. It is rendered in a <pre> rather than
// compiled: these bodies are agent instructions, frequently containing SQL and
// JSX fences, and compiling untrusted-shaped MDX from a DB row at request time
// is not worth the blast radius. Readers who want it rendered install the
// skill; readers here want to see exactly what the agent sees.

export const revalidate = 3600

export async function generateStaticParams() {
  // Every skill prerenders. The guard that returned [] when Supabase was
  // unconfigured is gone with the database read: the bundle is present at build
  // time by construction, so returning nothing here could only ever have meant
  // silently shipping zero skill pages.
  return listSkillNames().map((name) => ({ name }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const skill = getSkill(name)
  if (!skill) return { title: `Skill: ${name}` }
  return {
    title: `Skill: ${skill.name}`,
    description: skill.description ?? undefined,
  }
}

export default async function SkillDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const skill = getSkill(name)

  if (!skill) notFound()

  const sourceUrl = `https://github.com/nyuchi/mzizi-tools/blob/main/mzizi-skills/skills/${skill.name}/SKILL.md`

  return (
    <article className="mx-auto w-full max-w-3xl space-y-8 py-8">
      <header className="space-y-3">
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          <Link href="/skills" className="hover:text-foreground">
            Skills
          </Link>
        </p>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {skill.name}
        </h1>
        {skill.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {skill.description}
          </p>
        ) : null}
      </header>

      {/*
        `version`, `requires_mcp` and `applies_to` used to render here. They were
        envelope fields on the Supabase row that no writer maintained, so they
        froze at whatever was set when the row was created — `ecosystem-app-setup`
        advertised `applies_to: ["next.js"]` on a page whose body bootstraps
        Astro. Stale metadata on a public page is worse than none, because a
        reader has no way to tell. What replaces them is what the bundle actually
        knows: which release this deployment serves, and where the skill is
        authored. (nyuchi/mzizi-tools#87 decides whether `applies_to` comes back
        as git-owned frontmatter.)
      */}
      <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 text-xs sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="font-mono text-[10px] text-muted-foreground uppercase">Bundle</dt>
          <dd className="font-mono text-foreground">@nyuchi/mzizi-skills {skillsVersion()}</dd>
        </div>
        <div className="col-span-1 space-y-1 sm:col-span-2">
          <dt className="font-mono text-[10px] text-muted-foreground uppercase">Authored in</dt>
          <dd className="font-mono break-all text-foreground">{skill.source}</dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Get it</h2>
        <CopyCommand command="npx skills add @nyuchi/mzizi-skills" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          That installs every skill. To fetch just this one at runtime:
        </p>
        <CopyCommand command={`curl -s https://mzizi.dev/api/v1/skills/${skill.name}`} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Source of truth:{" "}
          <a className="underline hover:text-foreground" href={sourceUrl}>
            {skill.name}/SKILL.md
          </a>{" "}
          in nyuchi/mzizi-tools. Edit it there — not here, and not the registry row.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
          The skill
        </h2>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {skill.body_mdx}
        </pre>
      </section>
    </article>
  )
}
