//! Mzizi N11 discovery — "if the machine can't see it, it doesn't exist."
//!
//! The Rust implementation of `nyuchi-seo`: page metadata and Schema.org JSON-LD,
//! for a host that is not Next.js.
//!
//! # What this owns, and what the host owns
//!
//! This builds the metadata and renders it. It does not know what a framework is.
//! The `.ts` sibling returns a Next.js `Metadata` object and lets the App Router
//! render the tags; there is no App Router here, so [`Metadata::to_head_html`]
//! emits the `<meta>`/`<link>` elements and the host puts them in `<head>`. Same
//! division as N8, which builds an OTLP request and lets the host send it.
//!
//! # A security defect in the TypeScript, fixed here
//!
//! `generateSchemaLD` returns `JSON.stringify(...)` and its own doc comment tells
//! you to inject it with `dangerouslySetInnerHTML`. JSON escaping does not escape
//! `<`, so any schema field carrying the six characters `</script` closes the
//! script element early and everything after it is parsed as HTML. A job title, a
//! product name or an article headline is enough — all four templates take
//! caller-supplied strings, and a marketplace listing is user input.
//!
//! [`generate_schema_ld`] escapes `<` as `\u003c` (and `>` as `\u003e`, and `&`
//! as `\u0026`). Those are valid JSON string escapes, so the JSON-LD parses
//! identically while becoming inert inside a script element. This is the standard
//! mitigation and it costs nothing.
//!
//! **The `.ts` sibling still has this defect.** It is not fixed by this file, and
//! it should be — tracked as part of the back-port of Rust-found defects.
//!
//! # Two things the TypeScript does that this deliberately does not
//!
//! **The `product` og:type dance.** The `.ts` sets `openGraph.type` to `website`
//! when the caller asked for `product`, then re-emits the true value through
//! Next's `other` map — because Next's `OpenGraph` union rejects `product`. That
//! is a workaround for one framework's types, not a fact about Open Graph, so
//! here [`OgType::Product`] simply emits `og:type` as `product` once.
//!
//! **`alternates.languages` built from a bare locale list.** Preserved as-is,
//! including that it emits no `x-default` and does not include the current locale
//! — changing either alters what crawlers do with a live site, which is a
//! product decision rather than a porting one.

use core::fmt::Write as _;

/// What kind of thing the page is, for `og:type`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum OgType {
    /// A generic page.
    #[default]
    Website,
    /// A piece of writing.
    Article,
    /// A person or organisation.
    Profile,
    /// Something for sale. A real `og:type` (ogp.me/ns/product).
    Product,
}

impl OgType {
    /// The wire spelling, matching the `.ts` string union.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Website => "website",
            Self::Article => "article",
            Self::Profile => "profile",
            Self::Product => "product",
        }
    }
}

/// How a link should render on X/Twitter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TwitterCard {
    /// Small thumbnail beside the text.
    Summary,
    /// Full-bleed image above the text.
    #[default]
    SummaryLargeImage,
    /// An inline player.
    Player,
}

impl TwitterCard {
    /// The wire spelling, matching the `.ts` string union.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Summary => "summary",
            Self::SummaryLargeImage => "summary_large_image",
            Self::Player => "player",
        }
    }
}

/// The site this metadata describes. Matches the `.ts` module constants.
pub const BASE_URL: &str = "https://mukoko.com";
/// Site name, appended to every title.
pub const SITE_NAME: &str = "Mukoko";
/// Open Graph image used when a page supplies none.
pub const DEFAULT_OG_IMAGE: &str = "/og-default.png";

/// Everything a caller says about a page.
#[derive(Debug, Clone, Default)]
pub struct SeoConfig {
    /// Page title, before ` — Mukoko` is appended.
    pub title: String,
    /// Meta description. Omitted entirely when `None`.
    pub description: Option<String>,
    /// Site-root-relative path, e.g. `/jobs/123`. Joined to [`BASE_URL`].
    pub canonical_url: Option<String>,
    /// Open Graph image URL. Falls back to [`DEFAULT_OG_IMAGE`].
    pub og_image: Option<String>,
    /// What kind of thing this page is.
    pub og_type: OgType,
    /// How the link renders on X/Twitter.
    pub twitter_card: TwitterCard,
    /// Ask crawlers not to index or follow.
    pub no_index: bool,
    /// BCP 47 locale of this page.
    pub locale: Option<String>,
    /// Other locales this page exists in, for `alternates.languages`.
    pub alternate_locales: Vec<String>,
}

/// One `hreflang` alternate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Alternate {
    /// The locale code.
    pub locale: String,
    /// The absolute URL for that locale.
    pub url: String,
}

/// Resolved page metadata: every value decided, nothing defaulted later.
///
/// The equivalent of the `.ts`'s Next `Metadata` return, minus the framework. A
/// host may read the fields directly or call [`Metadata::to_head_html`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Metadata {
    /// `"<title> — Mukoko"`.
    pub title: String,
    /// Meta description, if the caller gave one.
    pub description: Option<String>,
    /// Absolute canonical URL, if the caller gave a path.
    pub canonical: Option<String>,
    /// `hreflang` alternates, in the order the caller listed them.
    pub alternates: Vec<Alternate>,
    /// True when crawlers should be told to stay away.
    pub no_index: bool,
    /// `og:type`, emitted truthfully — see the module docs.
    pub og_type: OgType,
    /// `og:locale`.
    pub locale: String,
    /// The image URL used for both Open Graph and Twitter.
    pub image: String,
    /// Open Graph image width, fixed at 1200 as in the `.ts`.
    pub image_width: u32,
    /// Open Graph image height, fixed at 630 as in the `.ts`.
    pub image_height: u32,
    /// `og:image:alt` — the raw title, not the site-suffixed one.
    pub image_alt: String,
    /// Twitter card style.
    pub twitter_card: TwitterCard,
}

/// Resolve a [`SeoConfig`] into [`Metadata`], applying every default.
///
/// Mirrors the `.ts` `generateMetadata`, including that an empty `og_image`
/// string falls back to the default (the `.ts` uses `||`, not `??`).
#[must_use]
pub fn generate_metadata(config: &SeoConfig) -> Metadata {
    let full_title = format!("{} — {SITE_NAME}", config.title);

    let image = match config.og_image.as_deref() {
        Some(s) if !s.is_empty() => s.to_owned(),
        _ => DEFAULT_OG_IMAGE.to_owned(),
    };

    let canonical_path = config.canonical_url.as_deref().unwrap_or("");
    let canonical = config
        .canonical_url
        .as_deref()
        .filter(|s| !s.is_empty())
        .map(|path| format!("{BASE_URL}{path}"));

    let alternates = config
        .alternate_locales
        .iter()
        .map(|l| Alternate {
            locale: l.clone(),
            url: format!("{BASE_URL}/{l}{canonical_path}"),
        })
        .collect();

    Metadata {
        title: full_title,
        description: config.description.clone(),
        canonical,
        alternates,
        no_index: config.no_index,
        og_type: config.og_type,
        locale: config.locale.clone().unwrap_or_else(|| "en".to_owned()),
        image,
        image_width: 1200,
        image_height: 630,
        image_alt: config.title.clone(),
        twitter_card: config.twitter_card,
    }
}

/// Escape a string for an HTML attribute value.
///
/// Attribute-position escaping, because every use below is inside `content="…"`.
/// `&` first, or the ampersands introduced by the later replacements get escaped
/// a second time.
fn escape_attr(s: &str, out: &mut String) {
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
}

fn meta_name(out: &mut String, name: &str, content: &str) {
    out.push_str("<meta name=\"");
    out.push_str(name);
    out.push_str("\" content=\"");
    escape_attr(content, out);
    out.push_str("\">\n");
}

fn meta_property(out: &mut String, property: &str, content: &str) {
    out.push_str("<meta property=\"");
    out.push_str(property);
    out.push_str("\" content=\"");
    escape_attr(content, out);
    out.push_str("\">\n");
}

impl Metadata {
    /// Render the `<title>`, `<meta>` and `<link>` elements for `<head>`.
    ///
    /// Every caller-supplied value is attribute-escaped. The `.ts` never had to
    /// do this because React escaped for it; a Rust host writing a string into
    /// `<head>` has no such help, so it happens here rather than being left as an
    /// exercise for whoever renders.
    #[must_use]
    pub fn to_head_html(&self) -> String {
        let mut out = String::new();

        out.push_str("<title>");
        escape_attr(&self.title, &mut out);
        out.push_str("</title>\n");

        if let Some(d) = &self.description {
            meta_name(&mut out, "description", d);
        }
        if self.no_index {
            meta_name(&mut out, "robots", "noindex, nofollow");
        }
        if let Some(c) = &self.canonical {
            out.push_str("<link rel=\"canonical\" href=\"");
            escape_attr(c, &mut out);
            out.push_str("\">\n");
        }
        for alt in &self.alternates {
            out.push_str("<link rel=\"alternate\" hreflang=\"");
            escape_attr(&alt.locale, &mut out);
            out.push_str("\" href=\"");
            escape_attr(&alt.url, &mut out);
            out.push_str("\">\n");
        }

        meta_property(&mut out, "og:title", &self.title);
        if let Some(d) = &self.description {
            meta_property(&mut out, "og:description", d);
        }
        if let Some(c) = &self.canonical {
            meta_property(&mut out, "og:url", c);
        }
        meta_property(&mut out, "og:site_name", SITE_NAME);
        meta_property(&mut out, "og:type", self.og_type.as_str());
        meta_property(&mut out, "og:locale", &self.locale);
        meta_property(&mut out, "og:image", &self.image);
        let mut buf = String::new();
        let _ = write!(buf, "{}", self.image_width);
        meta_property(&mut out, "og:image:width", &buf);
        buf.clear();
        let _ = write!(buf, "{}", self.image_height);
        meta_property(&mut out, "og:image:height", &buf);
        meta_property(&mut out, "og:image:alt", &self.image_alt);

        meta_name(&mut out, "twitter:card", self.twitter_card.as_str());
        meta_name(&mut out, "twitter:title", &self.title);
        if let Some(d) = &self.description {
            meta_name(&mut out, "twitter:description", d);
        }
        meta_name(&mut out, "twitter:image", &self.image);

        out
    }
}

// ─── Schema.org ─────────────────────────────────────────────────────────────

/// A JSON value, enough for Schema.org and no more.
///
/// Hand-rolled rather than `serde_json`, for the reason N8's crate states at
/// length: these components are compiled into every consumer, and JSON-LD is a
/// small, fully specified shape.
///
/// `Object` is a `Vec` of pairs, not a map, because Schema.org output is read by
/// people as often as machines and insertion order is worth keeping.
#[derive(Debug, Clone, PartialEq)]
pub enum Json {
    /// A string.
    Str(String),
    /// A number. JSON has one numeric type.
    Num(f64),
    /// A boolean.
    Bool(bool),
    /// An ordered list.
    Arr(Vec<Json>),
    /// An ordered set of key/value pairs.
    Object(Vec<(String, Json)>),
}

impl Json {
    /// Convenience for `Json::Str`.
    #[must_use]
    pub fn s(v: impl Into<String>) -> Self {
        Self::Str(v.into())
    }

    /// Build an object from pairs.
    #[must_use]
    pub fn obj<K: Into<String>>(pairs: impl IntoIterator<Item = (K, Self)>) -> Self {
        Self::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
    }

    fn write(&self, out: &mut String) {
        match self {
            Self::Str(s) => write_json_string(s, out),
            Self::Num(n) => {
                // JSON has no NaN or Infinity. Emitting one produces a document
                // no parser accepts, so they become null — the same choice
                // `JSON.stringify` makes, which keeps the two siblings agreeing.
                if n.is_finite() {
                    let _ = write!(out, "{n}");
                } else {
                    out.push_str("null");
                }
            }
            Self::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
            Self::Arr(items) => {
                out.push('[');
                for (i, item) in items.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    item.write(out);
                }
                out.push(']');
            }
            Self::Object(pairs) => {
                out.push('{');
                for (i, (k, v)) in pairs.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    write_json_string(k, out);
                    out.push(':');
                    v.write(out);
                }
                out.push('}');
            }
        }
    }
}

/// Write a JSON string literal, escaped so it is also inert inside `<script>`.
///
/// Beyond the escapes JSON requires, `<`, `>` and `&` become `\u003c`, `\u003e`
/// and `\u0026`. All three are valid JSON escapes, so a parser sees the original
/// characters — but the literal text `</script>` can no longer appear in the
/// output, which is what stops a caller-supplied string from closing the script
/// element that carries it. See the module docs.
fn write_json_string(s: &str, out: &mut String) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            '<' => out.push_str("\\u003c"),
            '>' => out.push_str("\\u003e"),
            '&' => out.push_str("\\u0026"),
            // U+2028 and U+2029 are legal in JSON strings and illegal in
            // JavaScript source. A JSON-LD block is parsed as JSON, but the same
            // string reaching a `<script>` of another type would break it.
            '\u{2028}' => out.push_str("\\u2028"),
            '\u{2029}' => out.push_str("\\u2029"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

/// One Schema.org node: an `@type` plus its properties.
#[derive(Debug, Clone, PartialEq)]
pub struct SchemaOrg {
    /// The `@type` value, e.g. `JobPosting`.
    pub ty: String,
    /// Everything else, in order.
    pub properties: Vec<(String, Json)>,
}

impl SchemaOrg {
    /// A node of the given type with no properties yet.
    #[must_use]
    pub fn new(ty: impl Into<String>) -> Self {
        Self {
            ty: ty.into(),
            properties: Vec::new(),
        }
    }

    /// Add a property, builder style.
    #[must_use]
    pub fn with(mut self, key: impl Into<String>, value: Json) -> Self {
        self.properties.push((key.into(), value));
        self
    }

    /// Add a property only when the option is `Some`, mirroring the `.ts`
    /// spread-if-present idiom.
    #[must_use]
    pub fn with_opt(self, key: impl Into<String>, value: Option<Json>) -> Self {
        match value {
            Some(v) => self.with(key, v),
            None => self,
        }
    }

    fn to_json(&self, with_context: bool) -> Json {
        let mut pairs: Vec<(String, Json)> = Vec::with_capacity(self.properties.len() + 2);
        if with_context {
            pairs.push(("@context".to_owned(), Json::s("https://schema.org")));
        }
        pairs.push(("@type".to_owned(), Json::s(self.ty.clone())));
        pairs.extend(self.properties.iter().cloned());
        Json::Object(pairs)
    }
}

/// Serialise one or more Schema.org nodes as a JSON-LD document.
///
/// One node yields that node with `@context`. Several yield a single `@context`
/// and an `@graph`.
///
/// # Divergence from the TypeScript
///
/// The `.ts` puts `@context` on the wrapper AND on every member of `@graph`. A
/// `@graph` inherits the enclosing context, so the repeats are redundant — this
/// emits it once, which is the canonical form. No consumer sees a different
/// graph; it is the same document with less in it.
#[must_use]
pub fn generate_schema_ld(schema: &[SchemaOrg]) -> String {
    let mut out = String::new();
    match schema {
        [] => {
            // The `.ts` cannot reach this: its parameter is one node or a
            // non-empty array in practice. An empty slice is expressible here,
            // and an empty JSON-LD block is the only honest answer — a `@graph`
            // of nothing would claim a structure that is not there.
            Json::Object(vec![("@context".to_owned(), Json::s("https://schema.org"))])
                .write(&mut out);
        }
        [only] => only.to_json(true).write(&mut out),
        many => {
            let graph = many.iter().map(|n| n.to_json(false)).collect::<Vec<_>>();
            Json::Object(vec![
                ("@context".to_owned(), Json::s("https://schema.org")),
                ("@graph".to_owned(), Json::Arr(graph)),
            ])
            .write(&mut out);
        }
    }
    out
}

/// A pay range on a [`job_posting`].
#[derive(Debug, Clone, PartialEq)]
pub struct Salary {
    /// Lower bound.
    pub min: f64,
    /// Upper bound.
    pub max: f64,
    /// ISO 4217 code.
    pub currency: String,
}

/// A `JobPosting` node.
#[must_use]
pub fn job_posting(
    title: &str,
    company: &str,
    location: &str,
    description: &str,
    date_posted: &str,
    salary: Option<&Salary>,
) -> SchemaOrg {
    SchemaOrg::new("JobPosting")
        .with("title", Json::s(title))
        .with(
            "hiringOrganization",
            Json::obj([
                ("@type", Json::s("Organization")),
                ("name", Json::s(company)),
            ]),
        )
        .with(
            "jobLocation",
            Json::obj([("@type", Json::s("Place")), ("address", Json::s(location))]),
        )
        .with("description", Json::s(description))
        .with("datePosted", Json::s(date_posted))
        .with_opt(
            "baseSalary",
            salary.map(|s| {
                Json::obj([
                    ("@type", Json::s("MonetaryAmount")),
                    ("currency", Json::s(s.currency.clone())),
                    (
                        "value",
                        Json::obj([
                            ("@type", Json::s("QuantitativeValue")),
                            ("minValue", Json::Num(s.min)),
                            ("maxValue", Json::Num(s.max)),
                            ("unitText", Json::s("MONTH")),
                        ]),
                    ),
                ])
            }),
        )
}

/// An `Article` node.
#[must_use]
pub fn article(title: &str, author: &str, date_published: &str, image: Option<&str>) -> SchemaOrg {
    SchemaOrg::new("Article")
        .with("headline", Json::s(title))
        .with(
            "author",
            Json::obj([("@type", Json::s("Person")), ("name", Json::s(author))]),
        )
        .with("datePublished", Json::s(date_published))
        .with_opt("image", image.map(Json::s))
}

/// An `Event` node.
#[must_use]
pub fn event(
    name: &str,
    start_date: &str,
    end_date: Option<&str>,
    location: &str,
    description: Option<&str>,
) -> SchemaOrg {
    SchemaOrg::new("Event")
        .with("name", Json::s(name))
        .with("startDate", Json::s(start_date))
        .with_opt("endDate", end_date.map(Json::s))
        .with(
            "location",
            Json::obj([("@type", Json::s("Place")), ("name", Json::s(location))]),
        )
        .with_opt("description", description.map(Json::s))
}

/// A `Product` node.
#[must_use]
pub fn product(
    name: &str,
    price: f64,
    currency: &str,
    image: Option<&str>,
    description: Option<&str>,
) -> SchemaOrg {
    SchemaOrg::new("Product")
        .with("name", Json::s(name))
        .with_opt("description", description.map(Json::s))
        .with_opt("image", image.map(Json::s))
        .with(
            "offers",
            Json::obj([
                ("@type", Json::s("Offer")),
                ("price", Json::Num(price)),
                ("priceCurrency", Json::s(currency)),
                ("availability", Json::s("https://schema.org/InStock")),
            ]),
        )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg(title: &str) -> SeoConfig {
        SeoConfig {
            title: title.to_owned(),
            ..SeoConfig::default()
        }
    }

    #[test]
    fn title_is_suffixed_and_alt_text_is_not() {
        let m = generate_metadata(&cfg("Jobs"));
        assert_eq!(m.title, "Jobs — Mukoko");
        assert_eq!(m.image_alt, "Jobs");
    }

    #[test]
    fn defaults_match_the_typescript() {
        let m = generate_metadata(&cfg("x"));
        assert_eq!(m.og_type, OgType::Website);
        assert_eq!(m.twitter_card, TwitterCard::SummaryLargeImage);
        assert_eq!(m.locale, "en");
        assert_eq!(m.image, DEFAULT_OG_IMAGE);
        assert!(!m.no_index);
        assert!(m.canonical.is_none());
    }

    #[test]
    fn empty_og_image_falls_back_like_the_ts_or_operator() {
        let m = generate_metadata(&SeoConfig {
            og_image: Some(String::new()),
            ..cfg("x")
        });
        assert_eq!(m.image, DEFAULT_OG_IMAGE);
    }

    #[test]
    fn canonical_and_alternates_are_absolute() {
        let m = generate_metadata(&SeoConfig {
            canonical_url: Some("/jobs/1".to_owned()),
            alternate_locales: vec!["sn".to_owned(), "nd".to_owned()],
            ..cfg("x")
        });
        assert_eq!(m.canonical.as_deref(), Some("https://mukoko.com/jobs/1"));
        assert_eq!(m.alternates[0].url, "https://mukoko.com/sn/jobs/1");
        assert_eq!(m.alternates[1].url, "https://mukoko.com/nd/jobs/1");
    }

    #[test]
    fn product_emits_its_true_og_type_once() {
        let m = generate_metadata(&SeoConfig {
            og_type: OgType::Product,
            ..cfg("Sofa")
        });
        let html = m.to_head_html();
        assert!(html.contains(r#"<meta property="og:type" content="product">"#));
        assert!(!html.contains(r#"content="website""#));
        assert_eq!(html.matches("og:type").count(), 1);
    }

    #[test]
    fn head_html_escapes_attribute_values() {
        let m = generate_metadata(&cfg(r#"Bolt " & <b>"#));
        let html = m.to_head_html();
        assert!(!html.contains("<b>"));
        assert!(html.contains("&lt;b&gt;"));
        assert!(html.contains("&quot;"));
        assert!(html.contains("&amp;"));
    }

    #[test]
    fn no_index_emits_robots() {
        let m = generate_metadata(&SeoConfig {
            no_index: true,
            ..cfg("x")
        });
        assert!(
            m.to_head_html()
                .contains(r#"name="robots" content="noindex, nofollow""#)
        );
    }

    #[test]
    fn single_node_carries_the_context() {
        let json = generate_schema_ld(&[article("T", "A", "2026-01-01", None)]);
        assert!(json.starts_with(r#"{"@context":"https://schema.org","@type":"Article""#));
        assert!(!json.contains("@graph"));
    }

    #[test]
    fn graph_carries_the_context_exactly_once() {
        let json = generate_schema_ld(&[
            article("T", "A", "2026-01-01", None),
            event("E", "2026-02-01", None, "Harare", None),
        ]);
        assert_eq!(
            json.matches("@context").count(),
            1,
            "the .ts repeats it per member"
        );
        assert!(json.contains("@graph"));
    }

    #[test]
    fn script_closing_sequence_cannot_survive_into_the_document() {
        // The defect this file fixes: a caller-supplied string ending the script
        // element that carries it.
        let json = generate_schema_ld(&[article(
            "Great deal</script><script>alert(1)</script>",
            "A",
            "2026-01-01",
            None,
        )]);
        assert!(!json.contains("</script>"));
        assert!(!json.contains('<'));
        assert!(json.contains("\\u003c/script\\u003e"));
    }

    #[test]
    fn optional_fields_are_omitted_not_nulled() {
        let json = generate_schema_ld(&[product("Sofa", 100.0, "USD", None, None)]);
        assert!(!json.contains("image"));
        assert!(!json.contains("description"));
        assert!(json.contains(r#""price":100"#));
    }

    #[test]
    fn salary_nests_a_quantitative_value() {
        let s = Salary {
            min: 500.0,
            max: 900.0,
            currency: "USD".to_owned(),
        };
        let json = generate_schema_ld(&[job_posting(
            "Dev",
            "Nyuchi",
            "Harare",
            "d",
            "2026-01-01",
            Some(&s),
        )]);
        assert!(json.contains(r#""@type":"MonetaryAmount""#));
        assert!(json.contains(r#""minValue":500"#));
        assert!(json.contains(r#""unitText":"MONTH""#));
    }

    #[test]
    fn non_finite_numbers_become_null_like_json_stringify() {
        let json = generate_schema_ld(&[product("x", f64::NAN, "USD", None, None)]);
        assert!(json.contains(r#""price":null"#));
    }

    #[test]
    fn empty_slice_yields_a_bare_context_not_an_empty_graph() {
        let json = generate_schema_ld(&[]);
        assert_eq!(json, r#"{"@context":"https://schema.org"}"#);
    }
}
