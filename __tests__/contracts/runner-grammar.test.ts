/**
 * The value predicates of the contract grammar, in contracts/runner.ts:
 * `is`, `contains` (a substring), `has "<token>"` (one whole
 * whitespace-separated token), `not_empty`, `in`, `uses "--token"`, and
 * `not <predicate>`, the negation of any one of them.
 *
 * Every row of `fixtures/predicates.json`, malformed operands included, gets
 * the same verdict here as `holds` in mzizi-rs/contract-eval/contract_eval.rs
 * gives it in mzizi-ui's `tests/contracts_json.rs`. "Unevaluable" is a verdict
 * of its own, and `not` never turns it into a pass.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

import { type Contract, evaluateClauses, evaluatePredicate, type Verdict } from "../../contracts/runner"

interface Case {
  pred: string
  value: string
  verdict: boolean | "unevaluable"
}

const { cases } = JSON.parse(readFileSync(join(__dirname, "fixtures/predicates.json"), "utf8")) as {
  cases: Case[]
}

const verdictOf = (v: Verdict): Case["verdict"] => ("ok" in v ? v.ok : "unevaluable")

describe("every predicate case gets the verdict both runners agree on", () => {
  test("the table covers holds, fails and unevaluable, with and without not", () => {
    for (const want of [true, false, "unevaluable"] as const) {
      expect(cases.some((c) => c.verdict === want && c.pred.startsWith("not "))).toBe(true)
      expect(cases.some((c) => c.verdict === want && !c.pred.startsWith("not "))).toBe(true)
    }
  })

  test.each(cases)("$pred on $value → $verdict", ({ pred, value, verdict }) => {
    expect(verdictOf(evaluatePredicate(value, pred))).toBe(verdict)
  })

  test("not of an unevaluable predicate stays unevaluable", () => {
    for (const c of cases.filter((c) => c.verdict === "unevaluable" && !c.pred.startsWith("not "))) {
      if (c.pred === "") continue
      expect(verdictOf(evaluatePredicate(c.value, `not ${c.pred}`)), `not ${c.pred}`).toBe("unevaluable")
    }
  })
})

/** Evaluate one clause against a root element carrying `class`. */
function clause(line: string, cls: string | null): string[] {
  const contract = { contract: `contract\n  ${line}\nend` } as Contract
  const attr = cls === null ? "" : ` class="${cls}"`
  return evaluateClauses(contract, {
    default: `<span data-slot="x"${attr}>x</span>`,
  })
}

const holds = (line: string, cls: string | null) => expect(clause(line, cls), `${line} on "${cls}"`).toEqual([])
const fails = (line: string, cls: string | null) => expect(clause(line, cls), `${line} on "${cls}"`).toHaveLength(1)

describe("a value predicate in a clause", () => {
  test("holds or fails on the root attribute", () => {
    holds('class has "uppercase"', "rounded-full uppercase")
    fails('class has "uppercase"', "hover:uppercase")
    holds('class not has "line-through"', "hover:line-through")
    fails('class not contains "line-through"', "hover:line-through")
  })

  test("an unevaluable predicate fails the clause, with or without not", () => {
    fails("class not in foo", "a")
    fails("class in", "a")
    fails('class not is "a" "b"', "c")
    fails("class not is a", "c")
  })

  test("an attribute the root does not carry fails the clause, with or without not", () => {
    fails('class not contains "line-through"', null)
    fails('class in ""', null)
    fails('class not is "x"', null)
  })
})
