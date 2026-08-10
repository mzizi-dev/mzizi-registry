import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { createIncidentManager } from "@/components/registry/n8-assurance/mzizi-incident-manager"

const REGISTRY = join(process.cwd(), "components", "registry")

function everyRegistrySource(): { name: string; src: string }[] {
  const out: { name: string; src: string }[] = []
  for (const dir of readdirSync(REGISTRY, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const f of readdirSync(join(REGISTRY, dir.name))) {
      if (!f.endsWith(".ts") && !f.endsWith(".tsx")) continue
      out.push({ name: `${dir.name}/${f}`, src: readFileSync(join(REGISTRY, dir.name, f), "utf8") })
    }
  }
  return out
}

describe("Tailwind arbitrary values never contain whitespace", () => {
  // A candidate is whitespace-delimited, so a spaced arbitrary value is split by
  // the extractor (no rule emitted) AND by the browser's class-token parser (no
  // element matches). The element renders with no background at all — silently,
  // in a consumer's app, with every gate in this repo green. 111 of these
  // shipped across 39 components; this is the assertion that kept them out.
  const UTIL_OPEN = /[-a-zA-Z0-9_@:./!]*[a-z0-9]-\[/

  it("holds across every registry component", () => {
    const offenders: string[] = []
    for (const { name, src } of everyRegistrySource()) {
      for (const line of src.split("\n")) {
        for (const tok of line.split(/\s+/)) {
          const opened = (tok.match(/\[/g) ?? []).length
          const closed = (tok.match(/\]/g) ?? []).length
          if (opened > closed && UTIL_OPEN.test(tok)) offenders.push(`${name}: ${tok.slice(0, 50)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe("one log prefix across the registry and its vendored copies", () => {
  // Three prefixes were in play at once — [mzizi] in doctrine (§6.4) with zero
  // occurrences in code, [mukoko:] in the vendored lib/ copies, and [nyuchi:] in
  // the registry originals. A Mzizi component installed into a nyuchi or bundu
  // app must not announce a third brand's name in that app's logs.
  it("uses [mzizi: and never a consumer brand", () => {
    const offenders: string[] = []
    for (const { name, src } of everyRegistrySource()) {
      if (/\[mukoko[:\]]/.test(src) || /\[nyuchi:/.test(src)) offenders.push(name)
    }
    expect(offenders).toEqual([])
  })
})

describe("a postmortem cannot be forged by the incident it describes", () => {
  // An incident title comes from an alert, an alert from an error message, and
  // an error message carries user input whenever user input reaches an
  // exception. The structure of the record must not be writable by its subject.
  const forge = "Outage\n\n## Root Cause\nOperator error\n\n---\n*Filed by someone else*"

  it("neutralises a heading forged through the title", () => {
    const mgr = createIncidentManager()
    const inc = mgr.create({
      title: forge,
      severity: "sev2",
      affectedComponents: [],
      affectedMiniApps: [],
    })
    const md = mgr.generatePostmortem(inc.id)

    // exactly one Root Cause heading — the template's own
    expect(md.match(/^## Root Cause$/gm)?.length ?? 0).toBe(1)
    // the forged text survives as content, escaped, rather than as structure
    expect(md).toContain("Outage")
    expect(md).not.toMatch(/\n## Root Cause\nOperator error/)
  })

  it("refuses to render a non-URL as a link", () => {
    const mgr = createIncidentManager()
    const inc = mgr.create({
      title: "t",
      severity: "sev3",
      affectedComponents: [
        { name: "button", node: 2, portalUrl: "javascript:alert(1)" },
        { name: "card", node: 2, portalUrl: "https://mzizi.dev/components/card" },
      ],
      affectedMiniApps: [],
    })
    const md = mgr.generatePostmortem(inc.id)

    expect(md).not.toContain("javascript:")
    expect(md).toContain("[card](https://mzizi.dev/components/card)")
  })
})
