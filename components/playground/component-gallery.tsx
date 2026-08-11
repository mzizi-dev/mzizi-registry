import { getAllComponents } from "@/lib/db"
import { ComponentGalleryClient, type GalleryItem } from "./component-gallery-client"

/**
 * Server component that reads the registry and hands it to the client filter UI.
 *
 * Two defects lived here, both invisible because each produced a plausible page:
 *
 *  1. It mapped `c.registry_type` — a column name from the retired Supabase row shape.
 *     A registry item's field is `type`, so EVERY card's type was `undefined`, the
 *     `TYPE_LABELS` lookup missed, and the type filter had nothing to filter on. The
 *     `as unknown as ComponentRow[]` cast in `getAllComponents` is what let it compile.
 *  2. It was gated on `isSupabaseConfigured()`. The registry is files on disk in the
 *     deployed bundle (CLAUDE.md §8.3), so with no anon key this rendered "Registry is
 *     currently unavailable" over content that was right there — and named an env var
 *     that would not have helped. `/api/v1/ui` had exactly this bug and it was fixed
 *     there; this copy was missed.
 *
 * `basePath` controls where the per-card links go — `/components` (the docs
 * surface) by default, `/playground` when rendered from the playground index.
 */
export async function ComponentGallery({ basePath }: { basePath?: string } = {}) {
  let items: GalleryItem[]

  try {
    const components = await getAllComponents()
    items = components.map((c) => ({
      name: c.name,
      type: c.type ?? "registry:ui",
      description: c.description ?? "",
    }))
  } catch {
    items = []
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        The component registry could not be read. This is a build problem rather than a
        configuration one — the registry ships with the app.
      </div>
    )
  }

  return <ComponentGalleryClient items={items} basePath={basePath} />
}
