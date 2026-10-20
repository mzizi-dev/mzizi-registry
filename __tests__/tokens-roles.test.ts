// The role layer (#484, slice 1): every role in `lib/tokens/roles.source.ts` is
// declared by the stylesheet the registry ships, registered with Tailwind under a
// key that collides with no Tailwind keyword, resolves to the manifest's value in
// both themes, and passes the contrast gate.
//
// These read the COMMITTED `mzizi-tokens-globals.css` and compile it with the
// repo's Tailwind, so they test what a consumer that copies the file gets.

import { describe, expect, it } from "vitest"
import { escapeRegExp } from "./helpers/regexp"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { compile } from "tailwindcss"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.source"
import { backgroundColors } from "@/lib/tokens/brand.source"
import { BODY, colorKey, CONTROL_SURFACES, contrastMin, isColorKind, NON_BODY, ROLES, UI, type Role } from "@/lib/tokens/roles.source"
import {
  apca,
  LADDER,
  wcag,
  MUTED,
  renderGlobalsCss,
  resolveRoles,
  roleGate,
  roleVar,
  sizeRoleTheme,
  textRamp,
} from "../scripts/render-globals-css"

const ROOT = process.cwd()
const CSS = readFileSync(join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"), "utf8")
const TAILWIND = dirname(createRequire(import.meta.url).resolve("tailwindcss/package.json"))
const RESOLVED = resolveRoles(minerals, heritageColors, experimentalColors)

async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(CSS, {
    base: ROOT,
    loadStylesheet: async (id: string) => {
      const path = id === "tailwindcss" ? join(TAILWIND, "index.css") : join(TAILWIND, id.replace(/^tailwindcss\//, ""))
      return { path, base: dirname(path), content: readFileSync(path, "utf8") }
    },
  })
  return compiler.build(candidates)
}

/** The declarations of a utility's rule in compiled output. */
function rule(css: string, cls: string): string {
  // Tailwind escapes `\`, `/` and `.` in a class name with a backslash; match that escaped form literally.
  const esc = escapeRegExp(cls.replace(/[\\/.]/g, "\\$&"))
  const m = css.match(new RegExp(`\\n\\s*\\.${esc} \\{([^}]*)\\}`))
  return m?.[1] ?? ""
}

/** `--name: value` for every declaration in one top-level block of the stylesheet. */
function declarations(selectorStart: string): Map<string, string> {
  const at = CSS.indexOf(`\n${selectorStart}`)
  if (at === -1) throw new Error(`no ${selectorStart} block`)
  const open = CSS.indexOf("{", at)
  let depth = 0
  let end = open
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === "{") depth++
    if (CSS[i] === "}" && --depth === 0) {
      end = i
      break
    }
  }
  const body = CSS.slice(open + 1, end).replace(/\/\*[\s\S]*?\*\//g, "")
  const out = new Map<string, string>()
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].replace(/\s+/g, " ").trim())
  return out
}

const LIGHT = declarations(":root {")
const DARK = declarations(".dark,")
const THEME = declarations("@theme {\n  /* ── FONT ROLES")
const INLINE = declarations("@theme inline {")

/**
 * Resolve `var()` chains the way a browser does on an element that is both
 * `:root` and `.dark`. `overrides` is a consumer's LOCAL OVERRIDES block: it
 * wins over the generated declarations in both themes, as it does in the file.
 * The `@theme inline` registrations resolve too (`--spacing-control`).
 */
function computed(name: string, mode: "light" | "dark", overrides: Record<string, string> = {}, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`cycle at ${name}`)
  seen.add(name)
  const raw = overrides[name] ?? (mode === "dark" ? DARK.get(name) : undefined) ?? LIGHT.get(name) ?? INLINE.get(name)
  if (raw === undefined) throw new Error(`${name} is not declared in ${mode}`)
  return raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, v: string) => computed(v, mode, overrides, new Set(seen)))
}

/** Every custom property a var's chain passes through, in one theme. */
function chain(name: string, mode: "light" | "dark", seen = new Set<string>()): Set<string> {
  seen.add(name)
  const raw = (mode === "dark" ? DARK.get(name) : undefined) ?? LIGHT.get(name) ?? ""
  for (const m of raw.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) if (!seen.has(m[1])) chain(m[1], mode, seen)
  return seen
}

/** A computed length in px: `3.5rem`, `48px`, or `max(a, b)` of those. */
function lengthPx(expr: string): number {
  const v = expr.trim()
  const max = v.match(/^max\(\s*(.*)\s*\)$/)
  if (max) return Math.max(...max[1].split(",").map(lengthPx))
  if (v.endsWith("rem")) return parseFloat(v) * 16
  if (v.endsWith("px")) return parseFloat(v)
  throw new Error(`not a length: ${expr}`)
}

describe("the role manifest", () => {
  it("names each role once, and every alias names a role", () => {
    const names = ROLES.map((r) => r.name)
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
    const refs = ROLES.flatMap((r) => {
      const d = r.default as Record<string, unknown>
      const vals = "light" in d ? [d.light, d.dark] : [d]
      return vals.flatMap((v) => {
        const x = v as { role?: string; mix?: [string, number, string] }
        return [x.role, x.mix?.[0], x.mix?.[2]].filter(Boolean) as string[]
      })
    })
    expect(refs.filter((n) => !names.includes(n))).toEqual([])
  })

  it("covers the groups #484 §2a lists", () => {
    const names = new Set(ROLES.map((r) => r.name))
    for (const tone of ["success", "warning", "info", "danger", "premium", "neutral", "stable", "beta", "alpha", "deprecated"]) {
      for (const suffix of ["", "-container", "-on-container", "-text"]) expect(names.has(`status-${tone}${suffix}`), `status-${tone}${suffix}`).toBe(true)
    }
    for (let i = 1; i <= 7; i++) {
      expect(names.has(`chart-${i}`)).toBe(true)
      expect(names.has(`category-${i}`)).toBe(true)
    }
    for (const n of [
      "primary", "primary-foreground", "ring", "brand-accent", "brand-accent-foreground", "app-accent", "app-accent-foreground",
      "destructive", "destructive-foreground", "destructive-text", "spacing-touch", "spacing-touch-min", "spacing-control",
      "radius-control", "radius-field", "radius-badge", "radius-card", "radius-dialog", "font-body", "font-display", "font-code",
    ]) {
      expect(names.has(n), n).toBe(true)
    }
  })

  it("keeps danger terracotta and destructive red, as two roles (owner decision 2026-10-07)", () => {
    expect(RESOLVED.get("status-danger")!.css.light).toBe("var(--mineral-terracotta)")
    expect(RESOLVED.get("destructive")!.value.light).toBe("#B3261E")
  })

  it("keeps Mzizi pill and the touch floor at 48px (owner decisions 2026-10-07)", () => {
    expect(RESOLVED.get("radius-control")!.value.light).toBe("9999px")
    expect(RESOLVED.get("spacing-touch")!.value.light).toBe("56px")
    expect(RESOLVED.get("spacing-touch-min")!.value.light).toBe("48px")
    const flat = CSS.replace(/\s+/g, " ")
    expect(flat).toContain("--spacing-touch-min: 3rem;")
    expect(flat).toContain("--spacing-touch: max( var(--size-touch), 3rem );")
  })
})

describe("the contrast gate on the Mzizi pack", () => {
  const { results, violations, pending, decorative } = roleGate(RESOLVED)

  it("finds no violation", () => {
    expect(violations).toEqual([])
    expect(results.length).toBeGreaterThan(150)
  })

  it("leaves only the control edge controls draw today pending: input, until slice 4 (#484)", () => {
    expect([...new Set(pending.map((p) => p.role))]).toEqual(["input"])
    // Every one of its measurements: no surface a control sits on lets it pass.
    expect(pending).toHaveLength(CONTROL_SURFACES.length * 2)
    expect(pending[0]!.pending).toMatch(/Slice 4 of #484/)
    expect(results.filter((r) => r.role === "input" && r.pass)).toEqual([])
  })

  it("exempts exactly the decorative hairlines, and says why each is never the only cue", () => {
    expect(decorative.map((d) => d.role).sort()).toEqual(["border", "sidebar-border"])
    for (const d of decorative) expect(d.reason, d.role).toMatch(/never the only cue/)
    expect(results.some((r) => r.role === "border" || r.role === "sidebar-border")).toBe(false)
  })

  it("puts border-control at Lc 30 and WCAG 3:1 on every surface a control can sit on, in both themes", () => {
    expect(CONTROL_SURFACES).toEqual(expect.arrayContaining(["base", "surface", "container", "overlay", "raised", "popover", "card", "sidebar"]))
    const got: string[] = []
    for (const mode of ["light", "dark"] as const) {
      for (const bg of CONTROL_SURFACES) {
        const fg = RESOLVED.get("border-control")!.value[mode]
        const on = RESOLVED.get(bg)!.value[mode]
        expect(Math.abs(apca(fg, on)), `${mode} on ${bg}`).toBeGreaterThanOrEqual(30)
        expect(wcag(fg, on), `${mode} on ${bg}`).toBeGreaterThanOrEqual(3)
        got.push(`${mode}:${bg}`)
      }
    }
    expect(results.filter((r) => r.role === "border-control").map((r) => `${r.mode}:${r.against}`).sort()).toEqual(got.sort())
    // The hairline it starts from is far under both: border stays decorative, border-control is the control's edge.
    expect(Math.abs(apca(RESOLVED.get("border")!.value.light, RESOLVED.get("base")!.value.light))).toBeLessThan(15)
  })

  it("holds text-tertiary to its own Lc 60 floor and WCAG 4.5:1, and keeps it lighter than text-secondary", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const bg of ["base", "surface"]) {
        const on = RESOLVED.get(bg)!.value[mode]
        const hex = RESOLVED.get("text-tertiary")!.value[mode]
        const tertiary = Math.abs(apca(hex, on))
        const secondary = Math.abs(apca(RESOLVED.get("text-secondary")!.value[mode], on))
        expect(tertiary, `${mode} on ${bg}`).toBeGreaterThanOrEqual(60)
        expect(wcag(hex, on), `${mode} on ${bg}`).toBeGreaterThanOrEqual(4.5)
        expect(tertiary, `${mode} on ${bg}`).toBeLessThan(75)
        // "Add 4.5:1 too" (owner, 2026-10-20) moves light tertiary to Lc 66.8-69.7: still 8.5 under secondary.
        expect(secondary - tertiary, `${mode} on ${bg}: secondary stays a step above tertiary`).toBeGreaterThanOrEqual(8)
      }
    }
    const rows = results.filter((r) => r.role === "text-tertiary")
    expect(rows.every((r) => r.min === 60 && r.wcag?.min === 4.5 && r.pass)).toBe(true)
  })

  it("puts --muted-foreground at Lc 75 on base and surface in both themes (#399)", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const bg of ["base", "surface"]) {
        const lc = Math.abs(apca(RESOLVED.get("muted-foreground")!.value[mode], RESOLVED.get(bg)!.value[mode]))
        expect(lc, `${mode} on ${bg}`).toBeGreaterThanOrEqual(75)
      }
    }
  })

  it("derives exactly the values whose palette default misses its bar", () => {
    const derived = [...RESOLVED.values()]
      .flatMap((r) => Object.keys(r.derived).map((m) => `${r.role.name}:${m}`))
      .sort()
    expect(derived).toEqual([
      "border-control:dark",
      "border-control:light",
      "destructive-text:dark",
      "destructive-text:light",
      "destructive:dark",
      "status-danger-text:light",
      "status-premium-on-container:dark",
    ])
  })

  it("holds every text role to Lc 75 unless it is non-body (Lc 60), pending or exempt", () => {
    for (const r of ROLES.filter((x) => x.kind === "text")) {
      expect(r.contrast, r.name).toBeDefined()
      if (r.contrast && "against" in r.contrast && !r.contrast.pending) {
        expect(contrastMin(r.kind, r.contrast), r.name).toBeGreaterThanOrEqual(r.contrast.nonBody ? NON_BODY : BODY)
      }
    }
    expect([BODY, NON_BODY, UI]).toEqual([75, 60, 30])
    expect(ROLES.filter((r) => r.contrast && "exempt" in r.contrast).map((r) => r.name)).toEqual(["hero-text"])
    expect(ROLES.filter((r) => r.contrast && "against" in r.contrast && r.contrast.nonBody).map((r) => r.name)).toEqual(["text-tertiary"])
    expect(ROLES.filter((r) => r.contrast && "decorative" in r.contrast).map((r) => r.name).sort()).toEqual(["border", "sidebar-border"])
  })
})

describe("the stylesheet declares every role", () => {
  it("declares each colour, size and radius role in :root, resolving to the manifest's value in both themes", () => {
    const wrong: string[] = []
    for (const r of RESOLVED.values()) {
      if (r.role.kind === "font") continue
      for (const mode of ["light", "dark"] as const) {
        const got = computed(roleVar(r.role), mode)
        if (got.startsWith("color-mix(")) continue // accent and wash: the browser mixes
        const want = r.value[mode]
        const same = r.role.kind === "size" ? parseFloat(got) * 16 === parseFloat(want) : got.replace(/\s/g, "").toLowerCase() === want.replace(/\s/g, "").toLowerCase()
        if (!same) wrong.push(`${r.role.name} (${mode}): stylesheet ${got}, manifest ${want}`)
      }
    }
    expect(wrong).toEqual([])
  })

  it("resolves --status-success-text to malachite's text tier in both themes", () => {
    expect(computed("--status-success-text", "light")).toBe("#004d40")
    expect(computed("--status-success-text", "dark")).toBe("#64ffda")
  })

  it("declares the font roles in a non-inline @theme, with font-sans/serif/mono as aliases", () => {
    for (const r of ROLES.filter((x) => x.kind === "font")) expect(THEME.get(`--${r.name}`), r.name).toBe(RESOLVED.get(r.name)!.css.light)
    expect(THEME.get("--font-sans")).toBe("var(--font-body)")
    expect(THEME.get("--font-serif")).toBe("var(--font-display)")
    expect(THEME.get("--font-mono")).toBe("var(--font-code)")
    const inline = CSS.slice(CSS.indexOf("@theme inline {"), CSS.indexOf("}", CSS.indexOf("@theme inline {")))
    expect(inline).not.toMatch(/--font-/)
  })
})

describe("Tailwind keys (#456)", () => {
  it("compiles text-base to Tailwind's 16px font size, not a colour", async () => {
    const out = await build(["text-base"])
    const body = rule(out, "text-base")
    expect(body).toMatch(/font-size:/)
    expect(body).not.toMatch(/(^|[^-])color:/)
    expect(CSS).not.toMatch(/--color-base:/)
  })

  it("registers the base step as bg-surface-base", async () => {
    const out = await build(["bg-surface-base"])
    expect(rule(out, "bg-surface-base")).toMatch(/background-color: var\(--base\);/)
  })

  it("gives every colour role a colour utility, and no key collides with a Tailwind keyword", async () => {
    const colors = ROLES.filter((r) => isColorKind(r.kind))
    const out = await build(colors.flatMap((r) => [`text-${colorKey(r)}`, `bg-${colorKey(r)}`, `border-${colorKey(r)}`]))
    const wrong: string[] = []
    for (const r of colors) {
      const k = colorKey(r)
      const v = `var(${roleVar(r)})`
      const text = rule(out, `text-${k}`)
      if (text.trim() !== `color: ${v};`) wrong.push(`text-${k}: ${text}`)
      if (!rule(out, `bg-${k}`).includes(`background-color: ${v};`)) wrong.push(`bg-${k}`)
      if (!rule(out, `border-${k}`).includes(`border-color: ${v};`)) wrong.push(`border-${k}`)
    }
    expect(wrong).toEqual([])
  })

  it("gives every size, radius and font role its utility", async () => {
    const sizes = ROLES.filter((r) => r.kind === "size").map((r) => r.name.replace(/^spacing-/, ""))
    const radii = ROLES.filter((r) => r.kind === "radius").map((r) => r.name.replace(/^radius-/, ""))
    const fonts = ROLES.filter((r) => r.kind === "font").map((r) => r.name.replace(/^font-/, ""))
    const out = await build([...sizes.map((s) => `h-${s}`), ...radii.map((r) => `rounded-${r}`), ...fonts.map((f) => `font-${f}`), "font-sans"])
    for (const s of sizes) expect(rule(out, `h-${s}`), `h-${s}`).toMatch(/^\s*height: /)
    expect(rule(out, "h-touch-min")).toMatch(/height: 3rem;/)
    for (const r of radii) expect(rule(out, `rounded-${r}`), `rounded-${r}`).toContain(`border-radius: var(--r-${r});`)
    for (const f of fonts) expect(rule(out, `font-${f}`), `font-${f}`).toContain(`font-family: var(--font-${f});`)
    // Non-inline: the font roles reach :root, where a brand overrides them at runtime.
    expect(out).toMatch(/--font-body: "Noto Sans"/)
    expect(rule(out, "font-sans")).toMatch(/font-family: var\(--font-sans\);/)
  })
})

describe("the platform files carry the roles", () => {
  const N1 = join(ROOT, "components/registry/n1-tokens")
  it("gives Rust Roles { light, dark } and Roles::mzizi()", () => {
    const rust = readFileSync(join(N1, "mzizi-tokens-rust.rs"), "utf8")
    expect(rust).toMatch(/pub struct Roles \{\s+\/\/\/ The light theme\.\s+pub light: RoleColors,\s+\/\/\/ The dark theme\.\s+pub dark: RoleColors,/)
    expect(rust).toMatch(/pub const fn mzizi\(\) -> Self/)
    expect(rust).toMatch(/pub const SPACING_TOUCH_MIN: u32 = 48;/)
  })

  it("names every colour role in every platform file", () => {
    const camel = (n: string) => n.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
    const files: [string, (n: string) => string][] = [
      ["mzizi-tokens-swift.swift", (n) => `static let ${camel(n)} = `],
      ["mzizi-tokens-kotlin.kt", (n) => `val ${camel(n)} = Color(`],
      ["mzizi-tokens-arkts.ets", (n) => `${camel(n)}: "`],
      ["mzizi-tokens-react-native.ts", (n) => `${camel(n)}: "`],
      ["mzizi-tokens-python.py", (n) => `${n.replace(/-/g, "_").toUpperCase()}: str = "`],
      ["mzizi-tokens-rust.rs", (n) => `${n.replace(/-/g, "_")}: "`],
      ["mzizi-tokens-typescript.ts", (n) => (n.includes("-") ? `"${n}": {` : `${n}: {`)],
    ]
    for (const [file, decl] of files) {
      const src = readFileSync(join(N1, file), "utf8")
      const missing = ROLES.filter((r) => isColorKind(r.kind)).filter((r) => !src.includes(decl(r.name))).map((r) => r.name)
      expect(missing, file).toEqual([])
    }
  })
})

// ─── /code-review findings on #485 ───────────────────────────────────────────

/** The manifest with some roles replaced or added, for cases the Mzizi pack does not have. */
function manifest(patch: Partial<Record<string, Partial<Role>>> = {}, extra: Role[] = []): Role[] {
  return [...ROLES.map((r) => (patch[r.name] ? ({ ...r, ...patch[r.name] } as Role) : r)), ...extra]
}

const resolveWith = (roles: readonly Role[]) => resolveRoles(minerals, heritageColors, experimentalColors, roles)

describe("the touch floor holds for every floored size role", () => {
  const floored = ROLES.filter((r) => r.floor)

  it("covers touch, control, control-sm, -lg, -icon, field and field-sm, by the floor flag", () => {
    expect(floored.map((r) => r.name).sort()).toEqual(
      ["spacing-control", "spacing-control-icon", "spacing-control-lg", "spacing-control-sm", "spacing-field", "spacing-field-sm", "spacing-touch"].sort()
    )
  })

  it("clamps each one with max(var(--size-x), 3rem) in @theme inline", () => {
    for (const r of floored) expect(INLINE.get(`--${r.name}`), r.name).toBe(`max( var(${roleVar(r)}), 3rem )`)
    // Not floored: the dense control is below the floor on purpose, and moves freely.
    expect(INLINE.get("--spacing-control-dense")).toBe("var(--size-control-dense)")
  })

  it("still computes >= 48px when a brand lowers the bare var to 32px", () => {
    for (const r of floored) {
      for (const mode of ["light", "dark"] as const) {
        const lowered = lengthPx(computed(`--${r.name}`, mode, { [roleVar(r)]: "2rem" }))
        expect(lowered, `${r.name} (${mode})`).toBeGreaterThanOrEqual(48)
        const raised = lengthPx(computed(`--${r.name}`, mode, { [roleVar(r)]: "4rem" }))
        expect(raised, `${r.name} (${mode}) raised`).toBe(64)
      }
    }
  })

  it("keys the clamp on the flag: a floored role under any name is clamped", () => {
    const extra: Role = { name: "spacing-tap", group: "size", kind: "size", required: true, description: "test", default: { px: 50 }, floor: true, block: "invariant" }
    const roles = manifest({}, [extra])
    expect(sizeRoleTheme(roles, resolveWith(roles))).toContain("  --spacing-tap: max(var(--size-tap), 3rem); /* never under the touch floor */")
  })
})

describe("fixed size roles", () => {
  it("registers each fixed role as its OWN literal value", () => {
    const second: Role = { name: "spacing-hit-min", group: "size", kind: "size", required: true, description: "test", default: { px: 60 }, fixed: true, block: "invariant" }
    const roles = manifest({}, [second])
    const lines = sizeRoleTheme(roles, resolveWith(roles))
    expect(lines).toContain("  --spacing-touch-min: 3rem; /* a literal: the touch floor no brand can lower */")
    expect(lines).toContain("  --spacing-hit-min: 3.75rem; /* a literal: fixed, no brand can move it */")
  })
})

describe("alias chains: overriding a source moves a role in both themes or in neither", () => {
  it("passes the same custom properties in light and dark for every role", () => {
    const wrong: string[] = []
    for (const r of RESOLVED.values()) {
      if (r.role.kind === "font") continue
      const light = [...chain(roleVar(r.role), "light")].sort()
      const dark = [...chain(roleVar(r.role), "dark")].sort()
      if (light.join() !== dark.join()) wrong.push(`${r.role.name}: light ${light.join(" ")} | dark ${dark.join(" ")}`)
    }
    expect(wrong).toEqual([])
  })

  it("declares a role derived in one theme as a literal in both", () => {
    for (const r of RESOLVED.values()) {
      if (!Object.keys(r.derived).length) continue
      for (const mode of ["light", "dark"] as const) expect(r.css[mode], `${r.role.name} (${mode})`).toMatch(/^#[0-9a-f]{6}$/)
    }
    // --destructive was var(--error) in light and a literal in dark; overriding --error moves it in neither now.
    for (const mode of ["light", "dark"] as const) {
      expect(computed("--destructive", mode, { "--error": "#123456" }), mode).toBe(computed("--destructive", mode))
      expect(computed("--status-danger-text", mode, { "--mineral-terracotta-text": "#123456" }), mode).toBe(computed("--status-danger-text", mode))
    }
    expect(CSS).toMatch(/ALIAS CHAINS/)
  })

  it("keeps a plain alias following its source in both themes", () => {
    for (const mode of ["light", "dark"] as const) expect(computed("--status-deprecated", mode, { "--status-danger": "#123456" })).toBe("#123456")
  })
})

describe("derivation", () => {
  it("resolves a text-derived foreground on a fill-derived fill, in either order (no recursion)", () => {
    const patched = manifest({ "destructive-foreground": { derive: "text" } })
    const forward = resolveWith(patched)
    const reverse = resolveWith([...patched].reverse())
    for (const map of [forward, reverse]) {
      expect(roleGate(map).violations).toEqual([])
      for (const mode of ["light", "dark"] as const) {
        const lc = Math.abs(apca(map.get("destructive-foreground")!.value[mode], map.get("destructive")!.value[mode]))
        expect(lc, mode).toBeGreaterThanOrEqual(75)
      }
    }
    // The same answer in either resolution order. The fill is measured against what the
    // foreground will paint once it walks, so it may move less than with a fixed foreground.
    for (const name of ["destructive", "destructive-foreground"]) expect(reverse.get(name)!.value).toEqual(forward.get(name)!.value)
    expect(reverse.get("destructive")!.derived).toEqual(forward.get("destructive")!.derived)
  })

  const ui = (name: string, against: string, literal: string): Role => ({
    name, group: "identity", kind: "ui", required: true, description: "test", contrast: { against: [against], min: 30 }, default: { literal }, block: "roles",
  })
  const fill = (name: string, literal: string): Role => ({
    name, group: "identity", kind: "fill", required: true, description: "test", default: { literal }, derive: "fill", block: "roles",
  })

  it("walks a fill the way every foreground allows, not only the first one's way", () => {
    // White passes on #303030 and pulls the fill toward black; black fails there.
    // Toward black never satisfies black, so the walk goes the other way.
    const roles = manifest({}, [fill("test-fill", "#303030"), ui("test-on-light", "test-fill", "#FFFFFF"), ui("test-on-dark", "test-fill", "#000000")])
    const got = resolveWith(roles).get("test-fill")!
    for (const mode of ["light", "dark"] as const) {
      expect(got.value[mode], mode).not.toMatch(/^#(000000|FFFFFF)$/)
      expect(Math.abs(apca("#FFFFFF", got.value[mode]))).toBeGreaterThanOrEqual(30)
      expect(Math.abs(apca("#000000", got.value[mode]))).toBeGreaterThanOrEqual(30)
      expect(got.derived[mode]).toMatch(/test-on-light measures Lc [\d.]+, test-on-dark measures Lc [\d.]+ on #303030; fill walked toward #FFFFFF/)
    }
    expect(roleGate(resolveWith(roles)).violations).toEqual([])
  })

  it("reports a fill no walk can satisfy as a violation naming the roles, never #000/#FFF", () => {
    const text = (name: string, literal: string): Role => ({ ...ui(name, "test-fill", literal), kind: "text", contrast: { against: ["test-fill"], min: 75 } })
    const roles = manifest({}, [fill("test-fill", "#808080"), text("test-white", "#FFFFFF"), text("test-black", "#000000")])
    const map = resolveWith(roles)
    expect(map.get("test-fill")!.value).toEqual({ light: "#808080", dark: "#808080" })
    const { violations } = roleGate(map)
    for (const mode of ["light", "dark"]) {
      expect(violations.some((v) => v.startsWith(`test-fill (${mode}): derive "fill" found no fill`) && v.includes("test-white (needs Lc 75)") && v.includes("test-black (needs Lc 75)"))).toBe(true)
    }
  })

  it("reports a text role no walk can satisfy", () => {
    const roles = manifest({}, [
      { name: "test-bg", group: "identity", kind: "surface", required: true, description: "test", default: { literal: "#808080" }, block: "roles" },
      { name: "test-text", group: "identity", kind: "text", required: true, description: "test", contrast: { against: ["test-bg"], min: 106 }, default: { literal: "#777777" }, derive: "text", block: "roles" },
    ])
    const map = resolveWith(roles)
    expect(map.get("test-text")!.value.light).toBe("#777777")
    expect(roleGate(map).violations).toContain(`test-text (light): derive "text" found no value between #000000 and #FFFFFF from #777777 that clears Lc 106 against test-bg (Lc ${Math.abs(apca("#777777", "#808080")).toFixed(1)} now)`)
  })
})

describe("the ladder is canon's backgroundColors", () => {
  it("reads LADDER and MUTED from brand.source.ts", () => {
    const canon = (n: string) => backgroundColors.find((c) => c.name === n)!
    for (const [name, light, dark] of LADDER) {
      expect(light.replace(/\s/g, "").toUpperCase(), name).toBe(canon(name).lightValue.replace(/\s/g, "").replace(/\.(\d)0\)/, ".$1)").toUpperCase())
      expect(dark.replace(/\s/g, "").toUpperCase(), name).toBe(canon(name).darkValue.replace(/\s/g, "").replace(/\.(\d)0\)/, ".$1)").toUpperCase())
    }
    expect(MUTED).toEqual([canon("muted").lightValue, canon("muted").darkValue])
  })

  it("measures the text ramp on the surface the gate measures", () => {
    const ramp = textRamp()
    for (const mode of ["light", "dark"] as const) {
      const surface = RESOLVED.get("surface")!.value[mode]
      const base = RESOLVED.get("base")!.value[mode]
      expect(+apca(ramp[mode].secondary, surface).toFixed(1)).toBe(ramp[mode].onSurface.secondary)
      expect(+apca(ramp[mode].secondary, base).toFixed(1)).toBe(ramp[mode].measure.secondary)
    }
  })
})

describe("radius roles follow their rung", () => {
  it("declares each role as a var of the base radius ladder", () => {
    const decl = (name: string) => LIGHT.get(name)?.replace(/\s+/g, "")
    expect(decl("--r-control")).toBe("var(--r-full)")
    expect(decl("--r-field")).toBe("var(--r-full)")
    expect(decl("--r-badge")).toBe("var(--r-full)")
    expect(decl("--r-card")).toBe("var(--r-base)")
    expect(decl("--r-dialog")).toBe("var(--r-xl)")
  })

  it("moves the roles and their deprecated names when a consumer overrides --r-full or --r-base", () => {
    for (const name of ["--r-control", "--r-field", "--r-badge", "--r-button", "--r-input", "--radius-control"]) {
      expect(computed(name, "light"), name).toBe("9999px")
      expect(computed(name, "light", { "--r-full": "6px" }), name).toBe("6px")
    }
    expect(computed("--r-card", "light", { "--r-base": "4px" })).toBe("4px")
  })
})

describe("the Rust floor asserts", () => {
  it("are module items, outside any test, for every floored size", () => {
    const N1 = join(ROOT, "components/registry/n1-tokens")
    for (const file of [join(N1, "mzizi-tokens-rust.rs"), join(ROOT, "mzizi-rs/crates/mzizi-tokens/src/generated/mzizi-tokens-rust.rs")]) {
      const rust = readFileSync(file, "utf8")
      expect(rust).not.toMatch(/#\[cfg\(test\)\]/)
      for (const r of ROLES.filter((x) => x.floor)) {
        expect(rust, `${file}: ${r.name}`).toMatch(new RegExp(`^const _: \\(\\) = assert!\\(Roles::${escapeRegExp(r.name.replace(/-/g, "_").toUpperCase())} >= Roles::SPACING_TOUCH_MIN\\);$`, "m"))
      }
    }
    const lib = readFileSync(join(ROOT, "mzizi-rs/crates/mzizi-tokens/src/lib.rs"), "utf8")
    expect(lib.slice(lib.indexOf("#[cfg(test)]"))).not.toMatch(/const _: \(\) = assert!/)
  })
})

describe("one resolution, passed down", () => {
  it("renders the stylesheet from the map it is given, not a second resolution", () => {
    const map = new Map(RESOLVED)
    const role = map.get("status-success-text")!
    map.set("status-success-text", { ...role, css: { light: "#010203", dark: "#040506" } })
    const css = renderGlobalsCss(minerals, heritageColors, experimentalColors, map)
    expect(css).toContain("--status-success-text: #010203;")
    expect(css).toContain("--status-success-text: #040506;")
  })

  it("leaves no module-level role cache in sync-tokens.ts", () => {
    const src = readFileSync(join(ROOT, "scripts/sync-tokens.ts"), "utf8")
    expect(src).not.toMatch(/rolesCache/)
    expect(src.match(/resolveRoles\(/g)).toHaveLength(1)
  })
})

describe("the gate's non-body floor and decorative exemption cannot loosen anything else", () => {
  const gateWith = (patch: Partial<Record<string, Partial<Role>>>) => roleGate(resolveWith(manifest(patch))).violations

  it("lets nonBody imply Lc 60, and fails body text declared at 60 without nonBody", () => {
    expect(contrastMin("text", { against: ["base"], nonBody: "test" })).toBe(NON_BODY)
    expect(gateWith({ "text-tertiary": { contrast: { against: ["base", "surface"], min: 60 } } })).toEqual(
      expect.arrayContaining(["text-tertiary: declares Lc 60, under the text bar of 75", expect.stringMatching(/^text-tertiary \(light\): Lc 6\d\.\d on base, needs 75$/)])
    )
  })

  it("fails a decorative text role, and a nonBody ui role", () => {
    expect(gateWith({ "text-secondary": { contrast: { decorative: "test" } } })).toContain("text-secondary: only a ui role can be decorative, not a text role")
    expect(gateWith({ ring: { contrast: { against: ["base", "surface"], nonBody: "test" } } })).toContain("ring: only a text role can be nonBody, not a ui role")
  })

  it("fails border-control when a pack sets it under 3:1, even where it clears Lc 30", () => {
    // #B4B3AF is where Lc 30 alone lands in light on base and surface: Lc 30.9 on surface, but 1.81:1.
    const violations = gateWith({ "border-control": { default: { literal: "#B4B3AF" }, derive: undefined } })
    expect(violations).toContain("border-control (light): Lc 30.9 on surface, needs 30; WCAG 1.81:1, needs 3:1")
  })

  it("derives border-control from the border role, so a pack's hairline is where the walk starts", () => {
    expect(ROLES.find((r) => r.name === "border-control")!.default).toEqual({ role: "border" })
    const darker = resolveWith(manifest({ border: { default: { literal: "#6E6D6A" } } }))
    // A hairline that already clears both bars in light is used as it is; dark still walks from it.
    expect(darker.get("border-control")!.value.light).toBe("#6E6D6A")
    expect(darker.get("border-control")!.derived.light).toBeUndefined()
  })
})

describe('derive "fill" holds every foreground to all of its bars, as it will paint', () => {
  const fill = (extra: Partial<Role> = {}): Role => ({
    name: "test-fill",
    group: "identity",
    kind: "fill",
    required: true,
    description: "test",
    default: { literal: "#C8C8C8" },
    derive: "fill",
    block: "roles",
    ...extra,
  })

  it("walks the fill until a foreground's WCAG ratio clears, not only its Lc", () => {
    // #6B6B6B on #C8C8C8: Lc 44.8 clears 30, but 3.19:1 misses 4.5:1.
    const edge: Role = { name: "test-edge", group: "identity", kind: "ui", required: true, description: "test", contrast: { against: ["test-fill"], min: 30, wcag: 4.5 }, default: { literal: "#6B6B6B" }, block: "roles" }
    const got = resolveWith(manifest({}, [fill(), edge])).get("test-fill")!
    for (const mode of ["light", "dark"] as const) {
      expect(got.derived[mode], mode).toMatch(/and 4.5:1$/)
      expect(wcag("#6B6B6B", got.value[mode]), mode).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("leaves the fill alone where a text-derived foreground reaches its bar by its own walk", () => {
    // #9A9A9A on #E0E0E0 is Lc 35.9; walked toward ink it clears 75 there, so the fill need not move.
    const text: Role = { name: "test-text", group: "identity", kind: "text", required: true, description: "test", contrast: { against: ["test-fill"], min: 75 }, default: { literal: "#9A9A9A" }, derive: "text", block: "roles" }
    const roles = manifest({}, [fill({ default: { literal: "#E0E0E0" } }), text])
    const resolved = resolveWith(roles)
    const f = resolved.get("test-fill")!
    const t = resolved.get("test-text")!
    expect(f.derived).toEqual({})
    expect(f.value.light).toBe("#E0E0E0")
    expect(Object.keys(t.derived).sort()).toEqual(["dark", "light"])
    expect(Math.abs(apca(t.value.light, f.value.light))).toBeGreaterThanOrEqual(75)
    expect(roleGate(resolved).violations).toEqual([])
  })
})
