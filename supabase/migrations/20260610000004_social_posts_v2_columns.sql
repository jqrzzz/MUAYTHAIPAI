-- social_posts v2 columns — the missing half of scripts/035-add-social-posts.sql.
--
-- Prod already had an older social_posts table (caption/content_type per-post),
-- so 035's CREATE TABLE IF NOT EXISTS silently no-op'd. The code, however, was
-- written against 035's v2 shape: multi-platform posts with per-platform
-- content JSONB and AI provenance. Verified live 2026-06-10: platforms /
-- content / source / source_intent / published_at do not exist, so every
-- social write path (manual save, AI compose, AI weekly batch) and the
-- operator adoption metrics have been silently broken.
--
-- This adds the v2 columns alongside the legacy ones (caption, content_type,
-- ai_generated, …) — nothing reads the legacy columns in current code, but
-- they may hold old data, so they are left untouched.

alter table public.social_posts add column if not exists platforms text[] not null default '{}'::text[];
alter table public.social_posts add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.social_posts add column if not exists source text not null default 'manual';
alter table public.social_posts add column if not exists source_intent text;
alter table public.social_posts add column if not exists published_at timestamptz;

-- The legacy table had caption + content_type as NOT NULL (no default). The
-- v2 writers store everything in the content JSONB and never set these, so
-- every v2 insert would violate the constraint. Relax them — they remain for
-- any legacy rows but are no longer required.
alter table public.social_posts alter column caption drop not null;
alter table public.social_posts alter column content_type drop not null;

-- Source is constrained as in 035 (manual | ai_compose | ai_batch).
do $$ begin
  alter table public.social_posts
    add constraint social_posts_source_check
    check (source in ('manual','ai_compose','ai_batch'));
exception when duplicate_object then null;
end $$;

create index if not exists social_posts_org_id_status_idx
  on public.social_posts (org_id, status, scheduled_for);
create index if not exists social_posts_org_id_created_at_idx
  on public.social_posts (org_id, created_at desc);
