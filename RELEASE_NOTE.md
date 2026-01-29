# Release Note

**Version:** 1.1.1
**Date:** 29/01/2026

## Tính năng mới (New Features)

### 1. Quản lý Đơn hàng (Orders Management)
- **My Orders Tab**:
  - Thêm tab "My Orders" giúp người dùng xem riêng danh sách các đơn hàng của mình.
  - Hiển thị chi tiết: Tên món, thời gian đặt, trạng thái thanh toán và giá tiền.
  - Tự động ẩn thông tin billing để giao diện gọn gàng hơn.

### 2. Gửi Bill (Send Bill)
- **Tính năng Gửi Bill**:
  - Cho phép người dùng gửi thông báo bill trực tiếp từ trang "My Bills" vào channel DATCOM.
  - Bot sẽ tag tên những người có đơn hàng và hiển thị tổng tiền cần thanh toán.
  - **Thông minh hơn**: Hệ thống tự động lọc chỉ gửi các đơn chưa thanh toán. Nếu tất cả đã thanh toán, sẽ không spam channel.

---

**Version:** 1.1.0  
**Date:** 29/01/2026

## Tính năng mới (New Features)

### 1. Quản lý Phạt (Penalty Management)
- **Group Phạt theo User**: Thay đổi giao diện hiển thị danh sách phạt.
  - Hiển thị danh sách nhân viên kèm tổng số lượng vi phạm và tổng số tiền phạt.
  - Bỏ cột trạng thái (`Status`) ở giao diện chính.
  - **Click xem chi tiết**: Nhấn vào dòng nhân viên để xem danh sách chi tiết các lỗi vi phạm của nhân viên đó trong cửa sổ Modal.

### 2. Opentalk
- **Highlight Lịch Trực Nhật**: 
  - Tự động làm nổi bật (highlight) dòng lịch trực nhật của người dùng hiện tại (Current User) trong bảng danh sách sự kiện Opentalk.
  - Sử dụng màu nền khác biệt và viền nhấn để người dùng dễ dàng nhận biết lịch của mình.

### 3. Pantry Menu
- **Giao diện Thanh toán Mezon Dong**:
  - Tích hợp giao diện thanh toán Mezon Dong trực tiếp tại trang Menu Pantry.
  - Hỗ trợ xem mã QR và hướng dẫn thanh toán nhanh chóng khi nhấn "Mua ngay".

### 4. Mezon SDK Update
- **Update Mezon SDK**:
  - Cập nhật SDK Mezon lên phiên bản 2.8.39.
---
