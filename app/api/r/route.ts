import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function getRegistry() {
  const registryPath = path.join(process.cwd(), "registry.json")
  if (!fs.existsSync(registryPath)) {
    throw new Error("registry.json not found")
  }
  const raw = fs.readFileSync(registryPath, "utf-8")
  return JSON.parse(raw)
}

export async function GET() {
  try {
    const registry = getRegistry()

    const index = {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: registry.name,
      homepage: registry.homepage,
      items: (registry.items ?? []).map(
        (item: {
          name: string
          type: string
          description?: string
          dependencies?: string[]
          registryDependencies?: string[]
        }) => ({
          name: item.name,
          type: item.type,
          description: item.description || "",
          dependencies: item.dependencies || [],
          registryDependencies: item.registryDependencies || [],
        })
      ),
    }

    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("[mukoko] Registry index error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
