# Đóng gói mini app cho Zalo Mini App platform

App ID: `4300503811252002131`

## File cấu hình
`zmp/app-config.json` đã được chuẩn bị theo Zalo Mini App App Config docs.

## Bundle để upload
Vì mini app này dùng Next.js để dev nhanh, để build lên Zalo Mini App console cần `next build` rồi `next export` (hoặc serve qua webview riêng), hoặc port code sang ZMP CLI template.

Quy trình khuyến nghị khi sẵn sàng đẩy lên app `4300503811252002131`:

1. Nếu giữ Next.js
   - chạy `pnpm --filter miniapp build` rồi serve trên domain HTTPS đã đăng ký với Zalo
   - cấu hình mini app dạng webview tới domain hosting nội dung

2. Nếu dùng ZMP CLI / Extension
   - tạo dự án ZMP mới, copy `app/`, `components/`, `lib/` của mini app sang
   - giữ nguyên `zmp/app-config.json` ở root dự án ZMP
   - chạy `zmp start` để preview, `zmp deploy` để publish

## Ảnh app icon / splash
Đặt vào `zmp/icon.png` (1024x1024) và `zmp/splash.png` theo yêu cầu Zalo console.

## Liên kết quan trọng
- Console: https://miniapp.zaloplatforms.com/console/4300503811252002131
- Docs: https://miniapp.zaloplatforms.com/documents/devtools/app-config/
