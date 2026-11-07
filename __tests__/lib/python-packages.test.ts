/**
 * lib/python-packages.ts: the PyPI package and module `/v1/py/{name}` names (#472).
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "vitest"

import packageForNode from "@/mzizi-py/package-for-node.json"
import { PYTHON_GIT, pythonPackageFor } from "@/lib/python-packages"

const ROOT = path.resolve(__dirname, "../..")
const REGISTRY = path.join(ROOT, "components/registry")
const PROJECT_NAME = /^name\s*=\s*"([^"]+)"/m.exec(
  readFileSync(path.join(ROOT, "mzizi-py/pyproject.toml"), "utf8")
)?.[1]

describe("pythonPackageFor", () => {
  test("names the package, import and module of a packaged component", () => {
    expect(pythonPackageFor("components/registry/n5-resilience/circuit-breaker.py")).toEqual({
      name: "mzizi-resilience",
      importName: "mzizi_resilience",
      module: "mzizi_resilience.circuit_breaker",
      pip: "pip install mzizi-resilience",
      pypi: "https://pypi.org/project/mzizi-resilience/",
      git: `pip install "mzizi-resilience @ git+${PYTHON_GIT}#subdirectory=mzizi-py"`,
    })
  })

  test("N8's Python ships in the same package", () => {
    expect(pythonPackageFor("components/registry/n8-assurance/chaos.py")?.module).toBe(
      "mzizi_resilience.chaos"
    )
  })

  test("unpackaged Python (N1's token module) and unknown nodes answer null", () => {
    expect(pythonPackageFor("components/registry/n1-tokens/mzizi-tokens-python.py")).toBeNull()
    expect(pythonPackageFor("components/registry/n6-pages/whatever.py")).toBeNull()
    expect(pythonPackageFor("components/registry/n5-resilience/retry.ts")).toBeNull()
  })

  test("the map names only the project mzizi-py/ builds", () => {
    for (const pkg of Object.values(packageForNode as Record<string, string | null>)) {
      if (pkg !== null) expect(pkg).toBe(PROJECT_NAME)
    }
  })

  test("every node with Python is in the map", () => {
    const nodes = readdirSync(REGISTRY).filter(
      (d) => /^n\d+-/.test(d) && readdirSync(path.join(REGISTRY, d)).some((f) => f.endsWith(".py"))
    )
    for (const node of nodes) expect(Object.keys(packageForNode)).toContain(node)
  })
})
