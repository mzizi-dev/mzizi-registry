"use client"

import * as React from "react"
import { PencilIcon, CheckIcon, XIcon } from "@/lib/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type InlineEditMode = "display" | "edit"

type InlineEditFieldType = "text" | "textarea" | "number" | "email" | "url"

interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string
  onSave: (next: string) => void | Promise<void>
  onCancel?: () => void
  fieldType?: InlineEditFieldType
  placeholder?: string
  maxLength?: number
  required?: boolean
  disabled?: boolean
  ariaLabel: string
  displayClassName?: string
  editClassName?: string
  validate?: (value: string) => string | null
  saveOnBlur?: boolean
  emptyText?: string
}

function InlineEdit({
  value,
  onSave,
  onCancel,
  fieldType = "text",
  placeholder,
  maxLength,
  required = false,
  disabled = false,
  ariaLabel,
  className,
  displayClassName,
  editClassName,
  validate,
  saveOnBlur = false,
  emptyText = "Click to edit",
  ...props
}: InlineEditProps) {
  const [mode, setMode] = React.useState<InlineEditMode>("display")
  const [draft, setDraft] = React.useState(value)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const displayRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (mode === "display") setDraft(value)
  }, [value, mode])

  const activate = () => {
    if (disabled) return
    setDraft(value)
    setError(null)
    setMode("edit")
  }

  const cancel = React.useCallback(() => {
    setDraft(value)
    setError(null)
    setMode("display")
    onCancel?.()
    requestAnimationFrame(() => displayRef.current?.focus())
  }, [value, onCancel])

  const commit = React.useCallback(async () => {
    if (required && draft.trim() === "") {
      setError("Required")
      return
    }
    if (validate) {
      const v = validate(draft)
      if (v) {
        setError(v)
        return
      }
    }
    if (draft === value) {
      setMode("display")
      return
    }
    try {
      setSaving(true)
      await onSave(draft)
      setMode("display")
      requestAnimationFrame(() => displayRef.current?.focus())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }, [draft, required, validate, value, onSave])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && fieldType !== "textarea") {
      e.preventDefault()
      commit()
    }
    if (e.key === "Enter" && e.metaKey && fieldType === "textarea") {
      e.preventDefault()
      commit()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      cancel()
    }
  }

  if (mode === "display") {
    const isEmpty = value === "" || value == null
    return (
      <button
        ref={displayRef}
        type="button"
        data-slot="inline-edit-display"
        data-portal="https://mzizi.dev/components/inline-edit"
        data-empty={isEmpty}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            activate()
          }
        }}
        disabled={disabled}
        aria-label={`${ariaLabel}. ${isEmpty ? emptyText : value}. Click to edit.`}
        className={cn(
          "group -mx-2 inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          isEmpty && "text-muted-foreground italic",
          displayClassName,
          className
        )}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className="min-w-0 truncate">{isEmpty ? emptyText : value}</span>
        <PencilIcon
          className="size-3.5 shrink-0 opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"
          aria-hidden="true"
        />
      </button>
    )
  }

  const InputTag = fieldType === "textarea" ? Textarea : Input
  const inputType = fieldType === "textarea" ? undefined : fieldType

  return (
    <div
      data-slot="inline-edit-editing"
      data-portal="https://mzizi.dev/components/inline-edit"
      className={cn("flex items-start gap-2", editClassName, className)}
    >
      <div className="min-w-0 flex-1">
        <InputTag
          autoFocus
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={error ? `${ariaLabel}-error` : undefined}
          value={draft}
          type={inputType}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={saving}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (saveOnBlur) commit()
          }}
        />
        {error && (
          <p id={`${ariaLabel}-error`} className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={commit}
          disabled={saving}
          aria-label="Save"
        >
          <CheckIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={cancel}
          disabled={saving}
          aria-label="Cancel"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export { InlineEdit }
export type { InlineEditProps, InlineEditFieldType }
