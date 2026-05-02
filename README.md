# SinricPro IoT Dashboard (ESP32-C3)

Một giao diện điều khiển thiết bị IoT chuyên nghiệp sử dụng nền tảng **SinricPro**. Dashboard này được thiết kế để điều khiển tối đa 4 thiết bị (Đèn, Quạt, Máy lạnh) thông qua WiFi và Cloud.

## ✨ Tính năng
- **Điều khiển thời gian thực:** Trạng thái thiết bị đồng bộ giữa Web và ESP32.
- **Tùy chỉnh phần cứng:** Cho phép đổi tên phòng, tên hệ thống và cấu hình chân GPIO trực tiếp trên UI.
- **Firmware Generator:** Tự động tạo mã nguồn C++ chuẩn cho ESP32-C3 dựa trên cấu hình hiện tại.
- **Dark Mode UI:** Giao diện phong cách kỹ thuật, tối ưu cho giám sát 24/7.

## 🚀 Hướng dẫn sử dụng

### 1. Chuẩn bị phần cứng
- 01 Board ESP32-C3.
- Relay kết nối vào các chân: **GPIO 5, 6, 7, 10**.
- Nút bấm (nút nhấn nhả) kết nối vào các chân: **GPIO 1, 2, 3, 4**.
- Đèn trạng thái hệ thống: **GPIO 8**.

### 2. Cài đặt Web App
1. Tải toàn bộ mã nguồn này về máy.
2. Chạy `npm install` để cài đặt dependencies.
3. Chạy `npm run dev` để mở Dashboard.

### 3. Nạp Firmware cho ESP32
1. Mở Dashboard, nhập thông tin **WiFi SSID** và **Mật khẩu**.
2. Nhấn nút **"Lấy mã Firmware"**.
3. Copy toàn bộ code C++ hiện ra.
4. Mở **Arduino IDE**, dán code vào và nạp cho ESP32-C3.
5. Kiểm tra LED chân số 8: **Sáng đứng** là đã kết nối thành công với Cloud.

## 🛠 Công nghệ sử dụng
- **Frontend:** React, Tailwind CSS, Lucide Icons, Framer Motion.
- **IoT Platform:** SinricPro SDK.
- **Phần cứng:** ESP32-C3 (C++ / Arduino framework).

## 📝 Lưu ý
- Hãy chắc chắn bạn đã có tài khoản tại [SinricPro](https://sinric.pro) để lấy App Key và App Secret (Mã trong ứng dụng là mã mẫu đã được tích hợp sẵn cho 4 switch).
- Sử dụng **Google Chrome** hoặc các trình duyệt hiện đại để có trải nghiệm tốt nhất.

---
*Dự án được khởi tạo bởi SinricPro Smart Home Solution.*
