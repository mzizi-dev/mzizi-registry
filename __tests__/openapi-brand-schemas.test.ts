// The OpenAPI brand schemas against the token objects the API serves.
//
// `openapi.yaml` is what api.mzizi.dev serves at `/openapi` (through the
// gateway's registry pin). Its `Mineral` schema still described five minerals
// with no text values while the palette carried `onContainer*`, `role`,
// `family` and `sortOrder`, and the `-text` tier landed with no field in the
// spec (#316). Nothing compared the two. This does: each colour schema's
// properties, and `EcosystemBrand`'s, must be exactly the keys `/v1/brand`
// serves for that family. Those are the token objects' own keys, plus the
// keys the API adds, minus the ones it does not project. A new token field
// fails here until the spec describes it, or this file says why the API leaves
// it out.
//
// The spec is read from `lib/openapi.generated.ts` (the bytes the gateway
// serves) with `readYaml()` below, a reader for the block-style subset
// `openapi.yaml` is written in. The repo has no YAML parser among its direct
// dependencies, and adding one changes the lockfile, so the reader lives here
// and the first tests hold it to the whole document.

import { describe, expect, it } from "vitest";
import { OPENAPI_YAML } from "@/lib/openapi.generated";
import {
  experimentalColors,
  heritageColors,
  minerals,
} from "@/lib/tokens/palette.generated";
import { ecosystem } from "@/lib/tokens/brand.source";

type Schema = {
  $ref?: string;
  allOf?: Schema[];
  properties?: Record<string, unknown>;
  required?: string[];
};

type Yaml = string | null | Yaml[] | { [key: string]: Yaml };

/**
 * Parse the block-style YAML subset `openapi.yaml` uses: mappings by
 * indentation, `- ` sequences (of scalars or mappings), flow sequences
 * (`[a, b]`, across lines), `{}`, quoted and plain scalars, `|` / `>` block
 * scalars, and full-line comments. Scalars stay strings. Anything else throws.
 */
function readYaml(text: string): Yaml {
  const lines = text.split("\n").map((raw) => ({
    indent: raw.length - raw.trimStart().length,
    text: raw.trim(),
  }));
  let i = 0;
  const skipBlank = () => {
    while (
      i < lines.length &&
      (lines[i]!.text === "" || lines[i]!.text.startsWith("#"))
    )
      i++;
  };
  const scalar = (v: string): string => {
    const q = /^(["'])(.*)\1$/.exec(v);
    if (q) return q[2]!;
    const hash = v.indexOf(" #");
    return (hash >= 0 ? v.slice(0, hash) : v).trim();
  };
  // A flow collection (`[a, "b"]`, `{type: [string, "null"]}`), possibly
  // across lines, read with a small recursive parser.
  const flow = (first: string): Yaml => {
    let buf = first;
    const balanced = (t: string) => {
      let depth = 0;
      let quote = "";
      for (const c of t) {
        if (quote) quote = c === quote ? "" : quote;
        else if (c === '"' || c === "'") quote = c;
        else if (c === "[" || c === "{") depth++;
        else if (c === "]" || c === "}") depth--;
      }
      return depth === 0;
    };
    while (!balanced(buf)) {
      i++;
      if (i >= lines.length)
        throw new Error("readYaml: unterminated flow collection");
      buf += " " + lines[i]!.text;
    }
    let at = 0;
    const ws = () => {
      while (buf[at] === " ") at++;
    };
    const item = (): Yaml => {
      ws();
      const c = buf[at];
      if (c === "[" || c === "{") {
        const close = c === "[" ? "]" : "}";
        const seq: Yaml[] = [];
        const map: { [key: string]: Yaml } = {};
        at++;
        ws();
        while (buf[at] !== close) {
          if (at >= buf.length)
            throw new Error("readYaml: bad flow collection");
          if (c === "[") seq.push(item());
          else {
            const key = item();
            ws();
            if (buf[at] !== ":") throw new Error("readYaml: bad flow mapping");
            at++;
            map[String(key)] = item();
          }
          ws();
          if (buf[at] === ",") at++;
          ws();
        }
        at++;
        return c === "[" ? seq : map;
      }
      if (c === '"' || c === "'") {
        const end = buf.indexOf(c, at + 1);
        const v = buf.slice(at + 1, end);
        at = end + 1;
        return v;
      }
      const start = at;
      while (
        at < buf.length &&
        !",]}".includes(buf[at]!) &&
        !(buf[at] === ":" && buf[at + 1] === " ")
      )
        at++;
      return buf.slice(start, at).trim();
    };
    const v = item();
    ws();
    if (at < buf.trimEnd().length)
      throw new Error(`readYaml: trailing text at line ${i + 1}`);
    return v;
  };
  // The value after `key:` (or `- `) on line i, whose owner sits at `indent`.
  const value = (rest: string, indent: number): Yaml => {
    if (rest === "") {
      i++;
      skipBlank();
      if (
        i < lines.length &&
        lines[i]!.indent > indent &&
        /^[[{]/.test(lines[i]!.text)
      ) {
        // A flow collection that starts on the next line (`required:` / `[`).
        const v = flow(lines[i]!.text);
        i++;
        return v;
      }
      if (i < lines.length && lines[i]!.indent > indent)
        return block(lines[i]!.indent);
      if (
        i < lines.length &&
        lines[i]!.indent === indent &&
        lines[i]!.text.startsWith("- ")
      )
        return block(indent);
      return null;
    }
    if (/^[|>][+-]?$/.test(rest)) {
      const out: string[] = [];
      i++;
      while (
        i < lines.length &&
        (lines[i]!.text === "" || lines[i]!.indent > indent)
      ) {
        out.push(lines[i]!.text);
        i++;
      }
      return out.join("\n").trim();
    }
    if (rest.startsWith("[") || rest.startsWith("{")) {
      const v = flow(rest);
      i++;
      return v;
    }
    i++;
    return scalar(rest);
  };
  const block = (indent: number): Yaml => {
    skipBlank();
    if (lines[i]!.text.startsWith("- ")) {
      const seq: Yaml[] = [];
      while (true) {
        skipBlank();
        const line = lines[i];
        if (!line || line.indent !== indent || !line.text.startsWith("- "))
          break;
        const item = line.text.slice(2);
        if (
          /^("[^"]*"|'[^']*'|[^\s"'#][^:]*?):(\s|$)/.test(item) &&
          !item.startsWith("[")
        ) {
          // `- key: value`: a mapping whose keys sit two columns in.
          lines[i] = { indent: indent + 2, text: item };
          seq.push(block(indent + 2));
        } else seq.push(value(item, indent));
      }
      return seq;
    }
    const map: { [key: string]: Yaml } = {};
    while (true) {
      skipBlank();
      const line = lines[i];
      if (!line || line.indent < indent) break;
      if (line.indent > indent)
        throw new Error(`readYaml: unexpected indent at line ${i + 1}`);
      if (line.text.startsWith("- ")) break;
      const m = /^("[^"]*"|'[^']*'|[^\s"'#][^:]*?):(?:\s+(.*))?$/.exec(
        line.text,
      );
      if (!m)
        throw new Error(`readYaml: not a key at line ${i + 1}: ${line.text}`);
      map[scalar(m[1]!)] = value((m[2] ?? "").trim(), indent);
    }
    return map;
  };
  skipBlank();
  const doc = block(0);
  skipBlank();
  if (i < lines.length) throw new Error(`readYaml: stopped at line ${i + 1}`);
  return doc;
}

const SPEC = readYaml(OPENAPI_YAML) as unknown as {
  openapi: string;
  paths: Record<string, unknown>;
  components: { schemas: Record<string, Schema> };
};
const SCHEMAS = SPEC.components.schemas;

/** A schema's property names, through `$ref` and `allOf`. */
function propertiesOf(schema: Schema): Set<string> {
  if (schema.$ref)
    return propertiesOf(
      SCHEMAS[schema.$ref.replace("#/components/schemas/", "")]!,
    );
  const own = Object.keys(schema.properties ?? {});
  return new Set([
    ...own,
    ...(schema.allOf ?? []).flatMap((s) => [...propertiesOf(s)]),
  ]);
}

/** Every key any row carries (optional keys appear on only some rows). */
const keysOf = (rows: readonly object[]) =>
  new Set(rows.flatMap((r) => Object.keys(r)));

/**
 * What `/v1/brand` serves per family: the token keys, plus the keys the API
 * adds, minus the keys it does not project (mzizi-api-gateway
 * `src/routes/content.ts`, mirrored by agent-tools' `brand.ts`).
 */
const SERVED = {
  Mineral: {
    rows: minerals,
    // `hex` is `mineralApiHex`; the `-text` pair is `textOnBaseTier()`.
    adds: ["hex", "textLight", "textDark"],
    omits: [],
  },
  HeritageColor: {
    rows: heritageColors,
    adds: ["hex", "textLight", "textDark"],
    // The API orders the heritage tones by the array and does not project it.
    omits: ["sortOrder"],
  },
  ExperimentalColor: {
    rows: experimentalColors,
    // `cssVar` is `--color-<name>`, built by the API.
    adds: ["hex", "textLight", "textDark", "cssVar"],
    // `heptagonIndex` is the position the API serves instead.
    omits: ["sortOrder"],
  },
  EcosystemBrand: {
    rows: ecosystem,
    adds: [],
    // Registry bookkeeping the API does not project.
    omits: ["adopterType", "sortOrder"],
  },
} as const;

function served(name: keyof typeof SERVED): string[] {
  const { rows, adds, omits } = SERVED[name];
  const keys = keysOf(rows);
  for (const k of adds) keys.add(k);
  for (const k of omits) keys.delete(k);
  return [...keys].sort();
}

describe("openapi.yaml brand schemas match what /v1/brand serves", () => {
  it("reads the whole served document", () => {
    expect(SPEC.openapi).toBe("3.1.0");
    expect(Object.keys(SPEC.paths)).toContain("/brand");
    // Every schema the document references was read, so a reader that
    // stopped early or nested a block wrongly fails here, not silently.
    const refs = new Set(
      [...OPENAPI_YAML.matchAll(/#\/components\/schemas\/(\w+)/g)].map(
        (m) => m[1]!,
      ),
    );
    for (const name of refs) expect(SCHEMAS[name], name).toBeDefined();
    expect(SCHEMAS.ExperimentalColor?.allOf?.[1]?.required).toContain(
      "heptagonIndex",
    );
  });

  for (const name of Object.keys(SERVED) as (keyof typeof SERVED)[]) {
    it(`${name} lists exactly the served keys`, () => {
      expect(SCHEMAS[name], `components.schemas.${name}`).toBeDefined();
      expect([...propertiesOf(SCHEMAS[name]!)].sort()).toEqual(served(name));
    });

    it(`${name}: every key it omits is really a token key`, () => {
      // An `omits` entry the tokens no longer carry is stale; drop it.
      const keys = keysOf(SERVED[name].rows);
      for (const k of SERVED[name].omits) expect(keys.has(k), k).toBe(true);
    });
  }

  it("BrandSystem lists and requires all three colour families", () => {
    const brand = SCHEMAS.BrandSystem!;
    const props = brand.properties as Record<string, { items?: Schema }>;
    expect(props.minerals?.items?.$ref).toBe("#/components/schemas/Mineral");
    expect(props.heritage?.items?.$ref).toBe(
      "#/components/schemas/HeritageColor",
    );
    expect(props.experimental?.items?.$ref).toBe(
      "#/components/schemas/ExperimentalColor",
    );
    expect(brand.required).toEqual(
      expect.arrayContaining(["minerals", "heritage", "experimental"]),
    );
  });

  it("hardcodes no family count", () => {
    // The spec's header rule: counts are never hardcoded, so it cannot drift.
    const props = SCHEMAS.BrandSystem!.properties as Record<
      string,
      Record<string, unknown>
    >;
    for (const f of ["minerals", "heritage", "experimental"]) {
      expect(props[f], f).not.toHaveProperty("minItems");
      expect(props[f], f).not.toHaveProperty("maxItems");
    }
  });
});
