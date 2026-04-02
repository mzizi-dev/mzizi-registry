"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps extends React.ComponentProps<"div"> {
  password: string
}

const CHECKS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function getStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: "" }
  const passed = CHECKS.filter((c) => c.test(password)).length
  if (passed <= 1) return { level: 1, label: "Weak" }
  if (passed <= 2) return { level: 2, label: "Fair" }
  if (passed <= 3) return { level: 3, label: "Good" }
  return { level: 4, label: "Strong" }
}

const SEGMENT_COLORS: Record<number, string> = {
  1: "bg-destructive",
  2: "bg-mineral-gold",
  3: "bg-mineral-cobalt",
  4: "bg-mineral-malachite",
}

function PasswordStrength({ className, password, ...props }: PasswordStrengthProps) {
  const { level, label } = getStrength(password)

  return (
    <div
      data-slot="password-strength"
      className={cn("space-y-3 text-sm", className)}
      {...props}
    >
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                seg <= level ? SEGMENT_COLORS[level] : "bg-muted"
              )}
            />
          ))}
        </div>
        {label && (
          <p
            className={cn(
              "text-xs font-medium",
              level === 1 && "text-destructive",
              level === 2 && "text-mineral-gold",
              level === 3 && "text-mineral-cobalt",
              level === 4 && "text-mineral-malachite"
            )}
          >
            {label}
          </p>
        )}
      </div>
      {/* Checklist */}
      <ul className="space-y-1">
        {CHECKS.map((check) => {
          const passed = password ? check.test(password) : false
          return (
            <li key={check.label} className="flex items-center gap-2">
              {passed ? (
                <Check className="text-mineral-malachite size-3.5" />
              ) : (
                <X className="text-muted-foreground size-3.5" />
              )}
              <span className={cn(passed ? "text-foreground" : "text-muted-foreground")}>
                {check.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { PasswordStrength, type PasswordStrengthProps }
