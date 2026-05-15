# Data Model Overview — Núi Bà Đen Mini App

## Mục tiêu
- Tổng quan entity chính cho mini app, CMS, chatbot, reporting, gamification.
- Làm đầu vào cho database schema chi tiết.

## Nhóm entity
### Identity
- users
- user_sessions (nếu cần)
- admin_users
- admin_roles
- admin_role_bindings

### Content
- content_pages
- content_translations
- banners
- alerts
- guide_articles
- guide_article_translations
- faq_items
- chatbot_kb_items

### Destination / POI
- poi
- poi_translations
- poi_categories
- poi_media
- poi_qr_codes

### Events
- event_items
- event_translations

### Reporting
- report_categories
- reports
- report_attachments
- report_updates
- report_status_history

### Chatbot
- chatbot_conversations
- chatbot_messages
- chatbot_feedback

### Gamification
- checkins
- badges
- badge_rules
- user_badges
- rewards
- user_rewards

### Governance
- audit_logs
- moderation_queue
- retention_policies

## Quan hệ mức cao
- user có nhiều reports
- report có nhiều updates và attachments
- user có nhiều checkins
- user có nhiều badges/rewards
- poi có nhiều translations/media/QR
- content page có nhiều translations
- KB item có thể link đến POI/article/FAQ

## Gợi ý trường hệ thống chung
- id
- created_at
- updated_at
- created_by
- updated_by
- status
- locale (nếu là bảng translation)

## Gợi ý tách bảng translation
- entity chính chứa identity, trạng thái, quan hệ
- entity translation chứa title/body/summary theo locale

## Gợi ý audit
- before_snapshot
- after_snapshot
- actor_id
- actor_role
- entity_type
- entity_id
- action
- timestamp

## Gợi ý moderation
- target_type
- target_id
- flag_reason
- severity
- decision
- reviewer_id

## Câu hỏi mở
- Có cần soft delete cho entity vận hành không?
- Có cần multi-tenant hoặc phân vùng dữ liệu theo đơn vị xử lý không?
- Có cần lưu media metadata riêng hay qua object storage table?
