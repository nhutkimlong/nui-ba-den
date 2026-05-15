# Decision Log — Núi Bà Đen Mini App

## Mục tiêu
- Ghi các quyết định đã chốt và các mục còn mở.
- Dùng làm nguồn sự thật cho bước spec triển khai.

## Đã chốt
### Product scope
- Có 4 tab: Trang chủ, Khám phá, Phản ánh, Hỗ trợ.
- Hỗ trợ 2 ngôn ngữ: Việt, Anh.
- Không có payment trong MVP.
- Có phản ánh, chatbot, check-in, badge.

### Identity / access
- User dùng tài khoản Zalo.
- Có admin backend/CMS riêng.

### Chatbot
- Chatbot chỉ làm hỏi/đáp.
- Chatbot dùng knowledge base chính thức + LLM API.
- Không khóa cứng implementation vào service demo cụ thể.
- CMS/KB là nguồn dữ liệu chính thức, chatbot không làm CMS.

### Reporting
- Có gửi phản ánh và xem lịch sử/trạng thái.
- Nhóm phản ánh tối thiểu: dịch vụ, an ninh trật tự, môi trường, khác.
- Có moderation/logging.

### Gamification
- Check-in dùng GPS + QR định danh POI.
- Có badge/danh hiệu.
- Reward/tier do admin cập nhật.

## Cần chốt tiếp
### 1. SLA cụ thể cho từng loại phản ánh
- Môi trường
- Dịch vụ
- An ninh trật tự
- Y tế/mất đồ nếu thêm

### 2. Admin auth system
- Dùng auth nào cho admin panel/backend?
- Có SSO hay tài khoản nội bộ riêng?

### 3. GPS radius / time window cho check-in
- bán kính cho phép
- thời gian chống lặp
- policy check-in trùng

### 4. Retention policy
- chatbot logs giữ bao lâu
- reports giữ bao lâu
- audit logs giữ bao lâu
- attachment/media giữ bao lâu

### 5. Brand color / dark mode
- màu chính thức
- có dark mode MVP hay không

### 6. Chatbot interaction reference
- User nói chatbot sẽ hoạt động giống một mẫu nào đó
- Cần mẫu cụ thể: screenshot, URL, flow, hay transcript

## Khuyến nghị chốt sớm
1. SLA phản ánh
2. Admin auth
3. GPS/time window
4. Chatbot interaction pattern
5. Retention
6. Brand/dark mode

## Default proposal nếu cần tạm chạy MVP
- SLA: chưa hard-code theo loại, chỉ hiển thị trạng thái.
- Admin auth: tài khoản nội bộ role-based.
- GPS radius: TBD.
- Time window: TBD.
- Retention: TBD theo policy vận hành.
- Dark mode: chưa làm MVP.
