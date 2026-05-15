-- 0001_identity_base.sql
-- Identity tables, common helpers, locale enum, audit hooks scaffold.
-- Aligns with docs/architecture/data-model-overview.md (Identity group).

set search_path = public;

-- =====================================================================
-- Helpers
-- =====================================================================

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Locale enum (vi/en, with vi as default per CLAUDE.md)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'locale_code') then
    create type locale_code as enum ('vi', 'en');
  end if;
end$$;

-- =====================================================================
-- App users (linked to auth.users via Zalo provider in future)
-- =====================================================================

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  -- auth_user_id will link to supabase auth.users.id once Zalo OAuth bridge wired.
  auth_user_id uuid unique,
  zalo_user_id text unique,
  display_name text,
  avatar_url text,
  preferred_locale locale_code not null default 'vi',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_users_set_updated_at
before update on app_users
for each row execute function set_updated_at();

-- =====================================================================
-- Admin identity (separate from app users — admin uses internal auth)
-- =====================================================================

create table if not exists admin_roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- e.g. 'super_admin', 'editor', 'reviewer'
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_roles_set_updated_at
before update on admin_roles
for each row execute function set_updated_at();

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,             -- links to auth.users when admin auth chosen
  email text unique not null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_set_updated_at
before update on admin_users
for each row execute function set_updated_at();

create table if not exists admin_role_bindings (
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  role_id uuid not null references admin_roles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid references admin_users(id) on delete set null,
  primary key (admin_user_id, role_id)
);

-- =====================================================================
-- RLS — deny by default. Public/admin policies added per-table later.
-- =====================================================================

alter table app_users enable row level security;
alter table admin_users enable row level security;
alter table admin_roles enable row level security;
alter table admin_role_bindings enable row level security;

-- Self-read for app_users once auth wiring lands.
create policy app_users_self_read
on app_users for select
using (auth.uid() is not null and auth_user_id = auth.uid());

create policy app_users_self_update
on app_users for update
using (auth.uid() is not null and auth_user_id = auth.uid())
with check (auth.uid() is not null and auth_user_id = auth.uid());

-- Admin tables have NO public policies — only service role bypasses RLS.

-- =====================================================================
-- Seed minimal admin roles
-- =====================================================================

insert into admin_roles (code, name, description) values
  ('super_admin', 'Super Admin', 'Full access including user/role management'),
  ('editor', 'Editor', 'Manage content, POI, KB, events'),
  ('reviewer', 'Reviewer', 'Triage and respond to reports, moderation queue')
on conflict (code) do nothing;
