# Content Model — Núi Bà Đen Mini App

## Mục tiêu
- Xác định các khối dữ liệu cần cho mini app và CMS.
- Làm đầu vào cho schema, API payload, workflow biên tập song ngữ.

## Nguyên tắc
- Nội dung gốc tách khỏi bản dịch.
- Mọi module hiển thị cho user đều cần locale `vi` và `en`.
- Nội dung động phải có trạng thái xuất bản.

## Content domains
### 1. Home blocks
- Banner
- Alert
- Featured POI
- Featured event
- Quick action block

### 2. POI
- POI core
- POI translations
- POI category
- GPS coordinates
- QR identity
- Opening/status info

### 3. Events
- Event core
- Event translations
- Event schedule
- Event status

### 4. Guide articles / cẩm nang
- Article core
- Article translations
- Category/tag
- Publish status

### 5. FAQ / KB
- FAQ item
- KB item
- Locale
- Tags / intent hints
- Source link

### 6. Reporting taxonomy
- Report category
- Severity
- SLA policy
- Status labels

### 7. Gamification catalog
- Badge
- Badge rule
- Reward/tier
- POI check-in mapping

### 8. Support info
- Hotline
- Emergency contacts
- Lost & found info
- Medical support info

## Trường gợi ý theo nhóm
### POI core
- id
- slug
- category_id
- latitude
- longitude
- qr_code_value
- status
- hero_image

### POI translations
- poi_id
- locale
- title
- short_description
- long_description
- practical_info

### Event core
- id
- start_at
- end_at
- status
- location_ref

### Event translations
- event_id
- locale
- title
- summary
- content

### Guide article
- slug
- category
- cover_image
- published_at
- locale title/body

### FAQ / KB item
- id
- locale
- question
- answer
- tags
- intent_hint
- linked_poi_id
- published

## Publish workflow
- draft
- ready
- published
- archived

## Translation workflow
- source created
- translation pending
- translation ready
- published

## CMS dependencies
- Content editor
- Translator hoặc editor song ngữ
- Moderator cho nội dung nhạy cảm

## API dependencies
- Home content API
- POI API
- Events API
- FAQ/KB API
- Support info API

## Câu hỏi mở
- Có cần versioning nội dung không?
- Có cần schedule publish/unpublish tự động không?
- Hình ảnh/media lưu ở đâu?
