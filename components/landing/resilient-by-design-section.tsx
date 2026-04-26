import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight } from "lucide-react"
import { ArchitectureExplorer } from "@/components/landing/architecture-explorer"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * "Resilient by design" — explains the two outliers of the 3D frontend
 * architecture (Outside / fundi and Documentation) and why they exist.
 *
 * Most design systems ship as a snapshot — frozen at release time, drift
 * sets in, security findings pile up, docs go stale. The Nyuchi system
 * has two layers whose entire job is to prevent that:
 *
 *   - L9 fundi (Outside axis): self-healing actor. L8 assurance reports
 *     failures, fundi opens GitHub issues, a human or Claude Code fixes.
 *   - L10 documentation (Documentation axis): the system documents
 *     itself — every component, every doc page, every version is in
 *     Supabase, served live, never copy-pasted into a static file.
 *
 * Together they're why the system stays current and secure without
 * manual maintenance pressure.
 */
// `ResilientBySection` is async because it embeds the server-rendered
// `ArchitectureExplorer` (which fetches axes + layers from Supabase).
// Async server components inside MDX work in Next.js 16 App Router.
export async function ResilientBySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <div className="mb-10 max-w-2xl sm:mb-12">
          <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground sm:text-xs">
            RESILIENT BY DESIGN
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Two outlier layers keep the system updated and secure
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            The 3D frontend architecture is ten layers across five axes. Eight of those layers build
            the product. Two sit outside the build path on purpose — they exist so the system never
            goes stale or insecure.
          </p>
        </div>

        {/* Interactive 3D explorer — five axes + ten layer nodes, click to inspect */}
        <div className="mb-10 overflow-hidden">
          <Suspense
            fallback={
              <Skeleton className="h-[320px] w-full rounded-xl border border-border sm:h-[420px]" />
            }
          >
            <ArchitectureExplorer />
          </Suspense>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">L9 · OUTSIDE AXIS</span>
              <span className="rounded-full bg-[var(--color-cobalt)]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[var(--color-cobalt)]">
                fundi
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold">
              Self-healing — failure becomes a learning event
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fundi (Shona for &quot;artisan&quot;) is the actor that lives outside the build. The
              L8 assurance layer detects runtime issues across the ecosystem and reports them to
              fundi. Fundi deduplicates, fingerprints, and promotes the worst ones into GitHub
              issues so a human — or Claude Code — can fix the root cause.
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>Edge function ingest with strict validation + dedup</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>Cron-driven heal pass (auth-gated) opens labelled GitHub issues</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>Append-only healing log for full auditability</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>On for nyuchi/mukoko by default, opt-in for external customers</span>
              </li>
            </ul>
            <Link
              href="/architecture/fundi"
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
            >
              How fundi works <ArrowRight className="size-4" />
            </Link>
          </article>

          <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                L10 · DOCUMENTATION AXIS
              </span>
              <span className="rounded-full bg-[var(--color-tanzanite)]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[var(--color-tanzanite)]">
                documentation
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold">
              The system documents itself — no stale truth
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every component, brand spec, and changelog entry lives in Supabase; long-form docs
              live in the repo as MDX. The Next.js app and the MCP server read both live; nothing is
              copy-pasted between them. When a component changes in the database or a doc page
              changes in the repo, the portal, the API, and the AI tools all pick it up on the next
              request. Drift becomes structurally impossible.
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>
                  Long-form docs are <code className="font-mono text-xs">.mdx</code> files in the
                  repo, compiled by <code className="font-mono text-xs">@next/mdx</code>
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>
                  <code className="font-mono text-xs">/api/v1/*</code> endpoints serve component +
                  brand + changelog data live from the database
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>
                  <code className="font-mono text-xs">registry.json</code> is a CI-verified
                  snapshot, never hand-edited
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true">→</span>
                <span>MCP tools surface live counts; AI never quotes a stale number</span>
              </li>
            </ul>
            <Link
              href="/architecture"
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
            >
              The 3D architecture model <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>

        <div className="mt-10 rounded-2xl border border-foreground/10 bg-foreground/5 px-6 py-5 sm:px-8 sm:py-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Net effect.</span> Five CVEs cleared in
            this PR alone — caught by <code className="font-mono text-xs">pnpm audit</code>, fixed
            inside the same PR per the no-deferral rule. CodeQL workflow-permissions findings,
            Dependabot advisories, and security-review notes never wait for a follow-up PR. See{" "}
            <Link href="/architecture" className="underline hover:no-underline">
              the architecture page
            </Link>{" "}
            for the full ten-layer model and{" "}
            <a
              href="https://github.com/nyuchi/design-portal/blob/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              SECURITY.md
            </a>{" "}
            for the disclosure process.
          </p>
        </div>
      </div>
    </section>
  )
}
