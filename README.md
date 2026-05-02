# SinricPro IoT Dashboard (ESP32-C3) Professional

Giao diện điều khiển thiết bị IoT (Smarthome) chuyên nghiệp sử dụng chip **ESP32-C3** và nền tảng **SinricPro**.

## ✨ Tính năng nổi bật
- **WiFi Portal (Smart Config):** Không cần nạp mã nguồn mỗi khi đổi WiFi. Chip tự phát WiFi "ESP32_SmartHome_Setup" để cấu hình.
- **Trạng thái LED (GPIO 8):**
  - **Nháy nhanh:** Đang ở chế độ chờ cấu hình WiFi hoặc mất mạng.
  - **Sáng đứng:** Đã kết nối Cloud SinricPro thành công.
- **Điều khiển 4 kênh:** Hỗ trợ điều khiển Relay và Nút bấm vật lý (phản hồi trạng thái lên server ngay lập tức).
- **Firmware Generator:** Dashboard tự tạo code C++ chuẩn theo cấu hình GPIO và ID thiết bị.

## 🚀 Cách triển khai nhanh

### 1. Nạp Firmware (Arduino IDE)
1. Cài đặt các thư viện: `SinricPro`, `SinricPro_Generic`, `WiFiManager`.
2. Copy đoạn mã trong phần **"Lấy mã Firmware"** trên Dashboard.
3. Chọn Board là **ESP32C3 Dev Module** và nhấn Upload.

### 2. Cấu hình WiFi cho chip
1. Sau khi nạp, dùng điện thoại tìm WiFi tên: `ESP32_SmartHome_Setup`.
2. Kết nối và nhập tên WiFi/Mật khẩu nhà bạn.
3. Đợi đèn LED (chân 8) sáng đứng là hoàn tất.

### 3. Sử dụng Web Dashboard
1. Nhấn **Kết nối** trên trình duyệt.
2. Tận hưởng việc điều khiển từ xa qua Internet.

## 🛠 Sơ đồ chân (Default)
- **Relay:** GPIO 5, 6, 7, 10
- **Nút nhấn:** GPIO 1, 2, 3, 4
- **LED Status:** GPIO 8

---
*Phát triển bởi SinricPro AI Solution.*
