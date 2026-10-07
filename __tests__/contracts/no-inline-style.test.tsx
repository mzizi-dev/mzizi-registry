/**
 * The CSP rule, registry-wide (#444): no contract-held implementation puts an
 * inline `style` attribute on an element, so an app's Content-Security-Policy
 * can keep `style-src 'self'` with no `'unsafe-inline'`. (`MineralStrip` in
 * `@bundu/ui` 0.2.0 coloured its segments with `style=`, and rendered
 * colourless under such a CSP.)
 *
 * - **Rendered (the guarantee).** `evaluateInlineStyles`, applied by
 *   `evaluateTheming`, fails any element with a `style` attribute. Every state
 *   of every contract-held build is rendered and checked: each `.astro` by
 *   `__tests__/astro/contracts.test.ts`, each `.tsx` with identity `contract`
 *   by `tsx-contracts.test.tsx`, the other `.tsx` here, and each `.rs` by
 *   `mzizi-ui`'s `tests/contracts_json.rs` (through `Case::check` in
 *   `mzizi-rs/contract-eval/`, which every Case-based Rust suite shares).
 * - **Source (a backstop).** `inlineStylesInSource` reads every implementation
 *   a contract declares for the forms it can see in an attribute position,
 *   including an empty React `style={{}}`, which renders nothing, and a style
 *   no contract state renders.
 *
 * The fixtures prove both fail on each way of writing an inline style, and
 * that bindings, parameters and fields named `style` do not trip the scan.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { type Contract, evaluateInlineStyles, evaluateTheming, inlineStylesInSource } from "../../contracts/runner"
import { CreateElement, EmptyStyle, ObjectStyle, SpreadLiteral, SpreadProps } from "../fixtures/inline-style/inline-style"
import { ROOT, loadContracts, registryFile } from "./contract-files"
import { renderTsx } from "./render-tsx"

const KINDS = ["astro", "tsx", "rs"] as const
const contracts = loadContracts()

describe("every contract declares its builds, and each exists", () => {
  test.each(contracts.map((c) => [c.name, c] as const))("%s", (_n, c) => {
    expect(c.implementations.astro?.registry, "an .astro build").toBeTruthy()
    for (const kind of KINDS) {
      const registry = c.implementations[kind]?.registry
      if (registry) expect(registryFile(registry, kind), `${registry}.${kind}`).not.toBeNull()
    }
  })
})

describe("no contract-held implementation writes an inline style (source)", () => {
  const implementations = contracts.flatMap((c) =>
    KINDS.flatMap((kind) => {
      const registry = c.implementations[kind]?.registry
      return registry ? [{ contract: c.name, kind, registry }] : []
    })
  )
  test.each(implementations.map((i) => [`${i.contract} (${i.registry}.${i.kind})`, i] as const))("%s", (_n, i) => {
    const file = registryFile(i.registry, i.kind) ?? ""
    expect(inlineStylesInSource(readFileSync(file, "utf8"), i.kind)).toEqual([])
  })
})

describe("a .tsx a contract holds by identity only renders no inline style in any state", () => {
  // Identity-`contract` builds are rendered in every state by tsx-contracts.test.tsx.
  const partial = contracts.filter((c) => c.implementations.tsx && c.implementations.tsx.identity !== "contract")
  test.each(partial.map((c) => [c.name, c] as const))("%s", async (_n, c) => {
    const file = registryFile(c.implementations.tsx?.registry ?? "", "tsx") ?? ""
    const mod = (await import(/* @vite-ignore */ file)) as Record<string, unknown>
    const Comp = mod[c.title] as ComponentType<Record<string, unknown>>
    expect(Comp, `${file} exports ${c.title}`).toBeTypeOf("function")
    const rendered = Object.fromEntries(
      Object.entries(c.states).map(([name, state]) => [name, renderTsx(Comp, state, false)])
    )
    expect(Object.keys(rendered).length).toBeGreaterThan(0)
    expect(evaluateInlineStyles(rendered)).toEqual([])
  })
})

describe("the rendered rule fails on each way React writes an inline style", () => {
  const fails = {
    "style={{…}}": ObjectStyle,
    "{...{ style }} (a spread literal)": SpreadLiteral,
    "{...props} (a props object with style)": SpreadProps,
    "createElement(…, { style })": CreateElement,
  }
  test.each(Object.entries(fails))("%s", (_n, Comp) => {
    const html = renderToStaticMarkup(createElement(Comp))
    expect(evaluateInlineStyles({ default: html })).toEqual([
      expect.stringMatching(/^\[default\] an inline style attribute on <span> \(style="--tint:var\(--primary\)"/),
    ])
  })

  test("evaluateTheming, which every contract suite runs, applies it in every state", () => {
    const html = renderToStaticMarkup(createElement(ObjectStyle))
    const contract = { theming: { tokens: [], brandOverlay: "", statusColours: [] } } as unknown as Contract
    expect(evaluateTheming(contract, { default: html, other: html })).toEqual([
      expect.stringMatching(/^\[default\] an inline style attribute on <span>/),
      expect.stringMatching(/^\[other\] an inline style attribute on <span>/),
    ])
  })

  test('an HTML `style="…"` attribute fails', () => {
    const html = '<div data-slot="x"><span style="--tint: var(--primary)">x</span></div>'
    expect(evaluateInlineStyles({ default: html })).toHaveLength(1)
  })

  test("an empty `style={{}}` renders nothing, so only the source scan sees it", () => {
    const html = renderToStaticMarkup(createElement(EmptyStyle))
    expect(html).not.toContain("style=")
    expect(evaluateInlineStyles({ default: html })).toEqual([])
  })
})

describe("the source scan", () => {
  test("reads the fixture's attribute forms; a props object is left to the rendered rule", () => {
    const source = readFileSync(path.join(ROOT, "__tests__/fixtures/inline-style/inline-style.tsx"), "utf8")
    expect(inlineStylesInSource(source, "tsx").map((l) => l.replace(/^line \d+: an inline style \((.*)\)$/, "$1"))).toEqual([
      "return <span style={tint}>object</span>",
      "return <span style={{}}>empty</span>",
      "return <span {...{ style: tint }}>spread literal</span>",
      'return createElement("span", { style: tint }, "createElement")',
    ])
  })

  test.each([
    ['<span style="--tint: var(--primary)">x</span>', "astro"],
    ["<span style='--tint: var(--primary)'>x</span>", "astro"],
    ['<span style={{ "--tint": tint }}>x</span>', "astro"],
    ["<span {style}>x</span>", "astro"],
    ['<span {style} class="x">x</span>', "astro"],
    ["  {style}", "astro"],
    ["<style define:vars={{ edge }}>", "astro"],
    ["el.setAttribute('style', css)", "astro"],
    ["<span {...{ style }}>x</span>", "tsx"],
    ['div { class: "flex", style: "{tint}",', "rs"],
    ["div { style: entrance_style(reduced),", "rs"],
    ['span { style: format!("color: {c}"),', "rs"],
    ["span { style: tint,", "rs"],
    ['span { style: if dim { "opacity: .5" } else { "" },', "rs"],
    ['span { "style": "--tint: red" }', "rs"],
  ] as const)("fails: %s (%s)", (line, kind) => {
    expect(inlineStylesInSource(line, kind)).toHaveLength(1)
  })

  test.each([
    ["const style = { color: tint }", "tsx"],
    ["let style = cn(base)", "tsx"],
    ["const { style } = props", "astro"],
    ["function X({ style }: Props) {", "tsx"],
    ["style?: CSSProperties", "tsx"],
    ['const icons = import.meta.glob("./icons/*.svg")', "astro"],
    ['<div class="bg-[url(//x)] text-sm" data-style="x">a // b</div>', "tsx"],
    ['<style is:global>.x { color: var(--primary); }</style>', "astro"],
    ['<style href="mzizi-x" precedence="default">{css}</style>', "tsx"],
    ["const STATUS_STYLES = { stable: s }", "tsx"],
    ["let style: String = String::new();", "rs"],
    ["let mut style: &str = \"\";", "rs"],
    ["pub fn Foo(style: Option<String>) -> Element {", "rs"],
    ["    pub style: String,", "rs"],
    ["    pub style: bool,", "rs"],
    ["use std::fmt::style::Write;", "rs"],
    ['"script", "style", "template",', "rs"],
    ["//! one stylesheet serves every target", "rs"],
  ] as const)("passes: %s (%s)", (line, kind) => {
    expect(inlineStylesInSource(line, kind)).toEqual([])
  })
})
