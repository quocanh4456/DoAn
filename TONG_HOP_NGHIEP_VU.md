# 📋 TỔNG HỢP NGHIỆP VỤ ĐỒ ÁN VINACOACH

> **Hệ thống đặt vé xe khách trực tuyến và quản lý vận hành nhà xe**
>
> Sinh viên: Vương Đình Quốc Anh — 64HTTT3
>node
> Ngày tổng hợp: 05/06/2026

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Mô hình dữ liệu](#3-mô-hình-dữ-liệu)
4. [Danh sách Use Case tổng quát](#4-danh-sách-use-case-tổng-quát)
5. [Nghiệp vụ chi tiết từng module](#5-nghiệp-vụ-chi-tiết-từng-module)
   - 5.1 [Module Xác thực (Auth)](#51-module-xác-thực-auth)
   - 5.2 [Module Người dùng (Users)](#52-module-người-dùng-users)
   - 5.3 [Module Tuyến đường (Routes)](#53-module-tuyến-đường-routes)
   - 5.4 [Module Khung giờ (Schedules)](#54-module-khung-giờ-schedules)
   - 5.5 [Module Phương tiện (Buses)](#55-module-phương-tiện-buses)
   - 5.6 [Module Chuyến đi (Trips)](#56-module-chuyến-đi-trips)
   - 5.7 [Module Vé xe (Tickets)](#57-module-vé-xe-tickets)
   - 5.8 [Module Thanh toán (Payments)](#58-module-thanh-toán-payments)
   - 5.9 [Module Báo cáo (Reports)](#59-module-báo-cáo-reports)
   - 5.10 [Module Chatbot AI](#510-module-chatbot-ai)
   - 5.11 [Module Email](#511-module-email)
6. [Tính năng AI chi tiết](#6-tính-năng-ai-chi-tiết)
   - 6.1 [Dynamic Pricing](#61-dynamic-pricing--điều-chỉnh-giá-vé-tự-động)
   - 6.2 [Revenue Forecasting](#62-revenue-forecasting--dự-báo-doanh-thu)
   - 6.3 [RFM Customer Segmentation](#63-rfm-customer-segmentation--phân-khúc-khách-hàng)
   - 6.4 [Low Demand Alerts](#64-low-demand-alerts--cảnh-báo-chuyến-ít-khách)
   - 6.5 [Chatbot AI](#65-chatbot-ai--tư-vấn-đặt-vé)
7. [Luồng nghiệp vụ chính](#7-luồng-nghiệp-vụ-chính)
8. [Quy tắc nghiệp vụ tổng hợp](#8-quy-tắc-nghiệp-vụ-tổng-hợp)
9. [Bảng API Endpoints](#9-bảng-api-endpoints)
10. [Công nghệ sử dụng](#10-công-nghệ-sử-dụng)

---

## 1. TỔNG QUAN HỆ THỐNG

**VinaCoach** là hệ thống đặt vé xe khách trực tuyến, hướng đến mô hình nhà xe cỡ nhỏ và trung chất lượng cao. Hệ thống hỗ trợ:

- Tìm kiếm chuyến xe và xem giá vé (kể cả giá động)
- Đăng ký, đăng nhập, đặt vé, thanh toán trực tuyến
- Quản lý tuyến đường, khung giờ, chuyến đi
- Quản lý phương tiện, nhân sự
- Báo cáo doanh thu và thống kê lượt khách
- **5 tính năng AI** tự xây dựng (không sử dụng API AI trả phí ngoài trừ Dify chatbot)
- **Email thông báo tự động** qua Gmail SMTP

**Kiến trúc hệ thống:**

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui |
| Backend | NestJS + TypeORM + JWT (Access + Refresh Token) + Swagger |
| Database | MySQL 8+ |
| Cache / Slot Locking | Redis |
| Thanh toán | PayOS |
| Chatbot | Dify AI Platform |
| Email | Nodemailer + Gmail SMTP |

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG

Hệ thống có **4 đối tượng** (3 vai trò trong DB + 1 khách vãng lai):

| Đối tượng | Vai trò (role) | Mô tả | Quyền hạn chính |
|---|---|---|---|
| **Khách vãng lai (Guest)** | Không có tài khoản | Người truy cập website chưa đăng nhập | Tìm chuyến xe, xem giá, đăng ký, đăng nhập |
| **Khách hàng (Customer)** | `Customer` (role_id=3) | Người dùng đã đăng ký tài khoản | Đặt vé, thanh toán, xem lịch sử, quản lý hồ sơ, dùng chatbot |
| **Nhân viên (Staff)** | `Staff` (role_id=2) | Nhân viên nhà xe | Quản lý vận hành, đặt vé tại quầy, báo cáo ca làm việc |
| **Quản trị viên (Admin)** | `Admin` (role_id=1) | Quản trị viên hệ thống | Quản lý hệ thống, nhân sự, xem toàn bộ báo cáo + AI phân tích |

**Quan hệ kế thừa:**
- `Guest` ← `Customer` (Customer kế thừa quyền Guest + thêm quyền riêng)
- `Staff` ← `Admin` (Admin kế thừa quyền Staff + thêm quyền riêng)

---

## 3. MÔ HÌNH DỮ LIỆU

### 3.1. Bảng dữ liệu

Hệ thống gồm **8 bảng** chính:

| STT | Bảng | Mô tả | Quan hệ |
|---|---|---|---|
| 1 | `roles` | Vai trò (Admin, Staff, Customer) | 1-N với `users` |
| 2 | `users` | Người dùng | N-1 với `roles`, 1-N với `tickets` |
| 3 | `routes` | Tuyến đường (điểm đi, điểm đến, giá cơ bản, khoảng cách) | 1-N với `schedules` |
| 4 | `schedules` | Khung giờ xuất bến định kỳ | N-1 với `routes`, 1-N với `trips` |
| 5 | `buses` | Phương tiện (biển số, loại xe, số ghế) | 1-N với `trips` |
| 6 | `trips` | Chuyến đi thực tế (ngày + schedule + xe + tài xế) | N-1 với `schedules`, N-1 với `buses`, 1-N với `tickets` |
| 7 | `tickets` | Vé xe (liên kết trip + user + điểm đón/trả + giá) | N-1 với `trips`, N-1 với `users`, 1-N với `payments` |
| 8 | `payments` | Thanh toán (PayOS hoặc tiền mặt) | N-1 với `tickets` |

### 3.2. Chi tiết từng bảng

#### Bảng `roles`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã vai trò |
| `name` | VARCHAR(50), UNIQUE | Tên vai trò: Admin, Staff, Customer |

#### Bảng `users`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã người dùng |
| `full_name` | VARCHAR(100) | Họ tên |
| `email` | VARCHAR(100), UNIQUE | Email (dùng để đăng nhập) |
| `phone` | VARCHAR(15) | Số điện thoại |
| `password` | VARCHAR(255) | Mật khẩu đã mã hóa (bcrypt, 10 rounds) |
| `role_id` | INT, FK → `roles.id` | Vai trò |
| `is_active` | BOOLEAN, default TRUE | Trạng thái kích hoạt |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

#### Bảng `routes`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã tuyến |
| `origin` | VARCHAR(100) | Điểm khởi hành |
| `destination` | VARCHAR(100) | Điểm đến |
| `distance` | FLOAT | Khoảng cách (km) |
| `base_price` | DECIMAL(12,0) | Giá vé cơ bản (VNĐ) |
| `is_active` | BOOLEAN, default TRUE | Trạng thái hoạt động |
| `created_at`, `updated_at` | TIMESTAMP | Thời gian |

#### Bảng `schedules`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã khung giờ |
| `route_id` | INT, FK → `routes.id` | Tuyến đường |
| `departure_time` | TIME | Giờ xuất bến |
| `is_active` | BOOLEAN, default TRUE | Trạng thái |

#### Bảng `buses`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã xe |
| `license_plate` | VARCHAR(20), UNIQUE | Biển số xe |
| `bus_type` | VARCHAR(50) | Loại xe (Ghế ngồi / Giường nằm) |
| `total_seats` | INT | Tổng số ghế |
| `is_active` | BOOLEAN, default TRUE | Trạng thái |
| `created_at`, `updated_at` | TIMESTAMP | Thời gian |

#### Bảng `trips`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã chuyến |
| `schedule_id` | INT, FK → `schedules.id` | Khung giờ |
| `bus_id` | INT, FK → `buses.id` | Phương tiện |
| `driver_name` | VARCHAR(100) | Tên tài xế (text, không FK) |
| `departure_date` | DATE | Ngày khởi hành |
| `available_seats` | INT | Số ghế còn trống |
| `status` | VARCHAR(20), default 'SCHEDULED' | Trạng thái: SCHEDULED / COMPLETED / CANCELLED |
| `cancel_reason` | VARCHAR(500), nullable | Lý do hủy chuyến |
| `created_at`, `updated_at` | TIMESTAMP | Thời gian |

#### Bảng `tickets`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã vé |
| `trip_id` | INT, FK → `trips.id` | Chuyến đi |
| `user_id` | INT, FK → `users.id` | Người đặt |
| `seat_count` | INT | Số chỗ đặt |
| `pick_up_location` | VARCHAR(255) | Điểm đón |
| `drop_off_location` | VARCHAR(255) | Điểm trả |
| `total_price` | DECIMAL(12,0) | Tổng tiền (đã tính giá động) |
| `status` | VARCHAR(20), default 'PENDING' | Trạng thái: PENDING / CONFIRMED / CANCELLED / EXPIRED |
| `created_at`, `updated_at` | TIMESTAMP | Thời gian |

#### Bảng `payments`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Mã thanh toán |
| `ticket_id` | INT, FK → `tickets.id` | Vé xe |
| `amount` | DECIMAL(12,0) | Số tiền |
| `transaction_id` | VARCHAR(100), nullable | Mã giao dịch PayOS |
| `payment_method` | VARCHAR(20), default 'PAYOS' | Phương thức: PAYOS / CASH |
| `status` | VARCHAR(20), default 'PENDING' | Trạng thái: PENDING / SUCCESS / FAILED |
| `paid_at` | DATETIME, nullable | Thời điểm thanh toán |
| `created_at` | TIMESTAMP | Thời gian tạo |

---

## 4. DANH SÁCH USE CASE TỔNG QUÁT

### 4.1. Use Case tổng quát

| Mã UC | Tên Use Case | Actor | Mô tả |
|---|---|---|---|
| UC1 | Tìm kiếm chuyến đi | Guest | Tìm chuyến xe theo tuyến đường và ngày |
| UC2 | Đăng ký tài khoản | Guest | Tạo tài khoản mới |
| UC3 | Đăng nhập | Guest | Đăng nhập vào hệ thống |
| UC4 | Đặt vé | Customer | Đặt vé xe trực tuyến |
| UC5 | Quản lý vé | Customer | Xem, hủy vé đã đặt |
| UC6 | Quản lý tài khoản | Customer | Xem/sửa hồ sơ, đổi mật khẩu |
| UC7 | Chat hỗ trợ | Customer | Chatbot AI tư vấn đặt vé |
| UC8 | Quản lý chuyến xe | Staff | Quản lý tuyến, khung giờ, chuyến đi |
| UC9 | Bán vé tại quầy | Staff | Đặt vé trực tiếp, thu tiền mặt |
| UC10 | Quản lý vé (nhân viên) | Staff | Xem toàn bộ vé trong hệ thống |
| UC11 | Báo cáo ca làm việc | Staff | Xem tổng hợp ca làm việc trong ngày |
| UC12 | Quản lý nhân sự & phương tiện | Admin | CRUD nhân viên, xe |
| UC13 | Xem báo cáo thống kê | Admin | Dashboard KPI, biểu đồ, AI phân tích |

### 4.2. Use Case phân rã – Đặt vé

| Mã UC | Tên Use Case | Actor | Quan hệ |
|---|---|---|---|
| UC4.1 | Xem thông tin chuyến đi | Customer | — |
| UC4.2 | Xem giá động (Dynamic Pricing) | Customer | Include bởi UC4.1 |
| UC4.3 | Chọn số lượng vé | Customer | Include bởi UC4.6 |
| UC4.4 | Chọn điểm đón | Customer | Include bởi UC4.6 |
| UC4.5 | Chọn điểm trả | Customer | Include bởi UC4.6 |
| UC4.6 | Giữ chỗ | Customer | — |
| UC4.7 | Thanh toán (PayOS) | Customer + PayOS | Include bởi UC4.6 |
| UC4.8 | Hủy vé | Customer | Extend từ UC4.6 |
| UC4.9 | Hết thời gian giữ chỗ | Hệ thống | Extend từ UC4.6 |

---

## 5. NGHIỆP VỤ CHI TIẾT TỪNG MODULE

### 5.1. Module Xác thực (Auth)

**Chức năng:** Đăng ký, đăng nhập, refresh token, quên mật khẩu, đổi mật khẩu, quản lý hồ sơ.

#### 5.1.1. Đăng ký (Register)
- **Đầu vào:** `fullName`, `email`, `phone`, `password`
- **Quy tắc nghiệp vụ:**
  - Kiểm tra email chưa tồn tại trong hệ thống → nếu trùng: lỗi `ConflictException`
  - Mật khẩu được mã hóa bằng **bcrypt** với 10 rounds
  - Tài khoản mới luôn được gán vai trò **Customer** (role_id = 3)
  - Nếu role Customer chưa tồn tại trong DB → tự tạo
  - Sau khi đăng ký thành công → trả về cặp token (Access + Refresh)
  - Hệ thống gửi **email chào mừng** tự động
- **Đầu ra:** `accessToken`, `refreshToken`, `user { id, fullName, email, role }`

#### 5.1.2. Đăng nhập (Login)
- **Đầu vào:** `email`, `password`
- **Quy tắc nghiệp vụ:**
  - Tìm user theo email (phải `isActive = true`)
  - So sánh mật khẩu với `bcrypt.compare()`
  - Nếu sai hoặc tài khoản bị vô hiệu → `UnauthorizedException` (cùng thông báo để tránh lộ thông tin)
  - Trả về cặp token + thông tin user
- **Đầu ra:** `accessToken`, `refreshToken`, `user { id, fullName, email, role }`

#### 5.1.3. Refresh Token
- **Đầu vào:** `refreshToken`
- **Quy tắc nghiệp vụ:**
  - Verify refresh token bằng `JWT_REFRESH_SECRET`
  - Kiểm tra user vẫn active
  - Tạo cặp token mới
- **Cấu hình:**
  - Access Token: hết hạn sau `JWT_EXPIRES_IN` (mặc định 3600s = 1 giờ)
  - Refresh Token: hết hạn sau `JWT_REFRESH_EXPIRES_IN` (mặc định 604800s = 7 ngày)

#### 5.1.4. Quên mật khẩu (Forgot Password)
- **Đầu vào:** `email`
- **Quy tắc nghiệp vụ:**
  - Luôn trả về thông báo thành công (kể cả email không tồn tại) → **bảo mật, không lộ email**
  - Tạo token ngẫu nhiên bằng `crypto.randomBytes(32)`
  - Token lưu **in-memory** (Map), hết hạn sau **15 phút**
  - Gửi email chứa link reset: `{FRONTEND_URL}/reset-password?token={token}`
- **Đầu ra:** `{ message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn..." }`

#### 5.1.5. Đặt lại mật khẩu (Reset Password)
- **Đầu vào:** `token`, `newPassword`
- **Quy tắc nghiệp vụ:**
  - Kiểm tra token tồn tại và chưa hết hạn
  - Token chỉ dùng **1 lần** (one-time use) → xóa sau khi dùng
  - Mật khẩu mới được mã hóa bcrypt
- **Đầu ra:** `{ message: "Đặt lại mật khẩu thành công" }`

#### 5.1.6. Đổi mật khẩu (Change Password)
- **Đầu vào:** `oldPassword`, `newPassword` + userId từ JWT
- **Quy tắc nghiệp vụ:**
  - Phải nhập đúng mật khẩu hiện tại
  - Mật khẩu mới **phải khác** mật khẩu cũ
  - Yêu cầu đã đăng nhập (JWT Auth)

#### 5.1.7. Xem & Sửa hồ sơ cá nhân
- **Xem:** Trả về thông tin user (trừ password)
- **Sửa:** Chỉ cho phép sửa `fullName` và `phone`
- **Yêu cầu:** Đã đăng nhập, chỉ sửa được hồ sơ của chính mình

---

### 5.2. Module Người dùng (Users)

**Phân quyền:** Chỉ Admin mới truy cập được module này.

#### Chức năng CRUD:

| Thao tác | Mô tả | Quy tắc nghiệp vụ |
|---|---|---|
| **Xem danh sách** | Lấy tất cả user, hỗ trợ tìm kiếm theo tên | Filter bằng `LIKE %search%` trên `fullName` |
| **Xem chi tiết** | Lấy user theo ID | Include relation `role` |
| **Thêm mới** | Tạo user mới (bất kỳ role) | Email unique, password bcrypt 10 rounds |
| **Cập nhật** | Sửa thông tin user | Kiểm tra email unique (loại trừ chính nó). Nếu password rỗng → giữ nguyên |
| **Xóa** | Xóa user vĩnh viễn | Hard delete (không soft delete) |

---

### 5.3. Module Tuyến đường (Routes)

**Phân quyền:** Staff, Admin (quản lý). Guest, Customer (chỉ xem).

#### Chức năng CRUD:

| Thao tác | Mô tả | Quy tắc nghiệp vụ |
|---|---|---|
| **Xem danh sách** | Lấy tuyến đang hoạt động | Chỉ lấy `isActive = true`. Hỗ trợ search theo origin/destination |
| **Xem chi tiết** | Lấy tuyến theo ID | — |
| **Thêm mới** | Tạo tuyến đường mới | **Điểm đi ≠ điểm đến** (so sánh lowercase, trim) |
| **Cập nhật** | Sửa thông tin tuyến | **Điểm đi ≠ điểm đến** sau khi cập nhật |
| **Xóa** | Vô hiệu tuyến | **Soft delete** (`isActive = false`) |

---

### 5.4. Module Khung giờ (Schedules)

**Phân quyền:** Staff, Admin.

#### Chức năng CRUD:

| Thao tác | Mô tả | Quy tắc nghiệp vụ |
|---|---|---|
| **Xem danh sách** | Lấy khung giờ, lọc theo routeId | Chỉ lấy `isActive = true`. Include `route` |
| **Thêm mới** | Tạo khung giờ mới | **Không trùng** khung giờ trên cùng tuyến (`routeId` + `departureTime` + `isActive`) |
| **Cập nhật** | Sửa khung giờ | Kiểm tra trùng lặp (loại trừ chính nó, dùng `Not(id)`) |
| **Xóa** | Vô hiệu khung giờ | **Soft delete** (`isActive = false`) |

---

### 5.5. Module Phương tiện (Buses)

**Phân quyền:** Admin.

#### Chức năng CRUD:

| Thao tác | Mô tả | Quy tắc nghiệp vụ |
|---|---|---|
| **Xem danh sách** | Lấy xe đang hoạt động | Filter: `isActive=true`, search theo biển số, lọc `busType`, `status` |
| **Thêm mới** | Tạo xe mới | **Biển số xe unique** (trong các xe `isActive = true`) |
| **Cập nhật** | Sửa thông tin xe | Kiểm tra biển số unique (loại trừ chính nó) |
| **Xóa** | Vô hiệu xe | **Soft delete** (`isActive = false`) |

---

### 5.6. Module Chuyến đi (Trips)

**Phân quyền:** Staff, Admin (quản lý). Customer (tìm kiếm, xem).

#### 5.6.1. Tìm kiếm chuyến xe (Public)
- **Đầu vào:** `origin?`, `destination?`, `date?`
- **Quy tắc nghiệp vụ:**
  - Chỉ hiện chuyến `status = SCHEDULED`
  - Chỉ hiện chuyến **sắp tới** (ngày > hôm nay HOẶC ngày = hôm nay & giờ >= giờ hiện tại)
  - Chỉ hiện chuyến còn ghế (`availableSeats > 0`)
  - Sắp xếp theo giờ xuất bến tăng dần
  - Giá hiển thị được **điều chỉnh theo ngày lễ/cuối tuần** (calculateTripBasePrice)

#### 5.6.2. CRUD Chuyến đi (Staff/Admin)

| Thao tác | Mô tả | Quy tắc nghiệp vụ |
|---|---|---|
| **Xem tất cả** | Danh sách chuyến đi | Sắp xếp theo ngày giảm dần. Include schedule, route, bus |
| **Tạo chuyến** | Tạo chuyến mới | Số ghế = `bus.totalSeats`. **Kiểm tra xung đột xe + tài xế** |
| **Cập nhật** | Sửa chuyến | **Kiểm tra xung đột** (loại trừ chính nó) |
| **Hủy chuyến** | Hủy chuyến | Chuyển `status = CANCELLED`, lưu `cancelReason` |

#### 5.6.3. Kiểm tra xung đột (checkConflicts)
Khi tạo/sửa chuyến, hệ thống kiểm tra:
1. **Xung đột phương tiện:** Cùng `busId` + cùng `departureDate` + cùng `departureTime` + status ≠ CANCELLED → Lỗi
2. **Xung đột tài xế:** Cùng `driverName` + cùng `departureDate` + cùng `departureTime` + status ≠ CANCELLED → Lỗi

#### 5.6.4. Tính giá động (Dynamic Price)
- **API:** `GET /api/trips/:id/dynamic-price`
- Trả về: `basePrice`, `finalPrice`, `totalMultiplier`, `factors[]`
- Chi tiết thuật toán xem mục [6.1](#61-dynamic-pricing--điều-chỉnh-giá-vé-tự-động)

---

### 5.7. Module Vé xe (Tickets)

**Phân quyền:** Customer (đặt/hủy vé cá nhân), Staff/Admin (quản lý toàn bộ, đặt vé tại quầy).

#### 5.7.1. Đặt vé (Customer)
- **Đầu vào:** `tripId`, `seatCount`, `pickUpLocation`, `dropOffLocation`
- **Luồng xử lý:**

  1. **Tìm chuyến đi** → 404 nếu không tồn tại
  2. **Kiểm tra ghế trống qua Redis:**
     - Đọc cache `trip:{id}:available`
     - Nếu chưa có → set giá trị từ DB
     - Dùng `DECRBY` để giảm atomically
     - Nếu kết quả < 0 → rollback `INCRBY` + lỗi ConflictException
     - **Fallback:** Nếu Redis down → dùng DB check
  3. **Tính giá động:** `calculateDynamicPrice()` → `finalPrice × seatCount`
  4. **Tạo vé:** status = `PENDING`
  5. **Khóa ghế (Redis TTL):**
     - Customer thường: **10 phút** (`LOCK_TTL = 600s`)
     - Đặt hộ khách (guest): **30 phút** (`GUEST_LOCK_TTL = 1800s`)
  6. **Cập nhật DB:** `tripsRepo.decrement(availableSeats)`
  7. **Gửi email** (nếu đặt hộ khách có email)
- **Đầu ra:** vé + `expiresIn` + `totalPrice`

#### 5.7.2. Xem vé theo user (Customer)
- Tự động **expire** các vé PENDING cũ trước khi trả kết quả
- Sắp xếp theo `createdAt DESC`
- Include: trip → schedule → route, bus

#### 5.7.3. Xem tất cả vé (Staff/Admin)
- Hỗ trợ tìm kiếm:
  - Số → tìm theo `ticket.id` hoặc `user.phone`
  - Chữ → tìm theo `user.fullName` hoặc `ticket.status`

#### 5.7.4. Xác nhận thanh toán tiền mặt (Staff)
- **Điều kiện:** Vé phải ở trạng thái `PENDING`
- **Hành động:**
  1. Chuyển status vé = `CONFIRMED`
  2. Tạo bản ghi payment: method = `CASH`, status = `SUCCESS`
  3. Lưu description: `"Thu tiền mặt tại quầy (Nhân viên ID: {staffId})"`
  4. Xóa lock Redis
  5. Gửi email xác nhận cho khách

#### 5.7.5. Hủy vé
- **Quy tắc:**
  - Customer chỉ hủy vé **của mình**
  - Admin/Staff hủy được **bất kỳ vé nào**
  - Chỉ hủy được vé ở trạng thái `PENDING`
  - Có thể kèm `reason` (lý do hủy)
- **Hành động:**
  1. Chuyển status = `CANCELLED`
  2. Hoàn trả ghế: `tripsRepo.increment(availableSeats)`
  3. Cập nhật Redis: `INCRBY` + xóa lock

#### 5.7.6. Xác nhận thanh toán online (sau PayOS webhook)
- Chuyển status vé = `CONFIRMED`
- Xóa lock Redis
- Gửi email xác nhận (fire-and-forget)

#### 5.7.7. Hết hạn vé (Auto-expire)
- **Cron job:** Chạy **mỗi phút** (`@Cron(EVERY_MINUTE)`)
- **Logic:** Tìm vé PENDING có `createdAt` > 10 phút → chuyển EXPIRED, hoàn trả ghế
- Cũng chạy **on-demand** khi user xem danh sách vé

#### 5.7.8. Đặt vé hộ khách (Guest Booking)
- Nhân viên đặt vé cho khách vãng lai có email
- TTL giữ chỗ: **30 phút** (thay vì 10 phút)
- Gửi email chứa link thanh toán đến guest

---

### 5.8. Module Thanh toán (Payments)

**Phân quyền:** Customer (thanh toán vé cá nhân), Staff (thu tiền mặt).

#### 5.8.1. Tạo link thanh toán PayOS (đơn vé)
- **Điều kiện:** Vé ở trạng thái `PENDING`
- **Luồng:**
  1. Tạo bản ghi payment: method = `PAYOS`, status = `PENDING`
  2. Gọi PayOS API tạo payment link
  3. Lưu `transactionId` = orderCode
  4. Lưu `description` = `"tickets:{ticketId}"`
- **Đầu ra:** `{ paymentUrl, paymentId }`

#### 5.8.2. Tạo link thanh toán PayOS (nhiều vé — vé khứ hồi)
- Gộp nhiều `ticketIds` vào 1 giao dịch
- Tổng tiền = sum tất cả vé
- `description` = `"tickets:1,2"` (danh sách ID phân cách dấu phẩy)
- PayOS `ticketId` FK = ID của vé đầu tiên

#### 5.8.3. Xử lý kết quả thanh toán PayOS (Return URL)
- **Đầu vào:** Query params từ PayOS: `code`, `orderCode`, `cancel`
- **Logic:**
  1. Tìm payment theo `transactionId = orderCode`
  2. **Idempotency:** Nếu đã `SUCCESS` hoặc `FAILED` → trả kết quả cũ (không xử lý lại)
  3. Parse `ticketIds` từ `description` field
  4. Nếu `cancel = true` → payment `FAILED`
  5. Nếu `code = '00'` → payment `SUCCESS` + `paidAt` = now + confirm tất cả tickets
  6. Khác → payment `FAILED`

#### 5.8.4. Thanh toán cho khách vãng lai (Guest Payment)
- Validate `guestEmail` khớp với thông tin vé
- Tạo link PayOS bình thường

---

### 5.9. Module Báo cáo (Reports)

**Phân quyền:** Admin (báo cáo tổng), Staff (báo cáo ca).

#### 5.9.1. KPI Tổng quan (Dashboard)
Trả về 7 chỉ số tức thời:
| KPI | Mô tả | Cách tính |
|---|---|---|
| `totalRevenue` | Tổng doanh thu | SUM payments SUCCESS |
| `todayRevenue` | Doanh thu hôm nay | SUM payments SUCCESS ngày hôm nay |
| `totalTickets` | Tổng số vé | COUNT tickets |
| `confirmedTickets` | Vé đã xác nhận | COUNT tickets CONFIRMED |
| `pendingTickets` | Vé đang chờ | COUNT tickets PENDING |
| `totalCustomers` | Tổng khách hàng | COUNT users role_id=3 |
| `upcomingTrips` | Chuyến sắp tới | COUNT trips SCHEDULED, ngày >= hôm nay |

#### 5.9.2. Báo cáo doanh thu theo ngày
- **Đầu vào:** `from`, `to` (khoảng thời gian)
- **Đầu ra:** Danh sách `{ date, total, count }` + `totalRevenue`

#### 5.9.3. Thống kê chuyến xe
- **Đầu vào:** `from`, `to`
- **Đầu ra:** Mỗi chuyến gồm: tuyến, ngày, loại xe, số ghế, số vé, số hành khách

#### 5.9.4. Doanh thu theo tuyến
- **Đầu vào:** `from`, `to`
- **Đầu ra:** Mỗi tuyến gồm: origin, destination, total, ticketCount

#### 5.9.5. Báo cáo ca làm việc (Staff)
- Chỉ lấy vé do **chính nhân viên** thu tiền mặt trong ngày
- Filter: `payment.method = CASH` + `payment.status = SUCCESS` + `description LIKE '%Nhân viên ID: {staffId}%'`
- **Đầu ra:** danh sách vé + `totalTickets` + `totalRevenue`

#### 5.9.6–5.9.8. Tính năng AI
Xem chi tiết tại mục [6. Tính năng AI](#6-tính-năng-ai-chi-tiết).

---

### 5.10. Module Chatbot AI

**Phân quyền:** Customer (widget chat nổi trên giao diện).

#### Luồng xử lý:
1. **Phân tích ý định (Intent Detection):**
   - `search_trip` — hỏi chuyến xe cụ thể (nhận diện keywords: chuyến, xe, đi, vé, ghế, còn...)
   - `list_routes` — hỏi danh sách tuyến / giá vé (keywords: tuyến, route, giá, price, danh sách...)
   - `general` — câu hỏi chung

2. **Trích xuất ngày:**
   - Pattern: `DD/MM`, `DD/MM/YYYY`, `DD-MM`
   - Từ khóa: "ngày mai" → tomorrow, "hôm nay" → today

3. **Truy vấn dữ liệu thực từ MySQL:**
   - `search_trip`: Query trips sắp tới, có ghế, tùy chọn filter ngày (limit 10)
   - `list_routes`: Lấy tất cả routes đang active
   - `general`: Tóm tắt danh sách tuyến

4. **Gửi đến Dify AI Platform:**
   - Kèm context dữ liệu thực + system prompt tiếng Việt
   - Response mode: `blocking`
   - Dify trả lời dựa trên dữ liệu thực, không bịa thông tin

---

### 5.11. Module Email

**Tích hợp:** Nodemailer + Gmail SMTP (App Password).

#### 3 loại email tự động:

| Loại | Trigger | Nội dung |
|---|---|---|
| **Reset Password** | Quên mật khẩu | Link đặt lại mật khẩu, hết hạn 15 phút |
| **Ticket Confirmation** | Thanh toán thành công (PayOS/CASH) | Mã vé, tuyến, ngày giờ, tài xế, xe, điểm đón/trả, tổng tiền |
| **Guest Booking** | Nhân viên đặt hộ khách | Thông tin vé + nút "Thanh toán ngay" (link PayOS), hết hạn 30 phút |

**Template:** HTML responsive, thiết kế chuyên nghiệp với gradient header, branding VinaCoach.

---

## 6. TÍNH NĂNG AI CHI TIẾT

### 6.1. Dynamic Pricing — Điều chỉnh giá vé tự động

**Mô tả:** Giá vé được tính tự động dựa trên 3 yếu tố kết hợp.

#### Bảng hệ số:

| # | Yếu tố | Điều kiện | Hệ số |
|---|---|---|---|
| 1 | **Ngày lễ** | Tết, 30/4, 1/5, 2/9... (hardcoded 2025-2026) | ×1.25 |
| 1 | **Cuối tuần** | Thứ 7, Chủ nhật | ×1.10 |
| 2 | **Ghế gần hết** | Tỷ lệ lấp đầy ≥ 90% | ×1.20 |
| 2 | **Ghế gần hết** | Tỷ lệ lấp đầy ≥ 80% | ×1.12 |
| 2 | **Ghế gần hết** | Tỷ lệ lấp đầy ≥ 60% | ×1.05 |
| 3 | **Đặt gấp** | ≤ 1 ngày trước khởi hành | ×1.15 |
| 3 | **Đặt gấp (nhẹ)** | ≤ 3 ngày trước khởi hành | ×1.08 |

#### Công thức:
```
totalMultiplier = dateMult × occupancyMult × lastMinuteMult
totalMultiplier = MIN(totalMultiplier, 1.5)    // Giới hạn tối đa ×1.5
finalPrice = ROUND(basePrice × totalMultiplier / 1000) × 1000    // Làm tròn 1.000 VNĐ
```

#### Ví dụ minh họa:
- Vé giá gốc 250.000đ, đặt ngày Chủ nhật, ghế 85% đầy, đặt trước 2 ngày:
  - `dateMult = 1.10` (cuối tuần)
  - `occupancyMult = 1.12` (≥80%)
  - `lastMinuteMult = 1.08` (≤3 ngày)
  - `rawMultiplier = 1.10 × 1.12 × 1.08 = 1.3306`
  - `finalPrice = ROUND(250,000 × 1.3306 / 1000) × 1000 = 333,000đ`

#### API: `GET /api/trips/:id/dynamic-price`
Trả về: `basePrice`, `finalPrice`, `totalMultiplier`, `factors[]`

---

### 6.2. Revenue Forecasting — Dự báo doanh thu

**Thuật toán:** Weighted Moving Average (WMA) + Linear Regression + Seasonality.

#### Quy trình tính toán:
1. **Lấy dữ liệu:** Doanh thu 90 ngày gần nhất từ bảng `payments` (status = SUCCESS)
2. **Fill gaps:** Điền 0 cho những ngày không có giao dịch
3. **WMA (window = 7):** Trọng số tăng dần (ngày gần nhất = trọng số 7, xa nhất = 1)
4. **Linear Regression** trên chuỗi WMA → tìm **slope** (xu hướng tăng/giảm)
5. **Dự báo:** `predicted[i] = lastWMA + slope × i`
6. **Seasonality:** Nhân thêm hệ số ngày lễ/cuối tuần
7. **Growth rate:** So sánh 30 ngày cuối vs 30 ngày trước đó

#### Phân loại xu hướng:
| Xu hướng | Điều kiện | Biểu tượng |
|---|---|---|
| Tăng trưởng | slope > 50,000 | 📈 |
| Suy giảm | slope < -50,000 | 📉 |
| Ổn định | -50,000 ≤ slope ≤ 50,000 | ➡️ |

#### API:
- `GET /api/reports/forecast?days=7|14|30` — Dự báo doanh thu
- `GET /api/reports/route-insights` — Phân tích theo tuyến

#### Route Insights:
Phân tích từng tuyến trong 90 ngày:
- Tỷ lệ lấp đầy trung bình
- Doanh thu / chuyến
- Ngày cao điểm trong tuần
- **Khuyến nghị AI:**
  - `avgOccupancy ≥ 80%` → "Nên tăng tần suất chạy" (🟢)
  - `avgOccupancy ≥ 60%` → "Cân nhắc tăng giá" (🟠)
  - `avgOccupancy < 60%` → "Cần kích cầu / khuyến mãi" (🔴)

---

### 6.3. RFM Customer Segmentation — Phân khúc khách hàng

**Mô tả:** Phân loại từng khách hàng theo 3 chỉ số RFM.

#### Bảng chấm điểm:

| Chỉ số | Điểm 3 | Điểm 2 | Điểm 1 |
|---|---|---|---|
| **R — Recency** (ngày đặt vé cuối) | ≤ 7 ngày | ≤ 30 ngày | > 30 ngày |
| **F — Frequency** (số lần CONFIRMED) | ≥ 5 lần | ≥ 2 lần | 1 lần |
| **M — Monetary** (tổng tiền SUCCESS) | ≥ 2.000.000₫ | ≥ 500.000₫ | < 500.000₫ |

#### Phân khúc (theo tổng điểm R+F+M):

| Phân khúc | Tổng điểm | Icon | Màu |
|---|---|---|---|
| 🏆 **VIP** | ≥ 8 | 🏆 | Vàng (gold) |
| 💙 **Trung thành** | ≥ 6 | 💙 | Xanh dương (blue) |
| 💛 **Tiềm năng** | ≥ 4 | 💛 | Xanh lá (green) |
| 🔴 **Cần kích cầu** | < 4 | 🔴 | Đỏ (red) |

#### API: `GET /api/reports/rfm-segments`
- Trả về: danh sách khách hàng + điểm RFM + nhãn phân khúc
- Summary: số lượng mỗi phân khúc (cho biểu đồ tròn)

---

### 6.4. Low Demand Alerts — Cảnh báo chuyến ít khách

**Mô tả:** Quét các chuyến sắp khởi hành (2–14 ngày tới), so sánh với lịch sử 90 ngày.

#### Logic cảnh báo:
1. Tính tỷ lệ lấp đầy lịch sử 90 ngày theo từng tuyến (`avgOccupancy`)
2. Với mỗi chuyến sắp tới:
   - **Case A (có data lịch sử):** Nếu tỷ lệ hiện tại < 60% × kỳ vọng → CẢNH BÁO
   - **Case B (không có data lịch sử):** Nếu chuyến trong 3 ngày tới VÀ 0 booking → CẢNH BÁO

#### Mức độ nghiêm trọng:
| Severity | Điều kiện | Màu |
|---|---|---|
| 🔴 **High** | Tỷ lệ lấp đầy < 15% | Đỏ |
| 🟡 **Medium** | Tỷ lệ lấp đầy < 30% | Vàng |
| 🟢 **Low** | Tỷ lệ lấp đầy < 60% kỳ vọng | Xanh |

#### Đề xuất giảm giá:
- Có data lịch sử: `suggestedDiscount = MIN(25%, (1 - current/expected) × 20%)`
- Không có data lịch sử: `suggestedDiscount = 10%` (cố định)
- **Giảm giá tối đa: 25%**

#### API: `GET /api/reports/low-demand-alerts`

---

### 6.5. Chatbot AI — Tư vấn đặt vé

**Tích hợp:** Dify AI Platform + context dữ liệu thực từ MySQL.

#### Quy trình:
1. **Phân tích ý định:** `search_trip` / `list_routes` / `general`
2. **Trích xuất thông tin:** ngày (DD/MM, "ngày mai", "hôm nay")
3. **Query DB:** Lấy dữ liệu phù hợp (chuyến xe, tuyến đường, giá vé)
4. **Gửi đến Dify:** context + câu hỏi → nhận trả lời tiếng Việt
5. **Trả về:** `{ answer, conversation_id, message_id }`

#### API: `POST /api/chatbot/message`
- Body: `{ query, conversation_id?, user? }`

---

## 7. LUỒNG NGHIỆP VỤ CHÍNH

### 7.1. Luồng đặt vé trực tuyến (Customer)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│ Tìm kiếm    │────▶│ Xem giá động │────▶│ Chọn ghế, điểm   │────▶│ Giữ chỗ    │
│ chuyến xe   │     │ (Dynamic     │     │ đón, điểm trả    │     │ (Redis 10p)│
└─────────────┘     │ Pricing)     │     └──────────────────┘     └─────┬──────┘
                    └──────────────┘                                     │
                                              ┌─────────────────────────┤
                                              ▼                         ▼
                                    ┌──────────────┐          ┌──────────────┐
                                    │ Thanh toán    │          │ Hết 10 phút  │
                                    │ qua PayOS     │          │ → EXPIRED    │
                                    └───────┬──────┘          │ → Hoàn ghế   │
                                            │                 └──────────────┘
                                            ▼
                                    ┌──────────────┐
                                    │ Webhook PayOS │
                                    │ code = '00'   │
                                    └───────┬──────┘
                                            ▼
                                    ┌──────────────┐     ┌──────────────┐
                                    │ Vé CONFIRMED │────▶│ Gửi email    │
                                    │ Xóa lock     │     │ xác nhận     │
                                    └──────────────┘     └──────────────┘
```

### 7.2. Luồng đặt vé tại quầy (Staff)

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌────────────────┐
│ NV tìm      │────▶│ Nhập thông tin   │────▶│ Thu tiền mặt   │────▶│ Vé CONFIRMED   │
│ chuyến xe   │     │ khách, chọn ghế  │     │ (CASH)         │     │ Gửi email      │
└─────────────┘     │ điểm đón/trả     │     │ NV xác nhận    │     └────────────────┘
                    └──────────────────┘     └────────────────┘
```

### 7.3. Luồng đặt vé hộ khách (Guest Booking)

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌────────────────┐
│ NV tìm      │────▶│ Nhập thông tin   │────▶│ Vé PENDING     │────▶│ Gửi email chứa │
│ chuyến xe   │     │ khách + email    │     │ Giữ chỗ 30 phút│     │ link thanh toán │
└─────────────┘     └──────────────────┘     └────────────────┘     └───────┬────────┘
                                                                            │
                                                                            ▼
                                                                  ┌────────────────┐
                                                                  │ Khách thanh toán│
                                                                  │ qua PayOS      │
                                                                  │ → CONFIRMED    │
                                                                  └────────────────┘
```

### 7.4. Luồng quên mật khẩu

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Nhập email   │────▶│ Gửi email    │────▶│ Click link   │────▶│ Nhập mật khẩu│
│              │     │ chứa link    │     │ reset        │     │ mới          │
│              │     │ (15 phút)    │     │              │     │ → Thành công │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 8. QUY TẮC NGHIỆP VỤ TỔNG HỢP

### 8.1. Quy tắc bảo mật
| # | Quy tắc | Chi tiết |
|---|---|---|
| BM-01 | Mã hóa mật khẩu | bcrypt, 10 salt rounds |
| BM-02 | JWT dual token | Access Token (1h) + Refresh Token (7 ngày) |
| BM-03 | Phân quyền RBAC | Guard kiểm tra `user.role.name` vs `@Roles()` decorator |
| BM-04 | Không lộ email | Forgot password luôn trả thành công |
| BM-05 | Token one-time | Reset password token chỉ dùng 1 lần |

### 8.2. Quy tắc đặt vé
| # | Quy tắc | Chi tiết |
|---|---|---|
| DV-01 | Giữ chỗ tạm thời | Redis TTL 10 phút (customer) / 30 phút (guest) |
| DV-02 | Atomic seat locking | Redis DECRBY + rollback nếu < 0 |
| DV-03 | Auto-expire | Cron mỗi phút, vé PENDING > 10 phút → EXPIRED + hoàn ghế |
| DV-04 | Chỉ hủy PENDING | Không thể hủy vé đã CONFIRMED |
| DV-05 | Giá động tối đa ×1.5 | Giới hạn tăng sốc |
| DV-06 | Làm tròn giá | Đến 1.000 VNĐ gần nhất |
| DV-07 | Idempotent payment | PayOS return được xử lý idempotent (không xử lý lại SUCCESS/FAILED) |

### 8.3. Quy tắc quản lý
| # | Quy tắc | Chi tiết |
|---|---|---|
| QL-01 | Soft delete | Routes, Schedules, Buses → `isActive = false` |
| QL-02 | Hard delete | Users → xóa vĩnh viễn |
| QL-03 | Xung đột xe/tài xế | Cùng ngày + cùng giờ + cùng xe/tài xế = lỗi |
| QL-04 | Unique constraints | Email user, biển số xe, khung giờ trên cùng tuyến |
| QL-05 | Điểm đi ≠ điểm đến | Tuyến đường không được có origin = destination |

### 8.4. Quy tắc email
| # | Quy tắc | Chi tiết |
|---|---|---|
| EM-01 | Fire-and-forget | Email gửi async, không block luồng chính |
| EM-02 | Non-fatal | Lỗi email không ảnh hưởng nghiệp vụ chính |
| EM-03 | Gmail App Password | Bắt buộc dùng App Password, không dùng mật khẩu Gmail chính |

---

## 9. BẢNG API ENDPOINTS

### 9.1. Auth (`/api/auth`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/register` | Đăng ký tài khoản | ❌ |
| POST | `/login` | Đăng nhập | ❌ |
| POST | `/refresh` | Refresh token | ❌ |
| POST | `/forgot-password` | Quên mật khẩu | ❌ |
| POST | `/reset-password` | Đặt lại mật khẩu | ❌ |
| PUT | `/change-password` | Đổi mật khẩu | ✅ JWT |
| GET | `/me` | Xem hồ sơ | ✅ JWT |
| PUT | `/me` | Sửa hồ sơ | ✅ JWT |

### 9.2. Users (`/api/users`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách user | ✅ Admin |
| GET | `/:id` | Chi tiết user | ✅ Admin |
| POST | `/` | Tạo user | ✅ Admin |
| PUT | `/:id` | Sửa user | ✅ Admin |
| DELETE | `/:id` | Xóa user | ✅ Admin |

### 9.3. Routes (`/api/routes`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách tuyến | ❌ |
| GET | `/:id` | Chi tiết tuyến | ❌ |
| POST | `/` | Tạo tuyến | ✅ Staff/Admin |
| PUT | `/:id` | Sửa tuyến | ✅ Staff/Admin |
| DELETE | `/:id` | Xóa (vô hiệu) tuyến | ✅ Staff/Admin |

### 9.4. Schedules (`/api/schedules`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách khung giờ | ❌ |
| POST | `/` | Tạo khung giờ | ✅ Staff/Admin |
| PUT | `/:id` | Sửa khung giờ | ✅ Staff/Admin |
| DELETE | `/:id` | Xóa khung giờ | ✅ Staff/Admin |

### 9.5. Buses (`/api/buses`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách xe | ✅ Admin |
| POST | `/` | Tạo xe | ✅ Admin |
| PUT | `/:id` | Sửa xe | ✅ Admin |
| DELETE | `/:id` | Xóa (vô hiệu) xe | ✅ Admin |

### 9.6. Trips (`/api/trips`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/search` | Tìm kiếm chuyến | ❌ |
| GET | `/` | Tất cả chuyến | ✅ Staff/Admin |
| GET | `/:id` | Chi tiết chuyến | ✅ JWT |
| GET | `/:id/dynamic-price` | Giá động | ✅ JWT |
| POST | `/` | Tạo chuyến | ✅ Staff/Admin |
| PUT | `/:id` | Sửa chuyến | ✅ Staff/Admin |
| DELETE | `/:id` | Hủy chuyến | ✅ Staff/Admin |

### 9.7. Tickets (`/api/tickets`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/` | Đặt vé | ✅ JWT |
| GET | `/my` | Vé của tôi | ✅ JWT |
| GET | `/` | Tất cả vé | ✅ Staff/Admin |
| POST | `/:id/confirm-cash` | Xác nhận tiền mặt | ✅ Staff/Admin |
| POST | `/:id/cancel` | Hủy vé | ✅ JWT |
| GET | `/guest/:id` | Vé khách vãng lai | ❌ (validate email) |

### 9.8. Payments (`/api/payments`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/create` | Tạo link PayOS | ✅ JWT |
| POST | `/create-multi` | Tạo link PayOS nhiều vé | ✅ JWT |
| GET | `/return` | Xử lý kết quả PayOS | ❌ (PayOS callback) |
| POST | `/guest-payment` | Thanh toán khách vãng lai | ❌ (validate email) |

### 9.9. Reports (`/api/reports`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/summary` | KPI tổng quan | ✅ Admin |
| GET | `/revenue` | Doanh thu theo ngày | ✅ Admin |
| GET | `/trip-stats` | Thống kê chuyến xe | ✅ Admin |
| GET | `/route-revenue` | Doanh thu theo tuyến | ✅ Admin |
| GET | `/shift-report` | Báo cáo ca làm việc | ✅ Staff/Admin |
| GET | `/forecast` | Dự báo doanh thu (AI) | ✅ Admin |
| GET | `/route-insights` | Phân tích tuyến (AI) | ✅ Admin |
| GET | `/rfm-segments` | Phân khúc RFM (AI) | ✅ Admin |
| GET | `/low-demand-alerts` | Cảnh báo ít khách (AI) | ✅ Admin |

### 9.10. Chatbot (`/api/chatbot`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/message` | Gửi tin nhắn chatbot | ✅ JWT |

---

## 10. CÔNG NGHỆ SỬ DỤNG

| Lớp | Công nghệ | Phiên bản | Mục đích |
|---|---|---|---|
| **Frontend** | React | 19 | UI framework |
| | Vite | — | Build tool |
| | TypeScript | — | Type safety |
| | TailwindCSS | — | Styling |
| | shadcn/ui | — | Component library |
| | Recharts | — | Biểu đồ |
| | dayjs | — | Xử lý ngày tháng |
| **Backend** | NestJS | — | API framework |
| | TypeORM | — | ORM |
| | JWT | — | Xác thực (Access + Refresh) |
| | Swagger | — | API documentation |
| | bcrypt | — | Mã hóa mật khẩu |
| | ioredis | — | Redis client |
| | @nestjs/schedule | — | Cron job (auto-expire) |
| **Database** | MySQL | 8+ | RDBMS |
| **Cache** | Redis | — | Slot locking, seat caching |
| **Thanh toán** | PayOS | — | Cổng thanh toán trực tuyến |
| **Chatbot** | Dify AI Platform | — | Chatbot NLP |
| **Email** | Nodemailer | — | SMTP client |
| | Gmail SMTP | — | Email provider |

---

> **Ghi chú:** Tài liệu này được tổng hợp từ source code thực tế của dự án, bao gồm database schema, backend services, pricing utilities, và use case diagrams. Mọi quy tắc nghiệp vụ, công thức tính toán, và luồng xử lý đều được trích xuất trực tiếp từ implementation.
