# Integration Boundaries — Núi Bà Đen Mini App

## Mục tiêu
- Chốt ranh giới giữa mini app, admin backend/CMS, chatbot service, Supabase.
- Giảm chồng chéo trách nhiệm giữa service.

## Thành phần
- Mini app client
- Admin backend/CMS
- Chatbot layer / Q&A service (implementation có thể thay đổi)
- Supabase

## Boundary rules
### Mini app
- Chỉ gọi public APIs.
- Không truy cập resource admin-only.
- Không gọi thẳng database.

### Admin backend/CMS
- Làm nguồn sự thật cho nội dung, reporting workflow, gamification rules.
- Cấp admin APIs và public app APIs.
- Ghi audit log cho hành động quan trọng.

### Chatbot service
- Chỉ xử lý hỏi/đáp.
- Không làm CRUD CMS.
- Không tự ý sửa KB/content chính.
- Có thể đọc KB/context qua API nội bộ hoặc replica được phép.

### Supabase
- Có thể là data store chính hoặc phụ.
- Có thể chứa KB, content tables, logs, progress.
- Không phải boundary cho client nếu backend đã đứng giữa.

## Luồng tích hợp đề xuất
### Content flow
CMS editor -> admin backend -> publish -> public content API -> mini app

### Report flow
mini app -> reporting API -> admin backend -> operator/moderator -> status update -> mini app history

### Chatbot flow
mini app -> chatbot API -> chatbot service -> fetch KB/context (backend/Supabase) -> answer -> mini app

### Check-in flow
mini app -> gamification API -> GPS+QR validation -> write checkin -> calculate badge/reward -> return result

## Đồng bộ KB
- Option A: chatbot service đọc KB qua internal API.
- Option B: chatbot service đọc replica/store sync từ Supabase.
- Ưu tiên Option A nếu cần kiểm soát quyền và versioning.

## Auth boundary
- User auth: Zalo account identity.
- Admin auth: hệ thống admin riêng.
- Service-to-service auth: cần chốt riêng.

## Không nên làm
- Mini app gọi thẳng Supabase admin tables.
- Chatbot service kiêm CMS.
- Logic moderation nằm rải rác ở nhiều service.

## Câu hỏi mở
- Service-to-service auth dùng gì?
- Cache layer nằm ở đâu?
- Analytics chạy từ DB, logs, hay event pipeline?
