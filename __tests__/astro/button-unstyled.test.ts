/**
 * The Astro button renders with no class attribute (issue #708, pattern PR), for every
 * variant, size and state; the adopter's `class` prop passes through. Rendered through
 * Astro's container API, as contracts.test.ts renders every contracted .astro.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { beforeAll, describe, expect, test } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const modules = import.meta.glob<{ default: unknown }>("/components/registry/n2-primitives/button.astro", {
  eager: true,
})

let container: AstroContainer
beforeAll(async () => {
  container = await AstroContainer.create()
})

type Component = Parameters<AstroContainer["renderToString"]>[0]

describe("the rendered Astro button", () => {
  test("carries no class attribute in any variant, size or state", async () => {
    const mod = modules["/components/registry/n2-primitives/button.astro"]
    expect(mod, "button.astro is loaded").toBeDefined()
    const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"]
    const sizes = ["default", "sm", "lg", "icon", "icon-sm"]
    for (const variant of variants) {
      for (const size of sizes) {
        const html = await container.renderToString(mod!.default as Component, {
          props: { variant, size },
          slots: { default: "Save" },
        })
        expect(html, `${variant}/${size}`).not.toMatch(/\sclass=/)
        expect(html).toContain(`data-variant="${variant}"`)
        expect(html).toContain(`data-size="${size}"`)
      }
    }
    const disabled = await container.renderToString(mod!.default as Component, {
      props: { disabled: true },
      slots: { default: "Save" },
    })
    expect(disabled).not.toMatch(/\sclass=/)
    expect(disabled).toContain('data-state="disabled"')
  })

  test("the adopter's class passes through", async () => {
    const mod = modules["/components/registry/n2-primitives/button.astro"]
    const html = await container.renderToString(mod!.default as Component, {
      props: { class: "w-full", variant: "outline" },
      slots: { default: "Save" },
    })
    expect(html).toContain('class="w-full"')
    expect(readFileSync(path.join(ROOT, "components/registry/n2-primitives/button.astro"), "utf8")).toContain(
      "class={extra}",
    )
  })
})
