/**
 * The CSP rule, registry-wide (#444): no contract-held implementation puts an
 * inline `style` attribute on an element, so an app's Content-Security-Policy
 * can keep `style-src 'self'` with no `'unsafe-inline'`. (`MineralStrip` in
 * `@bundu/ui` 0.2.0 coloured its segments with `style=`, and rendered
 * colourless under such a CSP.)
 *
 * - **Rendered: the rule.** `evaluateTheming` fails any element with a
 *   `style` attribute. Every state of every contract-held build is rendered
 *   and checked: each `.astro` by `__tests__/astro/contracts.test.ts`, each
 *   `.tsx` with identity `contract` by `tsx-contracts.test.tsx`, the other
 *   `.tsx` here, and each `.rs` by `Case::check` in `mzizi-rs/contract-eval/`
 *   (mzizi-ui's `tests/contracts_json.rs` and mzizi-brand's `tests/contract.rs`).
 * - **Source: a best-effort backstop.** `inlineStylesInSource` reports only
 *   unambiguous forms, so it never fails a build for a style that is not
 *   one. It sees an empty React `style={{}}`, which renders nothing, and a
 *   style no contract state renders.
 *
 * The fixtures prove the rendered rule fails on each way of writing an inline
 * style, the source scan on each form it reads, and that bindings,
 * parameters, fields, imports and comments named `style` pass the scan.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { type Contract, evaluateTheming, inlineStyles, inlineStylesInSource } from "../../contracts/runner"
import {
  CloneElement,
  CreateElement,
  EmptyStyle,
  Jsx,
  ObjectStyle,
  QuotedSpreadKey,
  SpacedStyle,
  SpreadLiteral,
  SpreadProps,
} from "../fixtures/inline-style/inline-style"
import { ROOT, loadContracts, registryFile } from "./contract-files"
import { renderTsx, wantsRequestUrl } from "./render-tsx"

const KINDS = ["astro", "tsx", "rs"] as const
const contracts = loadContracts()

describe("no contract-held implementation writes an inline style (source)", () => {
  const implementations = contracts.flatMap((c) =>
    KINDS.flatMap((kind) => {
      const registry = c.implementations[kind]?.registry
      return registry ? [{ contract: c.name, kind, registry }] : []
    })
  )
  test.each(implementations.map((i) => [`${i.contract} (${i.registry}.${i.kind})`, i] as const))("%s", (_n, i) => {
    // Each declared file's existence is asserted by the suites that render it.
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
    const wantsUrl = wantsRequestUrl(readFileSync(file, "utf8"))
    const rendered = Object.fromEntries(
      Object.entries(c.states).map(([name, state]) => [name, renderTsx(Comp, state, wantsUrl)])
    )
    expect(inlineStyles(rendered)).toEqual([])
  })
})

describe("the rendered rule fails on each way React writes an inline style", () => {
  const fails = {
    "style={{…}}": ObjectStyle,
    "style = {…} (spaced)": SpacedStyle,
    "{...{ style }} (a spread literal)": SpreadLiteral,
    '{...{ "style": s }} (a quoted spread key)': QuotedSpreadKey,
    "{...props} (a props object with style)": SpreadProps,
    "createElement(…, { style })": CreateElement,
    "cloneElement(el, { style })": CloneElement,
    'jsx("span", { style })': Jsx,
  }
  test.each(Object.entries(fails))("%s", (_n, Comp) => {
    const html = renderToStaticMarkup(createElement(Comp))
    expect(inlineStyles({ default: html })).toEqual([{ state: "default", tag: "span", style: "--tint:var(--primary)" }])
  })

  test("evaluateTheming, which every contract suite runs, applies it in every state", () => {
    const html = renderToStaticMarkup(createElement(ObjectStyle))
    const contract = { theming: { tokens: [], brandOverlay: "", statusColours: [] } } as unknown as Contract
    expect(evaluateTheming(contract, { default: html, other: html })).toEqual([
      "[default] an inline style attribute on <span> (needs style-src-attr 'unsafe-inline')",
      "[other] an inline style attribute on <span> (needs style-src-attr 'unsafe-inline')",
    ])
  })

  test("an empty `style={{}}` renders nothing, so only the source scan sees it", () => {
    const html = renderToStaticMarkup(createElement(EmptyStyle))
    expect(html).not.toContain("style=")
    expect(inlineStyles({ default: html })).toEqual([])
  })
})

const lineOf = (l: string) => l.replace(/^line \d+: an inline style \((.*)\)$/, "$1")

describe("the source scan (best effort)", () => {
  test("reads the fixture's unambiguous forms; a props object is left to the rendered rule", () => {
    const source = readFileSync(path.join(ROOT, "__tests__/fixtures/inline-style/inline-style.tsx"), "utf8")
    expect(inlineStylesInSource(source, "tsx").map(lineOf)).toEqual([
      "return <span style={tint}>object</span>",
      "return <span style={{}}>empty</span>",
      "return <span {...{ style: tint }}>spread literal</span>",
      'return createElement("span", { style: tint }, "createElement")',
      'return <span {...{ "style": tint }}>quoted spread key</span>',
      "return <span style = {tint}>spaced</span>",
      "return cloneElement(<span>clone</span>, { style: tint })",
      'return jsx("span", { style: tint, children: "jsx" })',
    ])
  })

  test.each([
    ['<span style="--tint: var(--primary)">x</span>', "astro"],
    ["<span style='--tint: var(--primary)'>x</span>", "astro"],
    ["<span style=`--tint: ${tint}`>x</span>", "astro"],
    ['<span style={{ "--tint": tint }}>x</span>', "astro"],
    ["<span style = {tint}>x</span>", "tsx"],
    ["<span {style}>x</span>", "astro"],
    ['<span {style} class="x">x</span>', "astro"],
    ['<span\n  class="x"\n  {style}\n>x</span>', "astro"],
    ["<style define:vars={{ edge }}>", "astro"],
    ["el.setAttribute('style', css)", "astro"],
    ["<span {...{ style }}>x</span>", "tsx"],
    ['<span {...{ "style": s }}>x</span>', "tsx"],
    ['<span {...{ "data-x": 1, style: s }}>x</span>', "tsx"],
    ['jsx("span", { style })', "tsx"],
    ['jsxs("span", { className: "x", style: s, children: [] })', "tsx"],
    ["cloneElement(child, { style })", "tsx"],
    ['createElement(\n  "span",\n  { style: s },\n)', "tsx"],
    ['rsx! { div { class: "flex", style: "{tint}" } }', "rs"],
    ["rsx! { div { style: entrance_style(reduced), } }", "rs"],
    ['rsx! { span { style: format!("color: {c}"), "x" } }', "rs"],
    ["rsx! {\n    span {\n        class: c,\n        style: tint,\n    }\n}", "rs"],
    ['rsx! { span { style: if dim { "opacity: .5" } else { "" } } }', "rs"],
    ['rsx! { span { "style": "--tint: red" } }', "rs"],
    ['rsx! { div { if show { span { style: s } } } }', "rs"],
  ] as const)("fails: %s (%s)", (src, kind) => {
    expect(inlineStylesInSource(src, kind)).toHaveLength(1)
  })

  test.each([
    ["const style = { color: tint }", "tsx"],
    ["let style = cn(base)", "tsx"],
    ["const { style } = props", "astro"],
    ['import { style } from "./x"', "astro"],
    ['export { style } from "./x"', "tsx"],
    ["return { style }", "tsx"],
    ["return { style: s }", "astro"],
    ["function X({ style }: Props) {", "tsx"],
    ["style?: CSSProperties", "tsx"],
    ["const m: Record<string, { style: string }> = {}", "tsx"],
    ['<span className={style}>x</span>', "tsx"],
    ['<span {...{ className: style }}>x</span>', "tsx"],
    ['createElement("span", { className: style })', "tsx"],
    ['<span data-style="x" styles={s}>x</span>', "tsx"],
    ["<span style>x</span>", "astro"],
    ['const icons = import.meta.glob("./icons/*.svg")', "astro"],
    ['<div class="bg-[url(//x)] text-sm" data-style="x">a // b</div>', "tsx"],
    ["<style is:global>.x { color: var(--primary); }</style>", "astro"],
    ['<style href="mzizi-x" precedence="default">{css}</style>', "tsx"],
    ["const STATUS_STYLES = { stable: s }", "tsx"],
    ["let style: String = String::new();", "rs"],
    ['let mut style: &str = "";', "rs"],
    ["pub fn Foo(style: Option<String>) -> Element {", "rs"],
    ["    pub style: String,", "rs"],
    ["    pub style: bool,", "rs"],
    ["    pub style: fn(Tone) -> String,", "rs"],
    ["let p = Props { style: x };", "rs"],
    ["/// Sets the style: none", "rs"],
    ["//! one stylesheet serves every target", "rs"],
    ["use std::fmt::style::Write;", "rs"],
    ['"script", "style", "template",', "rs"],
    ["div { style: tint }", "rs"],
    ["rsx! { Card { style: tint } }", "rs"],
    ["rsx! { div { onclick: move |_| { let p = Props { style: s }; } } }", "rs"],
    ['rsx! { div { // style: "x"\n  class: "a" } }', "rs"],
    ['rsx! { div { title: "style: x", class: "a" } }', "rs"],
    ['rsx! { div { title: r#"style: "x""#, class: "a" } }', "rs"],
  ] as const)("passes: %s (%s)", (src, kind) => {
    expect(inlineStylesInSource(src, kind)).toEqual([])
  })
})
