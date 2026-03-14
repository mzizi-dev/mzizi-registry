"use client"

import { COMPONENT_DOCS } from "./component-docs"
import { Badge } from "@/components/ui/badge"

interface ComponentDocSectionProps {
  name: string
}

export function ComponentDocSection({ name }: ComponentDocSectionProps) {
  const doc = COMPONENT_DOCS[name]
  if (!doc) return null

  return (
    <div className="space-y-6">
      {/* Use Cases */}
      {doc.useCases.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Use cases</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {doc.useCases.map((useCase) => (
              <li
                key={useCase}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-cobalt)]" />
                {useCase}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Variants & Sizes */}
      {(doc.variants || doc.sizes) && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Variants & sizes</h2>
          <div className="flex flex-wrap gap-6">
            {doc.variants && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Variants
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.variants.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {doc.sizes && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Sizes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.sizes.map((s) => (
                    <Badge key={s} variant="outline" className="font-mono">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      {doc.features && doc.features.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Features</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {doc.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-malachite)]" />
                {feature}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
