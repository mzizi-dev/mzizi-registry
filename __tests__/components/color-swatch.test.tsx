import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ColorSwatch } from "@/components/brand/color-swatch"
import { SEED_MINERALS } from "@/lib/brand"

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

describe("ColorSwatch", () => {
  const cobalt = SEED_MINERALS[0]

  it("renders mineral name", () => {
    render(<ColorSwatch mineral={cobalt} />)
    expect(screen.getByText("cobalt")).toBeInTheDocument()
  })

  it("shows hex value", () => {
    render(<ColorSwatch mineral={cobalt} />)
    expect(screen.getByText("#0047AB")).toBeInTheDocument()
  })

  it("shows CSS variable", () => {
    render(<ColorSwatch mineral={cobalt} />)
    expect(screen.getByText("--color-cobalt")).toBeInTheDocument()
  })

  it("shows usage description", () => {
    render(<ColorSwatch mineral={cobalt} />)
    expect(screen.getByText(/Primary blue, links, CTAs/)).toBeInTheDocument()
  })

  it("copies hex value on click", async () => {
    render(<ColorSwatch mineral={cobalt} />)
    const hexButton = screen.getByText("#0047AB")
    fireEvent.click(hexButton)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("#0047AB")
  })

  it("shows light and dark variant swatches", () => {
    render(<ColorSwatch mineral={cobalt} />)
    expect(screen.getByText("Light")).toBeInTheDocument()
    expect(screen.getByText("Dark")).toBeInTheDocument()
  })
})
