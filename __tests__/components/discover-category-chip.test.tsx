/**
 * discover-category-chip (#543): `linkComponent` renders the link with the app's router link,
 * with the same href, classes and aria-current as the plain <a>.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CategoryChip, type CategoryChipLinkProps } from "@/components/registry/n6-pages/discover-category-chip"

const html = (el: React.ReactElement) => {
  const host = document.createElement("div")
  host.innerHTML = renderToStaticMarkup(el)
  return host
}

function RouterLink({ children, ...props }: CategoryChipLinkProps) {
  return (
    <a data-router="yes" {...props}>
      {children}
    </a>
  )
}

describe("CategoryChip linkComponent", () => {
  it("renders the plain <a> without it", () => {
    const a = html(<CategoryChip href="/c/food" label="Food" />).querySelector("li > a")
    expect(a?.getAttribute("href")).toBe("/c/food")
    expect(a?.hasAttribute("data-router")).toBe(false)
  })

  it("hands href, className, aria-current and children to the link component", () => {
    const plain = html(<CategoryChip href="/c/food" label="Food" count={12} current />).querySelector("li > a")
    const routed = html(
      <CategoryChip href="/c/food" label="Food" count={12} current linkComponent={RouterLink} />
    ).querySelector("li > a")
    expect(routed?.getAttribute("data-router")).toBe("yes")
    expect(routed?.getAttribute("href")).toBe("/c/food")
    expect(routed?.getAttribute("aria-current")).toBe("page")
    expect(routed?.className).toBe(plain?.className)
    expect(routed?.textContent).toBe(plain?.textContent)
  })
})
