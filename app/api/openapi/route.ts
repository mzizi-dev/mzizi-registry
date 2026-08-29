import { NextResponse } from "next/server"

import { OPENAPI_YAML } from "@/lib/openapi.generated"

/**
 * GET /api/openapi
 *
 * Serves the OpenAPI 3.1 specification for the Mzizi registry API.
 * Returns the raw YAML by default, or JSON if ?format=json is requested.
 *
 * The document is imported, not read. It used to be
 * `readFile(join(process.cwd(), "openapi.yaml"))` — a filesystem read at
 * request time, which Cloudflare Workers cannot do. The old `try/catch`
 * reported that failure as `404 "OpenAPI specification not found"`, so on
 * Workers the spec did not error, it simply appeared not to exist. See
 * `scripts/generate-openapi.mjs`.
 *
 * The `try/catch` is gone with the read. There is nothing left here that can
 * throw, and a catch-all that turns a bug into a 404 is how the original
 * defect stayed invisible.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format")

  if (format === "json") {
    // Minimal YAML→JSON conversion for tooling that requires JSON
    // For a full parse, consumers should use a proper YAML parser
    return NextResponse.json(
      { message: "Use ?format=yaml (default) or fetch the raw YAML.", yaml: OPENAPI_YAML },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      }
    )
  }

  return new NextResponse(OPENAPI_YAML, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      // Signal to OpenAPI tooling that this is a spec
      "X-OpenAPI-Version": "3.1.0",
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
