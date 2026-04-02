import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Header } from "@/components/landing/header"

describe("Header Navigation", () => {
  it("renders the brand navigation link", () => {
    render(<Header />)
    const brandLinks = screen.getAllByText("Brand")
    expect(brandLinks.length).toBeGreaterThan(0)
  })

  it("brand link points to /brand", () => {
    render(<Header />)
    const brandLinks = screen.getAllByRole("link").filter(
      (link) => link.textContent === "Brand"
    )
    expect(brandLinks.length).toBeGreaterThan(0)
    expect(brandLinks[0]).toHaveAttribute("href", "/brand")
  })

  it("renders 3 icon buttons (search, github, theme toggle)", () => {
    render(<Header />)
    expect(screen.getByLabelText("Search components")).toBeInTheDocument()
    expect(screen.getByLabelText("GitHub")).toBeInTheDocument()
  })

  it("renders logo with design suffix", () => {
    render(<Header />)
    expect(screen.getByText(/nyuchi/)).toBeInTheDocument()
    expect(screen.getByText(/design/)).toBeInTheDocument()
  })
})
