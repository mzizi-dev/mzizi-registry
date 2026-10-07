// The role layer (#484, slice 1): every role in `lib/tokens/roles.source.ts` is
// declared by the stylesheet the registry ships, registered with Tailwind under a
// key that collides with no Tailwind keyword, resolves to the manifest's value in
// both themes, and passes the contrast gate.
//
// These read the COMMITTED `mzizi-tokens-globals.css` and compile it with the
// repo's Tailwind, so they test what a consumer that copies the file gets.

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { compile } from "tailwindcss"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.source"
import { colorKey, isColorKind, ROLES } from "@/lib/tokens/roles.source"
import { apca, resolveRoles, roleGate, roleVar } from "../scripts/render-globals-css"

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
  const esc = cls.replace(/[/.]/g, (c) => `\\\\\\${c}`)
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

/** Resolve `var()` chains the way a browser does on an element that is both `:root` and `.dark`. */
function computed(name: string, mode: "light" | "dark", seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`cycle at ${name}`)
  seen.add(name)
  const raw = (mode === "dark" ? DARK.get(name) : undefined) ?? LIGHT.get(name)
  if (raw === undefined) throw new Error(`${name} is not declared in ${mode}`)
  return raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, v: string) => computed(v, mode, new Set(seen)))
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
  const { results, violations, pending } = roleGate(RESOLVED)

  it("finds no violation", () => {
    expect(violations).toEqual([])
    expect(results.length).toBeGreaterThan(150)
  })

  it("leaves exactly the owner decisions pending", () => {
    expect([...new Set(pending.map((p) => p.role))].sort()).toEqual(["border", "sidebar-border", "text-tertiary"])
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
      "destructive-text:dark",
      "destructive-text:light",
      "destructive:dark",
      "status-danger-text:light",
      "status-premium-on-container:dark",
    ])
  })

  it("holds every text role to Lc 75 unless an owner decision is pending or it is exempt", () => {
    for (const r of ROLES.filter((x) => x.kind === "text")) {
      expect(r.contrast, r.name).toBeDefined()
      if (r.contrast && "against" in r.contrast && !r.contrast.pending) expect(r.contrast.min, r.name).toBeGreaterThanOrEqual(75)
    }
    expect(ROLES.filter((r) => r.contrast && "exempt" in r.contrast).map((r) => r.name)).toEqual(["hero-text"])
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
      if (!rule(out, `text-${k}`).match(new RegExp(`^\\s*color: ${v.replace(/[()]/g, "\\$&")};\\s*$`))) wrong.push(`text-${k}: ${rule(out, `text-${k}`)}`)
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
    for (const r of radii) expect(rule(out, `rounded-${r}`), `rounded-${r}`).toMatch(new RegExp(`border-radius: var\\(--r-${r}\\);`))
    for (const f of fonts) expect(rule(out, `font-${f}`), `font-${f}`).toMatch(new RegExp(`font-family: var\\(--font-${f}\\);`))
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
