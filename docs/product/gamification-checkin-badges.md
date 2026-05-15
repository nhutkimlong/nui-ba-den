# Gamification Check-in And Badges — Núi Bà Đen Mini App

## Mục tiêu
- Xác định phạm vi check-in, badge, reward/tier cho du khách.
- Làm đầu vào cho UX, rules engine, anti-fraud.

## Thành phần chính
- Check-in tại POI
- Badge/danh hiệu
- Reward/tier
- Lịch sử check-in
- Progress cá nhân

## Check-in flow
1. User mở chi tiết POI.
2. Nhấn check-in.
3. Quét QR tại điểm.
4. Xác minh GPS gần POI.
5. Ghi nhận check-in.
6. Tính progress, badge, tier, reward nếu có.
7. Trả kết quả cho user.

## Điều kiện thành công
- QR hợp lệ.
- GPS trong bán kính cho phép.
- Không vượt rate limit.
- Không trùng check-in trong time window cấm.

## Kết quả hiển thị cho user
- Check-in thành công/thất bại
- Lý do nếu thất bại
- Progress mới
- Badge mới nếu đạt
- Tier/reward nếu mở khóa

## Mô hình badge
- Badge theo số POI đã check-in
- Badge theo nhóm danh mục POI
- Badge theo sự kiện/chiến dịch
- Badge theo mùa/lễ hội

## Reward / tier
- Reward có thể do admin cập nhật.
- Tier có thể theo số check-in hoặc bộ badge.
- Reward/tier chưa gắn payment.

## Anti-fraud
- GPS proximity check
- QR mapping đúng POI
- Rate limit theo user/device/time
- Log check-in bất thường
- Có thể thêm signed QR/nonce nếu cần

## API phụ thuộc
- Validate check-in
- User progress
- Badge list
- Reward list
- Check-in history

## Admin phụ thuộc
- POI manager
- Badge/rule manager
- Reward manager
- Fraud monitoring / audit log

## Dữ liệu chính
- checkins
- badges
- badge_rules
- user_badges
- rewards

## Câu hỏi mở
- Bán kính GPS cho phép là bao nhiêu?
- Time window chống lặp là bao lâu?
- Reward có giới hạn theo ngày/sự kiện không?
