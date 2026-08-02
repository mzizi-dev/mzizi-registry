"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type BodyRegion = "head" | "chest" | "abdomen" | "limbs" | "back" | "skin" | "general"
type Severity = 1 | 2 | 3 | 4 | 5

interface SymptomEntry {
  region: BodyRegion
  description: string
  severity: Severity
  duration: string
}

interface SymptomCheckerProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  symptoms?: SymptomEntry[]
  onSymptomsChange?: (symptoms: SymptomEntry[]) => void
  onSubmit?: (symptoms: SymptomEntry[]) => void
}

const regions: { key: BodyRegion; label: string }[] = [
  { key: "head", label: "Head & Neck" },
  { key: "chest", label: "Chest" },
  { key: "abdomen", label: "Abdomen" },
  { key: "limbs", label: "Arms & Legs" },
  { key: "back", label: "Back" },
  { key: "skin", label: "Skin" },
  { key: "general", label: "General" },
]

const durations = ["Less than a day", "1-3 days", "4-7 days", "1-2 weeks", "More than 2 weeks"]

function SymptomChecker({
  symptoms = [],
  onSymptomsChange,
  onSubmit,
  className,
  ...props
}: SymptomCheckerProps) {
  const [region, setRegion] = React.useState<BodyRegion>("general")
  const [description, setDescription] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity>(3)
  const [duration, setDuration] = React.useState(durations[0])

  const addSymptom = () => {
    if (!description.trim()) return
    const entry: SymptomEntry = { region, description: description.trim(), severity, duration }
    const updated = [...symptoms, entry]
    onSymptomsChange?.(updated)
    setDescription("")
  }

  const removeSymptom = (i: number) => {
    onSymptomsChange?.(symptoms.filter((_, idx) => idx !== i))
  }

  return (
    <div
      data-slot="symptom-checker"
      data-portal="https://mzizi.dev/components/symptom-checker"
      className={cn(
        "space-y-4 rounded-[var(--radius-xl,17px)] border border-border bg-card p-5",
        className
      )}
      {...props}
    >
      <div className="text-sm font-medium">Describe your symptoms</div>
      <div className="text-[10px] text-muted-foreground">
        This is not a diagnostic tool. Your summary will be shared with your healthcare provider.
      </div>

      {/* Region selector */}
      <div className="flex flex-wrap gap-1">
        {regions.map((r) => (
          <button
            key={r.key}
            onClick={() => setRegion(r.key)}
            aria-pressed={region === r.key}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              region === r.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addSymptom()}
        placeholder="What are you experiencing?"
        className="h-12 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
      />

      {/* Severity */}
      <div>
        <label className="text-xs text-muted-foreground">Severity: {severity}/5</label>
        <input
          type="range"
          min={1}
          max={5}
          value={severity}
          onChange={(e) => setSeverity(parseInt(e.target.value) as Severity)}
          className="mt-1 h-1 w-full accent-[var(--color-terracotta,#D4A574)]"
        />
      </div>

      {/* Duration */}
      <select
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="h-10 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none"
        aria-label="Duration"
      >
        {durations.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <button
        onClick={addSymptom}
        disabled={!description.trim()}
        className="h-10 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        Add Symptom
      </button>

      {/* Current symptoms */}
      {symptoms.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Reported symptoms</div>
          {symptoms.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[var(--radius-md,12px)] bg-muted/30 px-3 py-2 text-xs"
            >
              <div>
                <span className="font-medium capitalize">{s.region}:</span> {s.description} ·
                Severity {s.severity}/5 · {s.duration}
              </div>
              <button
                onClick={() => removeSymptom(i)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
          {onSubmit && (
            <button
              onClick={() => onSubmit(symptoms)}
              className="mt-2 h-10 w-full rounded-full border border-primary text-sm font-medium text-primary hover:bg-primary/5"
            >
              Submit to Provider
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { SymptomChecker }
export type { SymptomCheckerProps }
