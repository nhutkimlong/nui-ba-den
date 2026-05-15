# Moderation, Audit, Logging — Núi Bà Đen Mini App

## Mục tiêu
- Chốt yêu cầu moderation và logging cho phản ánh, chatbot, admin actions.
- Làm đầu vào cho backend, dashboard, policy vận hành.

## Phạm vi
- Chatbot logs
- Report moderation
- Admin audit log
- Retention policy

## Moderation domains
### 1. Reporting
- Nội dung phản ánh có thể nhạy cảm, xúc phạm, sai phạm.
- Cần queue để moderator xem và quyết định.

### 2. Chatbot
- Log câu hỏi/câu trả lời
- Flag câu hỏi nhạy cảm hoặc trả lời không phù hợp
- Cho phép review và phân loại lỗi kiến thức

### 3. CMS content
- Nội dung public có thể cần review trước publish

## Audit log
### Ghi cho các hành động
- Tạo/sửa/xóa nội dung
- Cập nhật trạng thái phản ánh
- Cập nhật badge/rule/reward
- Thay đổi role hoặc policy

### Trường gợi ý
- actor_id
- actor_role
- action
- entity_type
- entity_id
- before_snapshot
- after_snapshot
- created_at

## Operational logs
- API request id
- latency
- error type
- chatbot source ids
- check-in validation result

## Retention gợi ý
- Audit log: giữ dài hạn
- Chatbot logs: giữ theo policy riêng vì có thể chứa PII
- Reports: giữ theo yêu cầu vận hành/pháp lý

## Quy trình moderation gợi ý
1. Nội dung bị flag
2. Vào moderation queue
3. Moderator review
4. Quyết định: keep / hide / escalate
5. Ghi audit log

## Dashboard gợi ý
- Số phản ánh theo trạng thái
- SLA breach count
- Chatbot helpful rate
- Số item bị moderation
- Check-in fail reasons

## Câu hỏi mở
- Retention cụ thể là bao lâu?
- Có cần export audit log định kỳ không?
- Có cần masking PII trong dashboard không?
