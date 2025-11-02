-- Supabase schema for 2048 Tilt
-- Run this in Supabase SQL editor (project > SQL > New query)
-- Safe to run multiple times; guarded with IF NOT EXISTS where applicable.

-- 0) Extensions (for UUID generation)
create extension if not exists "pgcrypto" with schema extensions;

-- 1) user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  best_score bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.1) updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- 1.2) auto-create profile when new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)) )
  on conflict (id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) game_scores table
create table if not exists public.game_scores (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  score bigint not null,
  latitude float8,
  longitude float8,
  city text,
  country text,
  created_at timestamptz not null default now()
);

-- 2.1) keep username in scores in sync when profile username changes (optional but recommended)
create or replace function public.sync_username_to_scores()
returns trigger language plpgsql as $$
begin
  if new.username is distinct from old.username then
    update public.game_scores set username = new.username where user_id = new.id;
  end if;
  return new;
end;$$;

drop trigger if exists on_profile_username_changed on public.user_profiles;
create trigger on_profile_username_changed
after update of username on public.user_profiles
for each row execute function public.sync_username_to_scores();

-- 3) indexes for leaderboard and queries
create index if not exists idx_game_scores_score_desc on public.game_scores (score desc);
create index if not exists idx_game_scores_user_id on public.game_scores (user_id);
create index if not exists idx_game_scores_city on public.game_scores (city);

-- 4) Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.game_scores enable row level security;

-- Allow everyone to read basic profile data (simplifies username check and ranking display)
drop policy if exists "Public read user_profiles" on public.user_profiles;
create policy "Public read user_profiles" on public.user_profiles
for select using (true);

-- Allow users to update only their own profile
drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile" on public.user_profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

-- Public read for leaderboards
drop policy if exists "Public read game_scores" on public.game_scores;
create policy "Public read game_scores" on public.game_scores
for select using (true);

-- Only the authenticated user can insert their own scores
drop policy if exists "Users insert own scores" on public.game_scores;
create policy "Users insert own scores" on public.game_scores
for insert with check (auth.uid() = user_id);

-- Users can update/delete only their own scores (typically not used, but safe)
drop policy if exists "Users update own scores" on public.game_scores;
create policy "Users update own scores" on public.game_scores
for update using (auth.uid() = user_id);

drop policy if exists "Users delete own scores" on public.game_scores;
create policy "Users delete own scores" on public.game_scores
for delete using (auth.uid() = user_id);

-- Done.
