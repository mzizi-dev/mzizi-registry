import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PricingCardProps {
  /** Plan name (e.g., "Pro", "Enterprise") */
  name: string
  /** Price display (e.g., "$29", "Free") */
  price: string
  /** Billing period (e.g., "/month", "/year") */
  period?: string
  /** Short description of the plan */
  description?: string
  /** List of features included */
  features: string[]
  /** CTA button text */
  buttonText?: string
  /** Called when the CTA button is clicked */
  onSelect?: () => void
  /** CTA button href (renders an anchor instead) */
  href?: string
  /** Highlight this card as the recommended plan */
  highlighted?: boolean
  /** Badge text (e.g., "Most Popular", "Best Value") */
  badge?: string
  /** Disable the CTA button */
  disabled?: boolean
  className?: string
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText = "Get started",
  onSelect,
  href,
  highlighted = false,
  badge,
  disabled = false,
  className,
}: PricingCardProps) {
  return (
    <Card
      data-slot="pricing-card"
      className={cn(
        "relative flex flex-col",
        highlighted && "border-primary shadow-lg",
        className
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            variant={highlighted ? "default" : "secondary"}
            className="whitespace-nowrap"
          >
            {badge}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{name}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period && (
            <span className="text-sm text-muted-foreground">{period}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <Separator className="mb-4" />
        <ul className="flex-1 space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-malachite)]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Button
            variant={highlighted ? "default" : "outline"}
            className="w-full"
            disabled={disabled}
            onClick={onSelect}
            asChild={!!href}
          >
            {href ? <a href={href}>{buttonText}</a> : buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { PricingCard }
export type { PricingCardProps }
