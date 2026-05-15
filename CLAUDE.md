# CLAUDE.md

## Project goal
Build complete Zalo Mini App for Ban Quản lý Khu du lịch quốc gia Núi Bà Đen.
Primary user: tourist.
Primary goals:
- tourist information
- POI discovery
- report incidents/issues
- chatbot Q&A
- GPS + QR check-in
- badges / gamification
- bilingual Vietnamese + English

No payment in MVP.

## Product scope
Main tabs:
1. Trang chủ
2. Khám phá
3. Phản ánh
4. Hỗ trợ

Core features:
- home content, alerts, featured POIs/events
- POI list/detail
- FAQ / guide articles
- reporting flow with history and status tracking
- chatbot powered by knowledge base + LLM API
- user profile with check-in history and badges
- admin backend/CMS for content, KB, reporting, gamification, moderation

## Authoritative docs
Read these first before planning or coding:
- [docs/specs/mvp-backlog.md](docs/specs/mvp-backlog.md)
- [docs/specs/decision-log.md](docs/specs/decision-log.md)
- [docs/product/information-architecture.md](docs/product/information-architecture.md)
- [docs/product/reporting-flow.md](docs/product/reporting-flow.md)
- [docs/product/chatbot-scope.md](docs/product/chatbot-scope.md)
- [docs/product/gamification-checkin-badges.md](docs/product/gamification-checkin-badges.md)
- [docs/product/content-model.md](docs/product/content-model.md)
- [docs/architecture/admin-backend-cms.md](docs/architecture/admin-backend-cms.md)
- [docs/architecture/data-model-overview.md](docs/architecture/data-model-overview.md)
- [docs/architecture/integration-boundaries.md](docs/architecture/integration-boundaries.md)
- [docs/architecture/moderation-audit-logging.md](docs/architecture/moderation-audit-logging.md)
- [docs/zalo/05-apis-permissions.md](docs/zalo/05-apis-permissions.md)
- [docs/zalo/06-release-review.md](docs/zalo/06-release-review.md)

## Architecture rules
- Mini app is tourist-facing client only.
- Admin backend/CMS is source of truth for content, reporting workflow, KB, gamification rules.
- Chatbot layer is Q&A only.
- Chatbot must not become CMS.
- Chatbot answers from official knowledge base/context through LLM API.
- Keep clean boundaries between:
  - frontend mini app
  - public APIs
  - admin APIs
  - chatbot layer
  - data store / Supabase

## Current product decisions
- bilingual: `vi`, `en`
- user identity: Zalo account
- no payment in MVP
- report categories minimum: service, security/order, environment, other
- report history and status visible to user
- check-in uses GPS + QR mapped to POI
- badges/rewards managed by admin
- moderation/logging required for reporting and chatbot

## Still-open decisions
Treat these as unresolved until user confirms:
- exact SLA by report category
- admin auth system
- GPS radius for valid check-in
- time window / repeat check-in policy
- retention policy for logs, reports, attachments
- official brand colors
- dark mode support
- final chatbot interaction pattern/reference

Do not invent final values for unresolved items. If implementation needs temporary defaults, mark them clearly and keep them easy to change.

## Implementation priorities
P0:
- home
- explore POI/detail
- reporting create/history/status
- chatbot Q&A
- check-in basic flow
- badge/progress basic flow
- admin CMS for content/KB/reporting/gamification

P1:
- event schedule
- notification for report updates
- analytics dashboard
- richer multilingual workflow

P2:
- advanced anti-fraud
- human handoff for chatbot
- dark mode
- deeper analytics

## Coding behavior for Claude
When asked to code:
1. read `docs/specs/mvp-backlog.md` and `docs/specs/decision-log.md`
2. map request to FE / BE / ADM module
3. preserve architecture boundaries
4. prefer simplest implementation that matches current MVP
5. avoid building payment, e-commerce, or unrelated features
6. keep chatbot implementation generic around KB + LLM API
7. do not hardcode dependency on any demo chatbot service
8. if unresolved decision blocks implementation, ask user or isolate behind clear config/constants
9. update docs when implementation changes product or architecture assumptions

## UX rules
- max 4 bottom tabs
- avoid controls near Zalo top-right menu area
- one main CTA per screen
- reduce manual typing
- request permissions only in context
- provide fallback when permissions denied
- fallback to Vietnamese when English translation missing
- chatbot should be support layer, not default landing flow

## Security and privacy rules
- do not expose secrets in repo or docs
- treat phone, location, report attachments, chatbot logs as sensitive
- require audit logs for admin actions
- require moderation flow for sensitive public/user-generated content
- apply role-based access in admin backend
- protect check-in against GPS spoofing / QR abuse as much as MVP allows

## Reporting rules
Use status model unless user changes it:
- `new`
- `triaged`
- `in_progress`
- `resolved`
- `rejected`
- `needs_more_info`

## Documentation rules
When creating new docs/specs:
- prefer concise operational docs
- keep product docs separate from architecture docs
- keep unresolved items in decision log
- keep public API assumptions aligned with `docs/zalo/05-apis-permissions.md`

## Recommended next build order
1. scaffold frontend information architecture
2. scaffold public backend APIs
3. scaffold admin backend/CMS
4. wire content and reporting
5. wire chatbot KB + LLM API
6. wire check-in and badges
7. add moderation/audit/logging
8. harden release checklist

## If user asks to proceed autonomously
Use `docs/specs/mvp-backlog.md` as execution order.
Start with P0.
Keep commits or changes grouped by FE / BE / ADM module.
