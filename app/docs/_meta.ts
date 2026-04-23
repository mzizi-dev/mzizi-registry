// Sidebar order for /docs/*.
//
// Concrete MDX pages resolve first (Next.js routing precedence), and the
// `[slug]` dynamic route at `app/docs/[slug]/page.tsx` catches everything
// else — served from the Supabase `documentation_pages` table (see issues
// #29 / #47). Nextra validates `_meta` keys against filesystem paths, so
// DB-only slugs cannot be listed here; reach them directly via URL or
// from the cross-linked pages that do exist.
export default {
  index: "Introduction",
  installation: "Installation",
  theming: "Theming",
  "dark-mode": "Dark Mode",
  cli: "CLI",
  "api-reference": "API Reference",
  contributing: "Contributing",
  changelog: "Changelog",
}
