# Frontend Tickets

## FE-01 — Home screen shell
**Priority:** P0  
**Scope:** Home, banner, tình trạng hôm nay, CTA, alerts.  
**Dependencies:** BE-01, ADM-02  
**Acceptance criteria:** loading/empty/error; `vi`/`en`; CTA đúng.  
**Open notes:** Brand color chưa chốt.

## FE-02 — Explore list and detail
**Priority:** P0  
**Scope:** danh sách POI, filter, chi tiết, link FAQ/chatbot/check-in.  
**Dependencies:** BE-01, ADM-02  
**Acceptance criteria:** list + detail; POI song ngữ; CTA đúng context.  
**Open notes:** map screen riêng chưa chốt.

## FE-03 — Reporting create flow
**Priority:** P0  
**Scope:** chọn loại, chọn POI/vị trí, mô tả, ảnh, vị trí, submit.  
**Dependencies:** BE-02, ADM-03, [../../zalo/05-apis-permissions.md](../../zalo/05-apis-permissions.md)  
**Acceptance criteria:** submit hoàn tất; permission UX camera/location; success state; error handling cơ bản.  
**Open notes:** SLA theo loại chưa chốt.

## FE-04 — Reporting history and detail
**Priority:** P0  
**Scope:** danh sách phản ánh theo user, chi tiết, timeline trạng thái.  
**Dependencies:** BE-02, ADM-03  
**Acceptance criteria:** xem lịch sử cá nhân; status rõ; timeline đúng.

## FE-05 — Support screen shell
**Priority:** P0  
**Scope:** hotline, FAQ links, chatbot entry, hồ sơ user block.  
**Dependencies:** BE-01, BE-03, ADM-02, ADM-04  
**Acceptance criteria:** entry point hỗ trợ đầy đủ; FAQ/hotline theo locale; chatbot CTA hoạt động.

## FE-06 — Chatbot conversation UI
**Priority:** P0  
**Scope:** UI hỏi/đáp, quick suggestions, feedback, fallback.  
**Dependencies:** BE-03, ADM-04  
**Acceptance criteria:** hỏi/đáp qua API; locale + context id; fallback FAQ/hotline; feedback.  
**Open notes:** interaction pattern cuối chưa chốt.

## FE-07 — Check-in flow
**Priority:** P0  
**Scope:** CTA check-in, scan QR, validate GPS + QR, hiển thị kết quả.  
**Dependencies:** BE-04, ADM-05, [../../zalo/05-apis-permissions.md](../../zalo/05-apis-permissions.md)  
**Acceptance criteria:** check-in success khi hợp lệ; fail state rõ; chống repeat theo rule BE.  
**Open notes:** GPS radius, time window chưa chốt.

## FE-08 — Badge and profile basic
**Priority:** P0  
**Scope:** hồ sơ user, badge list, check-in history, reward/tier basic view.  
**Dependencies:** BE-04, ADM-05  
**Acceptance criteria:** hiển thị đúng badge/progress/history theo user.

## FE-09 — Bilingual framework wiring
**Priority:** P0  
**Scope:** locale switching, fallback Việt, chuẩn hóa key/format.  
**Dependencies:** BE-01, ADM-02  
**Acceptance criteria:** render đúng `vi`/`en`; fallback rõ ràng.
