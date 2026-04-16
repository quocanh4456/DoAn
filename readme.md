# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENT DOCUMENT)

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1. Bối cảnh & Vấn đề (Context)
Bên cạnh đó, một loại hình dịch vụ vận tải hành khách đang rất phát triển hiện nay là dịch vụ sử dụng xe cỡ nhỏ và cỡ trung chất lượng cao, nhắm vào đối tượng khách hàng có thu nhập trung bình và trung bình khá. Đặc thù của mô hình này là hành khách thường là khách quen của nhà xe và có nhu cầu được đón và trả tại nhà. Việc thiếu một công cụ kết nối hiệu quả giữa nhà xe và hành khách trong các nhu cầu di chuyển hàng ngày đang làm giảm đi tính tiện lợi và an toàn của dịch vụ

### 1.2. Giải pháp (Solution)
Để giải quyết các hạn chế hiện tại và đáp ứng đúng đặc thù của loại hình dịch vụ xe khách cỡ nhỏ/trung chất lượng cao, dự án đề xuất xây dựng nền tảng quản lý trực tuyến toàn diện ("Smart Fleet & Ticketing Management") bao gồm các trọng tâm sau:
 **Hệ thống Đặt vé & Chăm sóc khách hàng (VinaCoach Core)**: Số hóa toàn bộ bảng giá, thanh toán trực tuyến nhằm minh bạch thông tin dịch vụ. Đặc biệt, hệ thống tối ưu hóa trải nghiệm cho tập khách quen thông qua việc hỗ trợ lưu trữ thông tin.
 
---

## 2. PHÂN TÍCH ĐỐI TƯỢNG NGƯỜI DÙNG (USER PERSONAS)

### 2.1. Khách vãng lai (Guest)
* **Quyền hạn:** Tìm kiếm chuyến đi, xem giá vé.
* **Hạn chế:** Không thể thanh toán và chốt vé nếu chưa nhập thông tin định danh.

### 2.2. Hành khách (Customer)
* **Quyền hạn:** Đặt vé, thanh toán trực tuyến, tra cứu lịch sử đi lại, hủy vé theo chính sách.
* **Mô tả đối tượng**: Là tập khách hàng có thu nhập trung bình và trung bình khá, mong muốn một dịch vụ di chuyển an toàn và tiện lợi. Họ thường là khách quen của nhà xe, ưa chuộng dòng xe cỡ nhỏ/trung chất lượng cao và đặc biệt có nhu cầu được xe đón và trả tận nhà thay vì phải tự di chuyển ra bến.

### 2.3. Nhân viên (Staff)
* **Quản lý vận hành**: 
  Tạo tuyến đường: Thiết lập các điểm đi, điểm đến và khoảng cách giữa các tỉnh thành.
o	Lập lịch trình (Trip): Sắp xếp thời gian xe chạy, gán xe và tài xế cụ thể cho từng chuyến.
•	Hỗ trợ nghiệp vụ: Thực hiện đặt vé tại quầy cho khách.

### 2.4. Quản trị viên (Admin)
* **Quản trị hệ thống**: Quản lý danh mục loại xe, thông tin phương tiện và hồ sơ nhân sự (Nhân viên/Tài xế).
* **Phân quyền**: Cấp tài khoản và quản lý quyền truy cập của nhân viên vào hệ thống.
* **Báo cáo chiến lược**: Theo dõi biểu đồ doanh thu, thống kê lượng khách và đánh giá hiệu suất của các tuyến đường.

---

## 3. DANH SÁCH TÍNH NĂNG (FEATURE LIST) & ĐẶC TẢ CHI TIẾT

Các Tính năng (Features)
2.1. Quản lý Tuyến đường và Lịch trình (Route & Schedule Management)
- Quản lý Tuyến đường:
Thêm, sửa, xóa, cập nhật thông tin chi tiết về các tuyến đường (điểm đi, điểm đến, khoảng cách, giá vé cơ bản).
- Lập Lịch trình:
Thiết lập các chuyến xe chạy thực tế dựa trên các tuyến đường đã tạo.
Gán thời gian xuất bến, sắp xếp phương tiện và phân công tài xế cụ thể cho từng chuyến.
2.2. Đặt vé và Thanh toán trực tuyến (Ticketing & Payment)
Tìm kiếm và Đặt chỗ:
- Số hóa cho phép hành khách xem và lựa chọn chuyến.
- Cho phép hành khách nhập text tự do hoặc chọn thông tin địa điểm đón/trả tận nhà khi tiến hành đặt vé.
- Xử lý Giao dịch an toàn (Slot Locking / Giữ chỗ):
Tích hợp cơ chế giữ chỗ tạm thời bằng Redis (đếm ngược 10 phút) khi hành khách tiến hành thanh toán. Hệ thống sẽ tạm trừ đi số lượng vé khách đang đặt vào tổng số chỗ trống của chuyến xe, loại bỏ hoàn toàn tình trạng bán vượt quá sức chứa của xe (overbooking).
- Thanh toán Điện tử:
Tích hợp API của VNPay để xử lý giao dịch trực tuyến an toàn.
2.3. Quản lý Hệ thống và Nhân sự (System & HR Management)
- Quản lý Phương tiện:
Tìm kiếm, thêm, xóa và sửa thông tin về danh mục các xe cỡ nhỏ và trung.
- Quản lý Tài khoản:
Tạo, xóa, sửa và tìm kiếm tài khoản của nhân viên điều hành.
2.4. Báo cáo và Thống kê (Reports & Analytics)
- Báo cáo Doanh thu:
Thống kê và trực quan hóa dữ liệu doanh thu để ban quản lý đánh giá hiệu quả kinh doanh.
- Thống kê Lượt khách / Chuyến xe:
Theo dõi hiệu suất khai thác của từng chuyến xe thông qua dữ liệu lượt khách

---

## 5. KIẾN TRÚC DỮ LIỆU (DATA MODEL CỐT LÕI)
1. **Roles**: Lưu danh mục các vai trò trong hệ thống (Admin, Staff, Customer) để quản lý phân quyền truy cập.
2. **Users**: Lưu thông tin định danh của khách hàng, nhân viên và quản trị viên; liên kết với bảng Roles thông qua RoleID.
3. **Routes**: Lưu thông tin các tuyến đường cố định bao gồm điểm đi, điểm đến, khoảng cách và đơn giá vé cơ bản.
4. **Schedules** (Khung giờ): Lưu các khung giờ xuất bến cố định trong ngày cho từng tuyến đường để hỗ trợ nhân viên lập lịch nhanh chóng.
5. **Buses**: Lưu thông tin chi tiết về phương tiện như biển số xe, loại xe (giường nằm/ghế ngồi) và tổng số ghế.
6. **Trips**: Lưu các chuyến đi thực tế trong ngày, kết hợp thông tin từ khung giờ, xe và tài xế cụ thể.
7. **Tickets**: Lưu thông tin vé đã đặt, bao gồm địa điểm đón khách (pick_up_location), địa điểm trả khách (drop_off_location) và trạng thái vé.
8. **Payments**: Lưu vết các giao dịch thanh toán trực tuyến (VNPAY) bao gồm số tiền, thời gian và trạng thái giao dịch để đối soát doanh thu.
---

## 6. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

* **Frontend:** Vite, ReactJS.
* **Backend:** Node.js (NestJS).
* **Database:** MySQL.
* **Caching/Locking:** Redis (Xử lý giữ chỗ đồng thời và đếm ngược thời gian thanh toán)
* **Payment Gateway:** API VNPay.

## 7. Current Progress (Tiến độ hiện tại)

### Backend (NestJS) - Hoàn thành
- Auth Module (JWT + RBAC: Admin/Staff/Customer)
- Users Module (CRUD nhân sự)
- Routes Module (CRUD tuyến đường)
- Schedules Module (CRUD khung giờ)
- Buses Module (CRUD phương tiện)
- Trips Module (Lập lịch chuyến + tìm kiếm)
- Tickets Module (Đặt vé + Redis slot locking 10 phút)
- Payments Module (Tích hợp VNPay sandbox)
- Reports Module (Doanh thu + thống kê lượt khách)

### Frontend (Vite + React + TailwindCSS + shadcn/ui) - Hoàn thành
- Trang chủ + Tìm chuyến xe (Public)
- Đăng nhập / Đăng ký
- Đặt vé với countdown 10 phút + Thanh toán VNPay
- Lịch sử vé của khách hàng
- Quản lý tuyến đường, khung giờ, chuyến đi (Staff)
- Đặt vé tại quầy (Staff)
- Quản lý phương tiện, nhân sự (Admin)
- Dashboard báo cáo doanh thu + biểu đồ (Admin)

### Hướng dẫn chạy

#### Yêu cầu
- Node.js >= 18
- MySQL đang chạy (tạo database `vinacoach`)
- Redis đang chạy (mặc định port 6379)

#### Backend
```bash
cd backend
cp .env.example .env   # hoặc chỉnh sửa .env có sẵn
npm run start:dev
```
API chạy tại: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

#### Frontend
```bash
cd frontend
npm run dev
```
App chạy tại: http://localhost:5173

## 8. Yêu cầu đặc thù
