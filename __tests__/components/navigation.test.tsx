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

  it("renders all main navigation links", () => {
    render(<Header />)
    expect(screen.getAllByText("Docs").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Components").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Blocks").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Charts").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Brand").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Foundations").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Patterns").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Architecture").length).toBeGreaterThan(0)
  })

  it("renders logo with registry suffix", () => {
    render(<Header />)
    expect(screen.getByText(/mukoko/)).toBeInTheDocument()
    expect(screen.getByText(/registry/)).toBeInTheDocument()
  })
})
