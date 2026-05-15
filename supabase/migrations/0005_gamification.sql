-- 0005_gamification.sql
-- Check-ins (GPS + QR), badges, badge rules, user_badges, rewards, user_rewards.
-- Aligns with docs/product/gamification-checkin-badges.md.

set search_path = public;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'badge_rule_kind') then
    -- 'first_checkin' and 'three_checkins' mirror current store.ts seed; extensible.
    create type badge_rule_kind as enum (
      'first_checkin',
      'n_checkins',
      'visit_poi',
      'visit_all_in_category',
      'manual'
    );
  end if;
end$$;

-- =====================================================================
-- Check-ins
-- =====================================================================

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  poi_id uuid not null references poi(id) on delete restrict,
  qr_id uuid references poi_qr_codes(id) on delete set null,
  -- Captured GPS at check-in time, for fraud audit.
  latitude double precision,
  longitude double precision,
  -- Distance (meters) between captured GPS and POI lat/lng — computed at app layer.
  distance_m double precision,
  is_valid boolean not null default true,
  reject_reason text,
  created_at timestamptz not null default now()
);

create index if not exists checkins_user_idx on checkins(user_id, created_at desc);
create index if not exists checkins_poi_idx on checkins(poi_id);

-- =====================================================================
-- Badges
-- =====================================================================

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  icon_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger badges_set_updated_at
before update on badges
for each row execute function set_updated_at();

create table if not exists badge_translations (
  badge_id uuid not null references badges(id) on delete cascade,
  locale locale_code not null,
  name text not null,
  description text,
  primary key (badge_id, locale)
);

-- One badge can have one rule (kind + params); for compound rules introduce composition later.
create table if not exists badge_rules (
  badge_id uuid primary key references badges(id) on delete cascade,
  kind badge_rule_kind not null,
  -- Free-form params: { "n": 3 } | { "poi_id": "..." } | { "category_id": "..." }
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger badge_rules_set_updated_at
before update on badge_rules
for each row execute function set_updated_at();

create table if not exists user_badges (
  user_id uuid not null references app_users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by_admin_id uuid references admin_users(id) on delete set null,
  source text,                              -- 'auto' | 'manual'
  primary key (user_id, badge_id)
);

create index if not exists user_badges_user_idx on user_badges(user_id);

-- =====================================================================
-- Rewards (admin-managed catalog; redemption flow out of MVP scope)
-- =====================================================================

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  required_badge_id uuid references badges(id) on delete set null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  stock int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger rewards_set_updated_at
before update on rewards
for each row execute function set_updated_at();

create table if not exists reward_translations (
  reward_id uuid not null references rewards(id) on delete cascade,
  locale locale_code not null,
  name text not null,
  description_md text,
  primary key (reward_id, locale)
);

create table if not exists user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete restrict,
  redeemed_at timestamptz,
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'expired', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists user_rewards_user_idx on user_rewards(user_id);

-- =====================================================================
-- RLS
-- =====================================================================

alter table checkins              enable row level security;
alter table badges                enable row level security;
alter table badge_translations    enable row level security;
alter table badge_rules           enable row level security;
alter table user_badges           enable row level security;
alter table rewards               enable row level security;
alter table reward_translations   enable row level security;
alter table user_rewards          enable row level security;

create policy checkins_self_read on checkins
for select using (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);

create policy badges_public_read on badges
for select using (is_active);

create policy badge_translations_public_read on badge_translations
for select using (
  exists (select 1 from badges b where b.id = badge_id and b.is_active)
);

-- badge_rules: not exposed publicly (could leak anti-fraud logic).

create policy user_badges_self_read on user_badges
for select using (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);

create policy rewards_public_read on rewards
for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy reward_translations_public_read on reward_translations
for select using (
  exists (select 1 from rewards r where r.id = reward_id and r.is_active)
);

create policy user_rewards_self_read on user_rewards
for select using (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);

-- =====================================================================
-- Seed two MVP badges (mirrors apps/api store.ts seed)
-- =====================================================================

insert into badges (code, sort_order) values
  ('first_explorer', 10),
  ('active_visitor', 20)
on conflict (code) do nothing;

insert into badge_translations (badge_id, locale, name)
select b.id, 'vi', case b.code
  when 'first_explorer' then 'Khám phá lần đầu'
  when 'active_visitor' then 'Du khách tích cực'
end from badges b where b.code in ('first_explorer', 'active_visitor')
on conflict do nothing;

insert into badge_translations (badge_id, locale, name)
select b.id, 'en', case b.code
  when 'first_explorer' then 'First explorer'
  when 'active_visitor' then 'Active visitor'
end from badges b where b.code in ('first_explorer', 'active_visitor')
on conflict do nothing;

insert into badge_rules (badge_id, kind, params)
select b.id, 'first_checkin'::badge_rule_kind, '{}'::jsonb
from badges b where b.code = 'first_explorer'
on conflict (badge_id) do nothing;

insert into badge_rules (badge_id, kind, params)
select b.id, 'n_checkins'::badge_rule_kind, '{"n": 3}'::jsonb
from badges b where b.code = 'active_visitor'
on conflict (badge_id) do nothing;
