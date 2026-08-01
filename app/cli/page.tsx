import type { Metadata } from "next"
import Link from "next/link"

import { CopyCommand } from "@/components/landing/copy-command"

// CLI INSTRUCTIONS — mzizi.dev/cli
//
// The public instruction surface for @nyuchi/mzizi-cli — the fundi agent.
// The package lives in nyuchi/mzizi-tools (`mzizi-cli/`); this page is its
// human-readable manual so consumers do not have to read the monorepo to get
// started.
//
// Deliberately no version number and no command inventory beyond what the
// package's own --help prints: hardcoding either here guarantees drift
// (CLAUDE.md §11). Link out for the live surface.

export const metadata: Metadata = {
  title: "CLI",
  description:
    "@nyuchi/mzizi-cli — the fundi agent. Explore a project, plan a change against the Mzizi registry, and apply it. Install, configure, and command reference.",
}

export default function CliPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 py-8">
      <header className="space-y-3">
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">CLI</p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          fundi — the Mzizi CLI
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          <code className="font-mono text-xs">@nyuchi/mzizi-cli</code> ships{" "}
          <strong className="font-semibold text-foreground">fundi</strong>: an agent that reads your
          project off disk, plans a change against the live registry, and applies it only when you
          tell it to. The SDK and the CLI are one package.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">Install</h2>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Per project, as a dev dependency:</p>
          <CopyCommand command="pnpm add -D @nyuchi/mzizi-cli" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Or run it without installing:</p>
          <CopyCommand command="npx @nyuchi/mzizi-cli --help" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Commands
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-mono text-sm font-medium text-foreground">fundi explore</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Reads a small set of disk markers —{" "}
              <code className="font-mono text-xs">package.json</code>,{" "}
              <code className="font-mono text-xs">tsconfig.json</code>,{" "}
              <code className="font-mono text-xs">app/globals.css</code>,{" "}
              <code className="font-mono text-xs">tailwind.config.*</code>,{" "}
              <code className="font-mono text-xs">components.json</code> — and prints a snapshot of
              what it found. Pure read, no model call, and{" "}
              <strong className="font-semibold text-foreground">no API key needed</strong>. Start
              here.
            </p>
            <CopyCommand command="npx fundi explore" />
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-sm font-medium text-foreground">
              fundi plan &lt;goal&gt;
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Plans the work against the live registry and returns the steps. The planner runs
              read-only — it can read files, list directories, and fetch skills and components, but
              writing and shelling out are blocked at this stage. A plan is inert until applied, so
              read it first.
            </p>
            <CopyCommand command='npx fundi plan "wire up Mzizi tokens and install the theme provider"' />
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-sm font-medium text-foreground">
              fundi chat &lt;message&gt;
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A single-turn question scoped to Mzizi doctrine — useful for &ldquo;which node does
              this belong to?&rdquo; without opening an editor.
            </p>
            <CopyCommand command='npx fundi chat "which node does a skeleton belong to?"' />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Configuration
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The SDK is env-agnostic; the CLI is the only layer that reads the environment.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-mono text-[11px] font-medium text-muted-foreground uppercase">
                  Variable
                </th>
                <th className="py-2 pr-4 font-mono text-[11px] font-medium text-muted-foreground uppercase">
                  Required
                </th>
                <th className="py-2 font-mono text-[11px] font-medium text-muted-foreground uppercase">
                  Use
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">ANTHROPIC_API_KEY</td>
                <td className="py-2 pr-4 text-xs">
                  for <code className="font-mono">plan</code> /{" "}
                  <code className="font-mono">chat</code>
                </td>
                <td className="py-2 text-xs">
                  Model access. <code className="font-mono">explore</code> runs without it.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">MZIZI_MCP_URL</td>
                <td className="py-2 pr-4 text-xs">no</td>
                <td className="py-2 text-xs">
                  Override the registry MCP. Defaults to the public endpoint.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">MZIZI_MODEL</td>
                <td className="py-2 pr-4 text-xs">no</td>
                <td className="py-2 text-xs">Override the model the agent loop uses.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          What it can and cannot touch
        </h2>
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="font-semibold text-foreground">
              Sandboxed to the project root.
            </strong>{" "}
            Every path is resolved inside the configured root; anything escaping it is rejected. The
            planner and the apply phase are both bound by this.
          </li>
          <li>
            <strong className="font-semibold text-foreground">Writes only on apply.</strong> File
            writes and shell commands are blocked during planning and unlock only when you apply a
            plan with dry-run off.
          </li>
          <li>
            <strong className="font-semibold text-foreground">No shell interpolation.</strong> Shell
            steps are argv-style, so there is no string a goal could smuggle a second command
            through.
          </li>
          <li>
            <strong className="font-semibold text-foreground">Holds no privileged secret.</strong>{" "}
            The CLI reaches gated services through the MCP, which mints tokens server-side. It never
            carries a machine credential.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Use it with the rest
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The CLI is one of three surfaces over the same registry. Pair it with the{" "}
          <Link className="underline hover:text-foreground" href="/skills">
            skills bundle
          </Link>{" "}
          so the agent has the doctrine, and the{" "}
          <Link className="underline hover:text-foreground" href="/tools">
            MCP server
          </Link>{" "}
          so it has live data. Source and issues live in{" "}
          <a
            className="underline hover:text-foreground"
            href="https://github.com/nyuchi/mzizi-tools/tree/main/mzizi-cli"
          >
            nyuchi/mzizi-tools
          </a>
          ; the published package is{" "}
          <a
            className="underline hover:text-foreground"
            href="https://www.npmjs.com/package/@nyuchi/mzizi-cli"
          >
            @nyuchi/mzizi-cli
          </a>
          .
        </p>
      </section>
    </article>
  )
}
