# Zalo Mini App Platform Overview — Núi Bà Đen

## Mục tiêu
- Tóm tắt nền tảng Zalo Mini App cho dự án này.
- Làm entry point cho team product/dev trước khi đọc docs chi tiết.

## Bối cảnh dự án
- Mini app shell đã được tạo.
- Có quyền vào app console.
- Scope hiện tại: thông tin du khách, phản ánh, chatbot, check-in, badge.
- Không có payment.

## Thành phần chính của nền tảng
- Zalo Mini App runtime
- Zalo developer console
- Devtools: VS Code Extension và CLI
- Public APIs: user, permission, location, camera, storage, navigation/UI

## Feature chính áp dụng cho dự án
- User identity qua tài khoản Zalo
- Location cho phản ánh/check-in
- Camera cho phản ánh/scan QR
- Storage cho local state cần thiết
- Navigation/UI APIs cho trải nghiệm trong app

## Không nằm trong scope hiện tại
- Thanh toán
- E-commerce flow
- CRM/marketing automation phức tạp

## Docs nên đọc tiếp
- `02-developer-console.md`
- `03-framework-and-tooling.md`
- `04-app-config.md`
- `05-apis-permissions.md`
- `06-release-review.md`

## Câu hỏi mở
- Có cần dùng notification permission cho cập nhật trạng thái phản ánh không?
- Có cần thêm webview cho nội dung ngoài mini app không?
