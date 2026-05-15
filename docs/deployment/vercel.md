# Núi Bà Đen — Vercel deployment

## Hiện trạng
- Vercel team: `nhutkimlong` (`team_gnO9ksrhiwBEl6WXUtsgBxxE`).
- Chưa có project — sẽ tạo qua CLI lần đầu.

## Cấu trúc deploy

| App           | Vercel project | Root dir       | Framework | Notes |
|---------------|----------------|----------------|-----------|-------|
| API (NestJS)  | `nbd-api`      | `apps/api`     | Other     | Có `api/index.ts` + `vercel.json` rewrites all → handler |
| Admin (Next)  | `nbd-admin`    | `apps/admin`   | Next.js   | Auto |
| Miniapp preview (Next) | `nbd-miniapp` | `apps/miniapp` | Next.js | Preview UI; production thật đẩy lên Zalo Mini App console |

## Bước 1 — Đăng nhập Vercel CLI

```powershell
npx vercel login
```

## Bước 2 — Link & deploy `nbd-api`

```powershell
cd apps\api
npx vercel link --scope nhutkimlongs-projects --project nbd-api --yes

# set env (production)
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add LLM_BASE_URL production
npx vercel env add LLM_API_KEY production
npx vercel env add LLM_MODEL production
npx vercel env add LLM_TIMEOUT_MS production
npx vercel env add ZALO_APP_ID production
npx vercel env add ZALO_APP_SECRET production
npx vercel env add ZALO_REDIRECT_URI production
npx vercel env add MINIAPP_BASE_URL production

# deploy
npx vercel --prod
```

Output URL ghi nhớ làm `NEXT_PUBLIC_API_BASE` cho admin/miniapp.

## Bước 3 — Link & deploy `nbd-admin`

```powershell
cd ..\admin
npx vercel link --scope nhutkimlongs-projects --project nbd-admin --yes
npx vercel env add NEXT_PUBLIC_API_BASE production
# nhập URL của nbd-api (vd https://nbd-api.vercel.app)
npx vercel --prod
```

## Bước 4 — Link & deploy `nbd-miniapp`

```powershell
cd ..\miniapp
npx vercel link --scope nhutkimlongs-projects --project nbd-miniapp --yes
npx vercel env add NEXT_PUBLIC_API_BASE production
npx vercel --prod
```

## Bước 5 — Cập nhật Zalo OAuth callback

Trong Zalo Developer Console → Mini App của bạn:
- Allowed Redirect URIs: thêm `https://nbd-api.vercel.app/auth/zalo/callback`
- Trong Vercel `nbd-api`, set lại `ZALO_REDIRECT_URI` đúng URL trên.
- `MINIAPP_BASE_URL` set là URL của `nbd-miniapp` (preview) hoặc URL Zalo production.

## Bước 6 — Tạo admin user

Trên máy local hoặc Vercel function:

```powershell
cd apps\api
# .env.local đã có SUPABASE_*, LLM_*
pnpm bootstrap:admin -- admin@nuibaden.com.vn 'StrongPasswordHere'
```

Đăng nhập admin tại `https://nbd-admin.vercel.app/login`.

## Bước 7 — Production Mini App lên Zalo

Để đẩy thật lên Zalo Mini App store:

```powershell
cd apps\miniapp
npm i -g zmp-cli
zmp login
zmp deploy            # đẩy lên môi trường review của Zalo
```

(`zmp` cần `app-config.json` ở thư mục project — sẽ tạo khi convert sang ZMP build, xem skill `zalo-mini-app`.)

## Lưu ý CORS

`apps/api/src/main.ts` đang `cors: true`. Trên Vercel, NestJS chạy qua `api/index.ts` đã set `cors: true`. Trước khi public, đổi thành whitelist:
- `https://nbd-admin.vercel.app`
- `https://nbd-miniapp.vercel.app`
- `https://h5.zaloapp.com` (Mini App webview)
- domain miniapp production khác

## Lưu ý service role

KHÔNG đem `SUPABASE_SERVICE_ROLE_KEY` xuống `nbd-admin` hay `nbd-miniapp`. Frontend chỉ dùng `NEXT_PUBLIC_API_BASE`.
