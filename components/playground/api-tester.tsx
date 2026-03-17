"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ApiTesterProps {
  name: string
}

export function ApiTester({ name }: ApiTesterProps) {
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = `/api/v1/ui/${name}`

  async function fetchComponent() {
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch(endpoint)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            GET
          </span>
          <code className="text-sm text-muted-foreground">{endpoint}</code>
        </div>
        <Button size="sm" onClick={fetchComponent} disabled={loading}>
          {loading ? "Fetching..." : "Try it"}
        </Button>
      </div>
      {(response || error) && (
        <div className="max-h-[400px] overflow-auto">
          <pre
            className={cn(
              "p-4 text-xs leading-relaxed",
              error ? "text-destructive" : "text-foreground"
            )}
          >
            <code>{error || response}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
