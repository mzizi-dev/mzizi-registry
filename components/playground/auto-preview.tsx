"use client"

import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

/**
 * Renders a registry component directly from its file on disk.
 *
 * The playground has 23 hand-written demos against 571 components, so 548 items
 * offered a Code tab and nothing to look at. Hand-writing the other 548 is not a
 * plan; rendering the real component is, and it is only possible because component
 * source lives on disk now (docs/component-source-migration.md) rather than in a
 * database column.
 *
 * What this deliberately does NOT do: invent props. It renders the component with
 * none. Anything that needs required props will throw, and throwing is the correct
 * outcome — a preview built from guessed props shows the consumer something that is
 * not the component, which is worse than showing them the source. The boundary
 * catches it and the page falls back to Code.
 *
 * A hand-written demo always wins. This is the floor, not a replacement: a real demo
 * shows a component in a composition with realistic content, which auto-rendering
 * cannot do.
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

  if (!Component) return null
  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading preview…</div>
  }

  return (
    <ErrorBoundary fallback={<PreviewUnavailable />}>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading preview…</div>}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

function PreviewUnavailable() {
  return (
    <div className="text-sm text-muted-foreground">
      This component needs props to render meaningfully — see the Code tab for its full signature.
    </div>
  )
}
