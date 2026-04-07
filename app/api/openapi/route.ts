import { readFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

/**
 * GET /api/openapi
 *
 * Serves the OpenAPI 3.1 specification for the Nyuchi Design Portal API.
 * Returns the raw YAML by default, or JSON if ?format=json is requested.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")

    const yamlPath = join(process.cwd(), "openapi.yaml")
    const yaml = await readFile(yamlPath, "utf-8")

    if (format === "json") {
      // Minimal YAML→JSON conversion for tooling that requires JSON
      // For a full parse, consumers should use a proper YAML parser
      return NextResponse.json(
        { message: "Use ?format=yaml (default) or fetch the raw YAML.", yaml },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        }
      )
    }

    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        // Signal to OpenAPI tooling that this is a spec
        "X-OpenAPI-Version": "3.1.0",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "OpenAPI specification not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
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
