import { NextResponse } from "next/server"
import { sampleData } from "@/lib/samples/data"
import { trackApiCall } from "@/lib/metrics"

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/samples — index of the sample dataset.
 *
 * The data every component preview renders against, and the data a consumer can build
 * against before they have a database. Each type mirrors a production MongoDB collection
 * validator, so the mapping from a Mzizi component to a real cluster is already done.
 */
export async function GET() {
  const start = Date.now()
  const types = Object.entries(sampleData).map(([type, records]) => ({
    type,
    count: records.length,
    href: `https://mzizi.dev/api/v1/samples/${type}`,
    mongodb: { database: "mzizi_samples", collection: type },
  }))

  trackApiCall({ endpoint: "/api/v1/samples", durationMs: Date.now() - start, statusCode: 200 })

  return NextResponse.json(
    {
      "@context": "https://schema.org",
      "@type": "DataCatalog",
      name: "Mzizi sample data",
      description:
        "Curated sample records in the same shapes as the platform's MongoDB collections. " +
        "Every component preview on mzizi.dev renders against these.",
      sample: true,
      types,
      // Stated up front rather than discovered. A consumer who assumes these are live
      // registry records will build something that breaks on real data.
      notes: [
        "These are fixtures, not live data. Places are real; businesses and people are not.",
        "Shapes mirror the production validators, so a query written here ships unchanged.",
        "`pnpm samples:push` loads the identical documents into MongoDB `mzizi_samples`.",
      ],
    },
    { headers: CORS_CACHE }
  )
}
