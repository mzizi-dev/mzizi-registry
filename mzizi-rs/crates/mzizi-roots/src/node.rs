//! The element-tree model and its serialisation: the runtime core of Mzizi Roots.
//!
//! This is the same node shape the Mzizi language's renderer uses (`compiler/src/render.rs`
//! in `mzizi-dev/mzizi`, RFC-0017): an element is a tag, its attributes in source order and
//! its children; text is a run of text. A fragment is a list of nodes with no element around
//! them. A component's Rust build and a component compiled from `.mz` both produce a tree of
//! these, and [`render_to_string`] is the one serialiser.
//!
//! Escaping is total. Every text node and every attribute value passes through [`escape`] when
//! it is serialised, so there is no way to write unescaped output through this module. The
//! escaping rules are the language's: `&`, `<`, `>`, `"` and `'` become decimal references
//! (`&#38;`, `&#60;`, `&#62;`, `&#34;`, `&#39;`), and everything else, including non-ASCII, is
//! written unchanged.
//!
//! Tags are `&'static str`, so a tag can only be one a component wrote in its source. Attribute
//! names are checked when a node is built: a name that is not a plain HTML name panics, because a
//! name is written by the component, never by a reader.
//!
//! [`Node`] is a public enum, so a caller can also build one directly, and the serialiser does not
//! trust it. [`render_to_string`] enforces the same rules as a second line of defence:
//!
//! - an attribute whose name is not a plain HTML name is skipped; a tag that is not one drops its
//!   whole element;
//! - `script` and `style` elements are never written, children included: entity escaping is the
//!   wrong context inside a raw-text element, so they are refused rather than escaped;
//! - subtrees nested deeper than [`MAX_DEPTH`] are dropped, so a deep tree cannot overflow the
//!   stack while it is serialised.
//!
//! URL attributes (`href`, `src` and the rest) are NOT filtered here. Escaping keeps a value inside
//! its attribute, but says nothing about the scheme. A caller that puts a URL into one must pass it
//! through `markdown-renderer`'s `safe_link` first, as the components in this crate do.
//!
//! Nothing here depends on Dioxus or on any renderer. Components produce a [`Node`] and call
//! [`render_to_string`]; a browser or a server does the rest.

/// One node of an element tree.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Node {
    /// An element: a tag, its attributes in the order they were written, and its children.
    Element {
        /// The markup tag. Static, so it comes only from a component's own source.
        tag: &'static str,
        /// `(name, value)` pairs, in source order. Values are unescaped here; [`render_to_string`]
        /// escapes them.
        attrs: Vec<(String, String)>,
        /// Child nodes, in order.
        children: Vec<Node>,
    },
    /// A run of text. Unescaped here; [`render_to_string`] escapes it.
    Text(String),
    /// Nodes with no element around them, written one after another.
    Fragment(Vec<Node>),
}

/// Tags with no closing tag and no children, as the language's renderer writes them.
const VOID_TAGS: &[&str] = &["img", "input", "br", "hr"];

/// Elements whose content is raw text, which entity escaping does not protect. They are never
/// written, children included.
const RAW_TEXT_TAGS: &[&str] = &["script", "style"];

/// How deep [`render_to_string`] writes. Every element and fragment is one level; a node nested
/// at this depth or deeper is dropped, with its subtree. Real trees are far shallower.
pub const MAX_DEPTH: usize = 256;

impl Node {
    /// An element with the given tag, attributes and children.
    ///
    /// # Panics
    ///
    /// Panics if an attribute name is not a plain HTML name (ASCII letters, digits and `-`,
    /// starting with a letter). Names are written by components, so a bad one is a bug in the
    /// component, found the first time it renders.
    #[must_use]
    pub fn element(tag: &'static str, attrs: &[(&str, &str)], children: Vec<Node>) -> Self {
        Self::Element {
            tag,
            attrs: attrs
                .iter()
                .map(|(name, value)| {
                    assert!(is_plain_name(name), "invalid attribute name `{name}`");
                    ((*name).to_owned(), (*value).to_owned())
                })
                .collect(),
            children,
        }
    }

    /// A text node.
    #[must_use]
    pub fn text(value: impl Into<String>) -> Self {
        Self::Text(value.into())
    }

    /// A fragment of nodes.
    #[must_use]
    pub fn fragment(nodes: Vec<Node>) -> Self {
        Self::Fragment(nodes)
    }
}

/// Whether `name` is a plain HTML name, for an attribute or a tag: an ASCII letter, then ASCII
/// letters, digits and `-`. Nothing else (no space, quote, `=`, `>` or `/`) can end a tag or an
/// attribute early.
fn is_plain_name(name: &str) -> bool {
    let mut chars = name.chars();
    matches!(chars.next(), Some(c) if c.is_ascii_alphabetic())
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '-')
}

/// Escape `value` for text and for double-quoted attribute values.
///
/// `&`, `<`, `>`, `"` and `'` become decimal references; everything else is written unchanged.
/// The same five, in the same form, as the language's renderer.
#[must_use]
pub fn escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        match c {
            '&' => out.push_str("&#38;"),
            '<' => out.push_str("&#60;"),
            '>' => out.push_str("&#62;"),
            '"' => out.push_str("&#34;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

/// Serialise a list of nodes to markup.
///
/// Attributes are written in order, double-quoted, with their values escaped. Every text node is
/// escaped. Void tags (`img`, `input`, `br`, `hr`) have no closing tag.
///
/// The serialiser refuses what [`Node::element`] would not have built, because [`Node`] can be
/// constructed directly: an attribute name or tag that is not a plain name is skipped (a bad tag
/// drops its element), `script` and `style` elements are dropped with their children, and nodes
/// nested deeper than [`MAX_DEPTH`] are dropped with their subtrees.
///
/// Recursion is used for the tree, so building, cloning and dropping a [`Node`] recurse too. That
/// is fine for trees a component builds; a caller that builds one thousands of levels deep must
/// not clone or drop it on a small stack.
#[must_use]
pub fn render_to_string(nodes: &[Node]) -> String {
    let mut out = String::new();
    for node in nodes {
        write_node(&mut out, node, 0);
    }
    out
}

fn write_node(out: &mut String, node: &Node, depth: usize) {
    if depth >= MAX_DEPTH {
        return;
    }
    match node {
        Node::Text(text) => out.push_str(&escape(text)),
        Node::Fragment(nodes) => {
            for child in nodes {
                write_node(out, child, depth + 1);
            }
        }
        Node::Element {
            tag,
            attrs,
            children,
        } => {
            if !is_plain_name(tag)
                || RAW_TEXT_TAGS
                    .iter()
                    .any(|raw| tag.eq_ignore_ascii_case(raw))
            {
                return;
            }
            out.push('<');
            out.push_str(tag);
            for (name, value) in attrs {
                if !is_plain_name(name) {
                    continue;
                }
                out.push(' ');
                out.push_str(name);
                out.push_str("=\"");
                out.push_str(&escape(value));
                out.push('"');
            }
            out.push('>');
            if VOID_TAGS.contains(tag) {
                return;
            }
            for child in children {
                write_node(out, child, depth + 1);
            }
            out.push_str("</");
            out.push_str(tag);
            out.push('>');
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_the_five_characters_as_decimal_references() {
        assert_eq!(escape(r#"&<>"'"#), "&#38;&#60;&#62;&#34;&#39;");
    }

    #[test]
    fn leaves_non_ascii_and_ordinary_text_alone() {
        assert_eq!(escape("Ubuntu — ngwenya ✓"), "Ubuntu — ngwenya ✓");
    }

    #[test]
    fn escapes_every_text_node_and_attribute_value() {
        let node = Node::element(
            "p",
            &[("title", "a \"quote\" & <tag>")],
            vec![Node::text("<script>alert(1)</script>")],
        );
        assert_eq!(
            render_to_string(&[node]),
            "<p title=\"a &#34;quote&#34; &#38; &#60;tag&#62;\">&#60;script&#62;alert(1)&#60;/script&#62;</p>"
        );
    }

    #[test]
    fn writes_attributes_in_source_order() {
        let node = Node::element(
            "div",
            &[("data-slot", "x"), ("role", "alert"), ("id", "a")],
            vec![],
        );
        assert_eq!(
            render_to_string(&[node]),
            "<div data-slot=\"x\" role=\"alert\" id=\"a\"></div>"
        );
    }

    #[test]
    fn void_tags_have_no_closing_tag() {
        let node = Node::element("hr", &[("role", "separator")], vec![]);
        assert_eq!(render_to_string(&[node]), "<hr role=\"separator\">");
    }

    #[test]
    fn a_fragment_writes_its_children_with_no_wrapper() {
        let nodes = vec![Node::fragment(vec![Node::text("a"), Node::text("b")])];
        assert_eq!(render_to_string(&nodes), "ab");
    }

    #[test]
    #[should_panic(expected = "invalid attribute name")]
    fn an_attribute_name_that_is_not_a_plain_name_panics() {
        let _ = Node::element("div", &[("on click", "x")], vec![]);
    }

    fn element(tag: &'static str, attrs: &[(&str, &str)], children: Vec<Node>) -> Node {
        Node::Element {
            tag,
            attrs: attrs
                .iter()
                .map(|(n, v)| ((*n).to_owned(), (*v).to_owned()))
                .collect(),
            children,
        }
    }

    #[test]
    fn a_built_node_with_a_hostile_attribute_name_writes_no_breakout() {
        // `Node` is public, so the name is not checked by `Node::element`. The serialiser must skip it.
        let node = element(
            "div",
            &[
                ("x onmouseover=alert(1) y", "v"),
                ("on\"click", "v"),
                ("on>click", "v"),
                ("1x", "v"),
                ("", "v"),
                ("role", "alert"),
            ],
            vec![Node::text("ok")],
        );
        let html = render_to_string(&[node]);
        assert_eq!(html, "<div role=\"alert\">ok</div>");
        assert!(!html.contains("onmouseover"));
        assert!(!html.contains("onclick"));
    }

    #[test]
    fn a_built_node_with_a_hostile_tag_writes_nothing_for_that_element() {
        let node = Node::fragment(vec![
            element(
                "img src=x onerror=alert(1) y",
                &[],
                vec![Node::text("inside")],
            ),
            Node::text("after"),
        ]);
        assert_eq!(render_to_string(&[node]), "after");
    }

    #[test]
    fn script_and_style_elements_are_never_written_with_their_children() {
        let script = Node::element("script", &[], vec![Node::text("alert(1)")]);
        let style = Node::element("style", &[("media", "all")], vec![Node::text("a{}")]);
        let upper = element("SCRIPT", &[], vec![Node::text("alert(2)")]);
        let nested = Node::element("div", &[("role", "group")], vec![script, style, upper]);
        assert_eq!(render_to_string(&[nested]), "<div role=\"group\"></div>");
    }

    #[test]
    fn a_node_nested_past_the_depth_limit_is_dropped_with_its_subtree() {
        // `chain(n)` is n divs around a text leaf, built without recursion.
        let chain = |n: usize| {
            let mut node = Node::text("leaf");
            for _ in 0..n {
                node = Node::element("div", &[], vec![node]);
            }
            node
        };

        let at_limit = render_to_string(&[chain(MAX_DEPTH - 1)]);
        assert!(
            at_limit.contains("leaf"),
            "a leaf one level inside the limit is written"
        );

        let past = render_to_string(&[chain(MAX_DEPTH + 44)]);
        assert_eq!(past.matches("<div>").count(), MAX_DEPTH);
        assert_eq!(past.matches("</div>").count(), MAX_DEPTH);
        assert!(!past.contains("leaf"));
    }
}
