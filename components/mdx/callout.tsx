import { AlertCircle, CheckCircle2, Info, Lightbulb, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Replacement for `nextra/components/Callout`. Four variants mapped to
// mineral accents — info (Cobalt), warning (Gold), error (Terracotta),
// success (Malachite). Ubuntu-style: "here's a shared note, friend."
// Accessible via role="note" with an SR-hidden label for the variant.

type CalloutVariant = "info" | "warning" | "error" | "success" | "tip"

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const ICON: Record<CalloutVariant, LucideIcon> = {
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle2,
  tip: Lightbulb,
}

const VARIANT_CLASS: Record<CalloutVariant, string> = {
  info: "border-l-[var(--color-cobalt)] bg-[var(--color-cobalt)]/5 [&_svg]:text-[var(--color-cobalt)]",
  warning: "border-l-[var(--color-gold)] bg-[var(--color-gold)]/5 [&_svg]:text-[var(--color-gold)]",
  error:
    "border-l-[var(--color-terracotta)] bg-[var(--color-terracotta)]/5 [&_svg]:text-[var(--color-terracotta)]",
  success:
    "border-l-[var(--color-malachite)] bg-[var(--color-malachite)]/5 [&_svg]:text-[var(--color-malachite)]",
  tip: "border-l-[var(--color-tanzanite)] bg-[var(--color-tanzanite)]/5 [&_svg]:text-[var(--color-tanzanite)]",
}

const SR_LABEL: Record<CalloutVariant, string> = {
  info: "Note",
  warning: "Warning",
  error: "Important",
  success: "Success",
  tip: "Tip",
}

export function Callout({ variant = "info", title, children, className }: CalloutProps) {
  const Icon = ICON[variant]
  return (
    <aside
      role="note"
      className={cn(
        "my-6 flex gap-3 rounded-lg border-y border-r border-l-4 border-border px-4 py-3 text-sm leading-relaxed",
        VARIANT_CLASS[variant],
        className
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{SR_LABEL[variant]}: </span>
      <div className="min-w-0 flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {title && <p className="!mt-0 mb-1 font-semibold text-foreground">{title}</p>}
        {children}
      </div>
    </aside>
  )
}
