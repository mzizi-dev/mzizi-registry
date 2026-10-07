/**
 * The React rendering of a contract state, shared by the React contract suite
 * and the CSP rule's suite. Kept apart from `contract-files.ts` so the Astro
 * suite, which loads contracts too, never imports React.
 */
import { createElement, type ComponentType, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { hydrate } from "../../contracts/runner"
import { REQUEST_URL } from "./contract-files"

const camel = (s: string) => s.replace(/-([a-z])/g, (_m, ch: string) => ch.toUpperCase())
const RENAME: Record<string, string> = { class: "className", for: "htmlFor" }
const marker = (slot: string) => `slot:${slot}`

/**
 * Render one contract state of a React implementation to HTML: `class` →
 * `className`, `for` → `htmlFor`, the default slot as `children` and a named
 * slot as its camelCase prop, and `requestUrl` where the component reads one.
 */
export function renderTsx(
  Comp: ComponentType<Record<string, unknown>>,
  state: { props?: Record<string, unknown>; slots?: Record<string, string> },
  wantsUrl: boolean
): string {
  const props: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(hydrate(state.props))) props[RENAME[k] ?? k] = v
  if (wantsUrl) props.requestUrl = REQUEST_URL
  const slots = state.slots ?? {}
  for (const name of Object.keys(slots)) {
    const node: ReactNode = marker(name)
    props[name === "default" ? "children" : camel(name)] = node
  }
  let html = renderToStaticMarkup(createElement(Comp, props))
  for (const [name, content] of Object.entries(slots)) html = html.split(marker(name)).join(content)
  return html
}
