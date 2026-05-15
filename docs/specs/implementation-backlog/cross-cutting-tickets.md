# Cross-Cutting Tickets

## X-01 — Data model baseline
**Priority:** P0  
**Scope:** schema baseline cho content, reporting, chatbot KB, gamification, audit.  
**Dependencies:** [../../architecture/data-model-overview.md](../../architecture/data-model-overview.md)  
**Acceptance criteria:** đủ cho BE/ADM P0; không gộp CMS logic vào chatbot tables.

## X-02 — Integration boundary enforcement
**Priority:** P0  
**Scope:** chuẩn hóa boundaries giữa mini app, backend, CMS, chatbot, store.  
**Dependencies:** [../../architecture/integration-boundaries.md](../../architecture/integration-boundaries.md)  
**Acceptance criteria:** FE không gọi admin-only resource; chatbot layer không có write access vào CMS.

## X-03 — Permission UX and policy alignment
**Priority:** P0  
**Scope:** align camera/location/notification policy giữa FE + docs + backend.  
**Dependencies:** [../../zalo/05-apis-permissions.md](../../zalo/05-apis-permissions.md)  
**Acceptance criteria:** permission prompts đúng ngữ cảnh; docs và implementation không lệch.

## X-04 — Decision lock for unresolved items
**Priority:** P0  
**Scope:** tạo config/constants/placeholders cho SLA, auth, GPS radius, time window, retention, brand, dark mode.  
**Dependencies:** [../decision-log.md](../decision-log.md)  
**Acceptance criteria:** không hardcode ngầm giá trị chưa chốt; placeholder/config rõ ràng.
