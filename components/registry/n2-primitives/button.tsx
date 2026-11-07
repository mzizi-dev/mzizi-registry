import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   BUTTON — Layer 2 Primitive
   
   Nyuchi Frontend Architecture: Layer 2 (Primitives)
   
   Token compliance:
   ✅ Radius: rounded-full (9999px) — buttons are ALWAYS pill per brand
   ✅ Touch target: 44px on a coarse pointer (Apple HIG: 44x44 pt), 36px under desktop density — set once in the token layer (h-control…), NEVER below 24px
   ✅ Focus ring: uses --ring token from semantic layer
   ✅ Colors: uses semantic tokens (primary, secondary, muted, destructive)
   ✅ data-slot: present for CSS targeting and testing
   
   No harness — primitives are too low-level for observability wiring.
   Brand components that USE buttons wire into the harness at their level.
   ═══════════════════════════════════════════════════════════════ */

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        /* DEFAULT = --size-control: 44px touch, 36px desktop */
        default:
          "h-control gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        /* SM = --size-control-sm: 44px touch (the floor), 32px desktop */
        sm: "h-control-sm gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        /* LG = --size-control-lg: 48px touch, 40px desktop, wider padding */
        lg: "h-control-lg gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        /* ICON variants — square touch targets */
        icon: "size-control-icon",
        "icon-sm": "size-control-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-portal="https://mzizi.dev/components/button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
