-- Migration: architecture_frontend_axes + architecture_frontend_layers
-- Issue: #46 "Frontend Architecture Layers — Table-Backed Doctrine"
--
-- DDL only. Seeding the five axes and ten layers is done out-of-band
-- against the live database so production data is never overwritten
-- by a PR merge. The fallback dataset baked into
-- `lib/db/getArchitectureFrontendAxes()` / `...Layers()` covers any
-- deployment that hits the tables before they're populated.
--
-- Tables:
--   public.architecture_frontend_axes    — 5 rows expected (X / Y / Z / Outside / Documentation)
--   public.architecture_frontend_layers  — 10 rows expected (L1 tokens .. L10 documentation)

begin;

-- public.update_updated_at() is defined in migration 20260407071000_initial_schema
-- and hardened in 20260417225802_harden_function_search_paths. Do not redefine
-- here — redefining without `set search_path to 'public'` would silently strip
-- the hardening.

create table if not exists public.architecture_frontend_axes (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  title        text not null,
  description  text not null,
  geometry     text not null check (geometry in ('horizontal','vertical','depth','external')),
  metaphor     text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.architecture_frontend_axes is
  'The five axes of the 3D frontend architecture: X (horizontal composition), Y (vertical infrastructure), Z (depth observation), Outside (actors beyond the build), Documentation (the system describing itself).';

alter table public.architecture_frontend_axes enable row level security;

drop policy if exists "public read architecture_frontend_axes"
  on public.architecture_frontend_axes;
create policy "public read architecture_frontend_axes"
  on public.architecture_frontend_axes
  for select
  to anon, authenticated
  using (true);

drop trigger if exists architecture_frontend_axes_updated_at
  on public.architecture_frontend_axes;
create trigger architecture_frontend_axes_updated_at
  before update on public.architecture_frontend_axes
  for each row execute function public.update_updated_at();

create table if not exists public.architecture_frontend_layers (
  id                    bigint generated always as identity primary key,
  layer_number          integer not null unique check (layer_number between 1 and 10),
  sub_label             text not null unique,
  title                 text not null,
  axis_name             text not null references public.architecture_frontend_axes(name) on update cascade,
  role                  text not null,
  description           text not null,
  covenant              text not null,
  stakeholder           text not null,
  implementation_rules  jsonb not null default '[]'::jsonb,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.architecture_frontend_layers is
  'The ten layers of the 3D frontend architecture. Each layer belongs to exactly one axis (architecture_frontend_axes.name FK). Components in `components.architecture_layer` reference layer_number.';

alter table public.architecture_frontend_layers enable row level security;

drop policy if exists "public read architecture_frontend_layers"
  on public.architecture_frontend_layers;
create policy "public read architecture_frontend_layers"
  on public.architecture_frontend_layers
  for select
  to anon, authenticated
  using (true);

drop trigger if exists architecture_frontend_layers_updated_at
  on public.architecture_frontend_layers;
create trigger architecture_frontend_layers_updated_at
  before update on public.architecture_frontend_layers
  for each row execute function public.update_updated_at();

create index if not exists architecture_frontend_layers_axis_idx
  on public.architecture_frontend_layers (axis_name);

commit;
