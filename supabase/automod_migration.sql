-- =============================================================
-- Automod — Moderation & Progressive Penalties
-- Run this AFTER the initial schema.sql migration
-- =============================================================

-- Add anon_id and moderation columns to comments
alter table public.comments
  add column if not exists anon_id text,
  add column if not exists moderation_status text not null default 'clean'
    check (moderation_status in ('clean', 'flagged', 'blocked'));

-- Add anon_id to complaints
alter table public.complaints
  add column if not exists anon_id text;

-- Moderation actions log (tracks offenses + penalties per anonymous user)
create table if not exists public.moderation_actions (
  id uuid primary key default uuid_generate_v4(),
  anon_id text not null,
  offense_type text not null check (offense_type in ('profanity', 'hate_speech', 'harassment', 'spam', 'other')),
  severity_score numeric not null default 0,
  action_taken text not null check (action_taken in ('warning', 'final_warning', 'mute_10m', 'mute_1h', 'mute_24h', 'block_24h')),
  muted_until timestamptz,
  reference_id uuid,
  reference_type text check (reference_type in ('comment', 'complaint')),
  details jsonb,
  created_at timestamptz not null default now()
);

-- Admin-issued bans (by anon_id or ip_hash)
create table if not exists public.admin_bans (
  id uuid primary key default uuid_generate_v4(),
  identifier_type text not null check (identifier_type in ('anon_id', 'ip_hash')),
  identifier_value text not null,
  reason text,
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz -- null = permanent
);

-- Indexes
create index if not exists idx_moderation_actions_anon on public.moderation_actions(anon_id);
create index if not exists idx_moderation_actions_created on public.moderation_actions(created_at desc);
create index if not exists idx_admin_bans_identifier on public.admin_bans(identifier_type, identifier_value);
create index if not exists idx_comments_anon_id on public.comments(anon_id);
create index if not exists idx_complaints_anon_id on public.complaints(anon_id);

-- RLS for moderation tables (service role bypasses; public has no access)
alter table public.moderation_actions enable row level security;
alter table public.admin_bans enable row level security;

-- Only service role can read/write moderation tables (no public policies)
-- Authenticated admins can read via server API routes that use service role key
