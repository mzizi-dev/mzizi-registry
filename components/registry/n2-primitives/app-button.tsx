import * as React from "react"

import { cn } from "@/lib/ui-utils"
import { appButtonVariants } from "@/lib/ui-variants"

/**
 * Button — the Dashboard Standard button (`contracts/app/button`), held to that whole
 * contract: an <a> when `href` is set, otherwise a <button type="button"> (so it never
 * submits by accident), at app density (36px, 44–48px on touch) with small corners.
 * `destructive` and `destructive-outline` read only the destructive tokens. The React
 * twin of `app-button.astro`; a server component. The registry primitive is `button`.
 */
export function Button({
  href,
  type = "button",
  variant,
  size,
  fullWidth,
  disabled,
  name,
  value,
  className,
  children,
}: {
  href?: string
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "destructive-outline"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  disabled?: boolean
  name?: string
  value?: string
  className?: string
  children?: React.ReactNode
}) {
  const classes = cn(appButtonVariants({ variant, size, fullWidth }), className)
  if (href) {
    return (
      <a href={href} className={classes} data-slot="button">
        {children}
      </a>
    )
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      name={name}
      value={value}
      data-slot="button"
    >
      {children}
    </button>
  )
}
