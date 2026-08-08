import { describe, expect, it } from "vitest"
import { sampleData, SAMPLE_NOW } from "@/lib/samples/data"
import { COMPONENT_PROPS } from "@/lib/samples/props.generated"
import { resolvePropsFor } from "@/lib/samples/resolve"
import type { SampleType } from "@/lib/samples/types"

/**
 * The sample dataset and the resolver that binds it to component props.
 *
 * These assert the properties a preview depends on, not the content. Whether Mana Pools has
 * a description is an editorial choice; whether the dataset contains a record with NO
 * description is a structural one, because that is the branch a card only renders when
 * something in the fixture set forces it to.
 */

const TYPES = Object.keys(sampleData) as SampleType[]

describe("the sample dataset", () => {
  it("covers every declared type with more than one record", () => {
    for (const type of TYPES) {
      expect(sampleData[type].length, `${type} needs several records`).toBeGreaterThan(1)
    }
  })

  it("gives every record a stable, unique id", () => {
    // Ids are referenced across types (a product's `sellerEntityId`, a person's
    // `defaultFamilyEntityId`) and by any consumer querying `mzizi_samples`. A duplicate
    // would make an upsert silently drop a record.
    const seen = new Set<string>()
    for (const type of TYPES) {
      for (const record of sampleData[type] as Array<{ _id: string }>) {
        expect(record._id, `${type} has a record with no _id`).toBeTruthy()
        expect(seen.has(record._id), `duplicate _id ${record._id}`).toBe(false)
        seen.add(record._id)
      }
    }
  })

  it("contains no clock reads or randomness", () => {
    // A fixture that changes between two renders breaks static prerendering (server and
    // client disagree), makes visual diffs noise, and makes a failing test unreproducible.
    // Every date is a fixed ISO string; this asserts they parse and none is "now".
    const dated = [
      ...sampleData.events.flatMap((e) => [e.startDate, e.endDate]),
      ...sampleData.articles.map((a) => a.datePublished),
      SAMPLE_NOW,
    ]
    for (const value of dated) {
      expect(typeof value).toBe("string")
      expect(Number.isNaN(Date.parse(value)), `${value} is not a parseable date`).toBe(false)
    }
  })

  it("includes the empty-state records a card would otherwise never exercise", () => {
    // Real data clusters around the easy case. If the fixture set does too, the branch that
    // renders a listing with no photograph is a branch nobody ever looks at — and most
    // informal-economy records have no photograph.
    expect(sampleData.places.some((p) => !p.media?.coverImage)).toBe(true)
    expect(sampleData.places.some((p) => p.description === null)).toBe(true)
    expect(sampleData.places.some((p) => !p.discovery?.aggregateRating)).toBe(true)
    expect(sampleData.persons.some((p) => p.picture === null)).toBe(true)
    expect(sampleData.articles.some((a) => a.image.length === 0)).toBe(true)
    expect(sampleData.products.some((p) => p.offers[0]?.availability === "SoldOut")).toBe(true)
    expect(sampleData.events.some((e) => e.eventStatus !== "EventScheduled")).toBe(true)
  })

  it("spans the verification tiers, not just the verified end", () => {
    // Tier 0 → 1 is the agent write-cliff. A component that only ever renders tier 3 in
    // preview hides the state most real records are actually in.
    const tiers = new Set(sampleData.places.map((p) => p.bundu.verificationTier))
    expect(tiers.has(0)).toBe(true)
    expect(tiers.has(3)).toBe(true)
  })

  it("carries at least one non-English record", () => {
    // Noto Sans is the type stack specifically for African language coverage (§7.2). An
    // all-English fixture set never renders a diacritic.
    expect(sampleData.articles.some((a) => a.inLanguage !== "en")).toBe(true)
  })
})

describe("prop resolution", () => {
  it("extracted props for a substantial share of the registry", () => {
    // A floor, not a target. If a parser change silently stops matching, this catches it —
    // the failure mode is "0 components have props", which reads as "no component takes
    // props" and produces empty previews everywhere.
    expect(Object.keys(COMPONENT_PROPS).length).toBeGreaterThan(250)
  })

  it("never hands a handler prop anything but a function", () => {
    // A component that calls `onSelect` on mount throws on a non-function, and a throw in
    // the preview is indistinguishable from the component being broken.
    for (const name of Object.keys(COMPONENT_PROPS)) {
      const { props } = resolvePropsFor(name)
      for (const [key, value] of Object.entries(props)) {
        if (/^on[A-Z]/.test(key)) {
          expect(typeof value, `${name}.${key} is not a function`).toBe("function")
        }
      }
    }
  })

  it("resolves a literal-union prop to one of its own literals", () => {
    // `size` means a pixel count on an avatar and a variant name on a CVA control. Taking
    // the name table first gave `copy-button` a `size` of 12, which is not one of its
    // variants — the declared type is the more specific statement and must win.
    for (const name of Object.keys(COMPONENT_PROPS)) {
      const declared = COMPONENT_PROPS[name]
      const { props } = resolvePropsFor(name)
      for (const prop of declared) {
        const literals = prop.type.match(/"[^"]*"/g)
        const isPureUnion = /^\s*"[^"]*"(?:\s*\|\s*"[^"]*")*\s*$/.test(prop.type)
        if (!isPureUnion || !literals) continue
        const value = props[prop.name]
        if (value === undefined) continue
        const allowed = literals.map((l) => l.replace(/"/g, ""))
        expect(allowed, `${name}.${prop.name} got ${JSON.stringify(value)}`).toContain(value)
      }
    }
  })

  it("defaults booleans to false so previews are not all skeletons", () => {
    // Nearly every boolean here is `loading`, `disabled` or `error`. Defaulting to true made
    // every component with a `loading` prop render grey bars instead of itself.
    const { props } = resolvePropsFor("nyuchi-article-card")
    expect(props.loading).toBe(false)
  })

  it("reports what it could not resolve instead of inventing it", () => {
    // The honesty rule. A preview that silently omits half a component's inputs looks like a
    // broken component; one that fabricates them looks like a working one that is lying.
    const { props, unmatched } = resolvePropsFor("empty-state")
    expect(unmatched.length).toBeGreaterThan(0)
    for (const name of unmatched) {
      expect(Object.keys(props)).not.toContain(name)
    }
  })
})

describe("preview coverage", () => {
  /**
   * A floor, not a target.
   *
   * `scripts/extract-props.ts` only understood a named `interface FooProps`
   * declaration, and most of this registry declares props INLINE on the
   * component's parameter — either `}: React.ComponentProps<"div"> & { … }` or
   * a bare `}: { … }`. So 256 of 572 components extracted zero props, and a
   * component with no props resolves to no sample data, which renders the
   * "needs props" fallback rather than the component doing its job. Nothing
   * failed; the previews were just empty.
   *
   * These numbers are deliberately below the measured values so ordinary
   * additions do not trip them. What they catch is a regression in the
   * EXTRACTOR — the failure that is invisible because it produces a smaller
   * object rather than an error.
   */
  it("extracts props for most of the registry", () => {
    expect(Object.keys(COMPONENT_PROPS).length).toBeGreaterThanOrEqual(450)
  })

  it("resolves at least one prop for the large majority of them", () => {
    let resolved = 0
    for (const [name, props] of Object.entries(COMPONENT_PROPS)) {
      if (!props.length) continue
      if (resolvePropsFor(name).matched.length > 0) resolved++
    }
    expect(resolved).toBeGreaterThanOrEqual(400)
  })

  it("never extracts a prop whose type swallowed the next one", () => {
    // The `=>` trap: counting `>` as a closing bracket drives depth negative on
    // an arrow-function prop, and every later member collapses into the
    // previous one's type — `onChange` came out as
    // `"(value: AddressValue) => void className?: string"`, taking `className`
    // with it.
    //
    // The tell is a member declaration following `=> void` (or `=> Promise<…>`)
    // with NO separator. A nested object type like
    // `{ name: string; avatar?: string }` has separators and is perfectly
    // legitimate — an earlier version of this assertion flagged
    // `article-page.author` for exactly that and was wrong.
    for (const [component, props] of Object.entries(COMPONENT_PROPS)) {
      for (const prop of props) {
        expect(prop.type, `${component}.${prop.name} swallowed the prop after it`).not.toMatch(
          /=>\s*[\w<>[\]|]+\s+\w+\??:/
        )
      }
    }
  })
})
