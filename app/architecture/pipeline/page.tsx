import { OPEN_DATA_PIPELINE } from "@/lib/architecture"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Pipeline — mukoko registry",
  description:
    "The open data pipeline: Redpanda, Flink, and Doris powering transparent African data infrastructure.",
}

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          open data pipeline
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A transparent, open data pipeline that processes African data with
          privacy at its core.
        </p>
      </div>

      {/* Open Data Manifesto */}
      <section className="mt-16">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Open Data Manifesto
          </h2>
          <blockquote className="mt-4 border-l-4 border-[var(--color-tanzanite)] pl-4 italic text-muted-foreground">
            &ldquo;African data should serve African communities first. Every data point
            collected is anonymized and made available as open data, powering
            research, policy, and innovation across the continent.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Pipeline Stages */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Pipeline Stages
        </h2>
        <p className="mt-2 text-muted-foreground">
          Data flows through three stages, each with a clear responsibility and
          technology choice.
        </p>

        <div className="mt-8 space-y-4">
          {OPEN_DATA_PIPELINE.map((stage, index) => (
            <div key={stage.name} className="flex gap-4">
              {/* Stage indicator */}
              <div className="flex flex-col items-center">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cobalt)] font-mono text-sm font-bold text-white">
                  {index + 1}
                </div>
                {index < OPEN_DATA_PIPELINE.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>

              {/* Stage card */}
              <Card className="mb-2 flex-1">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-serif text-lg">
                      {stage.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 font-mono text-xs"
                    >
                      {stage.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {stage.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">License:</span>{" "}
                    {stage.sovereignty.license} ({stage.sovereignty.governance})
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Boundary */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Privacy Boundary
        </h2>
        <p className="mt-2 text-muted-foreground">
          All personally identifiable information (PII) is stripped at the Apache Flink
          stage before data enters the analytical layer.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground">
              Before Boundary
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Raw events with user context, device IDs, and location precision.
              Processed in-memory only, never persisted with PII.
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground">
              After Boundary
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Anonymized, aggregated data points. Geographic precision reduced
              to district level. No individual can be identified.
            </p>
          </div>
        </div>
      </section>

      {/* Pipeline Flow Diagram */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Pipeline Flow
        </h2>
        <div className="mt-6 rounded-xl bg-muted p-4">
          <pre className="overflow-x-auto font-mono text-sm text-foreground">
{`Events (apps, sensors, APIs)
    │
    ▼
┌─────────────┐
│   Redpanda   │  Event streaming (Kafka-compatible)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Apache Flink │  Stream processing + PII stripping
└──────┬──────┘
       │  ← Privacy boundary (PII removed here)
       ▼
┌─────────────┐
│ Apache Doris │  Analytical database (open data)
└─────────────┘`}
          </pre>
        </div>
      </section>
    </div>
  )
}
