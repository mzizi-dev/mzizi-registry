-- Forward data migration: `nyuchi-*` registry components → `mzizi-*` (2026-09-27)
--
-- WHAT. Every registry component named `nyuchi-*` was renamed `mzizi-*` in the
-- repo (see `lib/component-renames.json`, the same 123 pairs as below). The
-- database still holds rows keyed by the old names. This moves the keys that
-- follow a component — its version history and the legacy component store — to
-- the new names.
--
-- WHAT IT DOES NOT TOUCH. Telemetry and logs (`usage_events`,
-- `observability_events`, `chaos_events`, `fundi_issues`, `fundi_healing_log`)
-- record what happened under the name in use at the time. They are history and
-- keep the old names.
--
-- ORDERING. None required. The code that ships with this rename reads
-- `component_versions` under every name a component has had
-- (`componentNameHistory` in `lib/component-renames.ts`), so it answers the same
-- before and after this runs. Apply it whenever convenient, then regenerate
-- `supabase/schema.sql` per `supabase/README.md` if the structure changed (it
-- does not: this is data only).
--
-- SAFETY. One transaction. Idempotent: a second run finds no old names. Tables
-- or columns that do not exist are skipped rather than failing, because
-- `schema.sql` is not yet a dump of the live project. If a table already holds a
-- row under BOTH the old and new name, the migration stops with an error naming
-- it rather than guess which row wins.
--
-- FOREIGN KEYS. `schema.sql` does not yet show whether the version store
-- references the component store. The parent (`components_store`) is renamed
-- first, so a child FK declared ON UPDATE CASCADE follows it; DEFERRABLE
-- constraints are deferred to COMMIT. A plain non-deferrable FK without
-- CASCADE makes the first UPDATE fail — the transaction rolls back and nothing
-- changes; in that case make the FK deferrable (or cascade) first.
--
-- Apply with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <this file>

BEGIN;

SET CONSTRAINTS ALL DEFERRED;

CREATE TEMP TABLE component_renames (old_name text PRIMARY KEY, new_name text NOT NULL UNIQUE)
  ON COMMIT DROP;

INSERT INTO component_renames (old_name, new_name) VALUES
    ('nyuchi-a11y', 'mzizi-a11y'),
    ('nyuchi-action-sheet', 'mzizi-action-sheet'),
    ('nyuchi-ai-context', 'mzizi-ai-context'),
    ('nyuchi-alert-banner', 'mzizi-alert-banner'),
    ('nyuchi-application-tracker', 'mzizi-application-tracker'),
    ('nyuchi-article-card', 'mzizi-article-card'),
    ('nyuchi-auth-card', 'mzizi-auth-card'),
    ('nyuchi-auth-layout', 'mzizi-auth-layout'),
    ('nyuchi-avatar-stack', 'mzizi-avatar-stack'),
    ('nyuchi-badge-display', 'mzizi-badge-display'),
    ('nyuchi-balance-display', 'mzizi-balance-display'),
    ('nyuchi-bottom-nav', 'mzizi-bottom-nav'),
    ('nyuchi-calendar', 'mzizi-calendar'),
    ('nyuchi-changelog-renderer', 'mzizi-changelog-renderer'),
    ('nyuchi-command-palette', 'mzizi-command-palette'),
    ('nyuchi-commute-card', 'mzizi-commute-card'),
    ('nyuchi-connectivity-bar', 'mzizi-connectivity-bar'),
    ('nyuchi-content-composer', 'mzizi-content-composer'),
    ('nyuchi-conversation-row', 'mzizi-conversation-row'),
    ('nyuchi-cover-header', 'mzizi-cover-header'),
    ('nyuchi-cover-wash-header', 'mzizi-cover-wash-header'),
    ('nyuchi-create-listing', 'mzizi-create-listing'),
    ('nyuchi-create-page', 'mzizi-create-page'),
    ('nyuchi-credential-card', 'mzizi-credential-card'),
    ('nyuchi-dashboard-layout', 'mzizi-dashboard-layout'),
    ('nyuchi-data', 'mzizi-data'),
    ('nyuchi-deep-link-handler', 'mzizi-deep-link-handler'),
    ('nyuchi-detail-layout', 'mzizi-detail-layout'),
    ('nyuchi-detail-page', 'mzizi-detail-page'),
    ('nyuchi-docs-api', 'mzizi-docs-api'),
    ('nyuchi-docs-engine', 'mzizi-docs-engine'),
    ('nyuchi-dx', 'mzizi-dx'),
    ('nyuchi-empty-screen', 'mzizi-empty-screen'),
    ('nyuchi-empty-state', 'mzizi-empty-state'),
    ('nyuchi-error-screen', 'mzizi-error-screen'),
    ('nyuchi-escalation-card', 'mzizi-escalation-card'),
    ('nyuchi-event-card', 'mzizi-event-card'),
    ('nyuchi-featured-card', 'mzizi-featured-card'),
    ('nyuchi-feed-page', 'mzizi-feed-page'),
    ('nyuchi-footer', 'mzizi-footer'),
    ('nyuchi-forecast-card', 'mzizi-forecast-card'),
    ('nyuchi-fundi', 'mzizi-fundi'),
    ('nyuchi-fundi-learning', 'mzizi-fundi-learning'),
    ('nyuchi-fundi-reporter', 'mzizi-fundi-reporter'),
    ('nyuchi-gauge-card', 'mzizi-gauge-card'),
    ('nyuchi-grid', 'mzizi-grid'),
    ('nyuchi-group-card', 'mzizi-group-card'),
    ('nyuchi-harness', 'mzizi-harness'),
    ('nyuchi-harness-prewire', 'mzizi-harness-prewire'),
    ('nyuchi-header', 'mzizi-header'),
    ('nyuchi-health-dashboard', 'mzizi-health-dashboard'),
    ('nyuchi-hero-stat', 'mzizi-hero-stat'),
    ('nyuchi-icons', 'mzizi-icons'),
    ('nyuchi-job-card', 'mzizi-job-card'),
    ('nyuchi-layout', 'mzizi-layout'),
    ('nyuchi-leaderboard-row', 'mzizi-leaderboard-row'),
    ('nyuchi-lesson-card', 'mzizi-lesson-card'),
    ('nyuchi-listing-card', 'mzizi-listing-card'),
    ('nyuchi-locale', 'mzizi-locale'),
    ('nyuchi-media', 'mzizi-media'),
    ('nyuchi-message-bubble', 'mzizi-message-bubble'),
    ('nyuchi-meta-tile', 'mzizi-meta-tile'),
    ('nyuchi-mini-app-runtime', 'mzizi-mini-app-runtime'),
    ('nyuchi-mission-card', 'mzizi-mission-card'),
    ('nyuchi-motion', 'mzizi-motion'),
    ('nyuchi-notification-center', 'mzizi-notification-center'),
    ('nyuchi-notification-item', 'mzizi-notification-item'),
    ('nyuchi-offer-card', 'mzizi-offer-card'),
    ('nyuchi-onboarding-step', 'mzizi-onboarding-step'),
    ('nyuchi-page', 'mzizi-page'),
    ('nyuchi-payment-mandate-card', 'mzizi-payment-mandate-card'),
    ('nyuchi-payment-summary', 'mzizi-payment-summary'),
    ('nyuchi-persistent-player', 'mzizi-persistent-player'),
    ('nyuchi-phrase-card', 'mzizi-phrase-card'),
    ('nyuchi-place-card', 'mzizi-place-card'),
    ('nyuchi-platform', 'mzizi-platform'),
    ('nyuchi-product-card', 'mzizi-product-card'),
    ('nyuchi-product-results', 'mzizi-product-results'),
    ('nyuchi-profile-block', 'mzizi-profile-block'),
    ('nyuchi-profile-header', 'mzizi-profile-header'),
    ('nyuchi-profile-page', 'mzizi-profile-page'),
    ('nyuchi-profile-page-layout', 'mzizi-profile-page-layout'),
    ('nyuchi-profile-settings', 'mzizi-profile-settings'),
    ('nyuchi-programme-item', 'mzizi-programme-item'),
    ('nyuchi-provider-card', 'mzizi-provider-card'),
    ('nyuchi-registration-card', 'mzizi-registration-card'),
    ('nyuchi-resilience', 'mzizi-resilience'),
    ('nyuchi-review-card', 'mzizi-review-card'),
    ('nyuchi-root-layout', 'mzizi-root-layout'),
    ('nyuchi-route-guard', 'mzizi-route-guard'),
    ('nyuchi-route-planner', 'mzizi-route-planner'),
    ('nyuchi-rsvp-button', 'mzizi-rsvp-button'),
    ('nyuchi-search-view', 'mzizi-search-view'),
    ('nyuchi-seo', 'mzizi-seo'),
    ('nyuchi-settings-page', 'mzizi-settings-page'),
    ('nyuchi-share-card', 'mzizi-share-card'),
    ('nyuchi-sidebar', 'mzizi-sidebar'),
    ('nyuchi-sidebar-nav', 'mzizi-sidebar-nav'),
    ('nyuchi-source-badge', 'mzizi-source-badge'),
    ('nyuchi-splash-screen', 'mzizi-splash-screen'),
    ('nyuchi-stats-row', 'mzizi-stats-row'),
    ('nyuchi-success-screen', 'mzizi-success-screen'),
    ('nyuchi-suitability-card', 'mzizi-suitability-card'),
    ('nyuchi-theme-provider', 'mzizi-theme-provider'),
    ('nyuchi-ticket-card', 'mzizi-ticket-card'),
    ('nyuchi-timeline', 'mzizi-timeline'),
    ('nyuchi-toast-provider', 'mzizi-toast-provider'),
    ('nyuchi-tokens', 'mzizi-tokens'),
    ('nyuchi-tokens-arkts', 'mzizi-tokens-arkts'),
    ('nyuchi-tokens-globals', 'mzizi-tokens-globals'),
    ('nyuchi-tokens-kotlin', 'mzizi-tokens-kotlin'),
    ('nyuchi-tokens-python', 'mzizi-tokens-python'),
    ('nyuchi-tokens-react-native', 'mzizi-tokens-react-native'),
    ('nyuchi-tokens-rust', 'mzizi-tokens-rust'),
    ('nyuchi-tokens-swift', 'mzizi-tokens-swift'),
    ('nyuchi-tokens-typescript', 'mzizi-tokens-typescript'),
    ('nyuchi-transaction-row', 'mzizi-transaction-row'),
    ('nyuchi-trust-meter', 'mzizi-trust-meter'),
    ('nyuchi-update-prompt', 'mzizi-update-prompt'),
    ('nyuchi-user-card', 'mzizi-user-card'),
    ('nyuchi-user-menu', 'mzizi-user-menu'),
    ('nyuchi-verified-badge', 'mzizi-verified-badge'),
    ('nyuchi-washed-theme', 'mzizi-washed-theme');

DO $$
DECLARE
  target record;
  clash text;
  moved bigint;
BEGIN
  FOR target IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND (c.table_name, c.column_name) IN (
        ('component_versions_store', 'component_name'),
        ('components_store', 'name'),
        ('component_docs', 'component_name'),
        ('component_demos', 'component_name')
      )
    -- Parent first, so ON UPDATE CASCADE children follow it.
    ORDER BY (c.table_name = 'components_store') DESC, c.table_name
  LOOP
    -- Version history holds many rows per component, so only single-row-per-name
    -- tables can clash.
    IF target.table_name <> 'component_versions_store' THEN
      EXECUTE format(
        'SELECT string_agg(r.old_name, '', '') FROM component_renames r
           WHERE EXISTS (SELECT 1 FROM public.%1$I WHERE %2$I = r.old_name)
             AND EXISTS (SELECT 1 FROM public.%1$I WHERE %2$I = r.new_name)',
        target.table_name, target.column_name)
      INTO clash;
      IF clash IS NOT NULL THEN
        RAISE EXCEPTION 'public.% holds both old and new names for: %', target.table_name, clash;
      END IF;
    END IF;

    EXECUTE format(
      'UPDATE public.%1$I AS t SET %2$I = r.new_name FROM component_renames r WHERE t.%2$I = r.old_name',
      target.table_name, target.column_name);
    GET DIAGNOSTICS moved = ROW_COUNT;
    RAISE NOTICE 'public.%.%: % row(s) renamed', target.table_name, target.column_name, moved;
  END LOOP;
END
$$;

COMMIT;
