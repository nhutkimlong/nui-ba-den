# Zalo APIs And Permissions — Núi Bà Đen Mini App

## Mục tiêu
- Ghi lại các API/public capability liên quan trực tiếp đến mini app này.
- Làm checklist cho dev trước khi code.

## APIs liên quan
### User
- `getUserInfo`
- `getUserID`
- `getAccessToken`
- `getPhoneNumber`
- `getSetting`

### Permission
- `openPermissionSetting`
- `requestSendNotification`

### Location
- `getLocation`

### Camera / media
- `createCameraContext`
- `requestCameraPermission`
- `checkZaloCameraPermission`
- Chọn/chụp ảnh khi cần phản ánh

### Storage
- `setItem`
- `getItem`
- `getStorageInfo`
- `saveFile`

### Navigation / UI
- `openMiniApp`
- `openWebview`
- `getRouteParams`
- `setNavigationBarColor`
- `setNavigationBarTitle`

## API áp vào feature nào
- Login/profile: `getUserInfo`, `getUserID`
- Phản ánh: camera/media + location
- Check-in: location + QR/camera nếu cần
- Chatbot context/local state: storage
- UI app: navigation bar APIs

## Permission UX
- Camera: chỉ xin khi user chuẩn bị chụp ảnh phản ánh hoặc scan QR.
- Location: chỉ xin khi user gửi phản ánh có vị trí hoặc check-in.
- Notification: chỉ xin khi có use case rõ như trạng thái phản ánh.

## Rủi ro / lưu ý
- Không xin quyền quá sớm.
- Nếu user từ chối, phải có fallback.
- Dữ liệu phone/location là nhạy cảm.
- Chỉ dùng API thật sự cần cho scope hiện tại.

## Checklist trước coding
- Chốt permission nào thật sự dùng
- Chốt consent copy cho camera/location
- Chốt fallback khi từ chối quyền
- Chốt data retention cho location/phone

## Câu hỏi mở
- Có thật sự cần `getPhoneNumber` không?
- Có cần notification cho cập nhật trạng thái phản ánh không?
- Flow scan QR sẽ dùng camera API nào cụ thể trong codebase thật?
