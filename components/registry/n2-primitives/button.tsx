import * as React from "react"
import { Slot } from "radix-ui"

/* ═══════════════════════════════════════════════════════════════
   BUTTON — N2 primitive (pattern: unstyled, #708)

   This component sets NO styling class. It carries structure, state
   and ARIA only:
     data-slot      "button"
     data-variant   default | outline | secondary | ghost | destructive | link
     data-size      default | sm | lg | icon | icon-sm
     data-state     enabled | disabled
     ARIA           from the adopter (aria-invalid, aria-expanded, …)

   The look lives in styles/pattern/mzizi-theme.css, keyed on those
   attributes. The identity-neutral minimums (the Bundu hit region,
   focus-visible, reduced motion) live in styles/pattern/floor.css. The
   values both read live in styles/pattern/tokens.css. An adopter can
   bring its own stylesheet against the same attributes.

   className is a pass-through for the adopter's own classes.
   ═══════════════════════════════════════════════════════════════ */

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-portal="https://mzizi.dev/components/button"
      data-variant={variant}
      data-size={size}
      data-state={disabled ? "disabled" : "enabled"}
      className={className}
      disabled={disabled}
      {...props}
    />
  )
}

/* Legacy re-export. Other components still style themselves with the Tailwind
   recipe in ui-variants.ts, and import it from here. It leaves when they move. */
export { buttonRecipe as buttonVariants } from "@/lib/ui-variants"
export { Button }
export type { ButtonVariant, ButtonSize }
