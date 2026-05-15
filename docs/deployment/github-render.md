# Deploy: GitHub + Render

Sau khi Vercel build chậm, dự án chuyển sang Render. 3 service đã được tạo qua
Render REST API từ repo `https://github.com/nhutkimlong/nui-ba-den` (branch
`main`, region `singapore`, plan `free`).

| Service       | Root        | URL                                    | Service ID                    |
|---------------|-------------|----------------------------------------|-------------------------------|
| `nbd-api`     | `apps/api`  | https://nbd-api-t63a.onrender.com      | `srv-d837bpuk1jcs73bh987g`    |
| `nbd-admin`   | `apps/admin`| https://nbd-admin.onrender.com         | `srv-d837c2l7vvec73944t40`    |
| `nbd-miniapp` | `apps/miniapp` | https://nbd-miniapp.onrender.com   | `srv-d837c1tckfvc73bbb77g`    |

Auto-deploy: bật. Mỗi push lên `main` sẽ trigger build cả 3 service. Cấu hình
Blueprint cũng được commit ở [render.yaml](../../render.yaml) để bootstrap lại
khi cần.

## Build & start commands

Mỗi service `cd ../..` để chạy pnpm workspace install ở root rồi build từng app:

- `nbd-api`: `pnpm --filter api build` → `node dist/main.js`, health
  check `/health`.
- `nbd-admin`: `pnpm --filter admin build` →
  `pnpm --filter admin exec next start -p $PORT`.
- `nbd-miniapp`: `pnpm --filter miniapp build` →
  `pnpm --filter miniapp exec next start -p $PORT`.

`PORT` do Render gán; không hardcode.

## Env vars

`nbd-api` đã set qua API:

- `NODE_VERSION=20.18.0`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-side)
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL=CrawBot`, `LLM_TIMEOUT_MS=20000`
- `MINIAPP_BASE_URL=https://nbd-miniapp.onrender.com`

Còn thiếu (set khi cần): `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_REDIRECT_URI`
(`https://nbd-api-t63a.onrender.com/auth/zalo/callback`).

`nbd-admin` và `nbd-miniapp` set:

- `NODE_VERSION=20.18.0`
- `NEXT_PUBLIC_API_BASE=https://nbd-api-t63a.onrender.com`

## Quản lý qua Render MCP

Đã thêm vào `~/.claude/settings.json`:

```json
"mcpServers": {
  "render": {
    "type": "http",
    "url": "https://mcp.render.com/mcp",
    "headers": { "Authorization": "Bearer rnd_..." }
  }
}
```

Restart Claude Code để dùng tool `mcp__render__*` cho các thao tác deploy/log.

## Trigger redeploy thủ công

```powershell
$h = @{ Authorization = "Bearer rnd_FfI2XCu9JyiBQT7h0nNeY99LoswR" }
Invoke-RestMethod -Method Post -Headers $h `
  -Uri "https://api.render.com/v1/services/srv-d837bpuk1jcs73bh987g/deploys"
```

Đổi service ID tương ứng cho admin/miniapp.

## Bootstrap admin user

```powershell
cd apps\api
$env:SUPABASE_URL="..."
$env:SUPABASE_SERVICE_ROLE_KEY="..."
pnpm bootstrap:admin -- admin@example.com strong-password
```

Đăng nhập admin tại `https://nbd-admin.onrender.com/login`.

## Caveat: Render Free

- Service spin down sau 15 phút idle, request đầu tiên cold-start ~30s.
- 750 instance-hours/tháng/workspace.
- Không có persistent disk.

Khi cần production-grade, đổi `plan` sang `starter` ($7/service/month) qua
dashboard hoặc PATCH `/v1/services/{id}`.

## Cập nhật `MINIAPP_BASE_URL`/Zalo redirect

Khi miniapp đổi domain (ví dụ custom domain), cập nhật:

1. `nbd-api` env `MINIAPP_BASE_URL` (PUT `/v1/services/{id}/env-vars`).
2. Zalo Console → OAuth redirect URL.

Sau đó trigger redeploy `nbd-api`.
