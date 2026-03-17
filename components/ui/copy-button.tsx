"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  /** The text to copy to clipboard */
  value: string
  /** Label shown before copying (default: "Copy") */
  label?: string
  /** Label shown after copying (default: "Copied") */
  copiedLabel?: string
  /** Duration in ms to show copied state (default: 2000) */
  copiedDuration?: number
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Icon-only mode (no label text) */
  iconOnly?: boolean
  className?: string
}

function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  copiedDuration = 2000,
  variant = "outline",
  size = "sm",
  iconOnly = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), copiedDuration)
  }

  return (
    <Button
      data-slot="copy-button"
      variant={variant}
      size={iconOnly ? "icon" : size}
      onClick={handleCopy}
      className={cn(iconOnly && "size-8", className)}
    >
      {copied ? (
        <Check className={cn("size-4", !iconOnly && "mr-1.5")} />
      ) : (
        <Copy className={cn("size-4", !iconOnly && "mr-1.5")} />
      )}
      {!iconOnly && (copied ? copiedLabel : label)}
    </Button>
  )
}

export { CopyButton }
export type { CopyButtonProps }
