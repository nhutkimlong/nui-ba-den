# Information Architecture — Núi Bà Đen Mini App

## Mục tiêu
- Cấu trúc màn hình cho du khách trên Zalo Mini App.
- Tách rõ 4 tab chính và các màn hình con.
- Làm đầu vào cho wireframe, routes, CMS dependencies.

## Phạm vi
- Hỗ trợ 2 ngôn ngữ: Việt, Anh.
- Không có thanh toán.
- Có chatbot, phản ánh, check-in, badge.

## Tab chính
1. Trang chủ
2. Khám phá
3. Phản ánh
4. Hỗ trợ

## 1) Trang chủ
### Mục tiêu
- Cung cấp trạng thái nhanh và CTA chính.

### Thành phần
- Banner/sự kiện nổi bật
- Tình trạng hoạt động hôm nay
- Lối tắt: Bản đồ, Khám phá, Phản ánh, Hỏi chatbot
- Thông báo khẩn/lưu ý
- Điểm nổi bật / sự kiện sắp diễn ra

### API phụ thuộc
- Home content
- Alerts
- Featured POIs
- Featured events

### Admin phụ thuộc
- Banner manager
- Alert manager
- Featured content ordering

## 2) Khám phá
### Mục tiêu
- Tra cứu điểm tham quan, sự kiện, cẩm nang.

### Thành phần
- Danh sách POI
- Bộ lọc danh mục
- Chi tiết POI
- Sự kiện/lịch hoạt động
- Cẩm nang/FAQ nhanh
- CTA check-in ở trang chi tiết POI

### API phụ thuộc
- POI list/detail
- Categories
- Events
- Guide articles

### Admin phụ thuộc
- POI manager
- Event manager
- Article/guide manager
- Translation manager

## 3) Phản ánh
### Mục tiêu
- Gửi phản ánh nhanh, ít nhập tay, theo dõi trạng thái.

### Thành phần
- Chọn loại phản ánh
- Form gửi phản ánh
- Ảnh minh chứng
- Vị trí hiện tại / POI liên quan
- Kết quả gửi thành công
- Lịch sử phản ánh
- Chi tiết trạng thái phản ánh

### API phụ thuộc
- Report categories
- Create report
- Attachment metadata
- Report history/detail

### Admin phụ thuộc
- Report inbox
- SLA board
- Operator assignment
- Moderation queue

## 4) Hỗ trợ
### Mục tiêu
- Hỗ trợ du khách qua chatbot và kênh khẩn.

### Thành phần
- Chatbot hỏi/đáp
- Hotline / liên hệ khẩn
- Chỉ đường
- Hỗ trợ mất đồ / y tế / khẩn cấp
- Hồ sơ người dùng
- Badge, check-in, phần thưởng

### API phụ thuộc
- Chatbot ask/reply
- FAQ list
- Emergency contacts
- User profile
- Badge/check-in history

### Admin phụ thuộc
- KB manager
- Hotline manager
- Badge/reward manager
- Chatbot log review

## Điều hướng chéo
- Từ Trang chủ sang chatbot
- Từ POI sang check-in
- Từ POI/FAQ sang chatbot với context
- Từ phản ánh sang lịch sử phản ánh
- Từ hồ sơ sang badge/check-in history

## Guardrails
- Tối đa 4 tab.
- Không đặt CTA gần menu top-right Zalo.
- 1 CTA chính mỗi màn hình.
- Fallback Việt nếu thiếu bản dịch Anh.

## Câu hỏi mở
- Có cần màn hình bản đồ riêng không?
- Hồ sơ user đặt trong tab Hỗ trợ hay màn hình riêng từ avatar?
- Badge hiển thị công khai hay chỉ user tự xem?
