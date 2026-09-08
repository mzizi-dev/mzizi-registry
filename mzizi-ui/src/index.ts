/**
 * `ui.mzizi.dev` — the viewable component set (tokens, primitives, brand,
 * pages, shell) as its own subdomain. See `lib/domain-proxy.ts` for what this
 * is and, more importantly, what it deliberately is not.
 */

import { createDomainProxyHandler } from "@/lib/domain-proxy"

const handle = createDomainProxyHandler({
  domain: "ui.mzizi.dev",
  // N1 tokens, N2 primitives, N3 brand, N6 pages, N7 shell — the strands'
  // viewable nodes. Everything else (the rungs, plus N4/N5/N8's logic-only
  // nodes) belongs to plus.mzizi.dev instead.
  allowedNodes: new Set(["n1", "n2", "n3", "n6", "n7"]),
  gatedPrefixes: ["/components", "/playground", "/source"],
  staticPrefixes: ["/tokens"],
})

export default {
  fetch: handle,
}
