-- ============================================================
-- Colcal — Supabase Schema
-- Run this entire file in your Supabase SQL Editor.
-- Service-role key is used server-side, so RLS policies are
-- permissive (actual auth happens in Next.js API routes via Clerk).
-- ============================================================
-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  org_id text,
  -- Clerk Organization ID (null for personal workspace)
  name text not null,
  color text not null default '#3b82f6',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(org_id, name) -- Ensure team name is unique per org
);
alter table teams enable row level security;
create policy "service role manages teams" on teams for all using (true);
-- User Profiles (for custom display names)
create table if not exists user_profiles (
  user_id text primary key,
  display_name text not null,
  updated_at timestamptz not null default now()
);
alter table user_profiles enable row level security;
create policy "service role manages user profiles" on user_profiles for all using (true);
-- Team Members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  org_id text,
  team_name text not null,
  member_id text not null,
  created_at timestamptz not null default now(),
  unique(org_id, team_name, member_id)
);
alter table team_members enable row level security;
create policy "service role manages members" on team_members for all using (true);
-- Tasks (work items per date)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  org_id text,
  date_key text not null,
  -- YYYY-MM-DD
  time text not null default 'Anytime',
  task text not null,
  team text not null default 'General',
  completed boolean not null default false,
  assignee text,
  created_at timestamptz not null default now()
);
alter table tasks enable row level security;
create policy "service role manages tasks" on tasks for all using (true);
-- Notes (per date, multiple entries)
create table if not exists notes (
  id text primary key,
  -- client-generated e.g. "2025-04-25-1714034400000"
  user_id text not null,
  org_id text,
  date_key text not null,
  -- YYYY-MM-DD
  text text not null,
  author_name text not null default 'Unknown User',
  team text not null default 'General',
  saved_at timestamptz not null default now()
);
alter table notes enable row level security;
create policy "service role manages notes" on notes for all using (true);
-- Calendar Events
create table if not exists calendar_events (
  id text primary key,
  -- client-generated e.g. String(Date.now())
  user_id text not null,
  org_id text,
  title text not null,
  start_time text not null,
  -- ISO string
  end_time text,
  -- ISO string (null for some all-day events)
  all_day boolean not null default false,
  created_at timestamptz not null default now()
);
alter table calendar_events enable row level security;
create policy "service role manages events" on calendar_events for all using (true);