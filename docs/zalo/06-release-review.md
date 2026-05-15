# Zalo Release Review Checklist — Núi Bà Đen

## Mục tiêu
- Checklist trước khi build/release mini app và backend liên quan.
- Một phần còn generic vì public docs release fetch chưa đủ chi tiết.

## Product gate
- [ ] 4 tab chính đã chốt
- [ ] Song ngữ Việt/Anh đủ cho màn hình public
- [ ] Reporting flow đã chốt status model
- [ ] Chatbot scope không vượt dữ liệu chính thức
- [ ] Check-in/badge rules đã chốt

## Zalo API gate
- [ ] Chỉ xin permission thật sự cần
- [ ] Consent copy cho camera/location đã chốt
- [ ] Fallback khi từ chối quyền đã có
- [ ] Không dùng API ngoài scope

## Admin backend gate
- [ ] Role matrix đã chốt
- [ ] Audit log cho hành động admin quan trọng
- [ ] Moderation queue cho chatbot/reporting
- [ ] Retention policy cho PII

## Security gate
- [ ] Không commit secret/token
- [ ] Rate limit public APIs
- [ ] Anti-fraud cho GPS/QR check-in
- [ ] Logging có masking nếu cần

## Content gate
- [ ] Banner/POI/FAQ/guide đã có đủ bản dịch
- [ ] Nội dung hotline/emergency chính xác
- [ ] KB chatbot đã review
- [ ] Nội dung nhạy cảm đã qua moderation nếu cần

## Operational gate
- [ ] Build target đúng app
- [ ] Có rollback plan
- [ ] Có người owner theo dõi phản ánh sau launch
- [ ] Có người owner review chatbot logs sau launch

## Manual review items
- Xác minh console settings thực tế
- Xác minh publish flow thực tế trên app console
- Xác minh review requirements nếu Zalo có checklist riêng trong console/docs private

## Câu hỏi mở
- Có staging environment rõ ràng không?
- Launch sẽ theo soft launch hay full release?
