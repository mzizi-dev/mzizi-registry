import {
  LOCAL_DATA_LAYER,
  CLOUD_LAYER,
  DATA_OWNERSHIP_RULES,
} from "@/lib/architecture"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Data Layer — mukoko registry",
  description:
    "Local-first data architecture with RxDB, SQLite, and cloud synchronization.",
}

export default function DataLayerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          data layer architecture
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A local-first data architecture that works offline and syncs when
          connected, with clear ownership rules for every byte.
        </p>
      </div>

      {/* Local Data Layer */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Local Data Layer
        </h2>
        <p className="mt-2 text-muted-foreground">
          Data lives on the device first. These technologies power the local
          storage and query layer.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {LOCAL_DATA_LAYER.map((tech) => (
            <Card key={tech.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-serif text-lg">
                    {tech.name}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {tech.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {tech.description}
                </p>
                {tech.platform && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Platform:</span>{" "}
                    {tech.platform}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cloud Layer */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Cloud Layer
        </h2>
        <p className="mt-2 text-muted-foreground">
          Cloud services provide synchronization, authentication, and eventual
          consistency across devices.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {CLOUD_LAYER.map((service) => (
            <Card key={service.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-serif text-lg">
                    {service.name}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {service.consistencyModel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Data Ownership Rules */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Data Ownership Rules
        </h2>
        <p className="mt-2 text-muted-foreground">
          Clear rules govern who owns what data across the ecosystem.
        </p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Data Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Owner
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Storage
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Sync
                </th>
              </tr>
            </thead>
            <tbody>
              {DATA_OWNERSHIP_RULES.map((rule) => (
                <tr
                  key={rule.category}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {rule.category}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.ownership}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.database}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{rule.consistencyModel}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Code Example */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Environment-Aware Storage
        </h2>
        <p className="mt-2 text-muted-foreground">
          Storage selection adapts automatically based on the runtime
          environment.
        </p>

        <div className="mt-6 rounded-xl bg-muted p-4">
          <pre className="overflow-x-auto font-mono text-sm text-foreground">
{`import { Capacitor } from '@capacitor/core';

export function getMukokoStorage() {
  if (Capacitor.isNativePlatform()) {
    return getRxStorageSQLite({ /* config */ });
  }
  return getRxStorageDexie();
}`}
          </pre>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Native platforms use SQLite for performance; web uses IndexedDB via
          Dexie for broad browser support.
        </p>
      </section>
    </div>
  )
}
