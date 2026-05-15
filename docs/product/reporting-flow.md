# Reporting Flow — Núi Bà Đen Mini App

## Mục tiêu
- Thiết kế luồng gửi và theo dõi phản ánh cho du khách.
- Làm đầu vào cho UI, API, admin operations.

## Phạm vi
- Phản ánh gắn với tài khoản Zalo user.
- Có theo dõi trạng thái sau khi gửi.
- Có moderation và audit log.

## Nhóm phản ánh tối thiểu
- Dịch vụ
- An ninh trật tự
- Môi trường
- Khác

## Luồng gửi phản ánh
1. Chọn loại phản ánh.
2. Chọn POI liên quan hoặc địa điểm gần nhất.
3. Nhập mô tả ngắn.
4. Chụp/tải ảnh minh chứng.
5. Chia sẻ vị trí hiện tại.
6. Xác nhận gửi.
7. Nhận mã phản ánh + trạng thái ban đầu.

## Tối ưu UX
- Quick chips cho mô tả phổ biến.
- Gợi ý POI gần vị trí user.
- Auto-fill locale và thời gian.
- Hiển thị rõ quyền camera/location trước khi xin quyền.

## Trạng thái đề xuất
- `new`
- `triaged`
- `in_progress`
- `resolved`
- `rejected`
- `needs_more_info`

## Màn hình lịch sử phản ánh
### Thông tin hiển thị
- Mã phản ánh
- Loại phản ánh
- Địa điểm
- Thời gian gửi
- Trạng thái hiện tại
- Mức độ ưu tiên nếu có

## Màn hình chi tiết phản ánh
### Thông tin hiển thị
- Tóm tắt phản ánh
- Ảnh đính kèm
- Vị trí/POI
- Timeline cập nhật trạng thái
- Ghi chú từ ban quản lý nếu có

## API phụ thuộc
- Report categories
- Create report
- Upload attachment metadata
- Get report history
- Get report detail
- Get report timeline/status

## Admin phụ thuộc
- Report inbox
- Assignment
- SLA board
- Moderation queue
- Audit log

## Bảo mật
- Có PII và vị trí.
- Cần retention policy.
- Role thấp không xem ngoài phạm vi.

## Câu hỏi mở
- User có được bổ sung ảnh/bình luận sau khi gửi không?
- Có escalation riêng cho nhóm an ninh/y tế không?
- SLA theo loại phản ánh chốt thế nào?
