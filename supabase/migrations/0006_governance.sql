-- 0006_governance.sql
-- Audit logs, moderation queue, retention policies. Service-role-only by default.
-- Aligns with docs/architecture/moderation-audit-logging.md.

set search_path = public;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'moderation_decision') then
    create type moderation_decision as enum ('pending', 'approved', 'rejected', 'escalated');
  end if;
  if not exists (select 1 from pg_type where typname = 'moderation_severity') then
    create type moderation_severity as enum ('low', 'medium', 'high');
  end if;
end$$;

-- =====================================================================
-- Audit logs (admin actions, sensitive mutations)
-- =====================================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references admin_users(id) on delete set null,
  actor_role text,                          -- snapshot of role code at time of action
  entity_type text not null,                -- e.g. 'reports', 'poi', 'chatbot_kb_items'
  entity_id uuid,
  action text not null,                     -- 'create' | 'update' | 'delete' | 'status_change' | ...
  before_snapshot jsonb,
  after_snapshot jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index if not exists audit_logs_actor_idx on audit_logs(actor_admin_id);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);

-- =====================================================================
-- Moderation queue (user-generated content awaiting review)
-- =====================================================================

create table if not exists moderation_queue (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,                -- 'report' | 'chatbot_message' | 'attachment'
  target_id uuid not null,
  flag_reason text,
  severity moderation_severity not null default 'low',
  decision moderation_decision not null default 'pending',
  reviewer_admin_id uuid references admin_users(id) on delete set null,
  decided_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger moderation_queue_set_updated_at
before update on moderation_queue
for each row execute function set_updated_at();

create index if not exists moderation_queue_target_idx on moderation_queue(target_type, target_id);
create index if not exists moderation_queue_decision_idx on moderation_queue(decision);

-- =====================================================================
-- Retention policies (TTL config — execution job out of MVP scope)
-- =====================================================================

create table if not exists retention_policies (
  id uuid primary key default gen_random_uuid(),
  scope text unique not null,               -- 'reports' | 'chatbot_messages' | 'audit_logs' | 'attachments'
  retention_days int,                       -- null = keep forever; set when policy chốt
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger retention_policies_set_updated_at
before update on retention_policies
for each row execute function set_updated_at();

-- =====================================================================
-- RLS — service-role only (no public/user policies)
-- =====================================================================

alter table audit_logs          enable row level security;
alter table moderation_queue    enable row level security;
alter table retention_policies  enable row level security;

-- =====================================================================
-- Seed retention scopes (inactive until policy chốt — see decision-log)
-- =====================================================================

insert into retention_policies (scope, retention_days, is_active, notes) values
  ('reports', null, false, 'TBD per ops policy'),
  ('chatbot_messages', null, false, 'TBD per ops policy'),
  ('audit_logs', null, false, 'TBD per ops policy'),
  ('attachments', null, false, 'TBD per ops policy')
on conflict (scope) do nothing;
