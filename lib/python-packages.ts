import packageForNode from "@/mzizi-py/package-for-node.json"

/**
 * Which PyPI package ships a Python registry component, and the module to import (#472).
 *
 * The Python mirror of `lib/rust-crates.ts`. The answer is read from
 * `mzizi-py/package-for-node.json`, the same map `pnpm py:generate`
 * (`scripts/generate-python-package.mjs`) uses to copy each `.py` file into the package, so
 * `/v1/py/{name}` on api.mzizi.dev and the package cannot disagree about where a component
 * lives.
 *
 * A node mapped to `null` has Python that is not packaged: a single-file module a consumer
 * copies, such as N1's `mzizi-tokens-python.py`. For those the answer is `null`.
 */

/** The source of every Mzizi Python package, installable at any commit with pip's git URL. */
export const PYTHON_GIT = "https://github.com/mzizi-dev/mzizi-registry"

/** The project directory inside {@link PYTHON_GIT} that holds the Python package. */
export const PYTHON_SUBDIRECTORY = "mzizi-py"

export interface PythonPackage {
  /** The PyPI distribution name, e.g. `mzizi-resilience`. */
  name: string
  /** The import package, e.g. `mzizi_resilience`. */
  importName: string
  /** The module that holds this component, e.g. `mzizi_resilience.circuit_breaker`. */
  module: string
  /** `pip install <name>`. */
  pip: string
  /** The PyPI project page. */
  pypi: string
  /** pip's install from git, for a commit not yet on PyPI. */
  git: string
}

/**
 * The package for a Python source path such as
 * `components/registry/n5-resilience/circuit-breaker.py`, or `null` when its node's Python is
 * not packaged (or the node is not in the map, which `pnpm py:generate` refuses).
 */
export function pythonPackageFor(pyPath: string): PythonPackage | null {
  const parts = pyPath.split("/")
  const node = parts.at(-2) ?? ""
  const file = parts.at(-1) ?? ""
  const name = (packageForNode as Record<string, string | null>)[node] ?? null
  if (name === null || !file.endsWith(".py")) return null
  const importName = name.replace(/-/g, "_")
  const module = `${importName}.${file.slice(0, -".py".length).replace(/-/g, "_")}`
  return {
    name,
    importName,
    module,
    pip: `pip install ${name}`,
    pypi: `https://pypi.org/project/${name}/`,
    git: `pip install "${name} @ git+${PYTHON_GIT}#subdirectory=${PYTHON_SUBDIRECTORY}"`,
  }
}
