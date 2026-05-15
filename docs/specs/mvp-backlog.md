# MVP Backlog — Núi Bà Đen Mini App

## Mục tiêu
- Chuyển bộ docs vòng 1 thành backlog triển khai MVP.
- Chia theo frontend mini app, backend public APIs, admin backend/CMS.

## Nguyên tắc MVP
- Ưu tiên tính năng phục vụ du khách ngay.
- Mọi flow phải có dữ liệu quản trị được.
- Chatbot dùng KB + LLM API, không khóa cứng implementation.
- Không làm payment.

## P0 — Must Have

### Frontend mini app
1. Trang chủ
- banner
- tình trạng hôm nay
- CTA sang Khám phá / Phản ánh / Chatbot

2. Khám phá
- danh sách POI
- chi tiết POI
- FAQ/cẩm nang cơ bản

3. Phản ánh
- chọn loại phản ánh
- gửi mô tả + ảnh + vị trí
- xem lịch sử phản ánh
- xem trạng thái phản ánh

4. Hỗ trợ
- chatbot Q&A
- hotline / hỗ trợ khẩn
- hồ sơ user cơ bản

5. Check-in cơ bản
- scan QR
- xác minh GPS
- ghi nhận check-in
- hiển thị badge/progress cơ bản

### Backend public APIs
1. Content API
- home blocks
- alerts
- POI list/detail
- FAQ/cẩm nang

2. Reporting API
- create report
- upload attachment metadata
- list reports by user
- get report detail/status timeline

3. Chatbot API
- ask question
- pass locale/context
- feedback helpful/unhelpful

4. Gamification API
- validate check-in
- get user progress
- get badges/rewards

### Admin backend/CMS
1. Content management
- banner
- alert
- POI
- FAQ/cẩm nang
- bản dịch Việt/Anh

2. Reporting operations
- inbox phản ánh
- cập nhật trạng thái
- phân loại/ưu tiên
- timeline xử lý

3. Chatbot KB management
- CRUD KB/FAQ
- publish/unpublish
- tags/context mapping

4. Gamification management
- CRUD badge
- CRUD reward/tier
- gán POI vào rule check-in

5. Governance
- admin roles cơ bản
- audit log cơ bản
- moderation queue cơ bản

## P1 — Should Have
- sự kiện/lịch hoạt động
- notification cho cập nhật phản ánh
- dashboard analytics cơ bản
- chatbot feedback dashboard
- reward/tier nâng cao
- multilingual content workflow tốt hơn

## P2 — Nice To Have
- anti-fraud nâng cao cho check-in
- handoff chatbot sang người thật
- publish schedule
- dark mode đầy đủ
- analytics sâu theo funnel

## Module split đề xuất
### Frontend
- FE-01 Home
- FE-02 Explore
- FE-03 Reporting
- FE-04 Support/Chatbot
- FE-05 Profile/Badge/Check-in

### Backend public
- BE-01 Content API
- BE-02 Reporting API
- BE-03 Chatbot API integration
- BE-04 Gamification API

### Admin/CMS
- ADM-01 Auth/Roles
- ADM-02 Content CMS
- ADM-03 Reporting Ops
- ADM-04 KB Management
- ADM-05 Gamification Management
- ADM-06 Moderation/Audit

## Acceptance focus per module
- FE modules: usable flow, bilingual support, empty/loading/error states.
- BE modules: stable schema, auth boundary, auditability where needed.
- ADM modules: CRUD đủ dùng, role-based access, publish/status workflow.

## Dependencies
- FE-03 phụ thuộc BE-02 + ADM-03
- FE-04 phụ thuộc BE-03 + ADM-04
- FE-05 phụ thuộc BE-04 + ADM-05
- FE-01/02 phụ thuộc BE-01 + ADM-02

## Open note
- User nói chatbot sẽ hoạt động “giống như này” cho phần đó; cần mẫu tham chiếu cụ thể để chốt interaction pattern/chat response format.
