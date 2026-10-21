/**
 * The CSP rule's source scan (#444): a backstop for the rendered check in
 * `runner.ts`, which is the rule. It reads an implementation's source with a
 * real parser and reports each place that writes an inline `style` on an
 * element:
 *
 * - `.tsx`: the TypeScript compiler API (`typescript`, a dev dependency).
 * - `.astro`: `@astrojs/compiler-rs`, the parser the installed `astro` itself
 *   compiles with, resolved through `astro` so the registry declares nothing
 *   new. Its AST covers the template, the frontmatter and `<script>` bodies.
 *
 * Because it walks a syntax tree, comments (JSDoc, `{/* … *\/}`, `<!-- … -->`),
 * strings, JSX text, nested objects and component props are never mistaken
 * for a style. What it reports:
 *
 * - a valued `style` attribute on an intrinsic (lowercase) element, in any
 *   form: `style="…"`, `style={…}`, a template literal, Astro's `{style}`;
 * - a spread object literal with a top-level `style` key: `{...{ style }}`;
 * - `<style define:vars>`, which compiles to a style attribute;
 * - `createElement`, `cloneElement` and `jsx` (`jsxs`, `jsxDEV`, `_jsx`,
 *   `_jsxs`) calls whose props object literal has a top-level `style` key,
 *   unless the element is provably a component (`createElement(Icon, …)`,
 *   `cloneElement(<Icon />, …)`);
 * - `setAttribute("style", …)`.
 *
 * A props object spread onto an element (`{...attrs}`) cannot be read from
 * source; the rendered check catches it. A file the parser cannot read fails
 * the scan, so a syntax error never passes as "no inline style".
 *
 * There is no Rust scan: no Rust parser is available from TypeScript, and a
 * hand-written tokenizer kept missing forms. Every contract-declared `.rs` is
 * rendered in every state and held by `Case::check` in
 * `mzizi-rs/contract-eval/` instead, and `mzizi-ui`'s `contracts_json.rs`
 * fails when a declared `.rs` is missing or no crate's suite evaluates it.
 *
 * Not synced to @bundu/ui: only `runner.ts` is, so its runner copy needs no
 * parser dependency.
 */
import { createRequire } from "node:module";
import ts from "typescript";

/** The two kinds of source the scan reads. */
export type SourceKind = "astro" | "tsx";

/** The call names that make an element from a type and a props object. */
const ELEMENT_CALLS = new Set([
  "createElement",
  "jsx",
  "jsxs",
  "jsxDEV",
  "_jsx",
  "_jsxs",
]);

/** A tag or type name that React and Astro render as an element, not a component. */
const intrinsic = (name: string) => /^[a-z]/.test(name);

/** `line N: …` for a source offset, with that line's text. */
function report(source: string, offsets: number[], what: string): string[] {
  const lines = source.split("\n");
  const seen = new Set(
    offsets.map((at) => source.slice(0, at).split("\n").length),
  );
  return [...seen]
    .sort((a, b) => a - b)
    .map((n) => `line ${n}: ${what} (${(lines[n - 1] ?? "").trim()})`);
}

// ─── .tsx: the TypeScript compiler API ──────────────────────────────────────

/** Whether a TypeScript property name is `style` (`style`, `"style"`, `["style"]`). */
function tsIsStyleName(name: ts.PropertyName): boolean {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name))
    return name.text === "style";
  return (
    ts.isComputedPropertyName(name) &&
    ts.isStringLiteralLike(name.expression) &&
    name.expression.text === "style"
  );
}

/** An expression with its wrapping parentheses removed: `((x))` is `x`. */
function unparenthesized(expr: ts.Expression): ts.Expression {
  let e = expr;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  return e;
}

/** Whether an expression is an object literal with a top-level `style` key. */
function tsHasStyleKey(expr: ts.Expression | undefined): boolean {
  if (!expr) return false;
  const e = unparenthesized(expr);
  if (!ts.isObjectLiteralExpression(e)) return false;
  return e.properties.some(
    (p) =>
      (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) &&
      tsIsStyleName(p.name),
  );
}

/** Whether the first argument of an element call is provably a component, not an element. */
function tsIsComponent(arg: ts.Expression | undefined): boolean {
  if (!arg) return false;
  const e = unparenthesized(arg);
  if (ts.isStringLiteralLike(e)) return !intrinsic(e.text);
  if (ts.isIdentifier(e)) return !intrinsic(e.text);
  if (ts.isPropertyAccessExpression(e)) return true;
  if (ts.isJsxElement(e)) return !tsIntrinsicTag(e.openingElement.tagName);
  if (ts.isJsxSelfClosingElement(e)) return !tsIntrinsicTag(e.tagName);
  return false;
}

/** Whether a JSX tag name is an intrinsic element (`span`, `my-el`), not a component (`Icon`, `UI.Icon`). */
function tsIntrinsicTag(tag: ts.JsxTagNameExpression): boolean {
  return ts.isIdentifier(tag) && intrinsic(tag.text);
}

/** The name a call's callee ends in (`createElement`, `React.createElement`, `el.setAttribute`). */
function tsCalleeName(callee: ts.Expression): string | undefined {
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

function tsxOffsets(sf: ts.SourceFile): number[] {
  const out: number[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      tsIntrinsicTag(node.tagName)
    ) {
      for (const attr of node.attributes.properties) {
        if (
          ts.isJsxAttribute(attr) &&
          ts.isIdentifier(attr.name) &&
          attr.name.text === "style" &&
          attr.initializer
        )
          out.push(attr.getStart(sf));
        else if (
          ts.isJsxSpreadAttribute(attr) &&
          tsHasStyleKey(attr.expression)
        )
          out.push(attr.getStart(sf));
      }
    } else if (ts.isCallExpression(node)) {
      const name = tsCalleeName(node.expression);
      const [first, props] = node.arguments;
      if (
        name &&
        (ELEMENT_CALLS.has(name) || name === "cloneElement") &&
        tsHasStyleKey(props) &&
        !tsIsComponent(first)
      )
        out.push(node.getStart(sf));
      else if (
        name === "setAttribute" &&
        first &&
        ts.isStringLiteralLike(first) &&
        first.text === "style"
      )
        out.push(node.getStart(sf));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Syntax errors only (no type checking), through the public API. */
function tsxSyntaxErrors(source: string): string[] {
  const { diagnostics = [] } = ts.transpileModule(source, {
    fileName: "source.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.Latest,
    },
  });
  return diagnostics
    .filter((d) => d.category === ts.DiagnosticCategory.Error)
    .flatMap((d) =>
      report(
        source,
        [d.start ?? 0],
        `cannot parse: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`,
      ),
    );
}

// ─── .astro: @astrojs/compiler-rs ───────────────────────────────────────────

/** An ESTree / JSX node from compiler-rs (offsets are UTF-16 indexes into the source). */
interface AstNode {
  type: string;
  start: number;
  [key: string]: unknown;
}
interface AstroParse {
  parse(input: string): {
    ast: AstNode;
    diagnostics: {
      severity: string;
      text: string;
      labels: { start: number }[];
    }[];
  };
}

let astroCompiler: AstroParse | undefined;
/** compiler-rs, resolved from `astro`'s own dependencies (no new dependency here). */
function astro(): AstroParse {
  const fromHere = createRequire(import.meta.url);
  astroCompiler ??= createRequire(fromHere.resolve("astro/package.json"))(
    "@astrojs/compiler-rs",
  ) as AstroParse;
  return astroCompiler;
}

const isNode = (v: unknown): v is AstNode =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as { type?: unknown }).type === "string";

/** A JSX name as written: `span`, `define:vars`, `UI.Icon`. */
function jsxName(n: unknown): string {
  if (!isNode(n)) return "";
  if (n.type === "JSXIdentifier") return String(n.name);
  if (n.type === "JSXNamespacedName")
    return `${jsxName(n.namespace)}:${jsxName(n.name)}`;
  if (n.type === "JSXMemberExpression")
    return `${jsxName(n.object)}.${jsxName(n.property)}`;
  return "";
}

function estreeHasStyleKey(n: unknown): boolean {
  if (!isNode(n) || n.type !== "ObjectExpression") return false;
  return (n.properties as unknown[]).some((p) => {
    if (!isNode(p) || p.type !== "Property") return false;
    const key = p.key;
    if (!isNode(key)) return false;
    if (!p.computed && key.type === "Identifier") return key.name === "style";
    return key.type === "Literal" && key.value === "style";
  });
}

function estreeIsComponent(n: unknown): boolean {
  if (!isNode(n)) return false;
  if (n.type === "Literal")
    return typeof n.value === "string" && !intrinsic(n.value);
  if (n.type === "Identifier") return !intrinsic(String(n.name));
  if (n.type === "MemberExpression") return true;
  if (n.type === "JSXElement") {
    const name = jsxName((n.openingElement as AstNode).name);
    return !intrinsic(name) || name.includes(".");
  }
  return false;
}

function estreeCalleeName(callee: unknown): string | undefined {
  if (!isNode(callee)) return undefined;
  if (callee.type === "Identifier") return String(callee.name);
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    isNode(callee.property)
  )
    return String(callee.property.name);
  return undefined;
}

function astroOffsets(root: AstNode): number[] {
  const out: number[] = [];
  const visit = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const x of v) visit(x);
      return;
    }
    if (!isNode(v)) return;
    if (v.type === "JSXOpeningElement") {
      const tag = jsxName(v.name);
      if (intrinsic(tag) && !tag.includes(".")) {
        for (const attr of v.attributes as AstNode[]) {
          const name = attr.type === "JSXAttribute" ? jsxName(attr.name) : "";
          if (name === "style" && attr.value != null) out.push(attr.start);
          else if (tag === "style" && name === "define:vars")
            out.push(attr.start);
          else if (
            attr.type === "JSXSpreadAttribute" &&
            estreeHasStyleKey(attr.argument)
          )
            out.push(attr.start);
        }
      }
    } else if (v.type === "CallExpression") {
      const name = estreeCalleeName(v.callee);
      const [first, props] = v.arguments as unknown[];
      if (
        name &&
        (ELEMENT_CALLS.has(name) || name === "cloneElement") &&
        estreeHasStyleKey(props) &&
        !estreeIsComponent(first)
      )
        out.push(v.start);
      else if (
        name === "setAttribute" &&
        isNode(first) &&
        first.type === "Literal" &&
        first.value === "style"
      )
        out.push(v.start);
    }
    for (const [k, child] of Object.entries(v)) if (k !== "type") visit(child);
  };
  visit(root);
  return out;
}

// ─── The scan ───────────────────────────────────────────────────────────────

/**
 * `line N: an inline style (…)` for each line of an implementation's source
 * that writes one, or `line N: cannot parse: …` when the parser cannot read
 * it. Empty means the source writes no inline style the scan can see.
 */
export function inlineStylesInSource(
  source: string,
  kind: SourceKind,
): string[] {
  if (kind === "tsx") {
    const errors = tsxSyntaxErrors(source);
    if (errors.length) return errors;
    const sf = ts.createSourceFile(
      "source.tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    return report(source, tsxOffsets(sf), "an inline style");
  }
  const { ast, diagnostics } = astro().parse(source);
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length)
    return errors.flatMap((d) =>
      report(source, [d.labels[0]?.start ?? 0], `cannot parse: ${d.text}`),
    );
  return report(source, astroOffsets(ast), "an inline style");
}
