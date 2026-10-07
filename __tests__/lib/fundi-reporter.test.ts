/**
 * Where the fundi reporter files its issues (#321).
 *
 * The destination was `nyuchi/design-portal`, then `nyuchi/mzizi`: each the
 * registry's name before a rename, each kept working only through GitHub's
 * rename redirect. So this checks the request the reporter actually makes, not
 * just the constant, and forbids the old names so the next rename cannot
 * regress the same way unnoticed.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  GITHUB_REPO,
  initFundiReporter,
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("mzizi-fundi-reporter destination", () => {
  it("is the registry, suffix included", () => {
    expect(GITHUB_REPO).toBe("mzizi-dev/mzizi-registry")
  })

  it("POSTs the issue to mzizi-dev/mzizi-registry", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({
        html_url: "https://github.com/mzizi-dev/mzizi-registry/issues/1",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await initFundiReporter({
      githubToken: "test-token",
    }).report(report)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.github.com/repos/mzizi-dev/mzizi-registry/issues",
    )
    expect(result).toEqual({
      issueUrl: "https://github.com/mzizi-dev/mzizi-registry/issues/1",
      queued: true,
    })
  })

  it("names neither a retired repo nor the Mzizi language's", () => {
    const source = readFileSync(
      path.resolve(
        __dirname,
        "../../components/registry/n9-fundi/mzizi-fundi-reporter.ts",
      ),
      "utf8",
    )
    for (const wrong of [
      '"nyuchi/mzizi"',
      '"nyuchi/design-portal"',
      '"mzizi-dev/mzizi"',
    ]) {
      expect(source).not.toContain(wrong)
    }
  })
})
