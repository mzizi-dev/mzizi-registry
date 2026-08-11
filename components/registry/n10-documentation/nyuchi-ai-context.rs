//! Mzizi N10 documentation — the context window an AI assistant is given.
//!
//! The Rust implementation of `nyuchi-ai-context`. Pure string assembly, no
//! framework, exactly as the `.ts` describes itself.
//!
//! # The defect this port had to confront
//!
//! The `.ts` opens with, in capitals: "This lib never hardcodes counts. Counts
//! drift as the ecosystem evolves." It then hardcodes the entire node set as a
//! literal string — a ten-row table, N1 through N10, with a four-axis model above
//! it. Both are stale:
//!
//!   * The node set is **uncapped** (§9) and runs past N10. N11 is the discovery
//!     rung and N12 the skills rung; neither appears. An assistant handed this
//!     context is told, in a document whose whole purpose is to be believed, that
//!     N10 is the end.
//!   * The horizontal / vertical / depth / outlier axis model is the retired
//!     layer-and-axis scheme. `nyuchi-seo`'s own header records being moved off
//!     N6 "because the layer/axis model is retired in favour of the DNA double
//!     helix".
//!
//! A count is not special. A hardcoded node LIST drifts the same way a hardcoded
//! node COUNT does, and this file proves it: the count rule was followed and the
//! list beside it went stale anyway.
//!
//! So the node map here is **data**, not a literal. [`NodeEntry`] rows are passed
//! in, the same way counts are, and [`current_nodes`] is a documented default for
//! a caller with nothing better — not a truth buried in a string. A caller that
//! reads `/api/v1/architecture` gets a map that cannot go stale at all.
//!
//! # Preserved rather than "fixed"
//!
//! The ten rules are reproduced as written, including rule 8's "48px minimum".
//! `scripts/validate-registry.mjs` records at length that the shipped primitives
//! never honoured the 56px/48px scale and that density won — but the rules block
//! is doctrine text owned by N10's authors, and silently editing what the system
//! tells an assistant about itself is not a porting decision. Flagged here, and
//! left for whoever owns §8.2 to settle.
//!
//! Rule 9's "Query get_node_counts()" and the Supabase/MCP footer are likewise
//! reproduced. They name a specific database and endpoint, which is exactly the
//! kind of fact that rots — see [`Endpoints`] for how a caller overrides them.

/// Live ecosystem totals, supplied by the caller.
///
/// Optional in the `.ts` and optional here: an assistant is better told where to
/// find the numbers than given numbers that have drifted.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EcosystemCounts {
    /// Every component in the registry.
    pub total_components: usize,
    /// Those marked stable.
    pub total_stable: usize,
    /// How many nodes exist. Uncapped — see §9.
    pub total_nodes: usize,
}

/// One row of the node map.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeEntry {
    /// Node number. No upper bound.
    pub number: u16,
    /// Short name, e.g. `Primitives`.
    pub label: String,
    /// What the node is for, one line.
    pub role: String,
}

impl NodeEntry {
    /// Build a row.
    #[must_use]
    pub fn new(number: u16, label: &str, role: &str) -> Self {
        Self {
            number,
            label: label.to_owned(),
            role: role.to_owned(),
        }
    }
}

/// The node set as it stands, for a caller with no live source.
///
/// A DEFAULT, not a definition. The authority is `/api/v1/architecture`, and a
/// caller that can reach it should pass those rows instead — that is the whole
/// point of the node map being a parameter. Kept here so the component still
/// produces something useful offline, and so the staleness is visible in a list
/// rather than buried in a prose table.
#[must_use]
pub fn current_nodes() -> Vec<NodeEntry> {
    vec![
        NodeEntry::new(
            1,
            "Tokens",
            "CSS substrate. The only node that defines CSS values.",
        ),
        NodeEntry::new(2, "Primitives", "Headless and accessible. Radix + CVA."),
        NodeEntry::new(3, "Brand", "N2 plus Ubuntu. Uses nyuchi-harness."),
        NodeEntry::new(4, "Safety", "Gates. Validates input, guards AI output."),
        NodeEntry::new(
            5,
            "Resilience",
            "Circuit breakers, retries, fallback chains.",
        ),
        NodeEntry::new(6, "Pages", "Pure composition. No inline primitives."),
        NodeEntry::new(7, "Shell", "App chrome. Header, nav, theme, lifecycle."),
        NodeEntry::new(
            8,
            "Assurance",
            "Observability, SLO tracking, chaos testing.",
        ),
        NodeEntry::new(
            9,
            "Fundi",
            "Self-healing. Turns assurance signals into filed defects.",
        ),
        NodeEntry::new(
            10,
            "Documentation",
            "Self-describing. The system explains itself.",
        ),
        NodeEntry::new(
            11,
            "Discovery",
            "Machine visibility. Metadata and structured data.",
        ),
        NodeEntry::new(
            12,
            "Skills",
            "What the system knows how to do, authored in git.",
        ),
    ]
}

/// Where the machine-readable truth lives.
///
/// Parameters rather than literals because the `.ts` hardcoded a Supabase project
/// ref, an MCP hostname and the repo slug `nyuchi/design-portal` — and the repo is
/// `nyuchi/mzizi`. An assistant handed a wrong repo slug will look in the wrong
/// place and report that the code does not exist.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoints {
    /// Human-facing site.
    pub site: String,
    /// `owner/repo` on GitHub.
    pub repo: String,
    /// MCP endpoint an assistant can call.
    pub mcp: String,
}

impl Default for Endpoints {
    fn default() -> Self {
        Self {
            site: "https://mzizi.dev".to_owned(),
            repo: "nyuchi/mzizi".to_owned(),
            mcp: "https://mzizi.dev/api/v1/mcp".to_owned(),
        }
    }
}

/// Which sections to include.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AiContextOptions {
    /// Live totals, if the caller has them.
    pub counts: Option<EcosystemCounts>,
    /// The ten rules.
    pub include_rules: bool,
    /// The heading and source line.
    pub include_architecture: bool,
    /// The node map table.
    pub include_node_map: bool,
    /// Node rows. Empty means "use [`current_nodes`]".
    pub nodes: Vec<NodeEntry>,
    /// Where the truth lives.
    pub endpoints: Endpoints,
}

impl Default for AiContextOptions {
    /// Matches the `.ts` defaults: all three sections on.
    fn default() -> Self {
        Self {
            counts: None,
            include_rules: true,
            include_architecture: true,
            include_node_map: true,
            nodes: Vec::new(),
            endpoints: Endpoints::default(),
        }
    }
}

/// The ten rules, reproduced verbatim from the `.ts`.
///
/// See the module docs on rule 8 — reproduced as written rather than silently
/// reconciled with what the primitives actually ship.
const ECOSYSTEM_RULES: &str = "\
## Rules (non-negotiable)

1. CSS values live only in N1. All other nodes use var(--token-name). Never hex outside N1.
2. Icons import from @/lib/icons only. Never from lucide-react directly.
3. N2 primitives never import useNyuchiHarness.
4. N3 brand components always destructure { log, motion, LiveRegion } from useNyuchiHarness.
5. N6 pages: pure composition, semantic CSS vars only, accept children/slots.
6. All interactive components: data-slot + data-portal attributes required.
7. Status colors use semantic tokens: --status-success, --status-error, --status-warning.
8. Touch targets: 48px minimum. Focus rings: focus-visible:outline-2.
9. No hardcoded numbers in code or copy. Query the live counts.
10. Shona terms come from the database. Never translate or invent them.";

/// Render the node map as a markdown table.
fn render_node_map(nodes: &[NodeEntry]) -> String {
    // Width the first column to the widest label so the table stays readable at
    // any node count — the `.ts` aligned its ten rows by hand, which is why an
    // eleventh could not be added without redoing the whitespace.
    let widest = nodes.iter().map(|n| n.label.len()).max().unwrap_or(0);

    let mut out = String::new();
    out.push_str("## Node map\n\n");
    out.push_str(
        "Every component belongs to exactly one node. The node set is UNCAPPED — a\n\
         new node may be added at any time, so never assume the highest number here\n\
         is the last one.\n\n",
    );
    for n in nodes {
        out.push_str(&format!(
            "  N{:<3} {:<width$}  — {}\n",
            n.number,
            n.label,
            n.role,
            width = widest
        ));
    }
    out
}

/// Build the context window.
///
/// Mirrors the `.ts` `generateAIContext`, with the node map taken from
/// `options.nodes` rather than a literal.
#[must_use]
pub fn generate_ai_context(options: &AiContextOptions) -> String {
    let mut parts: Vec<String> = Vec::new();

    if options.include_architecture {
        parts.push("# Mzizi Design System".to_owned());
        parts.push(String::new());
        if let Some(c) = options.counts {
            parts.push(format!(
                "Live counts: {} components total, {} stable, across {} nodes.",
                c.total_components, c.total_stable, c.total_nodes
            ));
        }
        parts.push(format!(
            "Source: {} | GitHub: {}",
            options.endpoints.site, options.endpoints.repo
        ));
        if options.counts.is_none() {
            parts.push(format!("For live counts: {}", options.endpoints.mcp));
        }
        parts.push(String::new());
    }

    if options.include_node_map {
        let owned;
        let nodes: &[NodeEntry] = if options.nodes.is_empty() {
            owned = current_nodes();
            &owned
        } else {
            &options.nodes
        };
        parts.push(render_node_map(nodes));
        parts.push(String::new());
    }

    if options.include_rules {
        parts.push(ECOSYSTEM_RULES.to_owned());
        parts.push(String::new());
    }

    parts.push(format!("MCP server: {}", options.endpoints.mcp));

    parts.join("\n")
}

/// The four named surfaces from the `.ts` `aiContextPresets`.
///
/// `mcp` and `claude` were byte-identical in the `.ts`, as were `copilot` and
/// `cursor`. Kept as four names because callers reference them by name, with the
/// duplication stated rather than hidden.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Preset {
    /// Full context for the MCP server.
    Mcp,
    /// Rules and node map, no architecture prose.
    Copilot,
    /// Full context. Identical to [`Preset::Mcp`].
    Claude,
    /// Rules and node map. Identical to [`Preset::Copilot`].
    Cursor,
}

impl Preset {
    /// Options for this surface.
    #[must_use]
    pub fn options(self, counts: Option<EcosystemCounts>) -> AiContextOptions {
        match self {
            Self::Mcp | Self::Claude => AiContextOptions {
                counts,
                ..AiContextOptions::default()
            },
            Self::Copilot | Self::Cursor => AiContextOptions {
                counts: None,
                include_architecture: false,
                ..AiContextOptions::default()
            },
        }
    }

    /// Render this surface's context window.
    #[must_use]
    pub fn render(self, counts: Option<EcosystemCounts>) -> String {
        generate_ai_context(&self.options(counts))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_includes_all_three_sections() {
        let s = generate_ai_context(&AiContextOptions::default());
        assert!(s.contains("# Mzizi Design System"));
        assert!(s.contains("## Node map"));
        assert!(s.contains("## Rules (non-negotiable)"));
    }

    #[test]
    fn the_node_map_reaches_past_n10() {
        // The whole reason this file diverges: the .ts stops at N10.
        let s = generate_ai_context(&AiContextOptions::default());
        assert!(s.contains("N11"), "N11 discovery is missing");
        assert!(s.contains("N12"), "N12 skills is missing");
    }

    #[test]
    fn it_says_the_node_set_is_uncapped() {
        let s = generate_ai_context(&AiContextOptions::default());
        assert!(s.contains("UNCAPPED"));
    }

    #[test]
    fn the_retired_axis_model_is_gone() {
        let s = generate_ai_context(&AiContextOptions::default());
        for retired in ["horizontal", "vertical", "outlier", "depth"] {
            assert!(
                !s.contains(retired),
                "retired axis word {retired} survived the port"
            );
        }
    }

    #[test]
    fn the_repo_slug_is_the_real_one() {
        let s = generate_ai_context(&AiContextOptions::default());
        assert!(s.contains("nyuchi/mzizi"));
        assert!(!s.contains("design-portal"));
    }

    #[test]
    fn counts_appear_only_when_supplied() {
        let without = generate_ai_context(&AiContextOptions::default());
        assert!(!without.contains("Live counts"));
        assert!(without.contains("For live counts"));

        let with = generate_ai_context(&AiContextOptions {
            counts: Some(EcosystemCounts {
                total_components: 575,
                total_stable: 500,
                total_nodes: 12,
            }),
            ..AiContextOptions::default()
        });
        assert!(with.contains("575 components total, 500 stable, across 12 nodes"));
        assert!(!with.contains("For live counts"));
    }

    #[test]
    fn caller_supplied_nodes_replace_the_default() {
        let s = generate_ai_context(&AiContextOptions {
            nodes: vec![NodeEntry::new(
                42,
                "Future",
                "A node nobody has invented yet.",
            )],
            ..AiContextOptions::default()
        });
        assert!(s.contains("N42"));
        assert!(s.contains("A node nobody has invented yet."));
        assert!(!s.contains("Primitives"), "the default map leaked through");
    }

    #[test]
    fn the_table_aligns_at_any_node_count() {
        // The .ts hand-aligned ten rows, so an eleventh could not be added
        // without redoing the whitespace.
        let s = render_node_map(&[
            NodeEntry::new(1, "A", "short"),
            NodeEntry::new(2, "AVeryLongLabelIndeed", "long"),
        ]);
        // Filter on the row prefix, not on " — ": the intro paragraph above the
        // rows contains an em dash too, and matching it compared a prose line
        // against a table row.
        let lines: Vec<&str> = s.lines().filter(|l| l.starts_with("  N")).collect();
        assert_eq!(lines.len(), 2);
        let col = |l: &str| l.find(" — ").unwrap();
        assert_eq!(col(lines[0]), col(lines[1]));
    }

    #[test]
    fn presets_that_the_ts_made_identical_stay_identical() {
        assert_eq!(Preset::Mcp.render(None), Preset::Claude.render(None));
        assert_eq!(Preset::Copilot.render(None), Preset::Cursor.render(None));
    }

    #[test]
    fn ide_presets_drop_the_architecture_prose_only() {
        let s = Preset::Copilot.render(None);
        assert!(!s.contains("# Mzizi Design System"));
        assert!(s.contains("## Node map"));
        assert!(s.contains("## Rules"));
    }

    #[test]
    fn endpoints_are_overridable() {
        let s = generate_ai_context(&AiContextOptions {
            endpoints: Endpoints {
                site: "https://example.test".to_owned(),
                repo: "acme/thing".to_owned(),
                mcp: "https://example.test/mcp".to_owned(),
            },
            ..AiContextOptions::default()
        });
        assert!(s.contains("acme/thing"));
        assert!(!s.contains("nyuchi/mzizi"));
    }
}
