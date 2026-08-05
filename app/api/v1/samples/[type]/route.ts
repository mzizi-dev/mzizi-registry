import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { sampleData } from "@/lib/samples/data"
import type { SampleType } from "@/lib/samples/types"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("samples")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/samples/[type] — the sample records of one type.
 *
 * Types: `places` | `entities` | `persons` | `events` | `products` | `articles`.
 *
 * WHAT THIS IS FOR.
 *
 * Every Mzizi component preview renders against these records, so a consumer building
 * against the registry can develop against the same data the component was designed for —
 * without standing up a database first. An agent scaffolding a page can fetch a real place
 * document and see exactly which fields a card reads.
 *
 * The shapes mirror the production MongoDB validators field for field
 * (`lib/samples/types.ts`), which is what makes this more than fixture JSON: the query a
 * consumer writes against `mzizi_samples` is the query they ship against their own cluster.
 * `pnpm samples:push` puts the identical documents in MongoDB for exactly that reason.
 *
 * NOT REAL DATA, AND SAID SO IN THE PAYLOAD. Every response carries `sample: true`. These
 * records are curated fixtures — the places are real, the businesses and people are not —
 * and a consumer must never be able to mistake them for the live registry. Production
 * `places.places` holds 15,359 documents; 38 have a description and none have images, which
 * is why previewing against it was never an option.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const start = Date.now()
  const endpoint = "/api/v1/samples/[type]"
  try {
    const { type } = await params
    const known = Object.keys(sampleData) as SampleType[]

    if (!type || !known.includes(type as SampleType)) {
      trackApiCall({ endpoint, durationMs: Date.now() - start, statusCode: 404 })
      return NextResponse.json(
        {
          error: `Unknown sample type "${type}"`,
          available: known,
        },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const records = sampleData[type as SampleType]
    logger.info("Sample records served", { data: { type, count: records.length } })
    trackApiCall({
      endpoint: `/api/v1/samples/${type}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Mzizi sample ${type}`,
        description:
          `Curated sample ${type} in the same shape as the platform's MongoDB collection. ` +
          "Used by every component preview on mzizi.dev.",
        sample: true,
        type,
        count: records.length,
        mongodb: { database: "mzizi_samples", collection: type },
        records,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Sample route error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint, durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}

/** Prerender all six types — the set is static and known at build time. */
export function generateStaticParams() {
  return Object.keys(sampleData).map((type) => ({ type }))
}
