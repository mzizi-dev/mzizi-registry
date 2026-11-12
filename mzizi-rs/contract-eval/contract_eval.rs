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

/// Decode the character references `dioxus-ssr` writes: the five named ones and numeric ones
/// (`&#60;`, `&#x3C;`), which it uses for `<`, `>` and `&` in text and attributes. One pass,
/// left to right, so `&#38;lt;` decodes to `&lt;` and not to `<`.
pub fn unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut rest = s;
    while let Some(at) = rest.find('&') {
        out.push_str(&rest[..at]);
        rest = &rest[at..];
        let decoded = rest.find(';').and_then(|end| {
            let name = &rest[1..end];
            let c = match name {
                "lt" => Some('<'),
                "gt" => Some('>'),
                "quot" => Some('"'),
                "amp" => Some('&'),
                "apos" => Some('\''),
                _ => name
                    .strip_prefix("#x")
                    .or_else(|| name.strip_prefix("#X"))
                    .map(|h| u32::from_str_radix(h, 16))
                    .or_else(|| name.strip_prefix('#').map(str::parse::<u32>))
                    .and_then(Result::ok)
                    .and_then(char::from_u32),
            }?;
            Some((c, end + 1))
        });
        match decoded {
            Some((c, len)) => {
                out.push(c);
                rest = &rest[len..];
            }
            None => {
                out.push('&');
                rest = &rest[1..];
            }
        }
    }
    out.push_str(rest);
    out
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

/// A rendered component: every top-level node `dioxus-ssr` emitted, so a rule that must see
/// the whole output (the CSP rule) does not stop at the first element. It derefs to
/// [`Rendered::root`], the first element, which is what every clause reads.
#[derive(Debug, Clone)]
pub struct Rendered {
    pub roots: Vec<Node>,
}

impl Rendered {
    /// Parse server-rendered markup. Panics when it holds no element.
    pub fn from_html(html: &str) -> Self {
        let rendered = Rendered { roots: parse(html) };
        assert!(
            rendered
                .roots
                .iter()
                .any(|n| matches!(n, Node::Element { .. })),
            "rendered no element: {html}"
        );
        rendered
    }

    /// The component's root: the first top-level element.
    pub fn root(&self) -> &Node {
        self.roots
            .iter()
            .find(|n| matches!(n, Node::Element { .. }))
            .expect("a rendered component has an element")
    }

    /// Every element in the whole output, depth first.
    pub fn elements(&self) -> Vec<&Node> {
        self.roots.iter().flat_map(Node::elements).collect()
    }
}

impl std::ops::Deref for Rendered {
    type Target = Node;
    fn deref(&self) -> &Node {
        self.root()
    }
}

/// Render a component: every top-level node, its root first among the elements.
///
/// Takes a function rather than an `Element` because props holding an [`EventHandler`] can
/// only be built inside a Dioxus runtime, which the `VirtualDom` provides while it runs `app`.
pub fn render(app: fn() -> Element) -> Rendered {
    let mut dom = VirtualDom::new(app);
    dom.rebuild_in_place();
    Rendered::from_html(&dioxus_ssr::render(&dom))
}

/// The CSP rule (#444): every element in the whole rendered output, every top-level node and
/// everything under it, that carries an inline `style` attribute, as `<tag> style="…"`. A
/// build held to a contract must have none, so an app's Content-Security-Policy keeps
/// `style-src 'self'` with no `'unsafe-inline'`; custom properties and sizes go through
/// classes, data attributes or SVG geometry. It reads the final markup, so it also sees Dioxus
/// CSS-property attributes (`background_color: …`, `width: …`), which `dioxus-ssr` merges into
/// `style`. The same rule as `inlineStyles` in `contracts/runner.ts`, which holds the Astro and
/// React builds. [`Case::check`] applies it to every state.
pub fn inline_styles(rendered: &Rendered) -> Vec<String> {
    rendered
        .elements()
        .into_iter()
        .filter_map(|e| {
            e.attr("style")
                .map(|s| format!("<{}> style=\"{s}\"", e.tag()))
        })
        .collect()
}

/// The property names a `style` attribute declares, lower-cased, in order: `color: red;
/// --tint: x` gives `color` and `--tint`. A `;` inside parentheses or quotes does not end a
/// declaration.
pub fn style_properties(style: &str) -> Vec<String> {
    let mut decls = Vec::new();
    let (mut depth, mut quote, mut start) = (0i32, None, 0);
    for (i, c) in style.char_indices() {
        match (quote, c) {
            (Some(q), c) if c == q => quote = None,
            (Some(_), _) => {}
            (None, '"' | '\'') => quote = Some(c),
            (None, '(') => depth += 1,
            (None, ')') => depth -= 1,
            (None, ';') if depth == 0 => {
                decls.push(&style[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    decls.push(&style[start..]);
    decls
        .into_iter()
        .filter_map(|d| {
            d.split_once(':')
                .map(|(p, _)| p.trim().to_ascii_lowercase())
        })
        .filter(|p| !p.is_empty())
        .collect()
}

/// Whether an allowed-style entry admits a property: the property itself, or `--*` for any
/// custom property.
fn allows(allowed: &str, property: &str) -> bool {
    allowed == property || (allowed == "--*" && property.starts_with("--"))
}

/// The size roles' heights in px, `(utility suffix, coarse pointer, desktop density)`:
/// `h-control` is `--spacing-control`. A copy of `lib/tokens/roles.source.ts`;
/// `__tests__/density.test.ts` holds it equal to the TypeScript runner's table and the roles.
pub const ROLE_HEIGHTS: &[(&str, u32, u32)] = &[
    ("touch", 49, 36),
    ("touch-min", 49, 28),
    ("control", 49, 36),
    ("control-sm", 49, 32),
    ("control-lg", 56, 40),
    ("control-icon", 49, 36),
    ("control-dense", 32, 28),
    ("field", 49, 36),
    ("field-sm", 49, 32),
];

/// THE BUNDU FLOOR (owner ruling 2026-11-02), a copy of `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`:
/// the hit region every interactive control keeps on every device, desktop included, in px.
/// `__tests__/density.test.ts` holds it equal to the source.
pub const HIT_AREA_PX: u32 = 49;
/// The hit region on a desktop (a fine pointer with hover), owner ruling 2026-11-12, #660. Equal to `VISIBLE_FINE_MIN_PX`.
pub const HIT_AREA_FINE_PX: u32 = 28;
/// The smallest a control is DRAWN at desktop density, in px (the Bundu floor again).
pub const VISIBLE_FINE_MIN_PX: u32 = 28;

fn class_of(node: &Node) -> &str {
    node.attr("class").unwrap_or("")
}

/// An element that draws its own `after:` pseudo-element: the hit-area rule steps aside.
fn has_own_after(node: &Node) -> bool {
    class_of(node).contains("after:")
}

/// An element that clips its overflow also clips a pseudo-element extending past its box.
fn clips(node: &Node) -> bool {
    class_of(node).split_whitespace().any(|c| {
        let c = c.rsplit(':').next().unwrap_or(c);
        matches!(
            c,
            "overflow-hidden"
                | "overflow-clip"
                | "overflow-x-hidden"
                | "overflow-y-hidden"
                | "overflow-x-clip"
                | "overflow-y-clip"
        )
    })
}

/// A composite row whose token-layer `min-height` is overridden by its own `min-h-*` utility.
fn own_min_height(node: &Node) -> bool {
    class_of(node)
        .split_whitespace()
        .any(|c| c.rsplit(':').next().unwrap_or(c).starts_with("min-h-"))
}

/// Whether the token layer's `hit-area` rule covers a node with a pseudo-element: a button, a `summary`, a
/// button-like role, or a `.hit-area` element, with no `after:` utility of its own and not a calendar day
/// (`[data-day]`). A copy of `carriesHitArea` in `contracts/runner.ts`.
pub fn carries_hit_area(node: &Node) -> bool {
    if has_own_after(node) || node.attr("data-day").is_some() {
        return false;
    }
    let tag = node.tag();
    if tag == "button" || tag == "summary" {
        return true;
    }
    if ["button", "tab", "switch"].contains(&node.attr("role").unwrap_or("")) {
        return true;
    }
    class_of(node).split_whitespace().any(|c| c == "hit-area")
}

/// A composite row: the token layer gives it `min-height` at the hit area instead of a pseudo-element.
pub fn is_composite_row(node: &Node) -> bool {
    ["menuitem", "menuitemcheckbox", "menuitemradio", "option"]
        .contains(&node.attr("role").unwrap_or(""))
}

/// Whether a node is an interactive control the Bundu hit-area floor applies to.
pub fn is_interactive(node: &Node) -> bool {
    if carries_hit_area(node) || is_composite_row(node) {
        return true;
    }
    let tag = node.tag();
    if tag == "button" || tag == "summary" {
        return true;
    }
    if ["button", "tab", "switch"].contains(&node.attr("role").unwrap_or("")) {
        return true;
    }
    match tag {
        "a" => node.attr("href").is_some(),
        "input" => node.attr("type") != Some("hidden"),
        "select" | "textarea" => true,
        _ => false,
    }
}

/// The hit region, in px, of an interactive node drawn `drawn` px tall: raised to `floor` (`HIT_AREA_PX` on touch,
/// `HIT_AREA_FINE_PX` on a desktop) only where the token layer's rule provably does it (see `hitRegion` in
/// `contracts/runner.ts`); otherwise its drawn box.
pub fn hit_region(node: &Node, drawn: u32, floor: u32) -> u32 {
    if is_composite_row(node) {
        return if own_min_height(node) {
            drawn
        } else {
            drawn.max(floor)
        };
    }
    if carries_hit_area(node) && !clips(node) {
        return drawn.max(floor);
    }
    drawn
}

/// What a density row's control violates of the Bundu floor, as sentences; empty for a row the evaluator cannot
/// read (`fine` is `None`), exactly as `hitViolations` in `contracts/runner.ts`.
pub fn hit_violations(node: &Node, fine: Option<u32>, coarse: Option<u32>) -> Vec<String> {
    let Some(fine) = fine else {
        return Vec::new();
    };
    if !is_interactive(node) {
        return Vec::new();
    }
    let at = coarse.unwrap_or(fine);
    let mut under = Vec::new();
    if hit_region(node, fine, HIT_AREA_FINE_PX) < HIT_AREA_FINE_PX {
        under.push(format!(
            "hit region is {}px on a fine pointer, below the {HIT_AREA_FINE_PX}px Bundu floor",
            hit_region(node, fine, HIT_AREA_FINE_PX)
        ));
    }
    if hit_region(node, at, HIT_AREA_PX) < HIT_AREA_PX {
        under.push(format!(
            "hit region is {}px on a coarse pointer, below the {HIT_AREA_PX}px Bundu floor",
            hit_region(node, at, HIT_AREA_PX)
        ));
    }
    if carries_hit_area(node) && !clips(node) && fine < VISIBLE_FINE_MIN_PX {
        under.push(format!(
            "drawn at {fine}px on a fine pointer, below the {VISIBLE_FINE_MIN_PX}px smallest a control is drawn"
        ));
    }
    under
}

/// Density rows pinned as known gaps against the Bundu floor, `<contract name>:<row part>`. A copy of
/// `HIT_AREA_GAPS` in `contracts/runner.ts`; `__tests__/density.test.ts` holds them equal.
pub const HIT_AREA_GAPS: &[&str] = &[
    "app/button:sm",
    "app/command-palette:result row",
    "app/command-palette:search box",
    "app/confirm-action:typed confirm box",
    "app/data-table:menu item",
    "app/filter-bar:field",
    "app/form-field:input",
    "app/form-field:select",
    "app/info-tip:button",
    "app/input:input",
    "app/page-header:docs pill",
    "app/pagination:page link",
    "app/plan-summary:action link",
    "app/side-nav:nav row",
    "app/tier-status:evidence link",
    "app/toolbar-menu:choice",
    "app/toolbar:search box",
    "app/top-bar-action:action",
    "app/workspace-switcher:menu item",
    "discover/breadcrumb:crumb link",
    "discover/category-chip:chip",
    "discover/category-chips:chip",
    "discover/detail-actions:secondary action",
    "discover/detail-actions:share link",
    "discover/discover-card:app link",
    "discover/discover-section:see all",
    "discover/discover-shell:home link",
    "discover/discover-shell:nav link",
    "discover/load-more:link",
    "discover/meta-list:linked value",
    "discover/open-in-app:link",
    "discover/related-rail:see all",
    "site/hero:call to action",
    "site/hero:call to action (centred)",
    "site/social-icon:link",
    "ui/address-code:link",
    "ui/address-private-row:link",
    "ui/address-share-card:link",
];

/// THE SPACING FLOOR (owner, 2026-11-04, #617), a copy of `BUNDU_FLOOR.spacing` in
/// `lib/tokens/roles.source.ts`; `__tests__/spacing-floor.test.ts` holds it equal to the source.
pub const INSET_FLOOR_PX: f32 = 14.0;
/// The least gap between controls, a label and its field, and sibling items, in px.
pub const GAP_FLOOR_PX: f32 = 7.0;
/// The least body line height.
pub const LEADING_FLOOR: f32 = 1.5;

/// The named spacing steps (`--space-*`, px) a class can name: `p-md`, `gap-sm`. A copy of `SPACE_NAMES`
/// in `contracts/runner.ts`.
const SPACE_NAMES: &[(&str, f32)] = &[
    ("xxs", 2.0),
    ("xs", 4.0),
    ("xs-plus", 6.0),
    ("sm", 8.0),
    ("sm-plus", 10.0),
    ("md", 12.0),
    ("base", 16.0),
    ("base-plus", 20.0),
    ("lg", 24.0),
    ("xl", 32.0),
    ("xl-plus", 40.0),
    ("2xl", 48.0),
    ("2xl-plus", 56.0),
    ("3xl", 64.0),
    ("4xl", 80.0),
    ("5xl", 96.0),
    ("6xl", 128.0),
];

/// `\d*\.?\d+`: the arbitrary leading forms `spacingViolations` reads (`1.2`, `.5`, `15`; not `1.`).
fn is_leading_number(n: &str) -> bool {
    match n.split_once('.') {
        Some((int, frac)) => {
            int.bytes().all(|b| b.is_ascii_digit())
                && !frac.is_empty()
                && frac.bytes().all(|b| b.is_ascii_digit())
        }
        None => !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()),
    }
}

fn is_decimal(v: &str) -> bool {
    let mut parts = v.splitn(2, '.');
    let int = parts.next().unwrap_or("");
    let frac = parts.next();
    !int.is_empty()
        && int.bytes().all(|b| b.is_ascii_digit())
        && frac.is_none_or(|f| !f.is_empty() && f.bytes().all(|b| b.is_ascii_digit()))
}

/// A spacing utility's value in px, or `None` where the evaluator cannot read it (a var, a calc, a role).
pub fn space_of(v: &str) -> Option<f32> {
    if v == "px" {
        return Some(1.0);
    }
    if is_decimal(v) {
        return v.parse::<f32>().ok().map(|n| n * 4.0);
    }
    if let Some(inner) = v.strip_prefix('[') {
        if let Some(n) = inner.strip_suffix("px]").filter(|n| is_decimal(n)) {
            return n.parse().ok();
        }
        if let Some(n) = inner.strip_suffix("rem]").filter(|n| is_decimal(n)) {
            return n.parse::<f32>().ok().map(|n| n * 16.0);
        }
        return None;
    }
    SPACE_NAMES.iter().find(|(n, _)| *n == v).map(|(_, px)| *px)
}

/// A class token without its variants (`sm:`, `group-data-[size=sm]/card:`) and a leading `!`.
fn utility_of(token: &str) -> &str {
    let mut depth = 0i32;
    let mut cut = None;
    for (i, c) in token.char_indices() {
        match c {
            '[' | '(' => depth += 1,
            ']' | ')' => depth -= 1,
            ':' if depth == 0 => cut = Some(i + 1),
            _ => {}
        }
    }
    let u = &token[cut.unwrap_or(0)..];
    let u = u.strip_prefix('!').unwrap_or(u);
    u.strip_suffix('!').unwrap_or(u)
}

const SPACING_KINDS: &[&str] = &[
    "gap-x", "gap-y", "gap", "space-x", "space-y", "px", "py", "pt", "pb", "pl", "pr", "ps", "pe",
    "p", "mx", "my", "mt", "mb", "ml", "mr", "ms", "me", "m",
];

/// `(negative, kind, value)` for a spacing utility such as `-mt-2`, `gap-x-3`, `px-3.5`.
fn spacing_utility(u: &str) -> Option<(bool, &'static str, &str)> {
    let (neg, rest) = match u.strip_prefix('-') {
        Some(r) => (true, r),
        None => (false, u),
    };
    SPACING_KINDS.iter().find_map(|k| {
        let v = rest.strip_prefix(k)?.strip_prefix('-')?;
        (!v.is_empty()).then_some((neg, *k, v))
    })
}

fn is_gap_kind(k: &str) -> bool {
    matches!(k, "gap" | "gap-x" | "gap-y" | "space-x" | "space-y")
}

/// Whether an element's classes draw an edge of their own: a fill, a border, a ring, a shadow or an outline.
fn draws_edge(classes: &[&str]) -> bool {
    classes.iter().any(|t| {
        let u = utility_of(t);
        if let Some(r) = u.strip_prefix("bg-") {
            return !(r == "transparent"
                || r == "none"
                || ["clip", "origin", "position", "repeat", "size", "blend"]
                    .iter()
                    .any(|p| r.starts_with(p)));
        }
        if u == "border" {
            return true;
        }
        if let Some(r) = u.strip_prefix("border-") {
            return !(["0", "t-0", "b-0", "l-0", "r-0", "x-0", "y-0"].contains(&r)
                || ["collapse", "separate", "spacing"]
                    .iter()
                    .any(|p| r.starts_with(p)));
        }
        u == "ring"
            || u.starts_with("ring-")
            || u.starts_with("shadow")
            || u == "outline"
            || u.starts_with("outline-")
    })
}

/// Whether an element's own classes fix its height, which then decides its block axis.
fn fixes_height(classes: &[&str]) -> bool {
    classes.iter().any(|t| {
        let u = utility_of(t);
        u.starts_with("h-") || u.starts_with("min-h-") || u.starts_with("size-")
    })
}

/// Whether an element is inline-level or a pill: a chip, a tag, a badge, an eyebrow.
fn inline_level(node: &Node, classes: &[&str]) -> bool {
    [
        "span", "code", "kbd", "mark", "small", "a", "abbr", "b", "i", "em", "strong", "label",
    ]
    .contains(&node.tag())
        || classes.iter().any(|t| {
            matches!(
                utility_of(t),
                "inline"
                    | "inline-flex"
                    | "inline-block"
                    | "inline-grid"
                    | "w-fit"
                    | "rounded-full"
            )
        })
}

fn own_text(node: &Node) -> bool {
    match node {
        Node::Element { children, .. } => children
            .iter()
            .any(|c| matches!(c, Node::Text(t) if !t.trim().is_empty())),
        Node::Text(_) => false,
    }
}

fn has_siblings(node: &Node) -> bool {
    match node {
        Node::Element { children, .. } => {
            children
                .iter()
                .filter(|c| match c {
                    Node::Element { tag, .. } => {
                        !["style", "script", "link", "meta"].contains(&tag.as_str())
                    }
                    Node::Text(t) => !t.trim().is_empty(),
                })
                .count()
                >= 2
        }
        Node::Text(_) => false,
    }
}

/// What a node's own classes violate of the spacing floor, as `(class, sentence)` pairs: a `gap-*` or `space-*`
/// under `GAP_FLOOR_PX` on a node with two or more children; padding under `INSET_FLOOR_PX` on a node with text
/// of its own that draws an edge (inline axis; block axis too unless it is a control, fixes its own height or is
/// inline-level); a negative margin on a text container; a tight `leading-*` on body copy. A copy of
/// `spacingViolations` in `contracts/runner.ts`; `contracts/spacing-cases.json` is the shared table.
pub fn spacing_violations(node: &Node) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let classes: Vec<&str> = class_of(node).split_whitespace().collect();
    let text = own_text(node);
    let edge = draws_edge(&classes);
    let control = is_interactive(node) || fixes_height(&classes) || inline_level(node, &classes);
    let siblings = has_siblings(node);
    let body_copy = ["p", "li", "dd", "blockquote", "figcaption", "td", "th"].contains(&node.tag());
    for t in &classes {
        let u = utility_of(t);
        if let Some((neg, kind, v)) = spacing_utility(u) {
            let px = space_of(v);
            if let Some(p) =
                px.filter(|p| is_gap_kind(kind) && !neg && *p < GAP_FLOOR_PX && siblings)
            {
                out.push((
                    t.to_string(),
                    format!("`{t}` is a {p}px gap, below the {GAP_FLOOR_PX}px Bundu spacing floor"),
                ));
            } else if text && neg && kind.starts_with('m') && px.is_some_and(|p| p > 0.0) {
                out.push((
                    t.to_string(),
                    format!("`{t}` is a negative margin on a text container"),
                ));
            } else if let Some(p) = px.filter(|_| text && edge && !neg) {
                let inline = ["p", "px", "pl", "pr", "ps", "pe"].contains(&kind);
                let block = ["p", "py", "pt", "pb"].contains(&kind) && !control;
                if (inline || block) && p < INSET_FLOOR_PX {
                    out.push((
                        t.to_string(),
                        format!(
                            "`{t}` is {p}px of {} padding on a text container, below the {INSET_FLOOR_PX}px Bundu inset floor",
                            if inline { "inline" } else { "block" }
                        ),
                    ));
                }
            }
            continue;
        }
        if body_copy && text {
            let l = match u.strip_prefix("leading-") {
                Some("none") => Some(1.0),
                Some("tight") => Some(1.25),
                Some("snug") => Some(1.375),
                Some(r) => r
                    .strip_prefix('[')
                    .and_then(|r| r.strip_suffix(']'))
                    .filter(|n| is_leading_number(n))
                    .and_then(|n| n.parse::<f32>().ok()),
                None => None,
            };
            if let Some(n) = l.filter(|n| *n < LEADING_FLOOR) {
                out.push((
                    t.to_string(),
                    format!("`{t}` is a {n} line height on body copy, below the {LEADING_FLOOR} Bundu floor"),
                ));
            }
        }
    }
    out
}

/// Spacing exceptions, `<contract name>:<offending class>`. A copy of `SPACING_GAPS` in `contracts/runner.ts`
/// (keys only; the reasons live there); `__tests__/spacing-floor.test.ts` holds the two equal.
pub const SPACING_GAPS: &[&str] = &[
    "app/bar-chart:gap-px",
    "app/toolbar:sm:gap-0",
    "ui/card:has-[>img:first-child]:pt-0",
    "ui/markdown-renderer:px-1.5",
];

/// The largest height, in px, an element's classes declare on a fine pointer at desktop density:
/// `h-N`, `min-h-N`, `size-N` on the 4px Tailwind scale, their `[Npx]` arbitrary forms, or a
/// size role (`h-control`).
pub fn declared_height(classes: &str) -> Option<u32> {
    declared_height_at(classes, false)
}

/// As [`declared_height`], on a coarse pointer when `coarse`: a size role takes its touch value.
pub fn declared_height_at(classes: &str, coarse: bool) -> Option<u32> {
    classes
        .split_whitespace()
        .filter_map(|c| {
            let v = c
                .strip_prefix("min-h-")
                .or_else(|| c.strip_prefix("h-"))
                .or_else(|| c.strip_prefix("size-"))?;
            if let Some(px) = v.strip_prefix('[').and_then(|v| v.strip_suffix("px]")) {
                px.parse().ok()
            } else if let Ok(n) = v.parse::<u32>() {
                Some(n * 4)
            } else {
                ROLE_HEIGHTS
                    .iter()
                    .find(|(name, _, _)| *name == v)
                    .map(|(_, touch, desktop)| if coarse { *touch } else { *desktop })
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
    pub states: Vec<(&'static str, Rendered)>,
    /// Prop defaults a `<name>` subject can resolve to.
    pub defaults: Vec<(&'static str, String)>,
    /// Variant tables: (enum, column, [(variant, value)]).
    pub columns: Vec<(&'static str, &'static str, Rows)>,
    /// The inline `style` properties this component still renders, a recorded gap rather than
    /// a hidden one (#481); `--*` admits any custom property. Empty for every component that
    /// meets the CSP rule. [`Case::check`] fails any other property, and an entry no state
    /// renders any more, so the list only shrinks.
    pub allowed_styles: &'static [&'static str],
}

pub fn tokens(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut chars = line.chars().peekable();
    while let Some(&c) = chars.peek() {
        if c.is_whitespace() {
            chars.next();
        } else if c == '"' {
            // A quoted string is one token, quotes kept. A quote left open runs to the end of
            // the line and stays open, so `quoted` does not take it for a quoted operand.
            chars.next();
            let mut s = String::from("\"");
            for c in chars.by_ref() {
                s.push(c);
                if c == '"' {
                    break;
                }
            }
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

/// The text inside a quoted token, or `None` when the token is not quoted.
pub fn quoted(t: &str) -> Option<&str> {
    t.strip_prefix('"')?.strip_suffix('"')
}

/// The one quoted operand a predicate takes; any other shape is an `Err`.
fn one_quoted<'a>(name: &str, operands: &'a [String]) -> Result<&'a str, String> {
    match operands {
        [only] => quoted(only),
        _ => None,
    }
    .ok_or_else(|| format!("`{name}` takes exactly one quoted operand"))
}

/// Evaluate a value predicate. `Err` is a clause this evaluator cannot apply.
///
/// `contains "<s>"` is a substring; `has "<token>"` is one whole whitespace-separated token
/// (`has "line-through"` is not satisfied by `hover:line-through`). `not <predicate>` negates
/// any one predicate (`not contains "line-through"`, `not has "uppercase"`).
///
/// Every operand is quoted, and a predicate takes exactly the operands it names: an unquoted
/// operand, an extra one, or (for `in`) none at all is an `Err`, and `not` of an `Err` stays an
/// `Err`, never a pass. The grammar and every verdict match `evaluatePredicate` in
/// `contracts/runner.ts`; `__tests__/contracts/fixtures/predicates.json` holds both to the same
/// cases. `at_least <n>` (an unquoted number) is evaluated here only, for prop defaults and
/// variant columns, which only the Rust suites have.
pub fn holds(value: &str, pred: &[String]) -> Result<bool, String> {
    let Some((head, operands)) = pred.split_first() else {
        return Err("an empty predicate".into());
    };
    match head.as_str() {
        "not" => match operands.first().map(String::as_str) {
            None => Err("`not` needs a predicate".into()),
            Some("not") => Err("`not not`: one `not` only".into()),
            Some(_) => holds(value, operands).map(|b| !b),
        },
        "is" => Ok(value == one_quoted(head, operands)?),
        "contains" => Ok(value.contains(one_quoted(head, operands)?)),
        "has" => {
            let want = one_quoted(head, operands)?;
            if want.is_empty() || want.contains(char::is_whitespace) {
                return Err("`has` takes one class token, with no whitespace".into());
            }
            Ok(value.split_whitespace().any(|c| c == want))
        }
        "not_empty" if operands.is_empty() => Ok(!value.trim().is_empty()),
        "not_empty" => Err("`not_empty` takes no operand".into()),
        "at_least" => {
            let [n] = operands else {
                return Err("`at_least` takes one number".into());
            };
            let n: f64 = n.parse().map_err(|_| "at_least needs a number")?;
            let v: f64 = value
                .parse()
                .map_err(|_| format!("`{value}` is not a number"))?;
            Ok(v >= n)
        }
        "in" => {
            let set: Option<Vec<&str>> = operands.iter().map(|p| quoted(p)).collect();
            match set {
                Some(set) if !set.is_empty() => Ok(set.contains(&value)),
                _ => Err("`in` takes one or more quoted operands, and only those".into()),
            }
        }
        "uses" => {
            let token = one_quoted(head, operands)?;
            if !token.starts_with("--") {
                return Err("`uses` takes \"--token\"".into());
            }
            Ok(value.contains(&format!("var({token}")))
        }
        _ => Err(format!(
            "`{head}` is not a predicate this evaluator evaluates"
        )),
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
            .map(|(_, rendered)| rendered.root())
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
        // and `when <state> <root attribute> <predicate…>`
        if first == "when" {
            let root = self.state(t.get(1).ok_or("`when` needs a state")?)?;
            if t.len() == 5 && t[2] == "shows" {
                let text = unquote(&t[4]);
                return Ok(root
                    .elements()
                    .iter()
                    .any(|e| e.tag() == t[3] && e.carries(text)));
            }
            if let Some(attr) = t.get(2).and_then(|s| root_attr(s)) {
                let value = root
                    .attr(attr)
                    .ok_or_else(|| format!("the `{}` root has no `{attr}`", t[1]))?;
                return holds(value, &t[3..]);
            }
            return Err(
                "only `when <state> shows <element> \"<text>\"` and `when <state> <root attribute> <predicate>` are evaluated"
                    .into(),
            );
        }

        // `uses <data-slot>`: an element carrying that slot is rendered in the default state.
        if first == "uses" && t.len() == 2 {
            let root = self.state("default")?;
            return Ok(root
                .elements()
                .iter()
                .any(|e| e.attr("data-slot") == Some(t[1].as_str())));
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
                        // The touch floor is judged on a coarse pointer (see contracts/runner.ts).
                        let classes = e.attr("class").unwrap_or("");
                        let coarse: String = classes
                            .split_whitespace()
                            .filter_map(|c| c.strip_prefix("pointer-coarse:"))
                            .collect::<Vec<_>>()
                            .join(" ");
                        let h = declared_height_at(&coarse, true)
                            .or_else(|| declared_height_at(classes, true));
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
        let mut used: Vec<&str> = Vec::new();
        let mut styled: Vec<String> = Vec::new();
        for (state, r) in &self.states {
            for e in r.elements() {
                let Some(style) = e.attr("style") else {
                    continue;
                };
                let properties = style_properties(style);
                let banned: Vec<&String> = properties
                    .iter()
                    .filter(
                        |p| match self.allowed_styles.iter().find(|a| allows(a, p)) {
                            Some(a) => {
                                used.push(*a);
                                false
                            }
                            None => true,
                        },
                    )
                    .collect();
                if properties.is_empty() || !banned.is_empty() {
                    styled.push(format!("[{state}] <{}> style=\"{style}\"", e.tag()));
                }
            }
        }
        assert!(
            styled.is_empty(),
            "{}: an inline style attribute, which a strict Content-Security-Policy blocks \
             (#444){}: {styled:?}",
            self.name,
            if self.allowed_styles.is_empty() {
                String::new()
            } else {
                format!(
                    ", with a property outside its allowed {:?}",
                    self.allowed_styles
                )
            }
        );
        for allowed in self.allowed_styles {
            assert!(
                used.contains(allowed),
                "{}: no state renders an inline `{allowed}` any more: remove it from its \
                 allowed_styles (#481)",
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

// ─── A CSS selector subset, for a contract's `checks` and `density` ────────────────────────

/// One compound selector: an optional tag, `.class`es and `[attr]` / `[attr="value"]`s,
/// joined by `>` or a space. A selector outside this subset is an `Err`, which the caller
/// turns into a failure (FM-12).
#[derive(Debug, Default)]
struct Compound {
    tag: Option<String>,
    classes: Vec<String>,
    attrs: Vec<(String, Option<String>)>,
}

fn compound(selector: &str) -> Result<Compound, String> {
    let s = selector.trim();
    let mut out = Compound::default();
    let mut i = 0;
    let b = s.as_bytes();
    let ident = |i: &mut usize| {
        let start = *i;
        while *i < b.len() && (b[*i].is_ascii_alphanumeric() || b[*i] == b'-' || b[*i] == b'_') {
            *i += 1;
        }
        s[start..*i].to_owned()
    };
    if i < b.len() && b[i].is_ascii_alphabetic() {
        out.tag = Some(ident(&mut i));
    }
    while i < b.len() {
        match b[i] {
            b'.' => {
                i += 1;
                out.classes.push(ident(&mut i));
            }
            b'[' => {
                let end = s[i..]
                    .find(']')
                    .ok_or_else(|| format!("unclosed `[` in `{s}`"))?
                    + i;
                let inner = &s[i + 1..end];
                match inner.split_once('=') {
                    Some((k, v)) => out
                        .attrs
                        .push((k.trim().to_owned(), Some(unquote(v.trim()).to_owned()))),
                    None => out.attrs.push((inner.trim().to_owned(), None)),
                }
                i = end + 1;
            }
            _ => return Err(format!("selector `{s}` is outside the evaluated subset")),
        }
    }
    Ok(out)
}

impl Compound {
    fn matches(&self, e: &Node) -> bool {
        self.tag.as_deref().is_none_or(|t| e.tag() == t)
            && self.classes.iter().all(|k| {
                e.attr("class")
                    .is_some_and(|v| v.split_whitespace().any(|w| w == k))
            })
            && self.attrs.iter().all(|(k, v)| match v {
                Some(v) => e.attr(k) == Some(v.as_str()),
                None => e.attr(k).is_some(),
            })
    }
}

/// Split a selector into compounds and the combinators between them: `>` (child) or a space
/// (descendant). Whitespace inside `[…]` is part of the attribute, not a combinator.
fn chain(selector: &str) -> Result<(Compound, Vec<(bool, Compound)>), String> {
    let mut parts: Vec<String> = Vec::new();
    let mut child = Vec::new();
    let mut cur = String::new();
    let mut depth = 0;
    let mut pending_child = false;
    let flush = |cur: &mut String, parts: &mut Vec<String>| {
        if !cur.is_empty() {
            parts.push(std::mem::take(cur));
        }
    };
    for ch in selector.trim().chars() {
        if depth == 0 && ch == '>' {
            flush(&mut cur, &mut parts);
            pending_child = true;
            continue;
        }
        if depth == 0 && ch.is_whitespace() {
            flush(&mut cur, &mut parts);
            continue;
        }
        // The first character of a compound after the first: record how it is joined.
        if cur.is_empty() && !parts.is_empty() {
            child.push(std::mem::take(&mut pending_child));
        }
        match ch {
            '[' => depth += 1,
            ']' => depth -= 1,
            _ => {}
        }
        cur.push(ch);
    }
    flush(&mut cur, &mut parts);
    if pending_child || parts.is_empty() {
        return Err(format!(
            "selector `{selector}` is outside the evaluated subset"
        ));
    }
    let first = compound(&parts[0])?;
    let rest = parts[1..]
        .iter()
        .zip(child)
        .map(|(p, is_child)| compound(p).map(|c| (is_child, c)))
        .collect::<Result<_, _>>()?;
    Ok((first, rest))
}

/// Every element under (and including) `root` that matches `selector`: compound selectors
/// joined by `>` (child) or a space (descendant).
pub fn select<'a>(root: &'a Node, selector: &str) -> Result<Vec<&'a Node>, String> {
    let (first, rest) = chain(selector)?;
    let mut set: Vec<&Node> = root
        .elements()
        .into_iter()
        .filter(|e| first.matches(e))
        .collect();
    for (is_child, c) in rest {
        let mut next: Vec<&Node> = Vec::new();
        for parent in set {
            let Node::Element { children, .. } = parent else {
                continue;
            };
            let candidates: Vec<&Node> = if is_child {
                children
                    .iter()
                    .filter(|n| matches!(n, Node::Element { .. }))
                    .collect()
            } else {
                children.iter().flat_map(Node::elements).collect()
            };
            for e in candidates {
                if c.matches(e) && !next.iter().any(|n| std::ptr::eq(*n, e)) {
                    next.push(e);
                }
            }
        }
        set = next;
    }
    Ok(set)
}
