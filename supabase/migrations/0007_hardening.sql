-- 0007_hardening.sql
-- Post-apply hardening based on Supabase advisor output:
--   - WARN 0011 function_search_path_mutable → pin search_path on user functions
--   - WARN 0003 auth_rls_initplan          → wrap auth.uid() in SELECT for per-statement caching
--   - INFO 0001 unindexed_foreign_keys     → add covering indexes for hot-path FKs
-- Skipped: WARN on rls_auto_enable (Supabase platform event trigger, not user-owned).
-- Skipped: INFO rls_enabled_no_policy on admin/governance tables — intentional service-role-only.

set search_path = public;

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function record_report_status_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into report_status_history (report_id, from_status, to_status)
    values (new.id, null, new.status);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into report_status_history (report_id, from_status, to_status, changed_by_admin_id)
    values (new.id, old.status, new.status, new.assignee_admin_id);
  end if;
  return new;
end;
$$;

drop policy if exists app_users_self_read on app_users;
create policy app_users_self_read
on app_users for select
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

drop policy if exists app_users_self_update on app_users;
create policy app_users_self_update
on app_users for update
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

drop policy if exists reports_self_read on reports;
create policy reports_self_read on reports
for select using (
  (select auth.uid()) is not null
  and exists (
    select 1 from app_users u where u.id = reporter_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists reports_self_insert on reports;
create policy reports_self_insert on reports
for insert with check (
  (select auth.uid()) is not null
  and exists (
    select 1 from app_users u where u.id = reporter_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists report_attachments_self_read on report_attachments;
create policy report_attachments_self_read on report_attachments
for select using (
  exists (
    select 1
    from reports r
    join app_users u on u.id = r.reporter_id
    where r.id = report_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists report_attachments_self_insert on report_attachments;
create policy report_attachments_self_insert on report_attachments
for insert with check (
  exists (
    select 1
    from reports r
    join app_users u on u.id = r.reporter_id
    where r.id = report_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists report_updates_self_read on report_updates;
create policy report_updates_self_read on report_updates
for select using (
  is_visible_to_user
  and exists (
    select 1
    from reports r
    join app_users u on u.id = r.reporter_id
    where r.id = report_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists report_status_history_self_read on report_status_history;
create policy report_status_history_self_read on report_status_history
for select using (
  exists (
    select 1
    from reports r
    join app_users u on u.id = r.reporter_id
    where r.id = report_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists chatbot_conversations_self_read on chatbot_conversations;
create policy chatbot_conversations_self_read on chatbot_conversations
for select using (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

drop policy if exists chatbot_conversations_self_insert on chatbot_conversations;
create policy chatbot_conversations_self_insert on chatbot_conversations
for insert with check (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

drop policy if exists chatbot_messages_self_read on chatbot_messages;
create policy chatbot_messages_self_read on chatbot_messages
for select using (
  exists (
    select 1
    from chatbot_conversations c
    join app_users u on u.id = c.user_id
    where c.id = conversation_id and u.auth_user_id = (select auth.uid())
  )
);

drop policy if exists chatbot_feedback_self_insert on chatbot_feedback;
create policy chatbot_feedback_self_insert on chatbot_feedback
for insert with check (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

drop policy if exists checkins_self_read on checkins;
create policy checkins_self_read on checkins
for select using (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

drop policy if exists user_badges_self_read on user_badges;
create policy user_badges_self_read on user_badges
for select using (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

drop policy if exists user_rewards_self_read on user_rewards;
create policy user_rewards_self_read on user_rewards
for select using (
  (select auth.uid()) is not null
  and exists (select 1 from app_users u where u.id = user_id and u.auth_user_id = (select auth.uid()))
);

create index if not exists admin_role_bindings_role_id_idx on admin_role_bindings(role_id);
create index if not exists checkins_qr_id_idx on checkins(qr_id);
create index if not exists poi_qr_codes_poi_id_idx on poi_qr_codes(poi_id);
create index if not exists user_badges_badge_id_idx on user_badges(badge_id);
create index if not exists user_rewards_reward_id_idx on user_rewards(reward_id);
