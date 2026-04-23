-- Migration: ubuntu_pillars + ubuntu_principles
-- Issue: #45 "Ubuntu Five Pillars & Five Principles — structural doctrine"
--
-- Adds the structural Ubuntu model (two five-fold sets) underneath the
-- existing Five Ubuntu Questions. DDL only — seeding is done out-of-band
-- against the live database so production data is never overwritten by a
-- PR merge.
--
-- Scholarly provenance of the intended seed:
--   - Mugumbate, J. et al. (2023). Social Work Education, 43(4).
--   - Mbigi, L. (1997). Ubuntu: The African Dream in Management.
--     Collective Fingers Theory — chara chimwe hachitswanyi inda.
--
-- Tables:
--   public.ubuntu_pillars     — 5 rows expected (Mhuri, Nharaunda, Vanhu, Zvakatipoteredza, Unhu)
--   public.ubuntu_principles  — 5 rows expected (Kurarama, Kubatana, Tsitsi, Ruremekedzo, Chiremerera)
--   public.get_ubuntu_counts() — plural count function matching project convention

begin;

-- public.update_updated_at() is defined in migration 20260407071000_initial_schema
-- and hardened in 20260417225802_harden_function_search_paths. Do not redefine
-- here — redefining without `set search_path to 'public'` would silently strip
-- the hardening.

-- ── ubuntu_pillars ────────────────────────────────────────────────────
create table if not exists public.ubuntu_pillars (
  id                bigint generated always as identity primary key,
  name              text not null unique,
  shona             text not null,
  title             text not null,
  description       text not null,
  sphere            text not null,
  platform_surface  text not null,
  source            text not null,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.ubuntu_pillars is
  'The five spheres Ubuntu exists within (Mugumbate et al. 2023). Where a person is situated in the web of relationships. One of three five-fold expressions of Ubuntu in the doctrine: Questions (filter), Pillars (context), Principles (behaviour).';

alter table public.ubuntu_pillars enable row level security;

drop policy if exists "public read ubuntu_pillars" on public.ubuntu_pillars;
create policy "public read ubuntu_pillars"
  on public.ubuntu_pillars for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated write ubuntu_pillars" on public.ubuntu_pillars;
create policy "authenticated write ubuntu_pillars"
  on public.ubuntu_pillars for all
  to authenticated
  using (true) with check (true);

drop trigger if exists ubuntu_pillars_updated_at on public.ubuntu_pillars;
create trigger ubuntu_pillars_updated_at
  before update on public.ubuntu_pillars
  for each row execute function public.update_updated_at();

-- ── ubuntu_principles ────────────────────────────────────────────────
create table if not exists public.ubuntu_principles (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  shona        text not null,
  title        text not null,
  description  text not null,
  expression   text not null,
  source       text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.ubuntu_principles is
  'The five behavioural virtues of Ubuntu (Mbigi 1997, Collective Fingers Theory / chara chimwe hachitswanyi inda). How a person embodies Ubuntu. Paired with ubuntu_pillars — two hands of five fingers.';

alter table public.ubuntu_principles enable row level security;

drop policy if exists "public read ubuntu_principles" on public.ubuntu_principles;
create policy "public read ubuntu_principles"
  on public.ubuntu_principles for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated write ubuntu_principles" on public.ubuntu_principles;
create policy "authenticated write ubuntu_principles"
  on public.ubuntu_principles for all
  to authenticated
  using (true) with check (true);

drop trigger if exists ubuntu_principles_updated_at on public.ubuntu_principles;
create trigger ubuntu_principles_updated_at
  before update on public.ubuntu_principles
  for each row execute function public.update_updated_at();

-- ── get_ubuntu_counts() ──────────────────────────────────────────────
-- Follows the existing get_*_counts() plural, table-returning convention
-- (see get_token_counts / get_layer_counts).

create or replace function public.get_ubuntu_counts()
  returns table(
    ubuntu_category text,
    item_count      bigint,
    table_name      text
  )
  language sql
  stable
  set search_path to 'public'
  as $function$
    select 'Pillars'::text,    count(*)::bigint, 'ubuntu_pillars'::text
    from public.ubuntu_pillars
    union all
    select 'Principles'::text, count(*)::bigint, 'ubuntu_principles'::text
    from public.ubuntu_principles
    order by 3;
  $function$;

commit;
