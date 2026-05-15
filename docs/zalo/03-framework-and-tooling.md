# Zalo Framework And Tooling — Núi Bà Đen

## Mục tiêu
- Tóm tắt devtools và workflow dev cho Zalo Mini App.

## Tooling public đã thấy
- Zalo Mini App Extension
- Zalo Mini App CLI
- Các mục: Đăng nhập, Tạo dự án, Khởi động, Xuất bản, Cấu hình Zalo Mini App

## Workflow cơ bản
- `init`
- `start`
- `build`
- `deploy`

## Vai trò của tooling trong dự án
- Khởi tạo/chạy app local
- Build package mini app
- Deploy/publish build mới
- Hỗ trợ dev thao tác trong VS Code

## Khuyến nghị cho dự án này
- Giữ 1 workflow thống nhất cho team.
- Chốt ai dùng CLI, ai dùng Extension.
- Ghi rõ command thực tế sau khi repo code sẵn sàng.

## Dev checklist
- Cài Extension nếu làm trong VS Code
- Đăng nhập CLI/extension nếu cần
- Xác minh app id / target app trước deploy
- Tách rõ build test và build release

## Câu hỏi mở
- Repo code thật nằm ở đâu?
- Team sẽ ưu tiên CLI hay extension trong daily workflow?
- Có CI/CD hay publish tay?
