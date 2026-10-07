/// <reference types="vite/client" />
/**
 * The CSP rule on an Astro build (#444). A fixture `.astro` puts an inline
 * style on elements in each way Astro allows: the string form, the object
 * form, the `{style}` shorthand, a spread props object and
 * `<style define:vars>`, which compiles to a style attribute. Rendered
 * through the container API, as `contracts.test.ts` renders every registry
 * `.astro` in every state, each one fails the runner's rule. The source scan
 * reads every form but the spread props object, which only the rendered rule
 * can see.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { expect, test } from "vitest"

import { evaluateInlineStyles, inlineStylesInSource } from "../../contracts/runner"

const fixtures = import.meta.glob<{ default: unknown }>("./fixtures/inline-style.astro", { eager: true })
type Component = Parameters<AstroContainer["renderToString"]>[0]

test("every way an .astro writes an inline style fails the rendered rule", async () => {
  const mod = fixtures["./fixtures/inline-style.astro"]
  expect(mod).toBeDefined()
  const container = await AstroContainer.create()
  const html = await container.renderToString(mod?.default as Component)
  const failures = evaluateInlineStyles({ default: html }).join("\n")
  for (const want of [
    /<div> \(style="[^"]*--edge:\s*var\(--border\)/, // <style define:vars>
    /<span> \(style="--tint: var\(--primary\)/, // string
    /<span> \(style="--edge:\s*var\(--border\)/, // object
    /<span> \(style="--shorthand: var\(--ring\)/, // {style}
    /<span> \(style="--spread: var\(--muted\)/, // {...attrs}
  ])
    expect(failures).toMatch(want)
})

test("the source scan reads every form but a spread props object", () => {
  const source = readFileSync(path.join(__dirname, "fixtures/inline-style.astro"), "utf8")
  expect(inlineStylesInSource(source, "astro").map((l) => l.replace(/^line \d+: an inline style \((.*)\)$/, "$1"))).toEqual([
    '<span style="--tint: var(--primary)">string</span>',
    '<span style={{ "--edge": "var(--border)" }}>object</span>',
    "<span {style}>shorthand</span>",
    "<style define:vars={{ edge }}>",
  ])
})
