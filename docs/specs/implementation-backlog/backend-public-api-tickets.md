# Backend Public API Tickets

## BE-01 — Public content API
**Priority:** P0  
**Scope:** home content, alerts, POI list/detail, FAQ/cẩm nang, locale-aware payloads.  
**Dependencies:** ADM-02, ADM-01  
**Acceptance criteria:** đủ cho FE-01/02/05/09; có locale/fallback; không lộ admin-only fields.

## BE-02 — Reporting API
**Priority:** P0  
**Scope:** create report, attachment metadata, list by user, detail, status timeline.  
**Dependencies:** ADM-03, ADM-01, ADM-06  
**Acceptance criteria:** user chỉ thấy report của mình; report tạo được với category/location/attachments; timeline đúng.

## BE-03 — Chatbot API integration
**Priority:** P0  
**Scope:** ask endpoint, locale/context request model, KB/context abstraction, LLM API abstraction, feedback endpoint.  
**Dependencies:** ADM-04, ADM-06, [../decision-log.md](../decision-log.md)  
**Acceptance criteria:** không hardcode demo service; có abstraction knowledge source + LLM provider; có log Q/A/feedback; không có quyền sửa CMS.  
**Open notes:** auth mini app -> chatbot chưa chốt; interaction pattern chưa chốt.

## BE-04 — Gamification API
**Priority:** P0  
**Scope:** validate check-in, badge progress, history, reward/tier read.  
**Dependencies:** ADM-05, ADM-01, ADM-06  
**Acceptance criteria:** validate QR + GPS; success/failure rõ; user xem được progress/badges/history.  
**Open notes:** GPS radius / time window chưa chốt.

## BE-05 — User identity mapping
**Priority:** P0  
**Scope:** map Zalo identity sang user nội bộ; lưu locale, consent flags cơ bản.  
**Dependencies:** ADM-01  
**Acceptance criteria:** có user record ổn định cho reporting/chatbot/check-in; không lưu dữ liệu nhạy cảm ngoài scope.

## BE-06 — File/media metadata handling
**Priority:** P0  
**Scope:** attachment metadata model; object storage strategy nếu dùng.  
**Dependencies:** BE-02, ADM-03  
**Acceptance criteria:** attachment metadata lưu được; có constraint cơ bản type/size nếu cần.

## BE-07 — Locale and translation response policy
**Priority:** P0  
**Scope:** locale query/headers; fallback `en -> vi` hoặc `vi -> vi`.  
**Dependencies:** BE-01  
**Acceptance criteria:** FE không phải tự đoán fallback; API trả locale metadata nhất quán.
