#!/usr/bin/env -S tsx
/**
 * Extract each component's prop names and types into `lib/samples/props.generated.ts`.
 *
 *   pnpm props:extract        — regenerate
 *   pnpm props:verify         — non-mutating drift gate
 *
 * WHY THIS EXISTS.
 *
 * `AutoPreview` renders a component in the browser. To hand it sample data it has to know
 * what props the component takes — and the props are a TypeScript type, which does not exist
 * at runtime. So the names and types are read here, at build time, from the source on disk,
 * and emitted as data the client can use.
 *
 * That is only possible because component source is a file in this repo. It was not possible
 * while source lived in a database column, which is a small concrete example of what the
 * migration bought.
 *
 * WHAT THIS DELIBERATELY IS NOT.
 *
 * Not a type checker, and not the TypeScript compiler API. It reads prop declarations with a
 * scanner and gives up on anything it cannot read confidently, emitting nothing for that
 * component rather than a guess. A wrong prop type produces a preview that renders something
 * which is not the component — worse than no preview, because it looks authoritative. `tsc`
 * remains the thing that decides whether a component's types are right; this only decides
 * what to try passing it.
 *
 * The output is committed and drift-gated for the same reason the token artifacts are: a
 * generated file that nothing verifies is a file that silently goes stale.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "fs"
import { basename, extname, join } from "path"

const REGISTRY = join(process.cwd(), "components", "registry")
const OUT = join(process.cwd(), "lib", "samples", "props.generated.ts")

export interface PropInfo {
  name: string
  /** The declared type source text, normalised to one line. */
  type: string
  required: boolean
}

/**
 * Props never worth resolving sample data for.
 *
 * `children` is handled separately (the resolver supplies a label). `className`, `class` and
 * `style` are presentational and a sample value would fight the component's own styling.
 * Anything starting with `on` is a handler — passing sample data there does nothing useful
 * and passing a function that is not a function throws.
 */
const SKIP = new Set(["className", "class", "style", "key", "ref", "asChild", "children"])

/** Strip comments so a `//` inside a doc block cannot be read as a prop. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
}

/**
 * Find the balanced `{ … }` body of a props type declaration.
 *
 * A regex with `[^}]*` — which is what a first attempt reaches for — stops at the first
 * nested closing brace, so `{ a: { b: string }, c: number }` loses `c`. Counting braces is
 * the only way to read a nested type correctly.
 */
/** Read the balanced `{ … }` starting at (or just before) `openBraceAt`. */
function balancedBody(src: string, openBraceAt: number): string | null {
  let depth = 0
  for (let i = openBraceAt; i < src.length; i++) {
    if (src[i] === "{") depth++
    else if (src[i] === "}") {
      depth--
      if (depth === 0) return src.slice(openBraceAt + 1, i)
    }
  }
  return null
}

function propsBody(src: string): string | null {
  // FORM 1 — a named declaration: `interface FooProps extends X { … }`.
  //
  // `extends VariantProps<typeof listingCardVariants>` sits between the name and the brace,
  // and a pattern that does not allow for it silently matches nothing — `nyuchi-listing-card`
  // and every other CVA-composed brand component extracted zero props, which reads
  // identically to "this component takes no props".
  const decl = /(?:type|interface)\s+\w*Props\w*\s*(?:extends\s+[^{]+?)?(?:=\s*)?\{/.exec(src)
  if (decl) return balancedBody(src, decl.index + decl[0].length - 1)

  // FORM 2 — declared INLINE on the component's own parameter, which is what most of this
  // registry actually does:
  //
  //   function AudioPlayer({ src, title, … }: React.ComponentProps<"div"> & {
  //     src: string
  //     title?: string
  //   }) {
  //
  // Only form 1 was handled, so 256 of 572 components extracted zero props — and a component
  // with no props resolves to no sample data, which is a preview rendering its "needs props"
  // fallback rather than the component doing its job. `alert`, `audio-player` and
  // `ai-response-card` all look propless from the outside for this reason alone.
  //
  // The search is for a destructured parameter annotated with an intersection that ENDS in an
  // object literal. `React.ComponentProps<"div">` on its own contributes nothing this can
  // resolve (it is every DOM attribute), so a signature with no literal half is correctly
  // skipped rather than guessed at.
  const inline = /\)?\s*}\s*:\s*[^{}()]*?&\s*\{/.exec(src)
  if (inline) return balancedBody(src, inline.index + inline[0].length - 1)

  // FORM 3 — a bare inline object literal with no intersection at all:
  //
  //   function CartItem({ name, price, … }: {
  //     name: string
  //     price: number
  //   }) {
  //
  // This is the most common shape in the registry after form 2, and it is the one a
  // pattern written for `X & { … }` cannot see, because there is no `&`. `cart-item`,
  // `agenda-view` and `changelog-entry` all declare every prop they have this way.
  //
  // Anchored on `}` + `:` + `{` so it matches a destructured PARAMETER annotation and not,
  // say, an object literal inside a function body.
  const bare = /}\s*:\s*\{/.exec(src)
  if (bare) return balancedBody(src, bare.index + bare[0].length - 1)

  return null
}

/**
 * Split a type body on top-level separators only, so nested objects stay intact.
 *
 * THE `=>` TRAP. Counting `<` and `>` as brackets looks obviously right — generics are
 * balanced — and it is wrong, because `=>` contains an unmatched `>`. One arrow function
 * prop drives the depth negative, every subsequent `depth === 0` test fails, and the rest of
 * the type collapses into a single member: `onChange` came out typed
 * `"(value: AddressValue) => void className?: string"`, swallowing `className` whole.
 *
 * The fix is to ignore a `>` that follows `=`. Angle brackets are still counted otherwise,
 * because `Record<string, PropInfo[]>` genuinely must not split on its inner comma.
 */
function topLevelMembers(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ""
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === "{" || ch === "(" || ch === "[" || ch === "<") depth++
    else if (ch === "}" || ch === ")" || ch === "]") depth--
    else if (ch === ">" && body[i - 1] !== "=") depth--

    if ((ch === ";" || ch === ",") && depth === 0) {
      out.push(current)
      current = ""
      continue
    }
    if (ch === "\n" && depth === 0 && current.trim()) {
      out.push(current)
      current = ""
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current)
  return out
}

function parseProps(src: string): PropInfo[] {
  const body = propsBody(stripComments(src))
  if (!body) return []
  const props: PropInfo[] = []
  for (const member of topLevelMembers(body)) {
    const m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(\?)?\s*:\s*([\s\S]+)$/.exec(member)
    if (!m) continue
    const [, name, optional, rawType] = m
    if (SKIP.has(name)) continue
    props.push({
      name,
      type: rawType.trim().replace(/\s+/g, " "),
      required: !optional,
    })
  }
  return props
}

function main() {
  const check = process.argv.slice(2).includes("--check")
  const byName: Record<string, PropInfo[]> = {}

  for (const dir of readdirSync(REGISTRY)) {
    const dirPath = join(REGISTRY, dir)
    if (!statSync(dirPath).isDirectory()) continue
    for (const file of readdirSync(dirPath)) {
      if (extname(file) !== ".tsx") continue
      const name = basename(file, ".tsx")
      const props = parseProps(readFileSync(join(dirPath, file), "utf8"))
      if (props.length > 0) byName[name] = props
    }
  }

  const sorted = Object.fromEntries(Object.entries(byName).sort(([a], [b]) => a.localeCompare(b)))
  const serialised =
    `// GENERATED by \`pnpm props:extract\` from components/registry/**/*.tsx.\n` +
    `// DO NOT EDIT BY HAND — \`pnpm props:verify\` fails the build on drift.\n` +
    `//\n` +
    `// What each component's props are called and what they are declared as, so the\n` +
    `// browser can resolve sample data for them (lib/samples/resolve.ts). Components with\n` +
    `// no readable props type are absent rather than empty — see scripts/extract-props.ts.\n\n` +
    `import type { PropInfo } from "./resolve"\n\n` +
    `export const COMPONENT_PROPS: Record<string, PropInfo[]> = ${JSON.stringify(sorted, null, 2)}\n`

  if (check) {
    const existing = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""
    if (existing !== serialised) {
      console.error("✖ lib/samples/props.generated.ts is stale. Run `pnpm props:extract`.")
      process.exit(1)
    }
    console.log(`✓ props.generated.ts matches source (${Object.keys(sorted).length} components).`)
    return
  }

  writeFileSync(OUT, serialised, "utf8")
  console.log(`✓ props.generated.ts written (${Object.keys(sorted).length} components with props)`)
}

main()
