-- 0009_site_settings_and_oauth.sql
-- site_settings (logo/hero/brand/contact editable from admin),
-- zalo_oauth_states (PKCE state store), app_sessions (bearer tokens for miniapp).

set search_path = public;

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

create trigger site_settings_set_updated_at
before update on site_settings
for each row execute function set_updated_at();

alter table site_settings enable row level security;

create policy site_settings_public_read on site_settings
for select using (true);

insert into site_settings (key, value) values
  ('brand', jsonb_build_object(
     'name_vi', 'Núi Bà Đen',
     'name_en', 'Ba Den Mountain',
     'tagline_vi', 'Khu du lịch quốc gia',
     'tagline_en', 'National tourism area',
     'logo_url', null,
     'primary_color', '#1F6E43'
   )),
  ('hero', jsonb_build_object(
     'image_url', null,
     'title_vi', 'Chào mừng đến Núi Bà Đen',
     'title_en', 'Welcome to Ba Den Mountain',
     'subtitle_vi', 'Thông tin du khách, hỗ trợ và check-in trong một nơi.',
     'subtitle_en', 'Tourist information, support, and check-in in one place.'
   )),
  ('contact', jsonb_build_object(
     'hotline', '0276 3823378',
     'email', 'info@nuibaden.com.vn',
     'address_vi', 'Khu di tích lịch sử văn hóa danh thắng và du lịch Núi Bà Đen, TP. Tây Ninh',
     'address_en', 'Ba Den Mountain Historical-Cultural-Tourism Area, Tay Ninh City'
   ))
on conflict (key) do nothing;

alter table app_users
  add column if not exists last_login_at timestamptz,
  add column if not exists zalo_followed boolean not null default false;

create table if not exists zalo_oauth_states (
  state text primary key,
  code_verifier text not null,
  redirect_uri text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table zalo_oauth_states enable row level security;

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  ip text
);

create index if not exists app_sessions_user_idx on app_sessions(user_id);
create index if not exists app_sessions_expires_idx on app_sessions(expires_at);

alter table app_sessions enable row level security;
