# Admin Backend And CMS — Núi Bà Đen Mini App

## Mục tiêu
- Xác định kiến trúc backend quản trị cho mini app.
- Tách rõ CMS, public APIs, chatbot service.

## Kiến trúc tổng
- Mini app: client cho du khách.
- Admin backend/CMS: trung tâm quản trị.
- Chatbot layer: Q&A API riêng, có thể thay đổi implementation.
- Supabase: data store/KB store tùy boundary cuối cùng.
- LLM API: lớp sinh câu trả lời dựa trên KB/context chính thức.

## Chức năng admin backend
- Quản lý nội dung song ngữ
- Quản lý POI + QR + GPS
- Quản lý FAQ/KB
- Quản lý phản ánh + trạng thái + SLA
- Quản lý badge/tier/quà
- Moderation queue
- Audit logs
- Analytics/dashboard

## Public API groups
- Content API
- Reporting API
- Gamification API
- Chatbot API gateway/integration metadata nếu cần

## Admin API groups
- CMS CRUD
- Translation management
- Report triage/status update
- Badge/reward management
- Moderation
- Audit/analytics

## Roles
- super_admin
- content_editor
- operator
- moderator
- gamification_admin
- analytics_viewer

## Data domains
- users
- poi
- poi_translations
- content_pages
- content_translations
- reports
- report_updates
- chatbot_kb_items
- chatbot_messages
- checkins
- badges
- badge_rules
- rewards
- audit_logs

## Boundary rules
- CMS không nằm trong chatbot service.
- Chatbot chỉ đọc KB/context qua cơ chế được phép.
- Public mini app không gọi thẳng bảng/admin-only resources.
- Admin actions phải có audit log.

## Moderation
- Review nội dung phản ánh
- Review chatbot logs/flags
- Hide/escalate/keep

## Bảo mật
- Auth mạnh cho admin
- Phân quyền theo role
- Retention policy cho PII
- Rate limit cho public APIs
- Anti-fraud cho check-in GPS/QR

## Câu hỏi mở
- Admin auth dùng hệ thống nào?
- Supabase dùng như primary store hay chỉ KB/store phụ?
- Có panel riêng cho operator và content team không?
