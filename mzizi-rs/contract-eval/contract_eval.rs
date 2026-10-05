//! The RFC-0006 contract evaluator shared by the Mzizi Roots contract suites.
//!
//! Each crate's `tests/contract.rs` includes this file with
//! `#[path = "../../../contract-eval/contract_eval.rs"] mod contract_eval;`, renders its
//! components with `dioxus-ssr` in named states, and evaluates every `CONTRACT` clause against
//! the markup. A clause this evaluator cannot resolve FAILS (RFC-0006 FM-12). The subset it
//! evaluates is documented at the top of `crates/mzizi-brand/tests/contract.rs`.
//!
//! Test support only: it lives outside every crate's package root, and the suites that
//! include it are excluded from the published crates.

#![allow(dead_code)]

use dioxus::prelude::*;

// ─── A small HTML reader for server-rendered markup ─────────────────────────────────────────

/// A node of rendered markup.
#[derive(Debug, Clone)]
pub enum Node {
    Element {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<Node>,
    },
    Text(String),
}

impl Node {
    pub fn attr(&self, name: &str) -> Option<&str> {
        match self {
            Node::Element { attrs, .. } => attrs
                .iter()
                .find(|(k, _)| k == name)
                .map(|(_, v)| v.as_str()),
            Node::Text(_) => None,
        }
    }

    pub fn text(&self) -> String {
        match self {
            Node::Text(t) => t.clone(),
            Node::Element { children, .. } => children.iter().map(Node::text).collect(),
        }
    }

    /// Every element in this subtree, depth first, this one included.
    pub fn elements(&self) -> Vec<&Node> {
        let mut out = Vec::new();
        if let Node::Element { children, .. } = self {
            out.push(self);
            for child in children {
                out.extend(child.elements());
            }
        }
        out
    }

    /// Whether this element carries `text`: in its content, or as its accessible name — an
    /// icon-only button reading "✕" carries "Dismiss" through `aria-label`.
    pub fn carries(&self, text: &str) -> bool {
        self.text().contains(text) || self.attr("aria-label").is_some_and(|l| l.contains(text))
    }

    pub fn tag(&self) -> &str {
        match self {
            Node::Element { tag, .. } => tag,
            Node::Text(_) => "",
        }
    }
}

pub const VOID: &[&str] = &["img", "input", "br", "hr", "meta", "link"];

pub fn unescape(s: &str) -> String {
    s.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&#x27;", "'")
        .replace("&amp;", "&")
}

/// Parse `dioxus-ssr` output. It is well-formed by construction, so this does not need to
/// be a general HTML parser: tags, double-quoted attributes, the unquoted `name=true` form
/// boolean attributes take, text and comments.
pub fn parse(html: &str) -> Vec<Node> {
    pub fn parse_nodes(s: &str, i: &mut usize, until: Option<&str>) -> Vec<Node> {
        let bytes = s.as_bytes();
        let mut out = Vec::new();
        while *i < s.len() {
            if s[*i..].starts_with("<!--") {
                let end = s[*i..].find("-->").expect("unterminated comment") + *i + 3;
                *i = end;
            } else if s[*i..].starts_with("</") {
                let end = s[*i..].find('>').expect("unterminated close tag") + *i;
                let tag = &s[*i + 2..end];
                assert_eq!(Some(tag), until, "mismatched close tag in {s}");
                *i = end + 1;
                return out;
            } else if bytes[*i] == b'<' {
                *i += 1;
                let start = *i;
                while *i < s.len() && !matches!(bytes[*i], b' ' | b'>' | b'/') {
                    *i += 1;
                }
                let tag = s[start..*i].to_owned();
                let mut attrs = Vec::new();
                loop {
                    while bytes[*i] == b' ' {
                        *i += 1;
                    }
                    if s[*i..].starts_with("/>") {
                        *i += 2;
                        out.push(Node::Element {
                            tag,
                            attrs,
                            children: Vec::new(),
                        });
                        break;
                    }
                    if bytes[*i] == b'>' {
                        *i += 1;
                        let children = if VOID.contains(&tag.as_str()) {
                            Vec::new()
                        } else {
                            parse_nodes(s, i, Some(&tag))
                        };
                        out.push(Node::Element {
                            tag,
                            attrs,
                            children,
                        });
                        break;
                    }
                    let name_start = *i;
                    while !matches!(bytes[*i], b'=' | b' ' | b'>' | b'/') {
                        *i += 1;
                    }
                    let name = s[name_start..*i].to_owned();
                    let value = if bytes[*i] == b'=' && bytes[*i + 1] == b'"' {
                        *i += 2; // `="`
                        let end = s[*i..].find('"').expect("unterminated attribute") + *i;
                        let v = unescape(&s[*i..end]);
                        *i = end + 1;
                        v
                    } else if bytes[*i] == b'=' {
                        // Boolean attributes come out unquoted: `disabled=true`.
                        *i += 1;
                        let start = *i;
                        while !matches!(bytes[*i], b' ' | b'>') {
                            *i += 1;
                        }
                        s[start..*i].to_owned()
                    } else {
                        String::new()
                    };
                    attrs.push((name, value));
                }
            } else {
                let end = s[*i..].find('<').map_or(s.len(), |n| n + *i);
                out.push(Node::Text(unescape(&s[*i..end])));
                *i = end;
            }
        }
        assert!(until.is_none(), "unclosed <{until:?}> in {s}");
        out
    }
    let mut i = 0;
    parse_nodes(html, &mut i, None)
}

/// Render a component and return its root element.
///
/// Takes a function rather than an `Element` because props holding an [`EventHandler`] can
/// only be built inside a Dioxus runtime, which the `VirtualDom` provides while it runs `app`.
pub fn render(app: fn() -> Element) -> Node {
    let mut dom = VirtualDom::new(app);
    dom.rebuild_in_place();
    let html = dioxus_ssr::render(&dom);
    parse(&html)
        .into_iter()
        .find(|n| matches!(n, Node::Element { .. }))
        .unwrap_or_else(|| panic!("rendered no element: {html}"))
}

/// The largest height, in px, an element's classes declare: `h-N`, `min-h-N`, `size-N` on the
/// 4px Tailwind scale, or their `[Npx]` arbitrary forms.
pub fn declared_height(classes: &str) -> Option<u32> {
    classes
        .split_whitespace()
        .filter_map(|c| {
            let v = c
                .strip_prefix("min-h-")
                .or_else(|| c.strip_prefix("h-"))
                .or_else(|| c.strip_prefix("size-"))?;
            if let Some(px) = v.strip_prefix('[').and_then(|v| v.strip_suffix("px]")) {
                px.parse().ok()
            } else {
                v.parse::<u32>().ok().map(|n| n * 4)
            }
        })
        .max()
}

// ─── The clause evaluator ───────────────────────────────────────────────────────────────────

/// A variant table's rows: (variant, value).
pub type Rows = Vec<(&'static str, String)>;

/// One component under contract.
pub struct Case {
    /// Registry name — `/v1/rs/{name}`.
    pub name: &'static str,
    pub contract: &'static str,
    /// Named render states. `default` is required.
    pub states: Vec<(&'static str, Node)>,
    /// Prop defaults a `<name>` subject can resolve to.
    pub defaults: Vec<(&'static str, String)>,
    /// Variant tables: (enum, column, [(variant, value)]).
    pub columns: Vec<(&'static str, &'static str, Rows)>,
}

pub fn tokens(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut chars = line.chars().peekable();
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() {
            chars.next();
        } else if c == '"' {
            chars.next();
            let mut s = String::from("\"");
            for c in chars.by_ref() {
                if c == '"' {
                    break;
                }
                s.push(c);
            }
            s.push('"');
            out.push(s);
        } else {
            let mut s = String::new();
            while let Some(&c) = chars.peek() {
                if c.is_whitespace() {
                    break;
                }
                s.push(c);
                chars.next();
            }
            out.push(s);
        }
    }
    out
}

pub fn unquote(t: &str) -> &str {
    t.strip_prefix('"')
        .and_then(|t| t.strip_suffix('"'))
        .unwrap_or(t)
}

/// The clauses inside `contract … end`.
pub fn clauses(contract: &str) -> Vec<&str> {
    let lines: Vec<&str> = contract.lines().map(str::trim).collect();
    assert_eq!(
        lines.first(),
        Some(&"contract"),
        "a contract opens with `contract`"
    );
    assert_eq!(lines.last(), Some(&"end"), "a contract closes with `end`");
    lines[1..lines.len() - 1]
        .iter()
        .copied()
        .filter(|l| !l.is_empty())
        .collect()
}

/// Evaluate a value predicate. `Err` is a clause this evaluator cannot apply.
pub fn holds(value: &str, pred: &[String]) -> Result<bool, String> {
    match pred.first().map(String::as_str) {
        Some("is") if pred.len() == 2 => Ok(value == unquote(&pred[1])),
        Some("contains") if pred.len() == 2 => Ok(value.contains(unquote(&pred[1]))),
        Some("not_empty") if pred.len() == 1 => Ok(!value.trim().is_empty()),
        Some("at_least") if pred.len() == 2 => {
            let n: f64 = pred[1].parse().map_err(|_| "at_least needs a number")?;
            let v: f64 = value
                .parse()
                .map_err(|_| format!("`{value}` is not a number"))?;
            Ok(v >= n)
        }
        Some("in") if pred.len() >= 2 => Ok(pred[1..].iter().any(|p| value == unquote(p))),
        Some("uses") if pred.len() == 2 && pred[1].starts_with("\"--") => {
            Ok(value.contains(&format!("var({}", unquote(&pred[1]))))
        }
        _ => Err(format!("unknown predicate {pred:?}")),
    }
}

pub fn root_attr(name: &str) -> Option<&'static str> {
    match name {
        "slot" => Some("data-slot"),
        "portal" => Some("data-portal"),
        "role" => Some("role"),
        "label" => Some("aria-label"),
        "class" => Some("class"),
        _ => None,
    }
}

impl Case {
    pub fn state(&self, name: &str) -> Result<&Node, String> {
        self.states
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, node)| node)
            .ok_or_else(|| format!("no `{name}` state is rendered for {}", self.name))
    }

    pub fn column(&self, enm: &str, col: &str) -> Result<&Rows, String> {
        self.columns
            .iter()
            .find(|(e, c, _)| *e == enm && *c == col)
            .map(|(_, _, v)| v)
            .ok_or_else(|| format!("no `{enm} {col}` table"))
    }

    pub fn evaluate(&self, clause: &str) -> Result<bool, String> {
        let t = tokens(clause);
        let first = t.first().ok_or("empty clause")?.as_str();

        // `when <state> shows <element> "<text>"`
        if first == "when" {
            if t.len() != 5 || t[2] != "shows" {
                return Err("only `when <state> shows <element> \"<text>\"` is evaluated".into());
            }
            let root = self.state(&t[1])?;
            let text = unquote(&t[4]);
            return Ok(root
                .elements()
                .iter()
                .any(|e| e.tag() == t[3] && e.carries(text)));
        }

        // `every <enum> <column> <predicate…>`
        if first == "every" {
            let rows = self.column(&t[1], &t[2])?;
            if rows.is_empty() {
                return Err(format!("`{} {}` has no rows", t[1], t[2]));
            }
            for (_, value) in rows {
                if !holds(value, &t[3..])? {
                    return Ok(false);
                }
            }
            return Ok(true);
        }

        // `<element> "<text>" min_height <n>`
        if t.len() == 4 && t[1].starts_with('"') && t[2] == "min_height" {
            let n: u32 = t[3].parse().map_err(|_| "min_height needs a number")?;
            let text = unquote(&t[1]);
            let mut found = false;
            for (_, root) in &self.states {
                for e in root.elements() {
                    let own = e.tag() == first && e.carries(text);
                    if own {
                        found = true;
                        let h = declared_height(e.attr("class").unwrap_or(""));
                        if h.is_none_or(|h| h < n) {
                            return Ok(false);
                        }
                    }
                }
            }
            return if found {
                Ok(true)
            } else {
                Err(format!("no <{first}> reading \"{text}\" is rendered"))
            };
        }

        // `<enum>.<variant> <column> <predicate…>` or `<variant>.<column> <predicate…>`
        if let Some((a, b)) = first.split_once('.') {
            let explicit = self.columns.iter().any(|(e, _, _)| *e == a) && t.len() >= 3;
            let (value, pred) = if explicit {
                let rows = self.column(a, &t[1])?;
                let v = rows
                    .iter()
                    .find(|(v, _)| *v == b)
                    .ok_or_else(|| format!("`{a}` has no variant `{b}`"))?;
                (v.1.clone(), &t[2..])
            } else {
                let mut hits = self
                    .columns
                    .iter()
                    .filter(|(_, c, _)| *c == b)
                    .filter_map(|(_, _, rows)| rows.iter().find(|(v, _)| *v == a));
                let hit = hits
                    .next()
                    .ok_or_else(|| format!("no enum has a variant `{a}` with a `{b}` column"))?;
                if hits.next().is_some() {
                    return Err(format!("`{a}.{b}` is ambiguous across enums"));
                }
                (hit.1.clone(), &t[1..])
            };
            return holds(&value, pred);
        }

        // `<name> <predicate…>` — a root attribute, else a prop default.
        if let Some(attr) = root_attr(first) {
            let root = self.state("default")?;
            let value = root
                .attr(attr)
                .ok_or_else(|| format!("the root has no `{attr}`"))?;
            return holds(value, &t[1..]);
        }
        if let Some((_, value)) = self.defaults.iter().find(|(n, _)| *n == first) {
            return holds(value, &t[1..]);
        }
        Err(format!(
            "`{first}` names no root attribute and no prop default"
        ))
    }

    pub fn check(&self) {
        let slot = self
            .state("default")
            .unwrap()
            .attr("data-slot")
            .map(str::to_owned);
        for (state, root) in &self.states {
            assert_eq!(
                root.attr("data-slot").map(str::to_owned),
                slot,
                "{}: the `{state}` state renders a different data-slot",
                self.name
            );
        }
        let list = clauses(self.contract);
        assert!(!list.is_empty(), "{}: an empty contract", self.name);
        for clause in list {
            match self.evaluate(clause) {
                Ok(true) => {}
                Ok(false) => panic!("{}: contract clause fails: `{clause}`", self.name),
                Err(why) => panic!(
                    "{}: contract clause cannot be evaluated, which is a failure, not a pass \
                     (RFC-0006 FM-12): `{clause}` — {why}",
                    self.name
                ),
            }
        }
    }
}

pub fn rows<T: Copy>(
    all: &[T],
    slug: fn(T) -> &'static str,
    value: fn(T) -> String,
) -> Vec<(&'static str, String)> {
    all.iter().map(|&v| (slug(v), value(v))).collect()
}
