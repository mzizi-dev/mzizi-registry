import crateForNode from "@/mzizi-rs/crate-for-node.json"

/**
 * Which Rust crate compiles a registry component — the crate a consumer depends on.
 *
 * `/api/v1/rs/{name}` answered `crate.name: "mzizi-ui"` for every component. That was true
 * for the nine N2 primitives and wrong for the rest: `mzizi-footer` ships in `mzizi-shell`,
 * `mzizi-seo` in `mzizi-discovery`, and a consumer told the wrong crate adds a dependency
 * that does not contain the component.
 *
 * The answer is read from `mzizi-rs/crate-for-node.json`, the same map
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
  const node = rsPath.split("/").at(-2) ?? ""
  return (crateForNode as Record<string, string>)[node] ?? null
}
