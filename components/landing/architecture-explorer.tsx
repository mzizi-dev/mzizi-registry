import { getArchitectureFrontendAxes, getArchitectureFrontendLayers } from "@/lib/db"
// Direct import is fine: `architecture-canvas.tsx` carries `"use client"`,
// so Next.js evaluates it only in the browser. Three.js never runs during
// SSR. Next.js automatically code-splits the client bundle.
import { ArchitectureCanvas } from "./architecture-canvas"

/**
 * Server wrapper for the interactive 3D architecture explorer.
 *
 * Fetches layer + axis rows from Supabase. If the tables are empty
 * (issue #46's DDL is applied but the out-of-band seed hasn't run),
 * renders an empty-state notice instead of a broken canvas. The canvas
 * itself is a client component — three.js never runs during SSR.
 */
export async function ArchitectureExplorer() {
  const [axes, layers] = await Promise.all([
    getArchitectureFrontendAxes(),
    getArchitectureFrontendLayers(),
  ])

  if (axes.length === 0 || layers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        The 3D architecture explorer needs{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          architecture_frontend_axes
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          architecture_frontend_layers
        </code>{" "}
        to be populated. See issue #46.
      </div>
    )
  }

  return <ArchitectureCanvas axes={axes} layers={layers} />
}
