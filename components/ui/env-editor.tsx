"use client"

import * as React from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

interface EnvVariable {
  key: string
  value: string
  secret?: boolean
}

function EnvEditor({
  variables,
  onChange,
  className,
  ...props
}: {
  variables: EnvVariable[]
  onChange: (variables: EnvVariable[]) => void
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const [revealed, setRevealed] = React.useState<Set<number>>(new Set())

  function updateVariable(index: number, field: "key" | "value", val: string) {
    const next = variables.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    onChange(next)
  }

  function removeVariable(index: number) {
    onChange(variables.filter((_, i) => i !== index))
    setRevealed((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
  }

  function addVariable() {
    onChange([...variables, { key: "", value: "", secret: false }])
  }

  function toggleReveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }

  return (
    <div data-slot="env-editor" className={cn("flex flex-col gap-2", className)} {...props}>
      {variables.map((variable, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={variable.key}
            onChange={(e) => updateVariable(index, "key", e.target.value)}
            placeholder="KEY"
            className="bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-40 min-w-0 rounded-lg border px-3 font-mono text-sm outline-none transition-colors focus-visible:ring-[3px]"
          />
          <div className="relative flex-1">
            <input
              type={variable.secret && !revealed.has(index) ? "password" : "text"}
              value={variable.value}
              onChange={(e) => updateVariable(index, "value", e.target.value)}
              placeholder="value"
              className="bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-lg border px-3 pr-9 font-mono text-sm outline-none transition-colors focus-visible:ring-[3px]"
            />
            {variable.secret && (
              <button
                type="button"
                onClick={() => toggleReveal(index)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                aria-label={revealed.has(index) ? "Hide value" : "Reveal value"}
              >
                {revealed.has(index) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeVariable(index)}
            className="text-muted-foreground hover:text-destructive shrink-0 p-1.5 rounded-md transition-colors"
            aria-label={`Remove ${variable.key || "variable"}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addVariable}
        className="flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Plus className="size-4" />
        Add variable
      </button>
    </div>
  )
}

export { EnvEditor, type EnvVariable }
