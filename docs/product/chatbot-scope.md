# Chatbot Scope — Núi Bà Đen Mini App

## Mục tiêu
- Xác định phạm vi chatbot trong mini app.
- Tách rõ Q&A API khỏi CMS/admin backend.

## Phạm vi chatbot
- Chỉ phục vụ hỏi/đáp trên mini app.
- Không làm CMS.
- Không làm workflow vận hành admin.
- Kiến trúc chatbot cần generic theo mô hình: knowledge base + LLM API.
- Có thể dùng service demo/tham chiếu tạm trong giai đoạn đầu, nhưng không khóa cứng triển khai cuối.

## Nguồn tri thức
- FAQ
- Cẩm nang du khách
- POI context
- Sự kiện/thông báo
- Knowledge base quản lý qua Supabase/CMS

## Entry points
- CTA ở Trang chủ
- Tab Hỗ trợ
- Deep link từ FAQ
- Deep link từ POI detail

## Hành vi mong muốn
- Trả lời ngắn, rõ, ưu tiên hành động tiếp theo.
- Nếu có context POI thì trả lời theo điểm đó.
- Link về nội dung chính thức khi phù hợp.
- Có feedback `helpful/unhelpful`.

## Failure mode
- API lỗi
- Không chắc câu trả lời
- Câu hỏi ngoài phạm vi
- Câu hỏi nhạy cảm/không phù hợp

## Fallback
- FAQ liên quan
- Hotline
- Form phản ánh/hỗ trợ
- Thông báo không đủ dữ liệu chính thức

## API boundary
### Mini app -> chatbot API
- ask question
- pass locale
- pass user/session id
- pass context id (poi/faq/article)

### Chatbot layer -> knowledge source / LLM API
- lấy KB/context theo cơ chế được phép
- gửi prompt/context sang LLM API
- không ghi sửa nội dung CMS
- không phụ thuộc cứng vào một service demo cụ thể

## Logging và moderation
- Log question/answer
- Log latency
- Log source KB ids nếu có
- Log feedback user
- Moderation flags cho nội dung nhạy cảm

## Admin phụ thuộc
- KB manager
- Chatbot log review
- Moderator

## Bảo mật
- Không trả lời ngoài dữ liệu chính thức.
- Không lộ system prompt/secret.
- Không giữ PII quá mức cần thiết.

## Câu hỏi mở
- Auth mini app -> chatbot API dùng API key, JWT, hay signed request?
- Có cần memory ngắn hạn theo session không?
- Có cần handoff sang người thật/hotline không?
