-- Mukoko Registry — Supabase Schema
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

comment on table components is 'Mukoko Registry component metadata — source of truth for the shadcn-compatible registry API.';

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

-- ─── Indexes ────────────────────────────────────────────────────────

create index if not exists idx_components_category on components(category);
create index if not exists idx_components_layer on components(layer);
create index if not exists idx_components_name on components(name);
create index if not exists idx_components_tags on components using gin(tags);
create index if not exists idx_component_docs_name on component_docs(component_name);
create index if not exists idx_component_demos_name on component_demos(component_name);
