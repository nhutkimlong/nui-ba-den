# Deploy: GitHub + Vercel

Repo đã commit local (1 commit: "chore: initial commit"). Bước tiếp theo: tạo
remote GitHub, push lên, rồi import 3 project (api, admin, miniapp) vào Vercel.

## Bước 1 — Tạo GitHub repo

Vào https://github.com/new

- Repository name: `nui-ba-den` (private hoặc public đều được)
- KHÔNG tick "Add a README", "Add .gitignore", "Choose a license" (đã có sẵn)

## Bước 2 — Push code

Trong PowerShell ở thư mục dự án:

```powershell
git remote add origin https://github.com/<USER>/nui-ba-den.git
git push -u origin main
```

Thay `<USER>` bằng GitHub username của bạn.

## Bước 3 — Import 3 project vào Vercel

Vào https://vercel.com/new — chọn team `nhutkimlong`. Import repo
`nui-ba-den` 3 lần với cấu hình khác nhau:

### Project 1: nbd-api

- **Project name:** `nbd-api`
- **Root Directory:** `apps/api` (click "Edit" rồi gõ vào)
- **Framework Preset:** Other
- **Build Command:** để mặc định (Vercel sẽ đọc `vercel.json`)
- **Environment Variables:**
  - `SUPABASE_URL` → URL Supabase project
  - `SUPABASE_SERVICE_ROLE_KEY` → service-role key (KHÔNG dùng anon)
  - `LLM_BASE_URL` → `https://ry4rkyf.9router.com/v1`
  - `LLM_API_KEY` → key self-hosted LLM
  - `LLM_MODEL` → `CrawBot`
  - `ZALO_APP_ID` → app ID từ Zalo Console
  - `ZALO_APP_SECRET` → app secret
  - `ZALO_REDIRECT_URI` → `https://nbd-api.vercel.app/auth/zalo/callback` (đổi sau khi biết domain thật)
  - `MINIAPP_BASE_URL` → URL miniapp sau khi deploy xong (xem bước 5)

Bấm **Deploy**.

### Project 2: nbd-admin

- **Project name:** `nbd-admin`
- **Root Directory:** `apps/admin`
- **Framework Preset:** Next.js (auto)
- **Environment Variables:**
  - `NEXT_PUBLIC_API_BASE` → URL của `nbd-api` sau khi deploy (vd `https://nbd-api.vercel.app`)

Bấm **Deploy**.

### Project 3: nbd-miniapp

- **Project name:** `nbd-miniapp`
- **Root Directory:** `apps/miniapp`
- **Framework Preset:** Next.js (auto)
- **Environment Variables:**
  - `NEXT_PUBLIC_API_BASE` → URL của `nbd-api`

Bấm **Deploy**.

## Bước 4 — Quay lại nbd-api cập nhật `MINIAPP_BASE_URL`

Sau khi `nbd-miniapp` deploy xong, copy URL (vd `https://nbd-miniapp.vercel.app`).

Vào nbd-api → Settings → Environment Variables → cập nhật `MINIAPP_BASE_URL`
→ Redeploy.

## Bước 5 — Cập nhật Zalo redirect URI

Vào https://developers.zalo.me → Mini App → Cấu hình OAuth:

- Redirect URL: `https://nbd-api.vercel.app/auth/zalo/callback`

## Bước 6 — Tạo admin user đầu tiên

Trong PowerShell (cần Supabase env vars):

```powershell
cd apps\api
$env:SUPABASE_URL="..."
$env:SUPABASE_SERVICE_ROLE_KEY="..."
pnpm bootstrap:admin -- admin@example.com strong-password-here
```

Đăng nhập admin tại `https://nbd-admin.vercel.app/login`.

## Bước 7 — Đẩy Mini App production lên Zalo

Mini App bản production thật chạy trong Zalo super-app, không phải Vercel.

Trong [apps/miniapp](../../apps/miniapp), build ZMP bundle theo skill
`zalo-mini-app` → upload ZIP qua Zalo Mini App Console
(https://mini.zalo.me).

`nbd-miniapp` trên Vercel chỉ dùng để preview UI và làm fallback web cho deep
link QR khi user mở link ngoài Zalo.

## Sau này: deploy update

```powershell
git add -A
git commit -m "feat: ..."
git push
```

Vercel sẽ auto build & deploy 3 project ngay khi push lên `main`.
