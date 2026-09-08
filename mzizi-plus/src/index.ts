/**
 * `plus.mzizi.dev` — the toolchain: safety, resilience, assurance, fundi and
 * discovery, packaged apart from the viewable primitives on `ui.mzizi.dev`.
 * See `lib/domain-proxy.ts` for what this is and, more importantly, what it
 * deliberately is not.
 *
 * `n12` (the skills rung) has no `components/registry/` directory yet — see
 * `scripts/generate-node-map.mjs` — so it can't be gated per-item the way
 * `/components` is. `/skills` is listed as a static prefix instead: every
 * skill is n12/toolchain content by construction, so it needs no per-item
 * lookup. Add `n12` to `allowedNodes` once that directory exists.
 */

import { createDomainProxyHandler } from "@/lib/domain-proxy"

const handle = createDomainProxyHandler({
  domain: "plus.mzizi.dev",
  // N4 safety, N5 resilience, N8 assurance, N9 fundi, N10 documentation,
  // N11 discovery — the rungs plus the two logic-only nodes. N12 (skills)
  // has no registry directory yet; see the module comment above.
  allowedNodes: new Set(["n4", "n5", "n8", "n9", "n10", "n11"]),
  gatedPrefixes: ["/components", "/playground", "/source"],
  staticPrefixes: ["/tools", "/observability", "/skills", "/cli", "/architecture"],
})

export default {
  fetch: handle,
}
