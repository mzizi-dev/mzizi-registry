/**
 * `/.well-known/security.txt` — the one file read exclusively by someone trying to report a
 * vulnerability responsibly.
 *
 * It shipped for months advertising three URLs that did not resolve: a `Contact` pointing at
 * `nyuchi/design-portal` (403 — the repo was renamed to `nyuchi/mzizi` and this reference was
 * not), a `Policy` at `mzizi.dev/security` (404) and an `Acknowledgments` at
 * `mzizi.dev/security/acknowledgments` (404). Every other gate was green the whole time,
 * because nothing had ever opened the file.
 *
 * These assertions are OFFLINE and structural — they cannot dial a URL, so they cannot prove
 * a link resolves. What they can do is stop the two mistakes that actually happened: naming a
 * repository that is not this one, and pointing at a path this app does not serve. A reviewer
 * still has to check a genuinely new external URL by hand.
 */
import { describe, expect, it } from "vitest"

vi.mock("next/server", () => ({
  NextResponse: class {
    constructor(
      public body: string,
      public init?: { status?: number; headers?: Record<string, string> }
    ) {}
  },
}))

import { vi } from "vitest"
import { GET } from "@/app/.well-known/security.txt/route"

async function body(): Promise<string> {
  const res = (await GET()) as unknown as { body: string }
  return res.body
}

function fields(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    const [key, ...rest] = line.split(":")
    const value = rest.join(":").trim()
    out.set(key, [...(out.get(key) ?? []), value])
  }
  return out
}

describe("/.well-known/security.txt", () => {
  it("carries the two fields RFC 9116 requires", async () => {
    const f = fields(await body())
    expect(f.get("Contact")?.length).toBeGreaterThan(0)
    expect(f.get("Expires")?.length).toBe(1)
  })

  it("expires in the future", async () => {
    const f = fields(await body())
    const expires = new Date(f.get("Expires")![0])
    expect(expires.getTime()).toBeGreaterThan(Date.now())
  })

  it("names this repository, never the pre-rename one", async () => {
    // github.com/nyuchi/design-portal answers 403. A reporter following it cannot file.
    const text = await body()
    expect(text).not.toContain("design-portal")
    for (const url of text.matchAll(/https:\/\/github\.com\/([\w-]+\/[\w-]+)/g)) {
      expect(url[1]).toBe("nyuchi/mzizi")
    }
  })

  it("only points at mzizi.dev paths this app actually serves", async () => {
    // The failure was `Policy: https://mzizi.dev/security` and an `Acknowledgments` beside
    // it, neither of which is a route. Anything on our own origin has to be a path we ship —
    // and today that is the canonical location of this very file, nothing else.
    const text = await body()
    const ours = [...text.matchAll(/https:\/\/mzizi\.dev(\/\S*)?/g)].map((m) => m[1] ?? "/")
    for (const path of ours) {
      expect(path).toBe("/.well-known/security.txt")
    }
  })

  it("declares itself canonical at the location it is served from", async () => {
    const f = fields(await body())
    expect(f.get("Canonical")).toEqual(["https://mzizi.dev/.well-known/security.txt"])
  })

  it("has no Acknowledgments field while there is no acknowledgments page", async () => {
    // Absent is honest. A link to a 404 advertises a process that does not exist, which is
    // worse than saying nothing — remove this test when the page ships.
    const f = fields(await body())
    expect(f.has("Acknowledgments")).toBe(false)
  })

  it("serves as plain text, not as a download or as HTML", async () => {
    const res = (await GET()) as unknown as {
      init?: { status?: number; headers?: Record<string, string> }
    }
    expect(res.init?.status).toBe(200)
    expect(res.init?.headers?.["Content-Type"]).toContain("text/plain")
  })
})
