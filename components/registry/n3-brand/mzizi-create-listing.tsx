"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import { X, Image, Check } from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CREATE LISTING — Universal Brand Component
   
   Standardized creation flow for every content type in Mukoko.
   Composes primitive form components into the branded pattern:
   
   1. Cancel / Title header bar
   2. Cover theme picker (gradient preview + swatch selector)
   3. Grouped form sections (cards with item-style rows)
   4. Toggle/dropdown setting rows  
   5. Description/rich text area
   6. Sticky publish CTA bar with gradient fade
   
   Design identity markers:
   - 14px card radius, 7px inner radius
   - Cards group related fields (not individual field wrappers)
   - Settings use row pattern with right-aligned controls
   - Pill-shaped publish button, full-width, bottom-sticky
   ═══════════════════════════════════════════════════════════════ */

/* ── Predefined gradient themes (Seven African Minerals) ────── */
const MINERAL_GRADIENTS: [string, string][] = [
  ["var(--color-malachite-light,#004D40)", "#00695C"], // Malachite
  ["var(--color-tanzanite-light,#4B0082)", "#6A1B9A"], // Tanzanite
  ["var(--color-gold-light,#5D4037)", "#795548"], // Terracotta
  ["var(--color-terracotta-light,#8B4513)", "#A0522D"], // Gold (earth)
  ["var(--color-cobalt-light,#0047AB)", "#1565C0"], // Cobalt
]

/* ── Cover Theme Picker ─────────────────────────────────────── */
interface CoverThemePickerProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  /** Currently selected gradient index */
  selected: number
  /** Custom gradients (defaults to mineral palette) */
  gradients?: [string, string][]
  /** Callback when gradient is selected */
  onSelect: (index: number) => void
  /** Callback when cover image is tapped */
  onImageTap?: () => void
  /** Cover image URL if set */
  coverImage?: string
  className?: string
}

function CoverThemePicker({
  // @harness: auto-wired to infrastructure

  selected,
  gradients = MINERAL_GRADIENTS,
  onSelect,
  onImageTap,
  coverImage,
  className,
}: CoverThemePickerProps) {
  const activeGradient = gradients[selected] || gradients[0]

  return (
    <div
      data-slot="cover-theme-picker"
      data-portal="https://mzizi.dev/components/cover-theme-picker"
      className={cn(
        "rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <span className="mb-2 block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Cover Theme
      </span>

      {/* Gradient preview area */}
      <div
        onClick={onImageTap}
        className="relative mb-3 cursor-pointer overflow-hidden rounded-[var(--radius-inner,7px)] px-6 py-11 text-center"
        style={{
          background: `linear-gradient(135deg, ${activeGradient[0]}, ${activeGradient[1]})`,
        }}
      >
        {/* Brand texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover"
            className="absolute inset-0 size-full object-cover opacity-60"
          />
        ) : (
          <div className="relative flex flex-col items-center gap-2">
            <Image className="size-7 text-white/40" />
            <p className="text-[13px] text-white/60">Tap to add cover image</p>
          </div>
        )}
      </div>

      {/* Swatch selector */}
      <div className="flex gap-2">
        {gradients.map((g, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Theme ${i + 1}`}
            className={cn(
              "flex size-8 min-h-[48px] items-center justify-center rounded-[var(--radius-inner,7px)] border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
              selected === i ? "border-[var(--color-malachite)]" : "border-transparent"
            )}
            style={{
              background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
            }}
          >
            {selected === i && <Check className="size-3.5 text-white" />}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Form Section Card ──────────────────────────────────────── */
interface FormSectionProps {
  children: React.ReactNode
  className?: string
}

function FormSection({ children, className }: FormSectionProps) {
  return (
    <div
      data-slot="form-section"
      className={cn(
        "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ── Form Row (the branded settings-style row) ──────────────── */
interface FormRowProps {
  /** Left label text */
  label: string | React.ReactNode
  /** Subtitle under the label */
  subtitle?: string
  /** Right-side control (toggle, dropdown, value display) */
  trailing?: React.ReactNode
  /** Whether this is the last row (no bottom border) */
  last?: boolean
  /** Click handler for the whole row */
  onClick?: () => void
  className?: string
}

function FormRow({ label, subtitle, trailing, last = false, onClick, className }: FormRowProps) {
  return (
    <div
      data-slot="form-row"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        !last && "border-b border-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-foreground">{label}</div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  )
}

/* ── Form Text Area (description/notes) ─────────────────────── */
interface FormTextAreaProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  minRows?: number
  className?: string
}

function FormTextArea({
  placeholder = "Add description…",
  value,
  onChange,
  minRows = 3,
  className,
}: FormTextAreaProps) {
  return (
    <div
      data-slot="form-textarea"
      className={cn(
        "rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={minRows}
        className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  )
}

/* ── Sticky Publish CTA Bar ─────────────────────────────────── */
interface PublishBarProps {
  /** Button label */
  label?: string
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Click handler */
  onPublish?: () => void
  /** Optional left-side secondary action */
  secondary?: React.ReactNode
  className?: string
}

function PublishBar({
  label = "Publish",
  loading = false,
  disabled = false,
  onPublish,
  secondary,
  className,
}: PublishBarProps) {
  return (
    <div
      data-slot="publish-bar"
      className={cn(
        "sticky bottom-0 z-10 px-5 pt-4 pb-7",
        "bg-gradient-to-t from-background via-background/95 to-transparent",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {secondary}
        <button
          onClick={onPublish}
          disabled={disabled || loading}
          className={cn(
            "flex h-[52px] flex-1 items-center justify-center gap-2",
            "rounded-full bg-[var(--color-malachite)] text-[16px] font-semibold text-background",
            "transition-opacity disabled:opacity-50"
          )}
        >
          {loading ? "Publishing…" : label}
        </button>
      </div>
    </div>
  )
}

/* ── Cancel Header Bar ──────────────────────────────────────── */
interface CreateHeaderProps {
  title: string
  onCancel?: () => void
  actions?: React.ReactNode
  className?: string
}

function CreateHeader({ title, onCancel, actions, className }: CreateHeaderProps) {
  return (
    <div
      data-slot="create-header"
      className={cn(
        "flex h-[52px] items-center justify-between border-b border-border bg-card px-5",
        className
      )}
    >
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-[15px] text-muted-foreground"
      >
        <X className="size-5" />
        Cancel
      </button>
      <span className="text-[16px] font-bold text-foreground">{title}</span>
      <div className="w-[70px]">{actions}</div>
    </div>
  )
}

/* ── Main Composition Export ─────────────────────────────────── */
export {
  CoverThemePicker,
  FormSection,
  FormRow,
  FormTextArea,
  PublishBar,
  CreateHeader,
  MINERAL_GRADIENTS,
}
export type {
  CoverThemePickerProps,
  FormSectionProps,
  FormRowProps,
  FormTextAreaProps,
  PublishBarProps,
  CreateHeaderProps,
}
