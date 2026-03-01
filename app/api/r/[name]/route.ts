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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid component name" },
        { status: 400 }
      )
    }

    const registry = getRegistry()
    const item = registry.items.find(
      (i: { name: string }) => i.name === name
    )

    if (!item) {
      return NextResponse.json(
        { error: `Component "${name}" not found in registry` },
        { status: 404 }
      )
    }

    const files: Array<{ path: string; type: string; content: string }> = []

    for (const file of item.files) {
      try {
        const filePath = path.join(process.cwd(), file.path)
        if (!fs.existsSync(filePath)) {
          console.warn(`[mukoko] File not found, skipping: ${filePath}`)
          continue
        }
        const content = fs.readFileSync(filePath, "utf-8")
        files.push({ path: file.path, type: file.type, content })
      } catch (fileError) {
        console.error(`[mukoko] Error reading file ${file.path}:`, fileError)
        // Skip this file but continue serving the rest
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: `No source files available for "${name}"` },
        { status: 404 }
      )
    }

    const registryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: item.name,
      type: item.type,
      description: item.description || "",
      dependencies: item.dependencies || [],
      registryDependencies: item.registryDependencies || [],
      files,
    }

    return NextResponse.json(registryItem, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("[mukoko] Registry item error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
