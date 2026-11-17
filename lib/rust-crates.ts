import crateForNode from "@/mzizi-rs/crate-for-node.json"
import crateForFile from "@/mzizi-rs/crate-for-file.json"

/**
 * Which Rust crate compiles a registry component — the crate a consumer depends on.
 *
 * `/api/v1/rs/{name}` answered `crate.name: "mzizi-ui"` for every component. That was true
 * for the nine N2 primitives and wrong for the rest: `mzizi-footer` ships in `mzizi-shell`,
 * `mzizi-seo` in `mzizi-discovery`, and a consumer told the wrong crate adds a dependency
 * that does not contain the component.
 *
 * The answer is read from `mzizi-rs/crate-for-file.json` (the components that moved out of their
 * node's crate, #710) and then `mzizi-rs/crate-for-node.json`: the same maps
 * `pnpm rust:generate` uses to copy each `.rs` file into its crate, so the route and the
 * crates cannot disagree about where a component lives.
 */

/** The install that resolves at any commit, before and after a crates.io release. */
export const CRATE_GIT = "https://github.com/mzizi-dev/mzizi-registry"

/**
 * The crate for a Rust source path such as `components/registry/n3-brand/mzizi-meta-tile.rs`,
 * or `null` when its node directory has no crate (which `pnpm rust:generate` refuses).
 */
export function crateFor(rsPath: string): string | null {
  const parts = rsPath.split("/")
  const node = parts.at(-2) ?? ""
  const file = `${node}/${parts.at(-1) ?? ""}`
  return (
    (crateForFile as Record<string, string>)[file] ??
    (crateForNode as Record<string, string>)[node] ??
    null
  )
}
