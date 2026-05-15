-- 0004_chatbot.sql
-- Knowledge base, conversations, messages, feedback. Chatbot is Q&A only.
-- Aligns with docs/product/chatbot-scope.md and CLAUDE.md (chatbot rules).

set search_path = public;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'kb_source_type') then
    create type kb_source_type as enum ('faq', 'poi', 'guide', 'page', 'manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'chatbot_role') then
    create type chatbot_role as enum ('user', 'assistant', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'chatbot_feedback_value') then
    create type chatbot_feedback_value as enum ('helpful', 'unhelpful');
  end if;
end$$;

-- =====================================================================
-- KB items — official corpus the chatbot retrieves from
-- =====================================================================

create table if not exists chatbot_kb_items (
  id uuid primary key default gen_random_uuid(),
  source_type kb_source_type not null,
  -- Optional link to source row (faq_items, poi, guide_articles, content_pages).
  -- Validated at app layer; no FK because target table varies.
  source_id uuid,
  status publish_status not null default 'draft',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null
);

create trigger chatbot_kb_items_set_updated_at
before update on chatbot_kb_items
for each row execute function set_updated_at();

create index if not exists chatbot_kb_items_status_idx on chatbot_kb_items(status);
create index if not exists chatbot_kb_items_source_idx on chatbot_kb_items(source_type, source_id);

create table if not exists chatbot_kb_translations (
  kb_id uuid not null references chatbot_kb_items(id) on delete cascade,
  locale locale_code not null,
  title text not null,
  body_md text not null,
  primary key (kb_id, locale)
);

-- =====================================================================
-- Conversations + messages
-- =====================================================================

create table if not exists chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  locale locale_code not null default 'vi',
  context_kind text,                     -- e.g. 'poi:ba-den-peak', 'faq', null
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists chatbot_conversations_user_idx on chatbot_conversations(user_id);

create table if not exists chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chatbot_conversations(id) on delete cascade,
  role chatbot_role not null,
  content text not null,
  -- For assistant turns: which KB items grounded the answer.
  source_kb_ids uuid[] not null default '{}',
  -- Latency / token counts for ops; nullable.
  latency_ms int,
  token_count int,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_messages_conversation_idx on chatbot_messages(conversation_id);

create table if not exists chatbot_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chatbot_messages(id) on delete cascade,
  user_id uuid references app_users(id) on delete set null,
  value chatbot_feedback_value not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_feedback_message_idx on chatbot_feedback(message_id);

-- =====================================================================
-- RLS
-- =====================================================================

alter table chatbot_kb_items        enable row level security;
alter table chatbot_kb_translations enable row level security;
alter table chatbot_conversations   enable row level security;
alter table chatbot_messages        enable row level security;
alter table chatbot_feedback        enable row level security;

create policy chatbot_kb_items_public_read on chatbot_kb_items
for select using (status = 'published');

create policy chatbot_kb_translations_public_read on chatbot_kb_translations
for select using (
  exists (select 1 from chatbot_kb_items k where k.id = kb_id and k.status = 'published')
);

create policy chatbot_conversations_self_read on chatbot_conversations
for select using (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);

create policy chatbot_conversations_self_insert on chatbot_conversations
for insert with check (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);

create policy chatbot_messages_self_read on chatbot_messages
for select using (
  exists (
    select 1
    from chatbot_conversations c
    join app_users u on u.id = c.user_id
    where c.id = conversation_id and u.auth_user_id = auth.uid()
  )
);

create policy chatbot_feedback_self_insert on chatbot_feedback
for insert with check (
  auth.uid() is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = auth.uid())
);
