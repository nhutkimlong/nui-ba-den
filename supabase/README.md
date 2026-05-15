# Supabase — Núi Bà Đen Mini App

Project ref: `tuusgppjfkcijoneojrg`
MCP server: configured in [../.mcp.json](../.mcp.json)

## Migration order

Áp đúng theo thứ tự số. Mỗi file là một step độc lập (idempotent — dùng `if not exists` / `on conflict do nothing`), nhưng FK liên bảng yêu cầu thứ tự này:

| #    | File                                             | Nội dung |
|------|--------------------------------------------------|----------|
| 0001 | `0001_identity_base.sql`                         | helper trigger, locale enum, app_users, admin_users + roles |
| 0002 | `0002_poi_content.sql`                           | POI + categories/translations/media/QR, content pages, banners, alerts, guides, FAQ |
| 0003 | `0003_reporting.sql`                             | report categories, reports, attachments, updates, status history |
| 0004 | `0004_chatbot.sql`                               | KB items, conversations, messages, feedback |
| 0005 | `0005_gamification.sql`                          | check-ins, badges, badge_rules, user_badges, rewards |
| 0006 | `0006_governance.sql`                            | audit_logs, moderation_queue, retention_policies |

## Cách áp

### Qua Supabase MCP (khuyến nghị, sau khi restart Claude Code)

Sau khi restart, các tool `mcp__supabase__*` sẽ load. Yêu cầu Claude:

> "Apply migration 0001_identity_base.sql qua Supabase MCP"

Claude sẽ dùng `mcp__supabase__apply_migration` cho từng file theo thứ tự.

### Qua Supabase CLI (nếu cài local)

```powershell
supabase link --project-ref tuusgppjfkcijoneojrg
supabase db push
```

### Qua SQL Editor trên dashboard

1. Mở project `tuusgppjfkcijoneojrg` → SQL Editor
2. Paste lần lượt từng file 0001 → 0006, chạy từng file
3. Kiểm tra `select * from pg_tables where schemaname = 'public'` sau khi xong

## RLS policy — tóm tắt

- Bảng nội dung (POI, content_pages, banners, alerts, guides, FAQ, KB): **public read** chỉ với row `published`/`active`.
- Bảng người dùng (reports, checkins, user_badges, user_rewards, chatbot_*): **self-only** read/insert qua `auth.uid()`.
- Bảng admin/governance (admin_*, audit_logs, moderation_queue, retention_policies, badge_rules, poi_qr_codes): **không có policy public** — chỉ service role bypass RLS.

## Convention

- Mọi bảng "operational" có `created_at`, `updated_at`; cập nhật tự động qua trigger `set_updated_at`.
- Mọi bảng song ngữ tách `*_translations(parent_id, locale, ...)` với PK `(parent_id, locale)`.
- Locale enum: `vi` | `en`. Default `vi` per CLAUDE.md.
- Status enum:
  - `publish_status`: `draft` | `published` | `archived`
  - `report_status`: `new` | `triaged` | `in_progress` | `resolved` | `rejected` | `needs_more_info`

## Còn để mở (xem `docs/specs/decision-log.md`)

- SLA cụ thể cho từng `report_categories.code` → cột `sla_hours` đang null
- GPS radius / time window cho check-in → `poi_qr_codes.check_radius_m` nullable, anti-replay logic ở app layer
- Retention days → bảng `retention_policies` đã seed scopes, `is_active=false`
- Admin auth system → `admin_users.auth_user_id` để link sau khi chốt
- Object storage bucket cho `report_attachments.storage_path` và `poi_media.url` — tạo qua dashboard sau

## Bảo mật

- **KHÔNG** commit service role key vào repo. Chỉ giữ trong `apps/api/.env.local`.
- Frontend (miniapp/admin) chỉ dùng anon key. Mọi mutation đi qua `apps/api`.
- LLM key (chatbot) ở `LLM_API_KEY`, không lưu DB.
