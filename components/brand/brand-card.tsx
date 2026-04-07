import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import type { EcosystemBrand } from "@/lib/brand"

interface BrandCardProps {
  brand: EcosystemBrand
  className?: string
}

const mineralColorMap: Record<string, string> = {
  cobalt: "var(--color-cobalt)",
  tanzanite: "var(--color-tanzanite)",
  malachite: "var(--color-malachite)",
  gold: "var(--color-gold)",
  terracotta: "var(--color-terracotta)",
}

export function BrandCard({ brand, className }: BrandCardProps) {
  const mineralColor = mineralColorMap[brand.mineral]

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: mineralColor }}
        aria-hidden="true"
      />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="font-serif text-xl">{brand.name}</CardTitle>
            <p className="font-mono text-xs text-muted-foreground">
              {brand.meaning} · {brand.language}
            </p>
          </div>
          <span
            className="flex size-8 items-center justify-center rounded-full text-xs font-medium"
            style={{
              backgroundColor: mineralColor,
              color:
                brand.mineral === "gold" || brand.mineral === "malachite" ? "#141413" : "#FAF9F5",
            }}
          >
            {brand.name[0]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {brand.role}
          </span>
        </div>
        <CardDescription className="text-sm leading-relaxed">{brand.description}</CardDescription>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">&ldquo;{brand.voice}&rdquo;</p>
          <a
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Visit <ExternalLink className="size-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
