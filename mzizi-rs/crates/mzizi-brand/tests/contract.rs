//! Contract tests — the first Mzizi Roots batch, against its own contracts and its
//! TypeScript siblings.
//!
//! Two questions, answered separately.
//!
//! 1. **Does each component keep its own contract?** Every module exports `CONTRACT`, a
//!    `contract … end` block in the Mzizi language's clause grammar (mzizi-dev/mzizi
//!    `design/RFC-0006-contracts.md`). This file renders the component with `dioxus-ssr`
//!    in named states and evaluates every clause against the markup it actually emits.
//!    A clause this evaluator cannot resolve FAILS — RFC-0006's FM-12, "the silently
//!    inapplicable assertion": an unevaluable contract that passes reads as proof.
//! 2. **Is it the same component as its `.tsx`?** The TypeScript is the incumbent and the
//!    reference, as in `mzizi-ui` and `mzizi-shell`: the slot, the portal and the variant
//!    values the Rust emits must appear in the sibling, and every deliberate divergence is
//!    asserted from both sides so it is removed when the `.tsx` is fixed.
//!
//! # The subset of RFC-0006 evaluated here
//!
//! Subjects: `<name>` (a root attribute — `slot`, `portal`, `role`, `label`, `class` — else a
//! prop default), `every <enum> <column>`, `<enum>.<variant> <column>`, `<variant>.<column>`,
//! `<element> "<text>"`, and `when <state>`. Predicates: `is`, `contains`, `not_empty`,
//! `at_least`, `in`, `uses "--token"`, `min_height` and `shows`. An element "carries" a text in
//! its content or as its `aria-label`, so an icon-only control is named by what it announces.
//! Unguarded clauses are
//! evaluated in the `default` state; `when <state>` clauses in that state; an
//! `<element> "<text>"` subject in every state where that element appears, and it must
//! appear in at least one.

use std::fs;
use std::path::PathBuf;

use dioxus::prelude::*;
use mzizi_brand::*;

// ─── A small HTML reader for server-rendered markup ─────────────────────────────────────────

/// A node of rendered markup.
#[derive(Debug, Clone)]
enum Node {
    Element {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<Node>,
    },
    Text(String),
}

impl Node {
    fn attr(&self, name: &str) -> Option<&str> {
        match self {
            Node::Element { attrs, .. } => attrs
                .iter()
                .find(|(k, _)| k == name)
                .map(|(_, v)| v.as_str()),
            Node::Text(_) => None,
        }
    }

    fn text(&self) -> String {
        match self {
            Node::Text(t) => t.clone(),
            Node::Element { children, .. } => children.iter().map(Node::text).collect(),
        }
    }

    /// Every element in this subtree, depth first, this one included.
    fn elements(&self) -> Vec<&Node> {
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
    fn carries(&self, text: &str) -> bool {
        self.text().contains(text) || self.attr("aria-label").is_some_and(|l| l.contains(text))
    }

    fn tag(&self) -> &str {
        match self {
            Node::Element { tag, .. } => tag,
            Node::Text(_) => "",
        }
    }
}

const VOID: &[&str] = &["img", "input", "br", "hr", "meta", "link"];

fn unescape(s: &str) -> String {
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
fn parse(html: &str) -> Vec<Node> {
    fn parse_nodes(s: &str, i: &mut usize, until: Option<&str>) -> Vec<Node> {
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
fn render(app: fn() -> Element) -> Node {
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
fn declared_height(classes: &str) -> Option<u32> {
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
type Rows = Vec<(&'static str, String)>;

/// One component under contract.
struct Case {
    /// Registry name — `/v1/rs/{name}`.
    name: &'static str,
    contract: &'static str,
    /// Named render states. `default` is required.
    states: Vec<(&'static str, Node)>,
    /// Prop defaults a `<name>` subject can resolve to.
    defaults: Vec<(&'static str, String)>,
    /// Variant tables: (enum, column, [(variant, value)]).
    columns: Vec<(&'static str, &'static str, Rows)>,
}

fn tokens(line: &str) -> Vec<String> {
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

fn unquote(t: &str) -> &str {
    t.strip_prefix('"')
        .and_then(|t| t.strip_suffix('"'))
        .unwrap_or(t)
}

/// The clauses inside `contract … end`.
fn clauses(contract: &str) -> Vec<&str> {
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
fn holds(value: &str, pred: &[String]) -> Result<bool, String> {
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

fn root_attr(name: &str) -> Option<&'static str> {
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
    fn state(&self, name: &str) -> Result<&Node, String> {
        self.states
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, node)| node)
            .ok_or_else(|| format!("no `{name}` state is rendered for {}", self.name))
    }

    fn column(&self, enm: &str, col: &str) -> Result<&Rows, String> {
        self.columns
            .iter()
            .find(|(e, c, _)| *e == enm && *c == col)
            .map(|(_, _, v)| v)
            .ok_or_else(|| format!("no `{enm} {col}` table"))
    }

    fn evaluate(&self, clause: &str) -> Result<bool, String> {
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

    fn check(&self) {
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

fn rows<T: Copy>(
    all: &[T],
    slug: fn(T) -> &'static str,
    value: fn(T) -> String,
) -> Vec<(&'static str, String)> {
    all.iter().map(|&v| (slug(v), value(v))).collect()
}

/// Read a registry component's TypeScript source.
fn tsx(name: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n3-brand")
        .join(format!("{name}.tsx"));
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

// ─── The cases ──────────────────────────────────────────────────────────────────────────────

fn noop() -> EventHandler<()> {
    EventHandler::new(|()| {})
}

fn meta_tile() -> Case {
    Case {
        name: "mzizi-meta-tile",
        contract: mzizi_meta_tile::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziMetaTile { primary: "Harare Gardens", secondary: "Open until 18:00".to_string(), icon: rsx! { span { "•" } } } },
                ),
            ),
            (
                "date",
                render(
                    || rsx! { MziziMetaTile { primary: "Saturday", date: MetaDate { month: "September".into(), day: "27".into() } } },
                ),
            ),
        ],
        defaults: vec![("tint", mzizi_meta_tile::DEFAULT_TINT.to_owned())],
        columns: vec![],
    }
}

fn people(n: usize) -> Vec<AvatarPerson> {
    (0..n)
        .map(|i| AvatarPerson {
            name: format!("Person {i}"),
            src: None,
        })
        .collect()
}

fn avatar_stack() -> Case {
    Case {
        name: "mzizi-avatar-stack",
        contract: mzizi_avatar_stack::CONTRACT,
        states: vec![
            (
                "default",
                render(|| rsx! { MziziAvatarStack { people: people(6) } }),
            ),
            (
                "unlabelled",
                render(|| rsx! { MziziAvatarStack { people: people(2), label: None } }),
            ),
        ],
        defaults: vec![("max", "4".to_owned())],
        columns: vec![(
            "avatar_stack_size",
            "class",
            rows(
                &AvatarStackSize::ALL,
                AvatarStackSize::slug,
                AvatarStackSize::bubble_classes,
            ),
        )],
    }
}

fn alert_banner() -> Case {
    Case {
        name: "mzizi-alert-banner",
        contract: mzizi_alert_banner::CONTRACT,
        states: vec![(
            "default",
            render(|| {
                rsx! {
                    MziziAlertBanner {
                        r#type: "Thunderstorm",
                        severity: AlertSeverity::Severe,
                        headline: "Severe storms this afternoon",
                        areas: vec!["Harare".into(), "Chitungwiza".into()],
                        on_dismiss: noop(),
                        on_details: noop(),
                    }
                }
            }),
        )],
        defaults: vec![],
        columns: vec![
            (
                "alert_severity",
                "label",
                rows(&AlertSeverity::ALL, AlertSeverity::slug, |s| {
                    s.label().to_owned()
                }),
            ),
            (
                "alert_severity",
                "mineral",
                rows(&AlertSeverity::ALL, AlertSeverity::slug, |s| {
                    s.mineral().to_owned()
                }),
            ),
        ],
    }
}

fn hero_stat() -> Case {
    Case {
        name: "mzizi-hero-stat",
        contract: mzizi_hero_stat::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziHeroStat { title: "Harare now", value: "24", unit: "°C".to_string(), on_share: noop() } },
                ),
            ),
            (
                "loading",
                render(|| rsx! { MziziHeroStat { title: "Harare now", value: "", loading: true } }),
            ),
        ],
        defaults: vec![],
        columns: vec![],
    }
}

fn empty_action(label: &str) -> EmptyStateAction {
    EmptyStateAction {
        label: label.into(),
        on_press: noop(),
    }
}

fn empty_state() -> Case {
    Case {
        name: "mzizi-empty-state",
        contract: mzizi_empty_state::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziEmptyState { title: "No events yet", action: empty_action("Create"), secondary: empty_action("Learn more") } },
                ),
            ),
            (
                "compact",
                render(
                    || rsx! { MziziEmptyState { title: "Nothing here", density: EmptyStateDensity::Compact } },
                ),
            ),
        ],
        defaults: vec![],
        columns: vec![(
            "empty_state_density",
            "padding",
            rows(
                &EmptyStateDensity::ALL,
                |d| match d {
                    EmptyStateDensity::Full => "full",
                    EmptyStateDensity::Compact => "compact",
                },
                |d| d.padding().to_owned(),
            ),
        )],
    }
}

fn cover_header() -> Case {
    Case {
        name: "mzizi-cover-header",
        contract: mzizi_cover_header::CONTRACT,
        states: vec![(
            "default",
            render(
                || rsx! { MziziCoverHeader { name: "Tendai Moyo", cover_image: "https://x.test/c.jpg".to_string() } },
            ),
        )],
        defaults: vec![],
        columns: vec![
            (
                "cover_height",
                "class",
                rows(&CoverHeight::ALL, CoverHeight::slug, |h| {
                    h.classes().to_owned()
                }),
            ),
            (
                "avatar_shape",
                "class",
                rows(&AvatarShape::ALL, AvatarShape::slug, |s| {
                    s.classes().to_owned()
                }),
            ),
        ],
    }
}

fn success_action(label: &str) -> SuccessAction {
    SuccessAction {
        label: label.into(),
        on_press: noop(),
    }
}

fn success_screen() -> Case {
    Case {
        name: "mzizi-success-screen",
        contract: mzizi_success_screen::CONTRACT,
        states: vec![(
            "default",
            render(
                || rsx! { MziziSuccessScreen { primary_action: success_action("Done"), secondary_action: success_action("View receipt") } },
            ),
        )],
        defaults: vec![("title", "Success".to_owned())],
        columns: vec![],
    }
}

fn gauge_card() -> Case {
    Case {
        name: "mzizi-gauge-card",
        contract: mzizi_gauge_card::CONTRACT,
        states: vec![
            (
                "default",
                render(|| rsx! { MziziGaugeCard { label: "UV index", value: "7", percent: 64.0 } }),
            ),
            (
                "loading",
                render(
                    || rsx! { MziziGaugeCard { label: "UV index", value: "7", percent: 0.0, loading: true } },
                ),
            ),
        ],
        defaults: vec![("mineral", GaugeMineral::default().slug().to_owned())],
        columns: vec![(
            "gauge_mineral",
            "stroke",
            rows(&GaugeMineral::ALL, GaugeMineral::slug, |m| {
                m.stroke().to_owned()
            }),
        )],
    }
}

fn stat(label: &str, trend: &str) -> StatItem {
    StatItem {
        icon: rsx! { span { "•" } },
        label: label.into(),
        value: "12".into(),
        color: None,
        trend: Some(trend.into()),
    }
}

fn stats_row() -> Case {
    Case {
        name: "mzizi-stats-row",
        contract: mzizi_stats_row::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziStatsRow { stats: vec![stat("Events", "+12%"), stat("Tickets", "-3%")] } },
                ),
            ),
            (
                "grid",
                render(
                    || rsx! { MziziStatsRow { stats: vec![stat("Events", "0%")], layout: StatsLayout::Grid } },
                ),
            ),
            (
                "loading",
                render(|| rsx! { MziziStatsRow { stats: vec![], loading: true } }),
            ),
        ],
        defaults: vec![("layout", StatsLayout::default().slug().to_owned())],
        columns: vec![
            (
                "stats_layout",
                "class",
                rows(&StatsLayout::ALL, StatsLayout::slug, |l| {
                    l.classes().to_owned()
                }),
            ),
            (
                "trend_direction",
                "class",
                rows(
                    &TrendDirection::ALL,
                    |d| match d {
                        TrendDirection::Up => "up",
                        TrendDirection::Down => "down",
                        TrendDirection::Flat => "flat",
                    },
                    |d| d.class().to_owned(),
                ),
            ),
        ],
    }
}

fn escalation_options() -> Vec<EscalationOption> {
    vec![
        EscalationOption {
            id: "approve".into(),
            label: "Approve".into(),
            description: Some("Pay 12 USD now".into()),
        },
        EscalationOption {
            id: "decline".into(),
            label: "Decline".into(),
            description: None,
        },
    ]
}

fn escalation_card() -> Case {
    Case {
        name: "mzizi-escalation-card",
        contract: mzizi_escalation_card::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziEscalationCard { title: "Confirm the payment", options: escalation_options(), on_choose: |_| {} } },
                ),
            ),
            (
                "pending",
                render(
                    || rsx! { MziziEscalationCard { title: "Confirm the payment", options: escalation_options(), on_choose: |_| {}, pending_id: "approve".to_string() } },
                ),
            ),
        ],
        defaults: vec![],
        columns: vec![],
    }
}

fn suitability_card() -> Case {
    Case {
        name: "mzizi-suitability-card",
        contract: mzizi_suitability_card::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziSuitabilityCard { title: "Drying laundry", level: SuitabilityLevel::Good } },
                ),
            ),
            (
                "loading",
                render(
                    || rsx! { MziziSuitabilityCard { title: "Drying laundry", level: SuitabilityLevel::Good, loading: true } },
                ),
            ),
        ],
        defaults: vec![],
        columns: vec![
            (
                "suitability_level",
                "label",
                rows(&SuitabilityLevel::ALL, SuitabilityLevel::slug, |l| {
                    l.label().to_owned()
                }),
            ),
            (
                "suitability_level",
                "color",
                rows(&SuitabilityLevel::ALL, SuitabilityLevel::slug, |l| {
                    l.color().to_owned()
                }),
            ),
        ],
    }
}

fn user_card() -> Case {
    Case {
        name: "mzizi-user-card",
        contract: mzizi_user_card::CONTRACT,
        states: vec![
            (
                "default",
                render(
                    || rsx! { MziziUserCard { name: "Rudo Chikomo", role: "Admin".to_string() } },
                ),
            ),
            (
                "loading",
                render(|| rsx! { MziziUserCard { name: "Rudo Chikomo", loading: true } }),
            ),
        ],
        defaults: vec![],
        columns: vec![],
    }
}

fn cases() -> Vec<Case> {
    vec![
        alert_banner(),
        avatar_stack(),
        cover_header(),
        empty_state(),
        escalation_card(),
        gauge_card(),
        hero_stat(),
        meta_tile(),
        stats_row(),
        success_screen(),
        suitability_card(),
        user_card(),
    ]
}

// ─── The tests ──────────────────────────────────────────────────────────────────────────────

#[test]
fn every_component_keeps_its_own_contract() {
    for case in cases() {
        case.check();
    }
}

#[test]
fn every_component_in_the_crate_is_under_contract_here() {
    // A component added to `CONTRACTS` but not to `cases()` would ship a contract nothing
    // evaluates — FM-12 at the level of the whole file.
    let tested: Vec<&str> = cases().iter().map(|c| c.name).collect();
    let listed: Vec<&str> = CONTRACTS.iter().map(|(n, _)| *n).collect();
    assert_eq!(tested, listed);
    for ((name, contract), case) in CONTRACTS.iter().zip(cases()) {
        assert_eq!(
            *contract, case.contract,
            "{name}: CONTRACTS and the case disagree"
        );
    }
}

#[test]
fn the_evaluator_rejects_what_it_cannot_apply() {
    // FM-12 from the evaluator's side: an unknown subject or predicate is an error, never a
    // silent pass.
    let case = user_card();
    assert!(case.evaluate("slot is \"user-card\"").unwrap());
    assert!(!case.evaluate("slot is \"something-else\"").unwrap());
    assert!(case.evaluate("card_radius uses \"--radius-lg\"").is_err());
    assert!(case.evaluate("slot resembles \"user-card\"").is_err());
    assert!(case.evaluate("when hovered shows span \"x\"").is_err());
    assert!(case.evaluate("button \"Nope\" min_height 48").is_err());
}

#[test]
fn every_slot_and_portal_matches_the_typescript() {
    for case in cases() {
        let ts = tsx(case.name);
        let root = case.state("default").unwrap();
        let slot = root.attr("data-slot").unwrap();
        assert!(
            ts.contains(&format!("data-slot=\"{slot}\"")),
            "{}: the Rust emits data-slot=\"{slot}\", which the .tsx does not",
            case.name
        );
        for (_, state) in &case.states {
            if let Some(portal) = state.attr("data-portal") {
                assert!(
                    ts.contains(portal),
                    "{}: the Rust emits data-portal=\"{portal}\", which the .tsx does not",
                    case.name
                );
            }
        }
    }
}

#[test]
fn every_variant_value_appears_in_the_typescript() {
    // The variant tables are the part of a contract most likely to drift: a mineral renamed on
    // one side renders unstyled on the other.
    for case in cases() {
        let ts = tsx(case.name);
        for (enm, col, values) in &case.columns {
            for (variant, value) in values {
                for class in value.split_whitespace() {
                    let piece = if value.starts_with("var(") {
                        value.as_str()
                    } else {
                        class
                    };
                    assert!(
                        ts.contains(piece),
                        "{}: `{enm}.{variant} {col}` emits `{piece}`, which the .tsx does not contain",
                        case.name
                    );
                }
            }
        }
    }
}

// ─── Deliberate divergences, asserted from both sides ───────────────────────────────────────

#[test]
fn alert_banner_details_button_is_raised_to_the_touch_floor() {
    let ts = tsx("mzizi-alert-banner");
    assert!(
        ts.contains("h-10 rounded-full px-4"),
        "the .tsx no longer ships the 40px details button — remove this divergence"
    );
}

#[test]
fn gauge_card_announces_a_clamped_value() {
    let ts = tsx("mzizi-gauge-card");
    assert!(
        ts.contains("aria-valuenow={Math.round(percent)}"),
        "the .tsx now clamps aria-valuenow — remove this divergence"
    );
    let root = render(|| rsx! { MziziGaugeCard { label: "UV", value: "11+", percent: 140.0 } });
    let meter = root
        .elements()
        .into_iter()
        .find(|e| e.attr("role") == Some("meter"))
        .cloned()
        .unwrap();
    assert_eq!(meter.attr("aria-valuenow"), Some("100"));
}

#[test]
fn cover_header_quotes_the_cover_url() {
    let ts = tsx("mzizi-cover-header");
    assert!(
        ts.contains("url(${coverImage})"),
        "the .tsx now quotes the cover URL — remove this divergence"
    );
}

#[test]
fn hero_stat_skeleton_keeps_the_region_name() {
    let ts = tsx("mzizi-hero-stat");
    let skeleton =
        &ts[ts.find("if (loading)").unwrap()..ts.find("return (\n    <section").unwrap()];
    assert!(
        !skeleton.contains("aria-label"),
        "the .tsx skeleton is now named — remove this divergence"
    );
    let root = render(|| rsx! { MziziHeroStat { title: "Harare now", value: "", loading: true } });
    assert_eq!(root.attr("aria-label"), Some("Harare now"));
}

#[test]
fn escalation_card_pending_state_is_controlled_by_the_host() {
    let ts = tsx("mzizi-escalation-card");
    assert!(
        ts.contains("useState<string | null>(null)"),
        "the .tsx no longer owns pendingId — revisit this divergence"
    );
    let root = render(|| {
        rsx! {
            MziziEscalationCard { title: "Confirm", options: escalation_options(), on_choose: |_| {}, pending_id: "approve".to_string() }
        }
    });
    let button = root
        .elements()
        .into_iter()
        .find(|e| e.tag() == "button")
        .cloned()
        .unwrap();
    assert!(
        button.attr("disabled").is_some(),
        "a pending card must disable its options"
    );
}
