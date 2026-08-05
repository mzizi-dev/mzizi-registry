"use client"

import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { resolvePropsFor } from "@/lib/samples/resolve"

/**
 * Renders a registry component directly from its file on disk.
 *
 * The playground has 23 hand-written demos against 571 components, so 548 items
 * offered a Code tab and nothing to look at. Hand-writing the other 548 is not a
 * plan; rendering the real component is, and it is only possible because component
 * source lives on disk now (docs/component-source-migration.md) rather than in a
 * database column.
 *
 * It renders with SAMPLE DATA, not with invented props, and the distinction is the
 * whole design. This component used to pass nothing at all, on the stated principle
 * that a preview built from guessed props shows the consumer something that is not
 * the component. That principle is intact:
 *
 *   * A GUESS invents a value to satisfy a type — `title: "Title"`, `count: 1`. What
 *     it renders tells you nothing about whether the component works.
 *   * SAMPLE DATA is a record of the shape the component was designed to display,
 *     from a curated set that mirrors the production MongoDB validators field for
 *     field (lib/samples/types.ts). A place card rendered against a real place
 *     document is the component doing its actual job.
 *
 * `resolvePropsFor` only supplies a value when it can identify the prop confidently,
 * by declared type first and name second. What it cannot identify it leaves absent,
 * so the component shows its own empty state rather than a fabricated one.
 *
 * A hand-written demo still wins where one exists. This is the floor, not a
 * replacement: a demo shows a component in a composition, which no resolver can.
 */

/**
 * Only `.tsx`. The extension is appended to the dynamic import below so webpack builds
 * its context over `.tsx` files ALONE — a context matching every extension pulls in
 * `.ts` modules like `nyuchi-docs-api.ts`, which reach `lib/registry-source.ts` and
 * therefore `fs`, and the client build fails on module-not-found. Narrowing the context
 * is the fix; filtering after the import is too late, because webpack has already
 * decided what to bundle.
 */
const RENDERABLE = /\.tsx$/

/**
 * Pick the component to render from a module.
 *
 * Preference order matters. The registry convention is a named export matching the
 * component's PascalCase name (`button.tsx` exports `Button`), so that is tried
 * first; `default` is the fallback. Picking the first export alphabetically would
 * render a sub-part — `CardHeader` instead of `Card` — which looks like a broken
 * component rather than the wrong pick.
 */
function pickComponent(
  mod: Record<string, unknown>,
  name: string
): ComponentType<Record<string, never>> | null {
  const pascal = name
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("")

  const candidates = [pascal, "default", ...Object.keys(mod)]
  for (const key of candidates) {
    const value = mod[key]
    // A React component is a function, or an object for memo/forwardRef results.
    if (typeof value === "function") return value as ComponentType<Record<string, never>>
    if (value && typeof value === "object" && "$$typeof" in (value as object)) {
      return value as ComponentType<Record<string, never>>
    }
  }
  return null
}

export function AutoPreview({ sourcePath, name }: { sourcePath: string; name: string }) {
  // Render only after mount, so this never runs during static prerender.
  //
  // React error boundaries do NOT catch a throw during SSR/prerender: a component that
  // needs required props takes down `pnpm build` for the whole route instead of falling
  // back to the Code tab. `feature-flag-toggle` calling Object.entries on an absent prop
  // is the worked example. Deferring to the browser is what makes the boundary able to
  // do its job, and the failure mode becomes one card saying "needs props" rather than a
  // failed deploy.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const Component = useMemo(() => {
    if (!RENDERABLE.test(sourcePath)) return null

    // `components/registry/n2-primitives/button.tsx` -> `n2-primitives/button`
    const rel = sourcePath.replace(/^components\/registry\//, "").replace(/\.[a-z]+$/, "")
    if (!/^n\d+-[a-z0-9-]+\/[a-zA-Z0-9._-]+$/.test(rel)) return null

    return lazy(async () => {
      const mod = (await import(`@/components/registry/${rel}.tsx`)) as Record<string, unknown>
      const picked = pickComponent(mod, name)
      if (!picked) throw new Error(`${name} exports no renderable component`)
      return { default: picked }
    })
  }, [sourcePath, name])

  // Resolved once per component, not per render — the sample set is static, so recomputing
  // it would allocate a fresh object every render and remount every child that takes it.
  const resolution = useMemo(() => resolvePropsFor(name), [name])

  if (!Component) return null
  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading preview…</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <ErrorBoundary fallback={<PreviewUnavailable />}>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading preview…</div>}>
          <Component {...(resolution.props as Record<string, never>)} />
        </Suspense>
      </ErrorBoundary>
      {resolution.unmatched.length > 0 && (
        // Stated, not hidden. A preview that silently omits half a component's inputs looks
        // like a broken component, and the reader has no way to tell the difference.
        <p className="text-xs text-muted-foreground">
          Rendered with sample data. No sample resolved for:{" "}
          <code className="font-mono">{resolution.unmatched.join(", ")}</code>
        </p>
      )}
    </div>
  )
}

function PreviewUnavailable() {
  return (
    <div className="text-sm text-muted-foreground">
      This component needs props to render meaningfully — see the Code tab for its full signature.
    </div>
  )
}
