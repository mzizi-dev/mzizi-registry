import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrandCard } from "@/components/brand/brand-card"
import { MineralStrip } from "@/components/brand/mineral-strip"
import { TypeScale } from "@/components/brand/type-scale"
import { SpacingScale } from "@/components/brand/spacing-scale"
import { SEED_ECOSYSTEM_BRANDS } from "@/lib/brand"

describe("BrandCard", () => {
  const testBrand = SEED_ECOSYSTEM_BRANDS.find((b) => b.name === "mukoko")!

  it("renders brand name", () => {
    render(<BrandCard brand={testBrand} />)
    expect(screen.getByText("mukoko")).toBeInTheDocument()
  })

  it("renders meaning and language", () => {
    render(<BrandCard brand={testBrand} />)
    expect(screen.getByText(/Beehive/)).toBeInTheDocument()
    expect(screen.getByText(/Shona/)).toBeInTheDocument()
  })

  it("renders role", () => {
    render(<BrandCard brand={testBrand} />)
    expect(screen.getByText("Africa's super app")).toBeInTheDocument()
  })

  it("renders description", () => {
    render(<BrandCard brand={testBrand} />)
    expect(screen.getByText(/Seventeen mini-apps/)).toBeInTheDocument()
  })

  it("renders voice", () => {
    render(<BrandCard brand={testBrand} />)
    expect(screen.getByText(/Welcoming, structured, protective/)).toBeInTheDocument()
  })

  it("renders visit link", () => {
    render(<BrandCard brand={testBrand} />)
    const link = screen.getByText("Visit").closest("a")
    expect(link).toHaveAttribute("href", "https://mukoko.com")
    expect(link).toHaveAttribute("target", "_blank")
  })
})

describe("MineralStrip", () => {
  it("renders 5 mineral segments", () => {
    const { container } = render(<MineralStrip />)
    const strip = container.querySelector("[data-slot='mineral-strip']")
    expect(strip).toBeInTheDocument()
    expect(strip?.children).toHaveLength(5)
  })

  it("renders as vertical (left border only)", () => {
    const { container } = render(<MineralStrip />)
    const strip = container.querySelector("[data-slot='mineral-strip']")
    expect(strip?.className).toContain("flex-col")
  })

  it("is aria-hidden", () => {
    const { container } = render(<MineralStrip />)
    const strip = container.querySelector("[data-slot='mineral-strip']")
    expect(strip).toHaveAttribute("aria-hidden", "true")
  })
})

describe("TypeScale", () => {
  it("renders all type scale entries", () => {
    render(<TypeScale />)
    expect(screen.getByText("Display")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
    expect(screen.getByText("Caption")).toBeInTheDocument()
    expect(screen.getByText("Code")).toBeInTheDocument()
  })

  it("shows font names", () => {
    render(<TypeScale />)
    expect(screen.getAllByText("Noto Serif").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Noto Sans").length).toBeGreaterThan(0)
    expect(screen.getAllByText("JetBrains Mono").length).toBeGreaterThan(0)
  })
})

describe("SpacingScale", () => {
  it("renders all spacing tokens", () => {
    render(<SpacingScale />)
    expect(screen.getByText("xs")).toBeInTheDocument()
    expect(screen.getByText("3xl")).toBeInTheDocument()
    expect(screen.getByText("4px")).toBeInTheDocument()
    expect(screen.getByText("64px")).toBeInTheDocument()
  })
})
