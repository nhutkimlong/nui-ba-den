-- 0002_poi_content.sql
-- POI categories, POIs, translations, media, QR codes; content pages, banners, alerts,
-- guide articles, FAQ items. Public read for published rows; mutations via service role / admin only.

set search_path = public;

-- =====================================================================
-- Status enum used by published content (drafts vs live)
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'publish_status') then
    create type publish_status as enum ('draft', 'published', 'archived');
  end if;
end$$;

-- =====================================================================
-- POI taxonomy
-- =====================================================================

create table if not exists poi_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                      -- e.g. 'scenic', 'spiritual', 'service'
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger poi_categories_set_updated_at
before update on poi_categories
for each row execute function set_updated_at();

create table if not exists poi_category_translations (
  category_id uuid not null references poi_categories(id) on delete cascade,
  locale locale_code not null,
  name text not null,
  description text,
  primary key (category_id, locale)
);

-- =====================================================================
-- POI
-- =====================================================================

create table if not exists poi (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references poi_categories(id) on delete set null,
  latitude double precision,
  longitude double precision,
  status publish_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null
);

create trigger poi_set_updated_at
before update on poi
for each row execute function set_updated_at();

create index if not exists poi_status_idx on poi(status);
create index if not exists poi_category_idx on poi(category_id);

create table if not exists poi_translations (
  poi_id uuid not null references poi(id) on delete cascade,
  locale locale_code not null,
  title text not null,
  short_description text,
  long_description text,
  primary key (poi_id, locale)
);

create table if not exists poi_media (
  id uuid primary key default gen_random_uuid(),
  poi_id uuid not null references poi(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video', 'audio', '360')),
  url text not null,
  alt_vi text,
  alt_en text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists poi_media_poi_idx on poi_media(poi_id);

create table if not exists poi_qr_codes (
  id uuid primary key default gen_random_uuid(),
  poi_id uuid not null references poi(id) on delete cascade,
  qr_value text unique not null,                -- physical QR payload printed on signage
  -- check_radius_m: optional override for GPS-radius validation; null = use global default.
  check_radius_m int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger poi_qr_codes_set_updated_at
before update on poi_qr_codes
for each row execute function set_updated_at();

-- =====================================================================
-- Generic content pages (about, policies, etc.)
-- =====================================================================

create table if not exists content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null
);

create trigger content_pages_set_updated_at
before update on content_pages
for each row execute function set_updated_at();

create table if not exists content_page_translations (
  page_id uuid not null references content_pages(id) on delete cascade,
  locale locale_code not null,
  title text not null,
  body_md text,
  primary key (page_id, locale)
);

-- =====================================================================
-- Banners (home carousel)
-- =====================================================================

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banners_set_updated_at
before update on banners
for each row execute function set_updated_at();

create table if not exists banner_translations (
  banner_id uuid not null references banners(id) on delete cascade,
  locale locale_code not null,
  title text,
  subtitle text,
  primary key (banner_id, locale)
);

-- =====================================================================
-- Alerts (urgent notices on home)
-- =====================================================================

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info', 'warning', 'critical')) default 'info',
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger alerts_set_updated_at
before update on alerts
for each row execute function set_updated_at();

create table if not exists alert_translations (
  alert_id uuid not null references alerts(id) on delete cascade,
  locale locale_code not null,
  title text not null,
  body_md text,
  primary key (alert_id, locale)
);

-- =====================================================================
-- Guide articles
-- =====================================================================

create table if not exists guide_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  cover_image_url text,
  status publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger guide_articles_set_updated_at
before update on guide_articles
for each row execute function set_updated_at();

create table if not exists guide_article_translations (
  article_id uuid not null references guide_articles(id) on delete cascade,
  locale locale_code not null,
  title text not null,
  summary text,
  body_md text,
  primary key (article_id, locale)
);

-- =====================================================================
-- FAQ
-- =====================================================================

create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  tags text[] not null default '{}',
  status publish_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faq_items_set_updated_at
before update on faq_items
for each row execute function set_updated_at();

create table if not exists faq_item_translations (
  faq_id uuid not null references faq_items(id) on delete cascade,
  locale locale_code not null,
  question text not null,
  answer_md text not null,
  primary key (faq_id, locale)
);

-- =====================================================================
-- RLS — public-read for published rows; writes via service role only
-- =====================================================================

alter table poi_categories            enable row level security;
alter table poi_category_translations enable row level security;
alter table poi                       enable row level security;
alter table poi_translations          enable row level security;
alter table poi_media                 enable row level security;
alter table poi_qr_codes              enable row level security;
alter table content_pages             enable row level security;
alter table content_page_translations enable row level security;
alter table banners                   enable row level security;
alter table banner_translations       enable row level security;
alter table alerts                    enable row level security;
alter table alert_translations        enable row level security;
alter table guide_articles            enable row level security;
alter table guide_article_translations enable row level security;
alter table faq_items                 enable row level security;
alter table faq_item_translations     enable row level security;

create policy poi_categories_public_read on poi_categories
for select using (is_active);

create policy poi_category_translations_public_read on poi_category_translations
for select using (true);

create policy poi_public_read on poi
for select using (status = 'published');

create policy poi_translations_public_read on poi_translations
for select using (
  exists (select 1 from poi p where p.id = poi_id and p.status = 'published')
);

create policy poi_media_public_read on poi_media
for select using (
  exists (select 1 from poi p where p.id = poi_id and p.status = 'published')
);

-- QR codes: do NOT expose qr_value publicly. Only service role reads them.

create policy content_pages_public_read on content_pages
for select using (status = 'published');

create policy content_page_translations_public_read on content_page_translations
for select using (
  exists (select 1 from content_pages c where c.id = page_id and c.status = 'published')
);

create policy banners_public_read on banners
for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy banner_translations_public_read on banner_translations
for select using (
  exists (select 1 from banners b where b.id = banner_id and b.is_active)
);

create policy alerts_public_read on alerts
for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy alert_translations_public_read on alert_translations
for select using (
  exists (select 1 from alerts a where a.id = alert_id and a.is_active)
);

create policy guide_articles_public_read on guide_articles
for select using (status = 'published');

create policy guide_article_translations_public_read on guide_article_translations
for select using (
  exists (select 1 from guide_articles g where g.id = article_id and g.status = 'published')
);

create policy faq_items_public_read on faq_items
for select using (status = 'published');

create policy faq_item_translations_public_read on faq_item_translations
for select using (
  exists (select 1 from faq_items f where f.id = faq_id and f.status = 'published')
);

-- =====================================================================
-- Seed minimal POI categories (codes mirror current store.ts seed)
-- =====================================================================

insert into poi_categories (code, sort_order) values
  ('scenic', 10),
  ('spiritual', 20),
  ('service', 30)
on conflict (code) do nothing;

insert into poi_category_translations (category_id, locale, name)
select c.id, 'vi', case c.code
  when 'scenic' then 'Cảnh quan'
  when 'spiritual' then 'Tâm linh'
  when 'service' then 'Dịch vụ'
end
from poi_categories c
where c.code in ('scenic', 'spiritual', 'service')
on conflict do nothing;

insert into poi_category_translations (category_id, locale, name)
select c.id, 'en', case c.code
  when 'scenic' then 'Scenic'
  when 'spiritual' then 'Spiritual'
  when 'service' then 'Service'
end
from poi_categories c
where c.code in ('scenic', 'spiritual', 'service')
on conflict do nothing;
