/**
 * `mzizi-fundi-reporter` (#321, #476): where it files, what it reports back,
 * and what it refuses to do in a browser.
 *
 * The destination was `nyuchi/design-portal`, then `nyuchi/mzizi`: each the
 * registry's name before a rename, each kept working only through GitHub's
 * rename redirect. So these check the request the reporter actually makes, not
 * just the constant. They also hold the failure handling: a 4xx/5xx or a network
 * error is a failure result (never a rejection, never `queued: true`), and only
 * an accepted report starts the cooldown, which is keyed on component AND error
 * type, as in the Rust build.
 *
 * A `githubToken` in this "use client" module ships to every browser, so the
 * browser path never sends one: reports go to a `fundiEndpoint`. Filing straight
 * to GitHub is tested only with `window` stubbed away (a server).
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  GITHUB_REPO,
  initFundiReporter,
  issuesApiUrl,
  resetFundiReporter,
  type FundiReport,
} from "@/components/registry/n9-fundi/mzizi-fundi-reporter"

const report: FundiReport = {
  component: "button",
  node: 2,
  severity: "high",
  errorType: "render",
  source: "error-tracker",
  title: "render failed",
  description: "the button threw",
}

const ISSUE = "https://github.com/mzizi-dev/mzizi-registry/issues/1"

function mockFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const r of responses) {
    if (r instanceof Error) fetchMock.mockRejectedValueOnce(r)
    else fetchMock.mockResolvedValueOnce(r)
  }
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

/** A server: no `window`, so a GitHub token may be used. */
function onServer() {
  vi.stubGlobal("window", undefined)
}

afterEach(() => {
  resetFundiReporter()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("mzizi-fundi-reporter destination", () => {
  it("is the registry, suffix included, and can be overridden", () => {
    expect(GITHUB_REPO).toBe("mzizi-dev/mzizi-registry")
    expect(issuesApiUrl()).toBe("https://api.github.com/repos/mzizi-dev/mzizi-registry/issues")
    expect(issuesApiUrl("acme/tracker")).toBe("https://api.github.com/repos/acme/tracker/issues")
  })

  it("on a server, POSTs the issue to mzizi-dev/mzizi-registry", async () => {
    onServer()
    const fetchMock = mockFetch(Response.json({ html_url: ISSUE }, { status: 201 }))

    const result = await initFundiReporter({ githubToken: "test-token" }).report(report)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.github.com/repos/mzizi-dev/mzizi-registry/issues",
    )
    expect(result).toEqual({ queued: true, issueUrl: ISSUE })
  })

  it("files at githubRepo when one is given", async () => {
    onServer()
    const fetchMock = mockFetch(Response.json({ html_url: ISSUE }, { status: 201 }))

    await initFundiReporter({ githubToken: "t", githubRepo: "acme/tracker" }).report(report)

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/acme/tracker/issues")
  })
})

describe("mzizi-fundi-reporter in a browser", () => {
  it("never sends a GitHub token, and files nothing without an endpoint", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchMock = mockFetch()

    const result = await initFundiReporter({ githubToken: "leaked" }).report(report)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result).toEqual({ queued: false, reason: "token-in-browser" })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("githubToken is ignored in a browser"))
  })

  it("sends to the fundi endpoint instead, without the token", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchMock = mockFetch(new Response(null, { status: 202 }))

    const result = await initFundiReporter({
      githubToken: "leaked",
      fundiEndpoint: "/api/fundi",
    }).report(report)

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/fundi")
    expect(JSON.stringify(fetchMock.mock.calls[0]?.[1])).not.toContain("leaked")
    expect(result).toEqual({ queued: true })
  })
})

describe("mzizi-fundi-reporter failures and cooldown", () => {
  it.each([401, 403, 404, 410, 500])(
    "reports an HTTP %i as a failure and lets the retry through",
    async (status) => {
      const fetchMock = mockFetch(
        new Response("no", { status }),
        new Response(null, { status: 202 }),
      )
      const reporter = initFundiReporter({ fundiEndpoint: "/api/fundi" })

      expect(await reporter.report(report)).toEqual({ queued: false, reason: "http-error", status })
      expect(await reporter.report(report)).toEqual({ queued: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    },
  )

  it("resolves a network error to a failure result and lets the retry through", async () => {
    mockFetch(new TypeError("Failed to fetch"), new Response(null, { status: 202 }))
    const reporter = initFundiReporter({ fundiEndpoint: "/api/fundi" })

    await expect(reporter.report(report)).resolves.toEqual({
      queued: false,
      reason: "network-error",
    })
    expect(await reporter.report(report)).toEqual({ queued: true })
  })

  it("treats a GitHub 2xx without a readable issue as a failure", async () => {
    onServer()
    mockFetch(new Response("<html>", { status: 201 }), Response.json({}, { status: 201 }))
    const reporter = initFundiReporter({ githubToken: "t" })

    expect(await reporter.report(report)).toEqual({
      queued: false,
      reason: "invalid-response",
      status: 201,
    })
    expect(await reporter.report(report)).toEqual({
      queued: false,
      reason: "invalid-response",
      status: 201,
    })
  })

  it("keys the cooldown on component and error type", async () => {
    const fetchMock = mockFetch(
      new Response(null, { status: 202 }),
      new Response(null, { status: 202 }),
    )
    const reporter = initFundiReporter({ fundiEndpoint: "/api/fundi" })

    expect(await reporter.report(report)).toEqual({ queued: true })
    expect(await reporter.report({ ...report, errorType: "network" })).toEqual({ queued: true })
    expect(await reporter.report(report)).toEqual({ queued: false, reason: "cooldown" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

/** The source with comments removed (string-aware: `//` in a URL stays). */
function code(): string {
  const src = readFileSync(
    path.resolve(__dirname, "../../components/registry/n9-fundi/mzizi-fundi-reporter.ts"),
    "utf8",
  )
  let out = ""
  let quote: string | null = null
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (quote) {
      out += c
      if (c === "\\") out += src[++i] ?? ""
      else if (c === quote) quote = null
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++
      out += "\n"
    } else if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2) + 1
    } else {
      if (c === '"' || c === "'" || c === "`") quote = c
      out += c
    }
  }
  return out
}

describe("mzizi-fundi-reporter source", () => {
  it("declares the registry live, not in a comment", () => {
    expect(code()).toContain('export const GITHUB_REPO = "mzizi-dev/mzizi-registry"')
  })

  it("names neither a retired repo nor the Mzizi language's, in any quote style", () => {
    const live = code()
    for (const wrong of ["nyuchi/mzizi", "nyuchi/design-portal", "mzizi-dev/mzizi"]) {
      expect(live).not.toMatch(new RegExp(`${wrong.replace("/", "\\/")}(?![\\w.-])`))
    }
  })
})
