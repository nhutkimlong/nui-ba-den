# Admin CMS Tickets

## ADM-01 — Admin auth and roles foundation
**Priority:** P0  
**Scope:** admin user model, role model, role binding, protected routes.  
**Dependencies:** [../decision-log.md](../decision-log.md)  
**Acceptance criteria:** role-based access nền tảng; roles tối thiểu đủ dùng.  
**Open notes:** admin auth system chưa chốt.

## ADM-02 — Content CMS foundation
**Priority:** P0  
**Scope:** CRUD banners, alerts, POI, guide/FAQ, translations `vi`/`en`.  
**Dependencies:** ADM-01  
**Acceptance criteria:** editor tạo/sửa/publish được; có trạng thái nội dung nếu dùng.

## ADM-03 — Reporting operations console
**Priority:** P0  
**Scope:** report inbox, detail, assign/update status, operator notes, timeline xử lý.  
**Dependencies:** ADM-01, ADM-06  
**Acceptance criteria:** operator xử lý end-to-end; mọi đổi trạng thái có log.

## ADM-04 — KB management console
**Priority:** P0  
**Scope:** CRUD FAQ/KB items, tags/intent hints, locale support, publish/unpublish, link tới POI/article.  
**Dependencies:** ADM-01, ADM-06  
**Acceptance criteria:** KB quản trị được như content chính thức; chatbot layer đọc được từ nguồn này.

## ADM-05 — Gamification management console
**Priority:** P0  
**Scope:** CRUD badges, rewards/tier, rule mapping badge/check-in/POI.  
**Dependencies:** ADM-01, ADM-06  
**Acceptance criteria:** admin cập nhật rule/catalog được; public APIs đọc đúng output.

## ADM-06 — Moderation and audit foundation
**Priority:** P0  
**Scope:** audit log admin actions, moderation queue chatbot/reporting, review actions keep/hide/escalate.  
**Dependencies:** ADM-01  
**Acceptance criteria:** có audit cho hành động quan trọng; có queue moderation tối thiểu; chatbot/reporting có thể bị flag.
