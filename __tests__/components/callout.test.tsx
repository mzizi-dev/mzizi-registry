import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Callout } from "@/components/mdx/callout"

describe("<Callout />", () => {
  it("renders with role='note' (a11y contract)", () => {
    render(<Callout>Body text</Callout>)
    expect(screen.getByRole("note")).toBeInTheDocument()
  })

  it("renders the SR-only variant label for the default 'info' variant", () => {
    render(<Callout>Body text</Callout>)
    // SR-only text should be in the DOM but visually hidden
    expect(screen.getByText("Note:")).toHaveClass("sr-only")
  })

  it("renders an SR-only label per variant", () => {
    const variants = [
      { variant: "info", label: "Note:" },
      { variant: "warning", label: "Warning:" },
      { variant: "error", label: "Important:" },
      { variant: "success", label: "Success:" },
      { variant: "tip", label: "Tip:" },
    ] as const
    for (const { variant, label } of variants) {
      const { unmount } = render(<Callout variant={variant}>Body</Callout>)
      expect(screen.getByText(label)).toHaveClass("sr-only")
      unmount()
    }
  })

  it("marks the icon as aria-hidden so SR users only hear the variant label + body", () => {
    const { container } = render(<Callout variant="warning">Body text</Callout>)
    const icon = container.querySelector("svg[aria-hidden='true']")
    expect(icon).toBeInTheDocument()
  })

  it("renders the title as a paragraph above the children when provided", () => {
    render(
      <Callout title="Heads up">
        <p>Body text</p>
      </Callout>
    )
    expect(screen.getByText("Heads up")).toBeInTheDocument()
    expect(screen.getByText("Body text")).toBeInTheDocument()
  })

  it("applies the consumer's className alongside the variant class", () => {
    const { container } = render(<Callout className="extra-class">Body</Callout>)
    expect(container.firstChild).toHaveClass("extra-class")
  })
})
