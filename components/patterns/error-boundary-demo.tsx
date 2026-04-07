"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/error-boundary"
import { SectionErrorBoundary } from "@/components/section-error-boundary"

function CrashOnRender(): React.ReactNode {
  throw new Error("Intentional crash for demo")
}

function MiniCard({
  title,
  crashTrigger,
  onCrash,
}: {
  title: string
  crashTrigger: boolean
  onCrash: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Badge variant="outline">Active</Badge>
      </div>
      <p className="text-xs text-muted-foreground">This component is working normally.</p>
      {crashTrigger && <CrashOnRender />}
      <Button variant="destructive" size="xs" onClick={onCrash}>
        Trigger error
      </Button>
    </div>
  )
}

export function ErrorBoundaryDemo() {
  const [componentCrash, setComponentCrash] = useState(false)
  const [sectionACrash, setSectionACrash] = useState(false)
  const [sectionBCrash, setSectionBCrash] = useState(false)

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      {/* Component-level demo */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[var(--color-malachite)]" />
          <h3 className="text-sm font-semibold text-foreground">Component ErrorBoundary</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ErrorBoundary>
            <MiniCard
              title="Card A"
              crashTrigger={componentCrash}
              onCrash={() => setComponentCrash(true)}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <MiniCard title="Card B" crashTrigger={false} onCrash={() => {}} />
          </ErrorBoundary>
          <ErrorBoundary>
            <MiniCard title="Card C" crashTrigger={false} onCrash={() => {}} />
          </ErrorBoundary>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Each card is wrapped in an ErrorBoundary. Crashing one shows a minimal fallback — the
          others are unaffected.
        </p>
      </div>

      <div className="h-px bg-border" />

      {/* Section-level demo */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[var(--color-cobalt)]" />
          <h3 className="text-sm font-semibold text-foreground">SectionErrorBoundary</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SectionErrorBoundary section="Weather Data">
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4">
              <span className="text-sm font-medium text-foreground">Weather Data Section</span>
              <p className="text-xs text-muted-foreground">
                Full section with retry capability and named error display.
              </p>
              {sectionACrash && <CrashOnRender />}
              <Button variant="destructive" size="xs" onClick={() => setSectionACrash(true)}>
                Crash this section
              </Button>
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary section="Community Reports">
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4">
              <span className="text-sm font-medium text-foreground">Community Reports Section</span>
              <p className="text-xs text-muted-foreground">
                Independent section — survives if Weather Data crashes.
              </p>
              {sectionBCrash && <CrashOnRender />}
              <Button variant="destructive" size="xs" onClick={() => setSectionBCrash(true)}>
                Crash this section
              </Button>
            </div>
          </SectionErrorBoundary>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          SectionErrorBoundary shows the section name, a retry button, and logs the error via the
          observability system. Click &quot;Try again&quot; to recover.
        </p>
      </div>
    </div>
  )
}
