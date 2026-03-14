import { useMDXComponents as getNextraComponents } from "nextra-theme-docs"
import { MineralStrip } from "@/components/brand/mineral-strip"
import { ColorSwatch } from "@/components/brand/color-swatch"
import { TokenTable } from "@/components/brand/token-table"
import { TypeScale } from "@/components/brand/type-scale"
import { SpacingScale } from "@/components/brand/spacing-scale"
import { BrandCard } from "@/components/brand/brand-card"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const nextraComponents = getNextraComponents()

export function useMDXComponents(
  components: Record<string, React.ComponentType>
) {
  return {
    ...nextraComponents,
    // Mukoko brand components — available in all MDX files without imports
    MineralStrip,
    ColorSwatch,
    TokenTable,
    TypeScale,
    SpacingScale,
    BrandCard,
    MukokoLogo,
    // UI primitives — commonly used in MDX content pages
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Separator,
    ...components,
  }
}
