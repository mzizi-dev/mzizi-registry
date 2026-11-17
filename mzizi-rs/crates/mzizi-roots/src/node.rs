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
                    assert!(is_attr_name(name), "invalid attribute name `{name}`");
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

/// Whether `name` is a plain HTML attribute name: an ASCII letter, then ASCII letters, digits
/// and `-`.
fn is_attr_name(name: &str) -> bool {
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
#[must_use]
pub fn render_to_string(nodes: &[Node]) -> String {
    let mut out = String::new();
    for node in nodes {
        write_node(&mut out, node);
    }
    out
}

fn write_node(out: &mut String, node: &Node) {
    match node {
        Node::Text(text) => out.push_str(&escape(text)),
        Node::Fragment(nodes) => {
            for child in nodes {
                write_node(out, child);
            }
        }
        Node::Element {
            tag,
            attrs,
            children,
        } => {
            out.push('<');
            out.push_str(tag);
            for (name, value) in attrs {
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
                write_node(out, child);
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
}
