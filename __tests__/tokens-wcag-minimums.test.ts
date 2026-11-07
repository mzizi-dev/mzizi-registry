// The WCAG 2 contrast MINIMUMS (owner decision 2026-11-02, #399: "adopt a WCAG 7:1 floor for body text.
// We should have minimums set"), enforced next to the APCA bars:
//
//   body text (the BODY rule)       >= 7:1   WCAG_BODY
//   non-body text (NON_BODY)        >= 4.5:1 WCAG_NON_BODY
//   UI parts that must be seen (UI) >= 3:1   WCAG_UI (WCAG 1.4.11)
//
// These measure the default Mzizi pack in both themes, and read the bars from `roles.source.ts` so there
// is one definition. A role under its minimum, or a rule that declares a lower one, fails the gate.

import { describe, expect, it } from "vitest"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.source"
import { ROLES, WCAG_BODY, WCAG_NON_BODY, WCAG_UI, wcagFloor, wcagMin, type MeasuredRule, type Role } from "@/lib/tokens/roles.source"
import { resolveRoles, roleGate, textRamp, wcag } from "../scripts/render-globals-css"

const RESOLVED = resolveRoles(minerals, heritageColors, experimentalColors)
const MODES = ["light", "dark"] as const
const resolveWith = (roles: readonly Role[]) => resolveRoles(minerals, heritageColors, experimentalColors, roles)
const manifest = (patch: Partial<Record<string, Partial<Role>>> = {}): Role[] =>
  ROLES.map((r) => (patch[r.name] ? ({ ...r, ...patch[r.name] } as Role) : r))
const gateWith = (patch: Partial<Record<string, Partial<Role>>>) => roleGate(resolveWith(manifest(patch))).violations

/** Every measured, non-pending role of a kind, with its rule. */
const measured = (kind: Role["kind"]) =>
  ROLES.filter((r): r is Role & { contrast: MeasuredRule } => r.kind === kind && !!r.contrast && "against" in r.contrast)

/** WCAG ratio of a role's resolved value on one of its backgrounds, per theme. */
const ratio = (name: string, bg: string, mode: (typeof MODES)[number]) => wcag(RESOLVED.get(name)!.value[mode], RESOLVED.get(bg)!.value[mode])

// The foregrounds on a brand's solid action fill are the one named exception: 4.5:1, with the reason in the manifest.
const EXCEPTIONS = ["app-accent-foreground", "brand-accent-foreground", "destructive-foreground", "primary-foreground", "sidebar-primary-foreground"]

describe("the three minimums are named exports, one definition", () => {
  it("are 7, 4.5 and 3", () => {
    expect(WCAG_BODY).toBe(7)
    expect(WCAG_NON_BODY).toBe(4.5)
    expect(WCAG_UI).toBe(3)
  })

  it("is the floor the gate reads for each kind of rule", () => {
    expect(wcagFloor("text", { against: ["base"], min: 75 })).toBe(WCAG_BODY)
    expect(wcagFloor("text", { against: ["base"], nonBody: "test" })).toBe(WCAG_NON_BODY)
    expect(wcagFloor("ui", { against: ["base"], min: 30 })).toBe(WCAG_UI)
    expect(wcagFloor("fill")).toBe(0)
    expect(wcagMin("ui", { against: ["base"], min: 30, wcag: 4.5 })).toBe(4.5)
  })
})

describe("body text holds WCAG 7:1 in both themes", () => {
  it("every default body-text role clears 7:1 on everything it is measured on", () => {
    const body = measured("text").filter((r) => !r.contrast.nonBody && !r.contrast.pending && !r.contrast.wcagException)
    expect(body.length).toBeGreaterThan(40)
    const under: string[] = []
    for (const r of body) {
      for (const mode of MODES) {
        for (const bg of r.contrast.against) {
          const got = ratio(r.name, bg, mode)
          if (got < WCAG_BODY) under.push(`${r.name} (${mode}) on ${bg}: ${got.toFixed(2)}:1`)
        }
      }
    }
    expect(under).toEqual([])
  })

  it("names text-primary, text-secondary, muted-foreground and foreground, on base and surface", () => {
    for (const name of ["text-primary", "text-secondary", "muted-foreground", "foreground"]) {
      expect(
        measured("text").some((r) => r.name === name && !r.contrast.nonBody),
        name
      ).toBe(true)
      for (const mode of MODES) {
        for (const bg of ["base", "surface"]) expect(ratio(name, bg, mode), `${name} ${mode} on ${bg}`).toBeGreaterThanOrEqual(WCAG_BODY)
      }
    }
  })

  it("walks light text-secondary to the lightest ramp step that clears 7:1 on base and surface", () => {
    const light = textRamp().light.secondary.toLowerCase()
    expect(light).toBe("#504f4e")
    expect(wcag(light, RESOLVED.get("base")!.value.light)).toBeGreaterThanOrEqual(WCAG_BODY)
    expect(wcag(light, RESOLVED.get("surface")!.value.light)).toBeGreaterThanOrEqual(WCAG_BODY)
    // The old value (#575655) measured 6.59:1 on base and 6.30:1 on surface.
    expect(wcag("#575655", RESOLVED.get("base")!.value.light)).toBeLessThan(WCAG_BODY)
    expect(RESOLVED.get("muted-foreground")!.value.light.toLowerCase()).toBe(light)
  })
})

describe("non-body text holds WCAG 4.5:1", () => {
  it("every nonBody role clears 4.5:1 on everything it is measured on", () => {
    const nonBody = measured("text").filter((r) => r.contrast.nonBody && !r.contrast.pending)
    expect(nonBody.map((r) => r.name)).toContain("text-tertiary")
    for (const r of nonBody) {
      for (const mode of MODES) {
        for (const bg of r.contrast.against) expect(ratio(r.name, bg, mode), `${r.name} ${mode} on ${bg}`).toBeGreaterThanOrEqual(WCAG_NON_BODY)
      }
    }
  })

  it("stays lighter than text-secondary, which body copy uses", () => {
    for (const mode of MODES) expect(ratio("text-tertiary", "base", mode)).toBeLessThan(ratio("text-secondary", "base", mode))
  })
})

describe("UI parts hold WCAG 3:1", () => {
  it("every non-decorative, non-pending ui role clears 3:1 on everything it is measured on", () => {
    const ui = measured("ui").filter((r) => !r.contrast.pending)
    expect(ui.map((r) => r.name)).toEqual(expect.arrayContaining(["ring", "border-control", "sidebar-ring"]))
    for (const r of ui) {
      for (const mode of MODES) {
        for (const bg of r.contrast.against) expect(ratio(r.name, bg, mode), `${r.name} ${mode} on ${bg}`).toBeGreaterThanOrEqual(WCAG_UI)
      }
    }
  })
})

describe("the gate fails a default under its minimum", () => {
  it("fails light text-secondary at its old value, #575655 (6.59:1 on base)", () => {
    expect(gateWith({ "text-secondary": { default: { literal: "#575655" } } })).toEqual(
      expect.arrayContaining([expect.stringMatching(/^text-secondary \(light\): Lc 78\.2 on base, needs 75; WCAG 6\.59:1, needs 7:1$/)])
    )
  })

  it("fails a body role that clears Lc 75 but not 7:1, a nonBody role under 4.5:1, and a ui role under 3:1", () => {
    // #5C5B5A: Lc 75.3+ on base, but under 7:1.
    expect(
      gateWith({
        "muted-foreground": { default: { literal: "#5C5B5A" } },
      }).some((v) => /^muted-foreground \(light\).*needs 7:1$/.test(v))
    ).toBe(true)
    // #8A8987: Lc ~50, 3:1; a nonBody role needs 4.5:1 and Lc 60.
    expect(gateWith({ "text-tertiary": { default: { literal: "#8A8987" } } }).some((v) => /^text-tertiary \(light\).*needs 4\.5:1$/.test(v))).toBe(
      true
    )
    // A pale ring: under 3:1.
    expect(gateWith({ ring: { default: { literal: "#9AA4B2" } } }).some((v) => /^ring \(light\).*needs 3:1$/.test(v))).toBe(true)
  })

  it("fails a rule that declares a WCAG bar under the kind's minimum, unless it is pending", () => {
    const low = {
      against: ["base", "surface"],
      min: 75,
      wcag: 4.5,
    } as MeasuredRule
    expect(gateWith({ "text-secondary": { contrast: low } })).toContain("text-secondary: declares WCAG 4.5:1, under the text minimum of 7:1")
    const lowUi = {
      against: ["base", "surface"],
      min: 30,
      wcag: 2,
    } as MeasuredRule
    expect(gateWith({ ring: { contrast: lowUi } })).toContain("ring: declares WCAG 2:1, under the ui minimum of 3:1")
  })

  it("fails a body role whose rule omits `wcag` entirely when its value is under 7:1", () => {
    const rule = { against: ["base", "surface"], min: 75 } as MeasuredRule
    expect(
      gateWith({
        "text-secondary": { contrast: rule, default: { literal: "#575655" } },
      }).some((v) => /needs 7:1$/.test(v))
    ).toBe(true)
  })

  it("reports the minimum in the results, per measurement", () => {
    const { results } = roleGate(RESOLVED)
    const sec = results.find((r) => r.role === "text-secondary" && r.mode === "light" && r.against === "surface")!
    expect(sec.wcag).toEqual({ measure: expect.any(Number), min: WCAG_BODY })
    expect(sec.wcag!.measure).toBeGreaterThanOrEqual(WCAG_BODY)
    expect(results.find((r) => r.role === "text-tertiary")!.wcag!.min).toBe(WCAG_NON_BODY)
    expect(results.find((r) => r.role === "ring")!.wcag!.min).toBe(WCAG_UI)
  })
})

describe("the named exception to the body minimum is exactly the label on a brand's action fill", () => {
  it("pins the exact set, each with a reason and the APCA bar still applied", () => {
    const withException = ROLES.filter((r) => r.contrast && "wcagException" in r.contrast && r.contrast.wcagException)
    expect(withException.map((r) => r.name).sort()).toEqual(EXCEPTIONS)
    const { wcagExceptions } = roleGate(RESOLVED)
    expect(wcagExceptions.map((e) => e.role).sort()).toEqual(EXCEPTIONS)
    for (const e of wcagExceptions) {
      expect(e.min).toBe(WCAG_NON_BODY)
      expect(e.reason.length).toBeGreaterThan(40)
    }
    for (const name of EXCEPTIONS) {
      for (const mode of MODES) {
        for (const r of roleGate(RESOLVED).results.filter((x) => x.role === name && x.mode === mode)) {
          expect(r.min).toBeGreaterThanOrEqual(75)
          expect(r.wcag!.measure, `${name} ${mode}`).toBeGreaterThanOrEqual(WCAG_NON_BODY)
        }
      }
    }
  })

  it("a wcagException on a non-text role is a violation", () => {
    const r = {
      against: ["base"],
      min: 30,
      wcagException: { min: 2, reason: "test" },
    } as MeasuredRule
    expect(gateWith({ ring: { contrast: r } })).toContain("ring: only a text role can carry a wcagException, not a ui role")
  })
})
