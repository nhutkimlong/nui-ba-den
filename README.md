# Núi Bà Đen Zalo Mini App Workspace

Workspace gồm 3 app:
- `apps/miniapp` — Next.js 14 mini app du khách (Trang chủ, Khám phá, Phản ánh, Hỗ trợ + Chatbot + Check-in)
- `apps/admin` — Next.js 14 admin CMS / operations console
- `apps/api` — NestJS API: content, reporting, chatbot (KB + LLM API), gamification, admin
- `packages/shared` — types, locale, status enum

Zalo Mini App ID: `4300503811252002131`

## Cài đặt

```
pnpm install
cp apps/miniapp/.env.example apps/miniapp/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/api/.env.example apps/api/.env.local
```

## Chạy dev

```
pnpm dev:api       # http://localhost:3002
pnpm dev:miniapp   # http://localhost:3000
pnpm dev:admin     # http://localhost:3001
```

## Build production

```
pnpm -r build
```

Hoặc từng app:
```
pnpm --filter api build
pnpm --filter miniapp build
pnpm --filter admin build
```

## Smoke test API

- `GET /health`
- `GET /content/home?locale=vi`
- `GET /content/explore?locale=en`
- `GET /content/poi/ba-den-peak?locale=vi`
- `POST /reports`
- `GET /reports/history`
- `POST /chatbot/ask`
- `POST /checkins`
- `GET /admin/overview`

## Đẩy lên Zalo Mini App

`zmp/app-config.json` đã chuẩn bị theo Zalo Mini App App Config docs. Xem [apps/miniapp/zmp/README.md](apps/miniapp/zmp/README.md) cho cách deploy lên app `4300503811252002131`.

## Tài liệu nội bộ

- [CLAUDE.md](CLAUDE.md)
- [docs/specs/mvp-backlog.md](docs/specs/mvp-backlog.md)
- [docs/specs/decision-log.md](docs/specs/decision-log.md)
- [docs/product/information-architecture.md](docs/product/information-architecture.md)
- [docs/product/chatbot-scope.md](docs/product/chatbot-scope.md)
- [docs/architecture/admin-backend-cms.md](docs/architecture/admin-backend-cms.md)
