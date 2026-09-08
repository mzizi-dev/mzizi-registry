/**
 * `createDomainProxyHandler` makes a gating decision per request — proxy to
 * the real `mzizi.dev` origin, or redirect there because this subdomain
 * doesn't serve the item/path. That decision is the entire point of
 * `ui.mzizi.dev` and `plus.mzizi.dev` existing as separate Workers, so it is
 * asserted directly rather than left to "the wrangler config looks right."
 *
 * The node map is mocked to a small fixed fixture rather than importing the
 * real generated one — this test is about the gating logic, not today's
 * registry contents, and a real registry item moving nodes shouldn't need to
 * touch this file.
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { createDomainProxyHandler } from "@/lib/domain-proxy"

vi.mock("@/lib/node-map.generated", () => ({
  NODE_MAP: {
    button: "n2", // ui-side item
    "accessibility-audit": "n8", // plus-side item
  },
}))

const UI_CONFIG = {
  domain: "ui.mzizi.dev",
  allowedNodes: new Set(["n1", "n2", "n3", "n6", "n7"]),
  gatedPrefixes: ["/components", "/playground", "/source"],
  staticPrefixes: ["/tokens"],
}

const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }))

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
})

function request(path: string): Request {
  vi.stubGlobal("fetch", fetchMock)
  return new Request(`https://ui.mzizi.dev${path}`)
}

describe("createDomainProxyHandler", () => {
  it("proxies the root path", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/"))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("proxies shared paths regardless of config", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/privacy"))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("proxies a static prefix this subdomain declares", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/tokens"))
    expect(res.status).toBe(200)
  })

  it("redirects a static-looking path this subdomain doesn't declare", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/tools"))
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://mzizi.dev/tools")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("proxies a gated item whose node this subdomain allows", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/components/button"))
    expect(res.status).toBe(200)
  })

  it("redirects a gated item whose node belongs to the other subdomain", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/components/accessibility-audit"))
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://mzizi.dev/components/accessibility-audit")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("redirects a gated item name absent from the node map", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/components/does-not-exist"))
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://mzizi.dev/components/does-not-exist")
  })

  it("redirects a deeper path under a gated prefix rather than guessing", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/components/button/extra"))
    expect(res.status).toBe(302)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("preserves the query string on a redirect", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/components/accessibility-audit?tab=props"))
    expect(res.headers.get("location")).toBe(
      "https://mzizi.dev/components/accessibility-audit?tab=props"
    )
  })

  it("redirects an entirely unmatched path", async () => {
    const handle = createDomainProxyHandler(UI_CONFIG)
    const res = await handle(request("/architecture"))
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://mzizi.dev/architecture")
  })
})
