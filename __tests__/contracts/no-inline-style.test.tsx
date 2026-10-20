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
 *   (mzizi-ui's `tests/contracts_json.rs`, which also fails when a declared
 *   `.rs` is missing or no crate's suite evaluates it).
 * - **Source: a backstop, with real parsers.** `inlineStylesInSource`
 *   (`contracts/source-scan.ts`) walks the TypeScript compiler's tree for a
 *   `.tsx` and compiler-rs's for an `.astro`. It sees an empty React
 *   `style={{}}`, which renders nothing, and a style no contract state
 *   renders. There is no `.rs` source scan: the rendered check holds Rust.
 *
 * This file runs in its own vitest project, after the rest (vitest.config.ts).
 *
 * The fixtures prove the rendered rule fails on each way of writing an inline
 * style, the source scan on each form it reads, and that bindings,
 * parameters, fields, imports, comments, strings, text and component props
 * named `style` pass the scan.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { type Contract, evaluateTheming, inlineStyles } from "../../contracts/runner"
import { inlineStylesInSource } from "../../contracts/source-scan"
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
import { ROOT, declaredFile, loadContracts } from "./contract-files"
import { renderTsx, wantsRequestUrl } from "./render-tsx"

/** The kinds the source scan reads (the rendered check alone holds `.rs`). */
const KINDS = ["astro", "tsx"] as const
const contracts = loadContracts()

describe("no contract-held implementation writes an inline style (source)", () => {
  const implementations = contracts.flatMap((c) =>
    KINDS.flatMap((kind) => {
      const registry = c.implementations[kind]?.registry
      return registry ? [{ contract: c.name, kind, registry }] : []
    })
  )
  test.each(implementations.map((i) => [`${i.contract} (${i.registry}.${i.kind})`, i] as const))("%s", (_n, i) => {
    const file = declaredFile(i.contract, i.registry, i.kind)
    expect(inlineStylesInSource(readFileSync(file, "utf8"), i.kind)).toEqual([])
  })
})

describe("a .tsx a contract holds by identity only renders no inline style in any state", () => {
  // Identity-`contract` builds are rendered in every state by tsx-contracts.test.tsx.
  const partial = contracts.filter((c) => c.implementations.tsx && c.implementations.tsx.identity !== "contract")
  test.each(partial.map((c) => [c.name, c] as const))("%s", async (_n, c) => {
    const file = declaredFile(c.name, c.implementations.tsx?.registry ?? "", "tsx")
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

describe("the source scan", () => {
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
    ["<style define:vars={{ edge }}></style>", "astro"],
    ["<script>el.setAttribute('style', css)</script>", "astro"],
    ["---\nconst css = 'x'\ndocument.body.setAttribute(\"style\", css)\n---\n<p>x</p>", "astro"],
    ['<p>{show && <b style={s}>x</b>}</p>', "astro"],
    ["<p>Don't</p>\n<span style={s}>x</span>", "astro"],
    ["<span {...{ style }}>x</span>", "tsx"],
    ['<span {...{ "style": s }}>x</span>', "tsx"],
    ['<span {...{ "data-x": 1, style: s }}>x</span>', "tsx"],
    ['jsx("span", { style })', "tsx"],
    ['jsxs("span", { className: "x", style: s, children: [] })', "tsx"],
    ["cloneElement(child, { style })", "tsx"],
    ['createElement(\n  "span",\n  { style: s },\n)', "tsx"],
    ['React.createElement("span", { ["style"]: s })', "tsx"],
    ["el.setAttribute(`style`, css)", "tsx"],
    ["const a = <p>Don't</p>\nconst b = <span style={s}>x</span>", "tsx"],
    ["const a = <p>{ok ? <i style={s} /> : null}</p>", "tsx"],
    ["cloneElement(<span />, { style: s })", "tsx"],
  ] as const)("fails: %s (%s)", (src, kind) => {
    expect(inlineStylesInSource(src, kind)).toHaveLength(1)
  })

  test.each([
    ["const style = { color: tint }", "tsx"],
    ["let style = cn(base)", "tsx"],
    ["---\nconst { style } = Astro.props\n---\n<p>x</p>", "astro"],
    ['---\nimport { style } from "./x"\n---\n<p>x</p>', "astro"],
    ['export { style } from "./x"', "tsx"],
    ["function f() { return { style } }", "tsx"],
    ["---\nfunction f() { return { style: s } }\n---\n<p>x</p>", "astro"],
    ["function X({ style }: Props) {}", "tsx"],
    ["interface Props { style?: CSSProperties }", "tsx"],
    ["const m: Record<string, { style: string }> = {}", "tsx"],
    ['<span className={style}>x</span>', "tsx"],
    ['<span {...{ className: style }}>x</span>', "tsx"],
    ['createElement("span", { className: style })', "tsx"],
    ['<span data-style="x" styles={s}>x</span>', "tsx"],
    ["<span style>x</span>", "astro"],
    ['---\nconst icons = import.meta.glob("./icons/*.svg")\n---\n<p>x</p>', "astro"],
    ['<div class="bg-[url(//x)] text-sm" data-style="x">a // b</div>', "tsx"],
    ["<style is:global>.x { color: var(--primary); }</style>", "astro"],
    ['<style href="mzizi-x" precedence="default">{css}</style>', "tsx"],
    ["const STATUS_STYLES = { stable: s }", "tsx"],
    // The third review's cases: comments, strings, text, nested objects, component props.
    ["/**\n * @example <Strip style={x} />\n */\nexport function Strip() { return null }", "tsx"],
    ["const a = <p>{/* <i style={s} /> */}x</p>", "tsx"],
    ["// <span style={s}>x</span>\nconst a = 1", "tsx"],
    ['const s = "<span style=\\"x\\">"', "tsx"],
    ["const s = `<span style=${x}>`", "tsx"],
    ["<!-- <span style=\"--x: 1\">x</span> -->\n<p>x</p>", "astro"],
    ["<p>{/* <i style={s} /> */}x</p>", "astro"],
    ['<span {...{ theme: { style } }}>x</span>', "tsx"],
    ['createElement("span", { theme: { style: s } })', "tsx"],
    ['<span {...{ theme: { style } }}>x</span>', "astro"],
    ['<span>{"style"}</span>', "tsx"],
    ['<span>"style"</span>', "astro"],
    ['<span>style="--x: 1"</span>', "astro"],
    ["const a = <p>Don't</p>\nfunction f() { return { style } }", "tsx"],
    ["<p>Don't</p>\n<p>{f({ style })}</p>", "astro"],
    ["<Icon style={s} />", "tsx"],
    ["<Icon style={s} />", "astro"],
    ["<UI.Icon style={s} />", "tsx"],
    ["createElement(Icon, { style: s })", "tsx"],
    ["cloneElement(<Icon />, { style: s })", "tsx"],
  ] as const)("passes: %s (%s)", (src, kind) => {
    expect(inlineStylesInSource(src, kind)).toEqual([])
  })
})

describe("a source the parser cannot read fails the scan, never passes", () => {
  test.each([
    ["function X({ style }: Props) {", "tsx"],
    ["<span style={s}>x</span", "tsx"],
    ["<style define:vars={{ edge }}>", "astro"],
  ] as const)("%s (%s)", (src, kind) => {
    const found = inlineStylesInSource(src, kind)
    expect(found.length).toBeGreaterThan(0)
    expect(found.every((l) => /^line \d+: cannot parse: /.test(l))).toBe(true)
  })
})
