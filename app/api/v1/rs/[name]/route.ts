import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { readComponent } from "@/lib/registry"
import { readComponentSourceFor } from "@/lib/registry-source"
import { CRATE_GIT, crateFor } from "@/lib/rust-crates"

const logger = createLogger("registry")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/rs/[name] — a component's RUST (Dioxus) implementation.
 *
 * TWO SURFACES OVER ONE COMPONENT, NOT TWO COMPONENTS.
 *
 * `button` is one registry item with one contract — one description, one dependency list,
 * one set of documented variants — implemented for React in `button.tsx` and for Dioxus in
 * `button.rs`, side by side in the same node directory. `/api/v1/ui/{name}` serves the first
 * and stays byte-identical to what it has always served, so every existing `npx shadcn add`
 * keeps working; this route serves the second.
 *
 * A separate `button-rust` registry entry was the obvious alternative and is wrong: two
 * entries can drift in description, variants and dependencies while both look correct, which
 * is precisely the class of defect this repo has spent the whole migration removing.
 *
 * A COMPONENT WITH NO RUST SIBLING IS A 404, DELIBERATELY.
 *
 * Most of the registry is TypeScript-only today. Answering 200 with an empty body — or
 * falling back to the `.tsx` — would tell a Dioxus consumer that a Rust implementation
 * exists when it does not, and CLAUDE.md §8.9 is explicit: never present a target as though
 * components exist for it when the honest answer is "the source is yours to write".
 *
 * THIS IS A READ SURFACE, NOT AN INSTALL PATH.
 *
 * `npx shadcn add` copies a file into a consumer's project. Rust has no equivalent and does
 * not need one — a Dioxus consumer depends on the crate that compiles the component, named in
 * the payload's `crate` (CLAUDE.md §8.9). This
 * route is for reading: an agent answering a question, a reviewer, someone porting a
 * component. The shadcn-shaped envelope is kept anyway so one client can parse both routes.
 *
 * THE CRATE IS THE ONE THAT COMPILES THIS COMPONENT — see `lib/rust-crates.ts`. It said
 * `mzizi-ui` for every component, which was wrong for 34 of the 43 it served then.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid component name" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const component = readComponent(name)
    if (!component) {
      return NextResponse.json(
        { error: `Component "${name}" not found in registry` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const source = readComponentSourceFor(name, "rs")
    if (source === null) {
      return NextResponse.json(
        {
          error: `"${name}" has no Rust implementation`,
          message:
            "This component ships for React only. The contract, tokens and variants are on " +
            `https://api.mzizi.dev/v1/ui/${encodeURIComponent(name)} — the Dioxus source is ` +
            "yours to write against them.",
        },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const rsPath = component.sources?.rs ?? `${name}.rs`
    const crate = crateFor(rsPath)
    if (crate === null) {
      // Unreachable while `pnpm rust:generate:check` passes: the generator refuses a node
      // directory with Rust in it that the map does not name. Answer 500 rather than guess.
      logger.error("Rust component has no crate", { data: { name, rsPath } })
      return NextResponse.json(
        { error: `"${name}" has Rust source but no crate compiles it` },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    logger.info("Rust component served", { data: { name } })

    return NextResponse.json(
      {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: component.name,
        type: component.type,
        target: "dioxus",
        description: component.description,
        // The crate, not a file copy — see the header. Stated in the payload so a client
        // does not have to infer the distribution model from the route name.
        crate: { name: crate, registry: "crates.io", git: CRATE_GIT },
        files: [
          {
            path: rsPath,
            type: "registry:rust",
            content: source,
          },
        ],
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Rust registry item error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
