# Zalo App Config — Núi Bà Đen

## Mục tiêu
- Ghi lại các điểm quan trọng của `app-config.json` cho mini app này.

## File cấu hình
- Tên file: `app-config.json`
- Vị trí: thư mục gốc dự án

## Root fields public đã thấy
- `app`
- `listCSS`
- `listSyncJS`
- `listAsyncJS`

## App fields quan trọng
- `title`
- `headerTitle`
- `headerColor`
- `leftButton`
- `textColor`
- `statusBar`
- `actionBarHidden`
- `hideAndroidBottomNavigationBar`
- `hideIOSSafeAreaBottom`
- `selfControlLoading`

## Liên hệ với dự án này
- `title` và `headerTitle` phải phù hợp brand Núi Bà Đen.
- `headerTitle` cần tính đến 2 ngôn ngữ.
- `headerColor` và `textColor` cần đồng bộ brand + contrast.
- `leftButton` cần hợp lý với subpages nhiều flow.
- `selfControlLoading` chỉ dùng khi thật sự cần kiểm soát splash/loading.

## Theme / locale
- `headerColor` / `textColor` hỗ trợ `light` và `dark`
- `headerTitle` hỗ trợ `vi`, `en`, `my`

## Cần chốt khi code thật
- Style header mặc định
- Có dùng hidden/transparent status bar không
- Danh sách CSS/JS load thêm nếu framework yêu cầu

## Câu hỏi mở
- Brand color chính thức là gì?
- Có cần dark mode không?
- Header title theo locale sẽ lấy từ config hay runtime?
