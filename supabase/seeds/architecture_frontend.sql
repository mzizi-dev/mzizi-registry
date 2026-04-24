-- Seed data for issue #46: populate `architecture_frontend_axes` and
-- `architecture_frontend_layers` so the 3D architecture explorer has
-- something to render (see `components/landing/architecture-canvas.tsx`
-- and the `ArchitectureExplorer` empty-state fallback).
--
-- This file is intended to be applied out-of-band by a maintainer with
-- SUPABASE_SERVICE_ROLE_KEY (the schema is anon-readable but RLS blocks
-- anon writes on these doctrine tables). The Claude Code web session
-- that authored it does not have service-role access.
--
-- Apply:
--   psql "$SUPABASE_DB_URL" -f supabase/seeds/architecture_frontend.sql
--   -- or via the Supabase Dashboard SQL editor
--
-- Idempotent: each INSERT is guarded by a `WHERE NOT EXISTS` so re-running
-- is safe. To refresh row content, run a manual UPDATE or TRUNCATE first.
--
-- Doctrine source: CLAUDE.md §6.2 (3D frontend architecture — ten layers
-- across five axes). Keep this file in sync with that section.

BEGIN;

-- ── Five axes ─────────────────────────────────────────────────────────

INSERT INTO public.architecture_frontend_axes
  (name, title, description, geometry, metaphor, sort_order)
SELECT * FROM (VALUES
  (
    'X-axis',
    'Horizontal composition',
    'The axis the user sees. Primitives combine into brand components, brand components compose into pages, and pages live inside the shell. Composition flows left to right along this axis.',
    'horizontal',
    'What the user sees',
    1
  ),
  (
    'Y-axis',
    'Vertical infrastructure',
    'The axis that threads through every layer on the X-axis. Tokens, safety, and resilience are infrastructure — they do not live at one point in the composition, they pass through it.',
    'vertical',
    'What holds the product up',
    2
  ),
  (
    'Z-axis',
    'Depth observation',
    'The axis that watches. Assurance is the observer — outside the composition on the X-axis and outside the infrastructure on the Y-axis. Depth means it can see both without being inside either.',
    'depth',
    'What watches the product',
    3
  ),
  (
    'Outside',
    'External actors',
    'Beyond the build. Fundi (L9) lives here — a self-healing actor that reads assurance signals and opens issues when patterns emerge. Not part of any user-facing code path.',
    'external',
    'What heals when the product breaks',
    4
  ),
  (
    'Documentation',
    'Self-describing system',
    'The axis that turns the system into its own reference. Every component, token, doc page, and changelog entry lives in the database and renders live — drift is structurally impossible.',
    'external',
    'How the system describes itself',
    5
  )
) AS v(name, title, description, geometry, metaphor, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.architecture_frontend_axes a WHERE a.name = v.name
);

-- ── Ten layers ────────────────────────────────────────────────────────
--
-- Each row's `implementation_rules` column is typed as text[] in the
-- TypeScript row shape. If the actual column is `jsonb` instead, swap
-- `ARRAY[...]::text[]` for `jsonb_build_array(...)` and rerun.

INSERT INTO public.architecture_frontend_layers
  (layer_number, sub_label, title, axis_name, role, description, covenant, stakeholder, implementation_rules, sort_order)
SELECT * FROM (VALUES
  (
    1,
    'tokens',
    'Design tokens',
    'Y-axis',
    'L1 — the only layer allowed to define CSS values',
    'Design decisions expressed as CSS custom properties in ``app/globals.css``. Every other layer reads these via ``var()`` — no layer above ever declares its own colour, radius, spacing, or motion duration.',
    'Design decisions are data, not code.',
    'Design system maintainer',
    ARRAY[
      'Define every value in ``:root`` and ``.dark`` blocks.',
      'Register tokens in the Tailwind ``@theme inline`` block so utility classes resolve.',
      'No hardcoded hex values, rgba(), or inline ``style={{}}`` outside L1.',
      'Category-to-mineral mapping lives here, not in components.'
    ]::text[],
    1
  ),
  (
    2,
    'primitive',
    'Primitives',
    'X-axis',
    'L2 — smallest composable unit of UI',
    'Headless, accessible primitives built on Radix UI + CVA. One component, one responsibility. Primitives never know about the brand — that is L3 is job.',
    'A primitive does one thing well.',
    'Component library author',
    ARRAY[
      'One CVA ``variants`` block per primitive; no inline conditional classes.',
      'Expose ``asChild`` / Slot where composition matters.',
      'Use Radix UI for focus, keyboard, and screen-reader behaviour.',
      '56px default / 48px minimum touch target.'
    ]::text[],
    2
  ),
  (
    3,
    'brand',
    'Brand components',
    'X-axis',
    'L3 — primitives wrapped in Ubuntu',
    'Brand components are L2 primitives extended with Nyuchi harness wiring: observability logging, motion presets, a11y live regions, and health reporting. This is where "I am because we are" lands in code.',
    'A brand component is a primitive with Ubuntu in it.',
    'Brand system steward',
    ARRAY[
      'Always destructure ``{ log, motion, LiveRegion }`` from ``useNyuchiHarness``.',
      'L2 primitives never import ``useNyuchiHarness`` directly.',
      'Every brand component carries a ``data-slot`` attribute for stable targeting.',
      'Use mineral palette tokens, not raw colour values.'
    ]::text[],
    3
  ),
  (
    4,
    'safety',
    'Safety rails',
    'Y-axis',
    'L4 — input validation, output sanitisation, AI guardrails',
    'The layer between user input and everything below it. Validates shape, length, encoding, and intent before any primitive or brand component trusts a value. Wraps AI calls with system-level policy so hallucinations never reach the UI unchecked.',
    'Nothing harmful reaches the user.',
    'Security + safety engineer',
    ARRAY[
      'Validate all external input with Zod schemas at the entry point.',
      'Sanitise every rich-text or MDX payload before render.',
      'Wrap AI completions with the ai-safety lib (see ``registry:lib``).',
      'Treat every third-party response as untrusted until it clears L4.'
    ]::text[],
    4
  ),
  (
    5,
    'resilience',
    'Resilience patterns',
    'Y-axis',
    'L5 — circuit breakers, retries, timeouts, fallback chains',
    'Threads fault-tolerance through every section. A failure in one primitive, one brand component, one page — never takes the whole shell down. Implemented as the ``nyuchi-resilience`` registry:lib, installed by consumers via the shadcn CLI.',
    'Failure in one part never breaks the whole.',
    'Reliability engineer',
    ARRAY[
      'Wrap every async boundary in ``SectionErrorBoundary``.',
      'Use the resilience lib primitives: circuit-breaker, retry, timeout, fallback-chain, bulkhead, rate-limiter.',
      'No global error handler swallows section-level failures silently.',
      'Chaos tests exercise the resilience paths before every release.'
    ]::text[],
    5
  ),
  (
    6,
    'pages',
    'Pages',
    'X-axis',
    'L6 — composition of L2 and L3, nothing implemented',
    'A page is a composition, not an implementation. L6 never hardcodes a button, a card, or an SVG — it arranges L2 primitives and L3 brand components. If a page invents UI, that UI belongs in L2 or L3, not in the page.',
    'A page is a composition, not an implementation.',
    'Product engineer',
    ARRAY[
      'Pages import from L2 and L3, never define new primitives.',
      'All copy, data, and metadata come from the database or props — not hardcoded.',
      'Pages can be server components by default; promote to client only when hooks are required.',
      'A page that renders a spinner or a skeleton pulls it from L2, never inlines one.'
    ]::text[],
    6
  ),
  (
    7,
    'shell',
    'Shell',
    'X-axis',
    'L7 — the app chrome: header, footer, navigation, theme',
    'The shell holds the product. Sticky header, full-navigation footer, theme switcher, authentication surface, observability status — everything that persists across page transitions lives here. Every consumer app of this registry has one shell, many pages.',
    'The shell holds the product.',
    'Platform engineer',
    ARRAY[
      'One ``<Header />`` + one ``<Footer />`` per app — the shell is singular.',
      'Shell components are the only place sticky positioning, backdrop blur, and theme-provider wiring live.',
      'The shell surfaces authentication state but never implements auth logic.',
      'Responsive by default across every breakpoint from 320px to ultra-wide.'
    ]::text[],
    7
  ),
  (
    8,
    'assurance',
    'Assurance',
    'Z-axis',
    'L8 — observability, health monitoring, SLO tracking',
    'The layer that watches. Collects structured logs, latency timings, error rates, and custom health signals from every X-axis and Y-axis layer and feeds them to dashboards and to L9 (fundi). Assurance is read-only from the build side — it never mutates application state.',
    'What breaks is seen before users feel it.',
    'Observability engineer',
    ARRAY[
      'Every brand component emits render timing + error events via the harness.',
      'Structured logs use the ``[mukoko]`` prefix for grep-ability.',
      'MCP / API usage flows into ``lib/metrics.ts``.',
      'Health signals are exposed at ``/api/v1/health``; assurance dashboards read from there.'
    ]::text[],
    8
  ),
  (
    9,
    'fundi',
    'Fundi',
    'Outside',
    'L9 — self-healing actor outside the build',
    'Fundi (Shona for "artisan / skilled tradesperson") reads assurance signals and turns recurring failures into GitHub issues that a human or Claude Code can resolve. It lives outside the build path: the app does not depend on fundi to function, but fundi keeps the app from going stale.',
    'Failure is a learning event, not a user-facing incident.',
    'Fundi operator',
    ARRAY[
      'Edge-function ingest validates + deduplicates incoming failures.',
      'Cron-driven heal pass promotes fingerprinted failures into labelled GitHub issues.',
      'Append-only healing log at ``fundi_issues`` for full auditability.',
      'On by default for nyuchi / mukoko; opt-in for external consumers.'
    ]::text[],
    9
  ),
  (
    10,
    'documentation',
    'Documentation',
    'Documentation',
    'L10 — the system documents itself',
    'Every component, doc page, brand spec, changelog entry, and architecture rule lives in Supabase and is served live through ``/api/v1/*`` and the MCP server at ``/mcp``. Nothing is copy-pasted into a static file. Drift is structurally impossible.',
    'The system documents itself.',
    'Docs maintainer',
    ARRAY[
      '``documentation_pages`` table renders to ``/docs/[slug]`` via ``components/docs/db-doc-page.tsx``.',
      '``/api/v1/*`` endpoints serve the same database content to any consumer.',
      '``registry.json`` is a CI-verified snapshot, never hand-edited (``pnpm registry:verify``).',
      'MCP tools surface live counts; AI assistants never quote a stale number.'
    ]::text[],
    10
  )
) AS v(layer_number, sub_label, title, axis_name, role, description, covenant, stakeholder, implementation_rules, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.architecture_frontend_layers l WHERE l.layer_number = v.layer_number
);

COMMIT;

-- Verify:
--   SELECT count(*) FROM public.architecture_frontend_axes;    -- expected: 5
--   SELECT count(*) FROM public.architecture_frontend_layers;  -- expected: 10
