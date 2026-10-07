/**
 * Fixtures for the CSP rule (#444): React components that put an inline
 * `style` on an element, each a different way. They are not registry
 * components; `__tests__/contracts/no-inline-style.test.tsx` proves the
 * contract runner fails on every one of them when rendered, and the source
 * scan on the forms it can read.
 */
import { cloneElement, createElement, type CSSProperties } from "react"
import { jsx } from "react/jsx-runtime"

const tint = { "--tint": "var(--primary)" } as CSSProperties

/** React's object form: renders a style attribute with `--tint`. */
export function ObjectStyle() {
  return <span style={tint}>object</span>
}

/** An empty style object: React renders no attribute, so only the source scan sees it. */
export function EmptyStyle() {
  return <span style={{}}>empty</span>
}

/** A spread object literal. */
export function SpreadLiteral() {
  return <span {...{ style: tint }}>spread literal</span>
}

/** A props object spread onto the element: only the rendered rule can see this one. */
export function SpreadProps() {
  const attrs = { "data-x": "1", style: tint }
  return <span {...attrs}>spread props</span>
}

/** `createElement` with a style prop. */
export function CreateElement() {
  return createElement("span", { style: tint }, "createElement")
}

/** A quoted key in a spread object literal. */
export function QuotedSpreadKey() {
  return <span {...{ "style": tint }}>quoted spread key</span>
}

/** `style = {…}`, with spaces around the `=`. */
export function SpacedStyle() {
  return <span style = {tint}>spaced</span>
}

/** `cloneElement` adding a style prop. */
export function CloneElement() {
  return cloneElement(<span>clone</span>, { style: tint })
}

/** The automatic runtime's `jsx`, with a style prop. */
export function Jsx() {
  return jsx("span", { style: tint, children: "jsx" })
}
