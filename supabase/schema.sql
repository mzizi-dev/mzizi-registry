-- Nyuchi Design Portal — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the document store.
--
-- Tables:
--   components       — Component metadata (replaces registry.json entries)
--   component_docs   — Component documentation (use cases, features, variants)
--   component_demos  — Demo configuration per component
--
-- All tables have RLS enabled with public read access.
-- Write access requires the service_role key (used by seed script and API).

-- ─── Components ─────────────────────────────────────────────────────

create table if not exists components (
  id bigint primary key generated always as identity,
  name text not null unique,
  registry_type text not null default 'registry:ui',
  description text not null default '',
  dependencies jsonb not null default '[]'::jsonb,
  registry_dependencies jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  category text,
  layer text default 'primitive',
  is_mukoko_component boolean default false,
  tags text[] default '{}',
  added_in_version text default '7.0.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table components is 'Nyuchi Design Portal component metadata — source of truth for the shadcn-compatible registry API.';

-- ─── Component Docs ─────────────────────────────────────────────────

create table if not exists component_docs (
  id bigint primary key generated always as identity,
  component_name text not null unique references components(name) on delete cascade,
  use_cases text[] not null default '{}',
  variants text[] default '{}',
  sizes text[] default '{}',
  features text[] default '{}',
  a11y text[] default '{}',
  examples jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table component_docs is 'Documentation for each registry component — use cases, variants, features.';

-- ─── Component Demos ────────────────────────────────────────────────

create table if not exists component_demos (
  id bigint primary key generated always as identity,
  component_name text not null unique references components(name) on delete cascade,
  has_demo boolean not null default true,
  demo_type text default 'interactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table component_demos is 'Tracks which components have interactive demos.';

-- ─── Updated-at trigger ─────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger components_updated_at
  before update on components
  for each row execute function update_updated_at();

create or replace trigger component_docs_updated_at
  before update on component_docs
  for each row execute function update_updated_at();

create or replace trigger component_demos_updated_at
  before update on component_demos
  for each row execute function update_updated_at();

-- ─── RLS — public read, service_role write ──────────────────────────

alter table components enable row level security;
alter table component_docs enable row level security;
alter table component_demos enable row level security;

-- Public read access (anon + authenticated can SELECT)
create policy "public read components"
  on components for select to anon, authenticated
  using (true);

create policy "public read component_docs"
  on component_docs for select to anon, authenticated
  using (true);

create policy "public read component_demos"
  on component_demos for select to anon, authenticated
  using (true);

-- Write access for authenticated users (admin/contributors)
-- In production, tighten this to specific roles or user IDs.
create policy "authenticated write components"
  on components for all to authenticated
  using (true)
  with check (true);

create policy "authenticated write component_docs"
  on component_docs for all to authenticated
  using (true)
  with check (true);

create policy "authenticated write component_demos"
  on component_demos for all to authenticated
  using (true)
  with check (true);

-- ─── Source code column on components ───────────────────────────────

alter table components add column if not exists source_code text;

comment on column components.source_code is 'Inline source code for the component, populated by seed script from filesystem.';

-- ─── Brand Minerals ────────────────────────────────────────────────

create table if not exists brand_minerals (
  id bigint primary key generated always as identity,
  name text not null unique,
  hex text not null,
  light_hex text not null,
  dark_hex text not null,
  container_light text not null,
  container_dark text not null,
  css_var text not null,
  origin text not null,
  symbolism text not null,
  usage text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_minerals is 'Five African Minerals — canonical color palette for the Mukoko design system.';

create or replace trigger brand_minerals_updated_at
  before update on brand_minerals
  for each row execute function update_updated_at();

alter table brand_minerals enable row level security;

create policy "public read brand_minerals"
  on brand_minerals for select to anon, authenticated
  using (true);

create policy "authenticated write brand_minerals"
  on brand_minerals for all to authenticated
  using (true)
  with check (true);

-- ─── Brand Semantic Colors ─────────────────────────────────────────

create table if not exists brand_semantic_colors (
  id bigint primary key generated always as identity,
  name text not null unique,
  light_value text not null,
  dark_value text not null,
  usage text not null,
  color_type text not null default 'semantic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_semantic_colors is 'Semantic and background color tokens for the Mukoko design system.';

create or replace trigger brand_semantic_colors_updated_at
  before update on brand_semantic_colors
  for each row execute function update_updated_at();

alter table brand_semantic_colors enable row level security;

create policy "public read brand_semantic_colors"
  on brand_semantic_colors for select to anon, authenticated
  using (true);

create policy "authenticated write brand_semantic_colors"
  on brand_semantic_colors for all to authenticated
  using (true)
  with check (true);

-- ─── Brand Typography ──────────────────────────────────────────────

create table if not exists brand_typography (
  id bigint primary key generated always as identity,
  name text not null unique,
  entry_type text not null default 'scale',
  size_px int,
  size_rem text,
  line_height text,
  weight int,
  font text,
  usage text not null,
  family text,
  reason text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_typography is 'Font families and type scale entries for the Mukoko design system.';

create or replace trigger brand_typography_updated_at
  before update on brand_typography
  for each row execute function update_updated_at();

alter table brand_typography enable row level security;

create policy "public read brand_typography"
  on brand_typography for select to anon, authenticated
  using (true);

create policy "authenticated write brand_typography"
  on brand_typography for all to authenticated
  using (true)
  with check (true);

-- ─── Brand Spacing ─────────────────────────────────────────────────

create table if not exists brand_spacing (
  id bigint primary key generated always as identity,
  name text not null unique,
  px int not null,
  rem text not null,
  usage text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_spacing is 'Spacing scale tokens for the Mukoko design system.';

create or replace trigger brand_spacing_updated_at
  before update on brand_spacing
  for each row execute function update_updated_at();

alter table brand_spacing enable row level security;

create policy "public read brand_spacing"
  on brand_spacing for select to anon, authenticated
  using (true);

create policy "authenticated write brand_spacing"
  on brand_spacing for all to authenticated
  using (true)
  with check (true);

-- ─── Brand Ecosystem ───────────────────────────────────────────────

create table if not exists brand_ecosystem (
  id bigint primary key generated always as identity,
  name text not null unique,
  meaning text not null,
  language text not null,
  role text not null,
  mineral text not null,
  url text not null,
  description text not null,
  voice text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_ecosystem is 'Ecosystem brands (bundu, nyuchi, mukoko, shamwari, nhimbe).';

create or replace trigger brand_ecosystem_updated_at
  before update on brand_ecosystem
  for each row execute function update_updated_at();

alter table brand_ecosystem enable row level security;

create policy "public read brand_ecosystem"
  on brand_ecosystem for select to anon, authenticated
  using (true);

create policy "authenticated write brand_ecosystem"
  on brand_ecosystem for all to authenticated
  using (true)
  with check (true);

-- ─── Brand Meta ────────────────────────────────────────────────────

create table if not exists brand_meta (
  id bigint primary key generated always as identity,
  version text not null,
  name text not null,
  last_updated text not null,
  homepage text not null,
  philosophy jsonb not null default '{}'::jsonb,
  voice_and_tone jsonb not null default '{}'::jsonb,
  accessibility jsonb not null default '{}'::jsonb,
  radii jsonb not null default '{}'::jsonb,
  component_specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table brand_meta is 'Brand system metadata — single row table for version, philosophy, voice, etc.';

create or replace trigger brand_meta_updated_at
  before update on brand_meta
  for each row execute function update_updated_at();

alter table brand_meta enable row level security;

create policy "public read brand_meta"
  on brand_meta for select to anon, authenticated
  using (true);

create policy "authenticated write brand_meta"
  on brand_meta for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Principles ───────────────────────────────────────

create table if not exists architecture_principles (
  id bigint primary key generated always as identity,
  name text not null unique,
  title text not null,
  description text not null,
  rationale text not null,
  implementation text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_principles is 'Five architecture principles for the Mukoko ecosystem.';

create or replace trigger architecture_principles_updated_at
  before update on architecture_principles
  for each row execute function update_updated_at();

alter table architecture_principles enable row level security;

create policy "public read architecture_principles"
  on architecture_principles for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_principles"
  on architecture_principles for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Framework ────────────────────────────────────────

create table if not exists architecture_framework (
  id bigint primary key generated always as identity,
  name text not null unique,
  approach text not null,
  framework text not null,
  rationale text not null,
  sovereignty_advantage text not null,
  platforms jsonb not null default '[]'::jsonb,
  harmony_os jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_framework is 'Framework decision — single row for Next.js + Capacitor strategy.';

create or replace trigger architecture_framework_updated_at
  before update on architecture_framework
  for each row execute function update_updated_at();

alter table architecture_framework enable row level security;

create policy "public read architecture_framework"
  on architecture_framework for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_framework"
  on architecture_framework for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Data Layer ───────────────────────────────────────

create table if not exists architecture_data_layer (
  id bigint primary key generated always as identity,
  name text not null unique,
  role text not null,
  platform text not null,
  description text not null,
  sovereignty jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_data_layer is 'Local-first data layer technologies with sovereignty assessments.';

create or replace trigger architecture_data_layer_updated_at
  before update on architecture_data_layer
  for each row execute function update_updated_at();

alter table architecture_data_layer enable row level security;

create policy "public read architecture_data_layer"
  on architecture_data_layer for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_data_layer"
  on architecture_data_layer for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Cloud Layer ──────────────────────────────────────

create table if not exists architecture_cloud_layer (
  id bigint primary key generated always as identity,
  name text not null unique,
  role text not null,
  consistency_model text not null,
  database text not null,
  data_categories jsonb not null default '[]'::jsonb,
  description text not null,
  sovereignty jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_cloud_layer is 'Cloud services with sovereignty assessments.';

create or replace trigger architecture_cloud_layer_updated_at
  before update on architecture_cloud_layer
  for each row execute function update_updated_at();

alter table architecture_cloud_layer enable row level security;

create policy "public read architecture_cloud_layer"
  on architecture_cloud_layer for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_cloud_layer"
  on architecture_cloud_layer for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Pipeline ─────────────────────────────────────────

create table if not exists architecture_pipeline (
  id bigint primary key generated always as identity,
  name text not null unique,
  role text not null,
  description text not null,
  sovereignty jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_pipeline is 'Open data pipeline stages with sovereignty assessments.';

create or replace trigger architecture_pipeline_updated_at
  before update on architecture_pipeline
  for each row execute function update_updated_at();

alter table architecture_pipeline enable row level security;

create policy "public read architecture_pipeline"
  on architecture_pipeline for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_pipeline"
  on architecture_pipeline for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Data Ownership ───────────────────────────────────

create table if not exists architecture_data_ownership (
  id bigint primary key generated always as identity,
  category text not null unique,
  consistency_model text not null,
  database text not null,
  examples jsonb not null default '[]'::jsonb,
  conflict_resolution text not null,
  ownership text not null,
  description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_data_ownership is 'Data ownership rules — personal, community, platform-open.';

create or replace trigger architecture_data_ownership_updated_at
  before update on architecture_data_ownership
  for each row execute function update_updated_at();

alter table architecture_data_ownership enable row level security;

create policy "public read architecture_data_ownership"
  on architecture_data_ownership for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_data_ownership"
  on architecture_data_ownership for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Sovereignty ──────────────────────────────────────

create table if not exists architecture_sovereignty (
  id bigint primary key generated always as identity,
  technology text not null unique,
  role text not null,
  license text not null,
  governance text not null,
  sovereignty_risk text not null,
  forkable boolean not null default true,
  self_hostable boolean not null default true,
  rationale text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_sovereignty is 'Technology sovereignty assessments for the full stack.';

create or replace trigger architecture_sovereignty_updated_at
  before update on architecture_sovereignty
  for each row execute function update_updated_at();

alter table architecture_sovereignty enable row level security;

create policy "public read architecture_sovereignty"
  on architecture_sovereignty for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_sovereignty"
  on architecture_sovereignty for all to authenticated
  using (true)
  with check (true);

-- ─── Architecture Removed ──────────────────────────────────────────

create table if not exists architecture_removed (
  id bigint primary key generated always as identity,
  name text not null unique,
  previous_role text not null,
  reason text not null,
  replacement text not null,
  migration_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table architecture_removed is 'Technologies removed from the Mukoko stack with rationale.';

create or replace trigger architecture_removed_updated_at
  before update on architecture_removed
  for each row execute function update_updated_at();

alter table architecture_removed enable row level security;

create policy "public read architecture_removed"
  on architecture_removed for select to anon, authenticated
  using (true);

create policy "authenticated write architecture_removed"
  on architecture_removed for all to authenticated
  using (true)
  with check (true);

-- ─── Blocks ───────────────────────────────────────────────────────

create table if not exists blocks (
  id bigint primary key generated always as identity,
  name text not null unique,
  block_type text not null default 'page',
  category text not null,
  description text not null default '',
  dependencies jsonb not null default '[]'::jsonb,
  registry_dependencies jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  source_code text,
  tags text[] default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table blocks is 'Pre-built page blocks (dashboard, login, signup, sidebar, chart examples).';

create or replace trigger blocks_updated_at
  before update on blocks
  for each row execute function update_updated_at();

alter table blocks enable row level security;

create policy "public read blocks"
  on blocks for select to anon, authenticated
  using (true);

create policy "authenticated write blocks"
  on blocks for all to authenticated
  using (true)
  with check (true);

-- ─── Portal Pages ─────────────────────────────────────────────────

create table if not exists portal_pages (
  id bigint primary key generated always as identity,
  slug text not null unique,
  section text not null,
  title text not null,
  description text not null default '',
  content text not null default '',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table portal_pages is 'Nyuchi Design Portal documentation pages — all content served from DB.';

create or replace trigger portal_pages_updated_at
  before update on portal_pages
  for each row execute function update_updated_at();

alter table portal_pages enable row level security;

create policy "public read portal_pages"
  on portal_pages for select to anon, authenticated
  using (true);

create policy "authenticated write portal_pages"
  on portal_pages for all to authenticated
  using (true)
  with check (true);

-- ─── Indexes ────────────────────────────────────────────────────────

create index if not exists idx_components_category on components(category);
create index if not exists idx_components_layer on components(layer);
create index if not exists idx_components_name on components(name);
create index if not exists idx_components_tags on components using gin(tags);
create index if not exists idx_component_docs_name on component_docs(component_name);
create index if not exists idx_component_demos_name on component_demos(component_name);

create index if not exists idx_brand_minerals_name on brand_minerals(name);
create index if not exists idx_brand_minerals_sort on brand_minerals(sort_order);
create index if not exists idx_brand_semantic_colors_name on brand_semantic_colors(name);
create index if not exists idx_brand_semantic_colors_type on brand_semantic_colors(color_type);
create index if not exists idx_brand_typography_type on brand_typography(entry_type);
create index if not exists idx_brand_typography_sort on brand_typography(sort_order);
create index if not exists idx_brand_spacing_sort on brand_spacing(sort_order);
create index if not exists idx_brand_ecosystem_name on brand_ecosystem(name);
create index if not exists idx_brand_ecosystem_sort on brand_ecosystem(sort_order);

create index if not exists idx_arch_principles_name on architecture_principles(name);
create index if not exists idx_arch_principles_sort on architecture_principles(sort_order);
create index if not exists idx_arch_framework_name on architecture_framework(name);
create index if not exists idx_arch_data_layer_name on architecture_data_layer(name);
create index if not exists idx_arch_data_layer_sort on architecture_data_layer(sort_order);
create index if not exists idx_arch_cloud_layer_name on architecture_cloud_layer(name);
create index if not exists idx_arch_cloud_layer_sort on architecture_cloud_layer(sort_order);
create index if not exists idx_arch_pipeline_name on architecture_pipeline(name);
create index if not exists idx_arch_pipeline_sort on architecture_pipeline(sort_order);
create index if not exists idx_arch_data_ownership_category on architecture_data_ownership(category);
create index if not exists idx_arch_sovereignty_technology on architecture_sovereignty(technology);
create index if not exists idx_arch_removed_name on architecture_removed(name);

create index if not exists idx_blocks_name on blocks(name);
create index if not exists idx_blocks_category on blocks(category);
create index if not exists idx_blocks_type on blocks(block_type);
create index if not exists idx_blocks_tags on blocks using gin(tags);
create index if not exists idx_blocks_sort on blocks(sort_order);

create index if not exists idx_portal_pages_slug on portal_pages(slug);
create index if not exists idx_portal_pages_section on portal_pages(section);
create index if not exists idx_portal_pages_sort on portal_pages(sort_order);
