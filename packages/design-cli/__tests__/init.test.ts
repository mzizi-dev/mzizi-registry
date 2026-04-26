import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runInit } from "../src/commands/init.js"

describe("runInit", () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), "nyuchi-design-cli-init-"))
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it("writes the four bootstrap files into a fresh project", async () => {
    const { written, skipped } = await runInit({ cwd })

    expect(written).toEqual([
      "app/globals.css",
      "lib/utils.ts",
      "components/theme-provider.tsx",
      "components.json",
    ])
    expect(skipped).toEqual([])

    for (const path of written) {
      expect(existsSync(join(cwd, path))).toBe(true)
    }
  })

  it("skips files that already exist (idempotent without --force)", async () => {
    await runInit({ cwd })
    const { written, skipped } = await runInit({ cwd })

    expect(written).toEqual([])
    expect(skipped.length).toBe(4)
  })

  it("globals.css template carries the L1 token block", async () => {
    await runInit({ cwd })
    const css = readFileSync(join(cwd, "app/globals.css"), "utf-8")

    expect(css).toContain(":root")
    expect(css).toContain(".dark")
    expect(css).toContain("@theme")
    // Mineral palette tokens must be present
    expect(css).toContain("--color-cobalt")
    expect(css).toContain("--color-tanzanite")
    expect(css).toContain("--color-malachite")
    expect(css).toContain("--color-gold")
    expect(css).toContain("--color-terracotta")
  })

  it("utils.ts template exports cn() helper", async () => {
    await runInit({ cwd })
    const utils = readFileSync(join(cwd, "lib/utils.ts"), "utf-8")

    expect(utils).toContain("export function cn(")
    expect(utils).toContain("clsx")
    expect(utils).toContain("twMerge")
  })

  it("components.json template uses the new-york style + neutral base", async () => {
    await runInit({ cwd })
    const config = JSON.parse(readFileSync(join(cwd, "components.json"), "utf-8"))

    expect(config.style).toBe("new-york")
    expect(config.tailwind?.baseColor).toBe("neutral")
    expect(config.aliases?.utils).toBe("@/lib/utils")
  })
})
