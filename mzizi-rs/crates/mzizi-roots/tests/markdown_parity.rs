//! The Markdown parser of `mzizi_roots::components::markdown_renderer` against the shared fixture.
//!
//! The React and Astro builds share `markdown-parse.ts`; this build has its own parser. They are
//! held together by the same trees for every case in `__tests__/fixtures/markdown-renderer.cases.json`
//! (which the TypeScript suite runs too), and by no HTML string sink in any of the three files.
//! The class-string parity this file used to hold went with the classes (#708).

mod markdown {
    use std::fs;
    use std::path::PathBuf;

    use mzizi_roots::components::markdown_renderer::{
        Align, Block, Inline, List, ListChild, MarkdownLinks, MarkdownSource, markdown_blocks,
    };
    use serde_json::{Value, json};

    fn source(file: &str) -> String {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n2-primitives")
            .join(file);
        fs::read_to_string(&path).unwrap_or_else(|e| panic!("cannot read {path:?}: {e}"))
    }

    #[test]
    fn no_build_has_an_html_string_sink() {
        for file in [
            "markdown-renderer.rs",
            "markdown-renderer.tsx",
            "markdown-renderer.astro",
            "markdown-parse.ts",
        ] {
            let code: String = source(file)
                .lines()
                .filter(|l| {
                    let t = l.trim_start();
                    !(t.starts_with("//") || t.starts_with('*') || t.starts_with("/*"))
                })
                .collect::<Vec<_>>()
                .join("\n");
            for sink in [
                "dangerouslySetInnerHTML",
                "set:html",
                "dangerous_inner_html",
                "innerHTML",
                "outerHTML",
                "insertAdjacentHTML",
                "document.write",
            ] {
                assert!(
                    !code.contains(sink),
                    "{file} uses the HTML string sink `{sink}`"
                );
            }
        }
    }

    fn inlines(c: &[Inline]) -> Value {
        Value::Array(
            c.iter()
                .map(|x| match x {
                    Inline::Text(v) => json!({ "t": "text", "v": v }),
                    Inline::Code(v) => json!({ "t": "code", "v": v }),
                    Inline::Strong(c) => json!({ "t": "strong", "c": inlines(c) }),
                    Inline::Em(c) => json!({ "t": "em", "c": inlines(c) }),
                    Inline::Link {
                        href,
                        title,
                        children,
                    } => {
                        json!({ "t": "link", "href": href, "title": title, "c": inlines(children) })
                    }
                })
                .collect(),
        )
    }

    fn lines(ls: &[Vec<Inline>]) -> Value {
        Value::Array(ls.iter().map(|l| inlines(l)).collect())
    }

    fn list(l: &List) -> Value {
        let items: Vec<Value> = l
            .items
            .iter()
            .map(|it| {
                let children: Vec<Value> = it
                    .children
                    .iter()
                    .map(|c| match c {
                        ListChild::List(l) => list(l),
                        ListChild::Lines(ls) => json!({ "kind": "lines", "lines": lines(ls) }),
                    })
                    .collect();
                json!({ "lines": lines(&it.lines), "children": children })
            })
            .collect();
        if l.ordered {
            json!({ "kind": "ol", "start": l.start, "items": items })
        } else {
            json!({ "kind": "ul", "items": items })
        }
    }

    /// The tree in `markdown-parse.ts`'s JSON shape.
    fn blocks(bs: &[Block]) -> Value {
        Value::Array(
            bs.iter()
                .map(|b| match b {
                    Block::Paragraph(ls) => json!({ "kind": "p", "lines": lines(ls) }),
                    Block::Heading { level, children } => {
                        json!({ "kind": "h", "level": level, "c": inlines(children) })
                    }
                    Block::List(l) => list(l),
                    Block::Quote(children) => json!({ "kind": "quote", "children": blocks(children) }),
                    Block::Code { lang, text } => json!({ "kind": "code", "lang": lang, "v": text }),
                    Block::Rule => json!({ "kind": "hr" }),
                    Block::Table { align, head, rows } => json!({
                        "kind": "table",
                        "align": align.iter().map(|a| match a {
                            None => Value::Null,
                            Some(Align::Left) => json!("left"),
                            Some(Align::Center) => json!("center"),
                            Some(Align::Right) => json!("right"),
                        }).collect::<Vec<_>>(),
                        "head": head.iter().map(|c| inlines(c)).collect::<Vec<_>>(),
                        "rows": rows.iter().map(|r| r.iter().map(|c| inlines(c)).collect::<Vec<_>>()).collect::<Vec<_>>(),
                    }),
                })
                .collect(),
        )
    }

    #[test]
    fn the_parser_matches_the_typescript_case_for_case() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../__tests__/fixtures/markdown-renderer.cases.json");
        let fixture: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        let cases = fixture["cases"].as_array().unwrap();
        assert!(cases.len() >= 40, "the shared fixture has too few cases");
        for case in cases {
            let policy = match case["links"].as_str() {
                Some("https") => MarkdownLinks::Https,
                _ => MarkdownLinks::Safe,
            };
            let from = match case["from"].as_str() {
                Some("html") => MarkdownSource::Html,
                Some("auto") => MarkdownSource::Auto,
                _ => MarkdownSource::Markdown,
            };
            let got = blocks(&markdown_blocks(
                case["input"].as_str().unwrap(),
                policy,
                from,
            ));
            assert_eq!(
                got,
                case["expect"],
                "case `{}`",
                case["say"].as_str().unwrap()
            );
        }
    }
}
