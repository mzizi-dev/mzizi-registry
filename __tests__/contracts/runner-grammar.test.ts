/**
 * The class-token predicates of the contract grammar, in contracts/runner.ts:
 * `has "<token>"` (one whole whitespace-separated token) and `not <predicate>`
 * (the negation of any one predicate). `contains` stays a substring.
 * `mzizi-ui`'s `tests/contracts_json.rs` holds the Rust evaluator
 * (`mzizi-rs/contract-eval/`) to the same cases.
 */
import { describe, expect, test } from "vitest"

import { type Contract, evaluateClauses } from "../../contracts/runner"

/** Evaluate one clause against a root element carrying `class`. */
function clause(line: string, cls: string | null): string[] {
  const contract = { contract: `contract\n  ${line}\nend` } as Contract
  const attr = cls === null ? "" : ` class="${cls}"`
  return evaluateClauses(contract, { default: `<span data-slot="x"${attr}>x</span>` })
}

const holds = (line: string, cls: string | null) => expect(clause(line, cls), `${line} on "${cls}"`).toEqual([])
const fails = (line: string, cls: string | null) => expect(clause(line, cls), `${line} on "${cls}"`).toHaveLength(1)

describe("has: one whole class token", () => {
  test("the token itself", () => {
    holds('class has "text-malachite"', "bg-malachite/10 text-malachite uppercase")
  })

  test("a variant, an opacity or a longer token is not the token", () => {
    fails('class has "text-malachite"', "dark:text-malachite")
    fails('class has "text-malachite"', "text-malachite/50")
    fails('class has "bg-malachite/10"', "hover:bg-malachite/10")
    fails('class has "bg-malachite/10"', "bg-malachite/100")
  })

  test("where contains, a substring, still passes", () => {
    holds('class contains "text-malachite"', "dark:text-malachite")
    holds('class contains "bg-malachite/10"', "bg-malachite/100")
  })

  test("a token with whitespace in it cannot be evaluated, so it fails", () => {
    fails('class has "a b"', "a b")
  })
})

describe("not: the negation of one predicate", () => {
  test("not contains", () => {
    holds('class not contains "cobalt"', "bg-malachite/10 text-malachite")
    fails('class not contains "cobalt"', "bg-malachite/10 text-malachite dark:text-cobalt")
  })

  test("not has", () => {
    holds('class not has "line-through"', "text-malachite hover:line-through")
    fails('class not has "line-through"', "text-malachite line-through")
  })

  test("not is", () => {
    holds('slot not is "y"', "a")
    fails('slot not is "x"', "a")
  })

  test("not of an unevaluable predicate fails, never passes", () => {
    fails('class not frobs "x"', "a")
    fails('class not uses "primary"', "a")
    fails('class not has "a b"', "a")
    fails('class not not contains "a"', "a")
  })

  test("not on an attribute the root does not carry fails", () => {
    fails('class not contains "cobalt"', null)
  })
})
