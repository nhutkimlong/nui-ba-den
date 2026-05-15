-- 0011_admin_password.sql
set search_path = public;
alter table admin_users add column if not exists password_hash text;
alter table admin_users add column if not exists last_login_at timestamptz;

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  token_hash text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  ip text
);
create index if not exists admin_sessions_admin_idx on admin_sessions(admin_user_id);
create index if not exists admin_sessions_expires_idx on admin_sessions(expires_at);
alter table admin_sessions enable row level security;
