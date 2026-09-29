/**
 * Whether the pages that used to be gated on Supabase render their content.
 *
 * `/architecture`, `/architecture/nodes/[n]`, `/ubuntu`, `/source/[name]`,
 * `/observability` and `/changelog` each opened with `if (!isSupabaseConfigured())`
 * and rendered a "not configured" placeholder. Supabase was never configured on
 * the registry Worker, so the placeholder is what the site has always served —
 * even though everything below the gate reads files (doctrine, the registry, the
 * release record), not the database.
 *
 * The registry holds no database any more, so the gate is gone. Removing it
 * outright would change six live pages in the same change that removes
 * Supabase, which is supposed to change nothing anyone can see. So the pages
 * keep serving the placeholder, byte for byte, behind this one switch, and the
 * file-backed render below each placeholder stays intact rather than deleted.
 *
 * Flipping this to `true` is a deliberate website change: it replaces six
 * placeholders (which still name the retired `NEXT_PUBLIC_SUPABASE_*` variables)
 * with the real pages. Do it in its own PR, and delete the placeholders with it.
 */
export const RENDER_FILE_BACKED_PAGES: boolean = false
