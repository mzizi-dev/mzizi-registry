/**
 * Resolve a component's props to sample data.
 *
 * This is what turns "render it with no props and hope" into a preview that shows the
 * component doing its job. It runs in the browser, against `COMPONENT_PROPS` (extracted from
 * source at build time) and `sampleData` (authored in `lib/samples/data.ts`).
 *
 * THE RULE THAT KEEPS THIS HONEST.
 *
 * `AutoPreview` used to render with NO props, on the stated principle that a preview built
 * from guessed props shows the consumer something that is not the component. That principle
 * still holds, and this does not violate it — because these are not guesses.
 *
 * The difference is real and worth being precise about:
 *
 *   * A GUESS invents a value to satisfy a type. `title: "Title"`, `count: 1`. It renders
 *     something, and what it renders tells you nothing about whether the component works.
 *   * SAMPLE DATA is a record of the shape the component was designed to display, drawn from
 *     a curated set that mirrors the production MongoDB validators. A place card rendered
 *     against a real place document is the component doing exactly its job.
 *
 * So the resolver only supplies a value when it can identify the prop with reasonable
 * confidence — by declared type first, then by name. When it cannot, it supplies nothing and
 * the component falls back to whatever it does with an absent prop, which may still be the
 * "needs props" card. Half a preview from real data beats a whole one from invented data.
 *
 * Resolution is reported alongside the render (`resolvePropsFor` returns `matched` and
 * `unmatched`) so the playground can say which props were filled and which were not. A
 * preview that silently omits half its inputs looks like a broken component.
 */

import { sampleData, SAMPLE_NOW } from "./data"
import { COMPONENT_PROPS } from "./props.generated"
import type { SampleType } from "./types"

export interface PropInfo {
  name: string
  type: string
  required: boolean
}

export interface Resolution {
  props: Record<string, unknown>
  matched: string[]
  unmatched: string[]
}

/** Strip `| null`, `| undefined`, `readonly`, and outer parens to get at the core type. */
function coreType(type: string): string {
  return type
    .replace(/\breadonly\b/g, "")
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t && t !== "null" && t !== "undefined")
    .join("|")
    .replace(/^\((.*)\)$/, "$1")
    .trim()
}

const isArrayType = (t: string) => /\[\]$/.test(t) || /^(?:Array|ReadonlyArray)</.test(t)
const elementType = (t: string) =>
  t
    .replace(/\[\]$/, "")
    .replace(/^(?:Array|ReadonlyArray)<(.*)>$/, "$1")
    .trim()

/**
 * Domain types, matched on the DECLARED TYPE NAME.
 *
 * This is the high-confidence path: a prop declared `place: Place` wants a place, and there
 * is nothing to guess about it. Name-based matching below is the fallback for the many
 * components that declare props inline rather than against a named type.
 */
const TYPE_TO_SAMPLE: Array<[RegExp, SampleType]> = [
  [/\bplace\b/i, "places"],
  [/\b(?:entity|organi[sz]ation|business|seller|vendor|merchant)\b/i, "entities"],
  [/\b(?:person|user|author|member|profile|contact|attendee)\b/i, "persons"],
  [/\bevent\b/i, "events"],
  [/\b(?:product|listing|offer|item)\b/i, "products"],
  [/\b(?:article|post|story|news)\b/i, "articles"],
]

/** Prop NAMES that identify a domain object even when the type is inline or `unknown`. */
const NAME_TO_SAMPLE: Array<[RegExp, SampleType]> = [
  [/^places?$/i, "places"],
  [/^(?:entit(?:y|ies)|organi[sz]ations?|businesse?s?|sellers?|vendors?)$/i, "entities"],
  [/^(?:persons?|people|users?|authors?|members?|profiles?|contacts?|attendees?)$/i, "persons"],
  [/^events?$/i, "events"],
  [/^(?:products?|listings?|offers?)$/i, "products"],
  [/^(?:articles?|posts?|stories|news)$/i, "articles"],
]

function sampleFor(prop: PropInfo): SampleType | null {
  const core = coreType(prop.type)
  const element = isArrayType(core) ? elementType(core) : core
  for (const [pattern, key] of TYPE_TO_SAMPLE) if (pattern.test(element)) return key
  for (const [pattern, key] of NAME_TO_SAMPLE) if (pattern.test(prop.name)) return key
  return null
}

/**
 * Scalar props, matched on name.
 *
 * Every value here is drawn from the sample records rather than written fresh, so a preview
 * stays recognisably part of one world: the same place names, the same people. A component
 * showing "Lorem ipsum" next to one showing "Mana Pools" reads as two different systems.
 */
/**
 * Each entry lists CANDIDATES in preference order; the first that satisfies the declared
 * type wins. One value per name is not enough — `value` is a number on a gauge and a string
 * on a copy button, `size` is a pixel count on an avatar and a variant name on a control.
 * A single candidate forced `copy-button`'s `value: string` to take the number 45.
 */
const SCALARS: Array<[RegExp, unknown[]]> = [
  [/^(?:title|heading|headline|label|name)$/i, ["Mana Pools National Park"]],
  [/^(?:subtitle|subheading|caption|tagline)$/i, ["Mashonaland West, Zimbabwe"]],
  [
    /^(?:description|summary|excerpt|body|text|content|message)$/i,
    ["A UNESCO World Heritage Site on the Zambezi floodplain, known for walking safaris."],
  ],
  [
    /^(?:src|imageUrl|image|thumbnail|cover|coverImage|avatar|photo)$/i,
    ["https://picsum.photos/seed/mana-pools/800/800"],
  ],
  [/^(?:href|url|link)$/i, ["https://mzizi.dev"]],
  [/^(?:alt|altText|ariaLabel)$/i, ["Elephants on the Zambezi floodplain at Mana Pools"]],
  [/^(?:amount|price|total|subtotal)$/i, [45, "US$45.00"]],
  [/^value$/i, [45, "mana-pools-national-park"]],
  [/^(?:currency|priceCurrency)$/i, ["USD"]],
  [/^(?:count|quantity|qty|length|total(?:Count)?)$/i, [12]],
  [/^size$/i, [40]],
  [/^(?:percent|percentage|progress|completion)$/i, [68]],
  [/^(?:rating|score|stars)$/i, [4.8]],
  [
    /^(?:date|datetime|timestamp|publishedAt|createdAt|updatedAt|startDate|endDate|now)$/i,
    [SAMPLE_NOW],
  ],
  [/^email$/i, ["rudo.moyo@example.co.zw"]],
  [/^(?:phone|telephone|tel)$/i, ["+263 77 000 0000"]],
  [/^initials$/i, ["RM"]],
  [/^(?:slug|id|key)$/i, ["mana-pools-national-park"]],
  [/^placeholder$/i, ["Search places, events and listings…"]],
  [/^(?:role|jobTitle|position)$/i, ["Field guide, Mana Pools"]],
  [/^(?:category|section|topic)$/i, ["Travel"]],
  [/^(?:sourceName|publisher|publisherName|siteName)$/i, ["Kubatana News"]],
  [/^(?:authorName|byline|author)$/i, ["Farai Chikwanha"]],
  [/^readTime$/i, ["4 min read", 4]],
  [/^(?:location|city|locality|region)$/i, ["Harare, Zimbabwe"]],
]

/**
 * Resolve a scalar from the declared TYPE, for the cases where the type alone is enough.
 *
 * WHAT THIS DELIBERATELY NO LONGER DOES: return a generic string for `string`, or a generic
 * number for `number`. That fallback looked harmless and produced
 * `readTime: "Mana Pools National Park"`, `strokeColor: "Mana Pools National Park"` and
 * `ariaLabel: "Mana Pools National Park"` — visibly nonsense, and worse, the sort of nonsense
 * that renders. A prop whose name says nothing and whose type says only "a string" is a prop
 * this cannot resolve, and saying so is the honest answer.
 *
 * `boolean` returns FALSE, not true. Nearly every boolean in this registry is `loading`,
 * `disabled`, `error` or `readOnly`; defaulting to true made every component with a `loading`
 * prop render its skeleton instead of itself — 60-odd previews showing grey bars.
 */
function scalarByType(type: string): unknown {
  const core = coreType(type)
  // A union of string literals — the first is the documented default in every CVA-style
  // component here, and matching a variant to its own declared set cannot be wrong.
  if (/^"[^"]*"(?:\s*\|\s*"[^"]*")*$/.test(core)) {
    return core.split("|")[0].trim().replace(/^"|"$/g, "")
  }
  if (core === "boolean") return false
  if (core === "Date") return new Date(SAMPLE_NOW)
  return undefined
}

/** Does a candidate value satisfy the declared type well enough to pass? */
function typeAccepts(type: string, value: unknown): boolean {
  const core = coreType(type)
  if (!core || core === "unknown" || core === "any") return true
  if (isArrayType(core)) return Array.isArray(value)
  if (/^"[^"]*"(?:\s*\|\s*"[^"]*")*$/.test(core)) {
    return core.split("|").some((l) => l.trim().replace(/^"|"$/g, "") === value)
  }
  if (core === "string") return typeof value === "string"
  if (core === "number") return typeof value === "number"
  if (core === "boolean") return typeof value === "boolean"
  // A named or structural type — the name-based table cannot know, so let it through and let
  // the component's own error boundary be the judge.
  return true
}

/**
 * Resolve every prop a component declares.
 *
 * Handlers get a no-op rather than being skipped: a component that calls `onSelect` on mount
 * would throw on `undefined`, and a throw in the preview is indistinguishable to a reader
 * from the component being broken.
 */
export function resolvePropsFor(componentName: string): Resolution {
  const declared = COMPONENT_PROPS[componentName] ?? []
  const props: Record<string, unknown> = {}
  const matched: string[] = []
  const unmatched: string[] = []

  for (const prop of declared) {
    const core = coreType(prop.type)

    // Handlers first — the name test is unambiguous and a sample value is meaningless.
    if (/^on[A-Z]/.test(prop.name) || /=>/.test(core)) {
      props[prop.name] = () => {}
      matched.push(prop.name)
      continue
    }

    // A LITERAL UNION IS CHECKED BEFORE EVERYTHING ELSE, because it is the most specific
    // statement a prop can make: the type enumerates its own valid values, so matching one
    // of them cannot be wrong.
    //
    // Two separate bugs came from testing it later. `size` in the name table means a pixel
    // count, but `size` on a CVA control means `"default" | "sm"` — the name table handed
    // `copy-button` a size of 12. And the domain matcher scans the type as TEXT, so
    // `appointment-card`'s `type: "in-person" | "telemedicine"` matched `/\bperson\b/` inside
    // its own literal and received an entire person document.
    const byLiteral = scalarByType(prop.type)
    if (byLiteral !== undefined && /^"[^"]*"(?:\s*\|\s*"[^"]*")*$/.test(core)) {
      props[prop.name] = byLiteral
      matched.push(prop.name)
      continue
    }

    const sampleKey = sampleFor(prop)
    if (sampleKey) {
      const records = sampleData[sampleKey]
      props[prop.name] = isArrayType(core) ? records.slice(0, 4) : records[0]
      matched.push(prop.name)
      continue
    }

    // Name-based, but only when the value actually satisfies the declared type. Without that
    // guard `copy-button`'s `value: string` received the number 45.
    const byName = SCALARS.find(([pattern]) => pattern.test(prop.name))
    if (byName) {
      const accepted = byName[1]
        .map((v) => (isArrayType(core) ? [v] : v))
        .find((candidate) => typeAccepts(prop.type, candidate))
      if (accepted !== undefined) {
        props[prop.name] = accepted
        matched.push(prop.name)
        continue
      }
    }

    if (byLiteral !== undefined) {
      props[prop.name] = isArrayType(core) ? [byLiteral] : byLiteral
      matched.push(prop.name)
      continue
    }

    // Nothing confident to supply. Leave it absent rather than invent one — a required prop
    // left out shows the component's own empty/error state, which is the truth.
    unmatched.push(prop.name)
  }

  return { props, matched, unmatched }
}

/** Whether any sample data is available for a component at all. */
export function hasSampleProps(componentName: string): boolean {
  return (COMPONENT_PROPS[componentName]?.length ?? 0) > 0
}
