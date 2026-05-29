# VinaCoach

He thong dat ve xe khach truc tuyen va quan ly van hanh nha xe.

Project gom:
- `frontend`: ung dung React + Vite + TypeScript + TailwindCSS + shadcn/ui
- `backend`: API NestJS + TypeORM + Swagger
- `database.sql`: schema va seed data MySQL

## Tong quan

VinaCoach huong den mo hinh nha xe co nho va trung chat luong cao, ho tro:
- Tim chuyen xe va xem gia ve
- Dang ky, dang nhap, dat ve, thanh toan
- Quan ly tuyen duong, khung gio, chuyen di
- Quan ly phuong tien, nhan su
- Bao cao doanh thu va thong ke luot khach
- **[AI] Dieu chinh gia ve tu dong theo nhu cau thi truong (Dynamic Pricing)**
- **[AI] Phan tich doanh thu va du bao bang thuat toan hoc may (Revenue Forecasting)**
- **[AI] Phan khuc khach hang theo RFM (Recency · Frequency · Monetary)**
- **[AI] Canh bao chuyen it khach & Goi y giam gia tu dong (Low Demand Alerts)**
- **[AI] Chatbot tu van dat ve tich hop Dify**
- **Email thong bao tu dong (Gmail SMTP)**

## Cong nghe su dung

- Frontend: React 19, Vite, TypeScript, TailwindCSS, shadcn/ui, Recharts, dayjs
- Backend: NestJS, TypeORM, JWT (Access + Refresh Token), Swagger
- Database: MySQL 8+
- Cache / slot locking: Redis
- Thanh toan: PayOS
- Chatbot: Dify AI Platform
- Email: Nodemailer + Gmail SMTP

## Cau truc thu muc

```text
Do_An/
|-- backend/
|   |-- src/
|   |   |-- modules/
|   |   |   |-- auth/         # Dang nhap, dang ky, refresh token, quen mat khau
|   |   |   |-- users/        # Quan ly nguoi dung
|   |   |   |-- routes/       # Tuyen duong
|   |   |   |-- schedules/    # Khung gio
|   |   |   |-- trips/        # Chuyen di + dynamic pricing
|   |   |   |-- tickets/      # Ve xe + huy ve
|   |   |   |-- payments/     # PayOS + thu tien mat
|   |   |   |-- buses/        # Phuong tien
|   |   |   |-- reports/      # Bao cao + 4 tinh nang AI
|   |   |   |-- chatbot/      # Chatbot Dify tich hop DB
|   |   |   |-- email/        # Email thong bao
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- public/       # Trang chu, tim kiem, dang nhap, dang ky, quen mat khau
|   |   |   |-- customer/     # Dat ve, ve cua toi, ho so, doi mat khau
|   |   |   |-- staff/        # Quan ly van hanh, dat ve tai quay, bao cao ca
|   |   |   |-- admin/        # Dashboard, phuong tien, nhan su
|-- database.sql
|-- readme.md
|-- RUN.md
```

## Yeu cau moi truong

Can cai san:
- Node.js 18+
- npm 9+
- MySQL 8+ hoac XAMPP MySQL
- Redis (khuyen nghi, mac dinh port `6379`)

Khuyen nghi moi truong Windows:
- VSCode
- XAMPP neu dung MySQL local

## Huong dan chay nhanh

### 1. Clone / mo project

Neu da co source:

```bash
cd D:\Study\Do_An
```

Neu vua clone:

```bash
git clone https://github.com/quocanh4456/DoAn.git
cd DoAn
```

### 2. Import database

Project da co file `database.sql` chua schema va du lieu mau.

Cach de nhat voi phpMyAdmin:
1. Mo `http://localhost/phpmyadmin`
2. Chon `Import`
3. Chon file `database.sql`
4. Bam `Go`

Hoac dung command line:

```bash
mysql -u root -p < database.sql
```

Database duoc tao voi ten:

```text
vinacoach
```

### 3. Cai dependency

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 4. Cau hinh backend

File `backend/.env` dang duoc bo qua khoi git, ban can tao file nay tren may local.

Noi dung toi thieu tham khao:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=vinacoach

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_RETURN_URL=http://localhost:5173/customer/payment/result
PAYOS_CANCEL_URL=http://localhost:5173/customer/payment/result

# Chatbot Dify (tuy chon)
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key

# Gmail SMTP (tuy chon)
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="VinaCoach <your_gmail@gmail.com>"
```

Neu ban dung XAMPP mac dinh thi `DB_USERNAME=root` va `DB_PASSWORD=` thuong la duoc.

### 5. Chay backend

Mo terminal 1:

```bash
cd backend
npm run start:dev
```

Sau khi chay thanh cong:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

### 6. Chay frontend

Mo terminal 2:

```bash
cd frontend
npm run dev
```

Sau khi chay thanh cong:
- App: `http://localhost:5173`

## Tai khoan test

Mat khau cho tat ca tai khoan mau:

```text
123456
```

Tai khoan:
- Admin: `admin@vinacoach.vn`
- Staff: `staff@vinacoach.vn`
- Customer: `customer@vinacoach.vn`

## Script huu ich

### Backend

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Tinh nang hien co

### Public / Guest
- Trang chu voi hero section, tim kiem chuyen xe nhanh
- Tim kiem chuyen xe theo tuyen va ngay
- Dang ky tai khoan (kem email chao mung tu dong)
- Dang nhap / Dang xuat
- Quen mat khau & reset mat khau qua email (OTP 6 so, het han 15 phut)

### Customer (Khach hang)
- Dat ve va giu cho tam thoi (khoa Redis 10 phut)
- Thanh toan truc tuyen qua PayOS
- Xem lich su ve (PENDING / CONFIRMED / CANCELLED / EXPIRED)
- Chi tiet ve voi modal day du thong tin (tuyen, gio, xe, tai xe, diem don/tra)
- Thanh toan lai hoac huy ve dang PENDING
- Quan ly ho so ca nhan (sua ten, SĐT)
- Doi mat khau
- Chatbot tu van dat ve (Dify AI + du lieu thoi gian thuc)

### Staff (Nhan vien)
- Quan ly tuyen duong (them / sua / xoa)
- Quan ly khung gio (them / sua / xoa)
- Quan ly chuyen di (tao / cap nhat trang thai)
- Quan ly ve (xem toan bo ve trong he thong)
- Dat ve tai quay (thu tien mat, khong can khach tu tao tai khoan)
- Bao cao ca lam viec: tong so ve thu tien mat + doanh thu trong ngay

### Admin
- Dashboard KPI tong quan (doanh thu, so ve, khach hang, chuyen sap toi)
- Bieu do phan loai trang thai ve (Donut chart)
- Bao cao doanh thu theo ngay (Area chart, filter theo khoang thoi gian)
- Bao cao doanh thu theo tuyen (Bar chart ngang)
- Thong ke lap day chuyen xe (co mini progress bar)
- Quan ly phuong tien (them / sua / xoa xe)
- Quan ly nhan su (them / sua / xoa / kich hoat / vo hieu)
- Tab **AI Phan tich** tich hop 4 tinh nang AI (xem section ben duoi)

---

## Tinh nang AI

VinaCoach tich hop **4 tinh nang AI + 1 chatbot** tu xay dung, khong su dung API AI tra phi ben ngoai (ngoai tru chatbot Dify).
Toan bo logic tinh toan chay tren NestJS backend, dua vao du lieu MySQL hien co.

### 1. Dynamic Pricing — Dieu chinh gia ve tu dong

Gia ve duoc tinh tu dong dua tren 4 yeu to ket hop:

| Yeu to | Dieu kien ap dung | He so |
|--------|------------------|-------|
| Ngay le | Tet, 30/4, 1/5, 2/9... | x1.25 |
| Cuoi tuan | Thu 7, Chu nhat | x1.10 |
| Ghe gan het | > 80% ghe da dat | x1.12 den x1.20 |
| Dat gap | <= 1 ngay truoc khi khai hanh | x1.15 |
| Dat gap (nhe) | <= 3 ngay truoc khi khai hanh | x1.08 |

**Gioi han toi da: x1.5** so voi gia goc. Gia lam tron den 1.000 VND gan nhat.

**API endpoint:**
```
GET /api/trips/:id/dynamic-price
```
Tra ve: `basePrice`, `finalPrice`, `totalMultiplier`, `factors[]` (danh sach yeu to dang ap dung).

**Hien thi tren giao dien:**
- Trang dat ve (`/customer/booking/:tripId`): hien thi bang "Phan tich gia" voi tung yeu to
- Badge "Gia dong x1.xx" va gia goc bi gach chan khi co dieu chinh
- Khi gia thuong: hien thi badge xanh la "Gia ve thuong"

---

### 2. Revenue Forecasting — Phan tich & Du bao doanh thu

Su dung thuat toan **Weighted Moving Average (WMA) + Linear Regression** de du bao doanh thu.

**Quy trinh tinh toan:**
1. Lay du lieu doanh thu 90 ngay gan nhat tu DB
2. Fill gaps: dien 0 cho nhung ngay khong co giao dich
3. WMA voi window = 7 ngay (ngay gan nhat co trong so cao hon)
4. Linear Regression tren chuoi WMA de tinh xu huong (slope)
5. Forecast = WMA(ngay cuoi) + slope x i (cho i ngay toi)
6. Ap them seasonality: ngay le / cuoi tuan tang them he so tuong ung
7. Tinh growth rate: so sanh 30 ngay cuoi vs 30 ngay truoc do

**API endpoints:**
```
GET /api/reports/forecast?days=7|14|30
GET /api/reports/route-insights
```

**Hien thi tren Admin Dashboard (`/admin/dashboard` → tab "AI Phan tich"):**

- **4 KPI cards gradient:** Xu huong (Tang truong / Suy giam / On dinh), Toc do tang truong %, Du bao tong doanh thu, Toc do thay doi trung binh/ngay
- **Forecast Chart:** Bieu do ket hop duong thuc te (mau tim) + duong du bao net dut (mau cam), voi duong phan cach "Hom nay"
- **Selector:** Chon du bao 7 / 14 / 30 ngay
- **Bang Route Insights:** Phan tich tung tuyen duong trong 90 ngay qua
  - Ty le lap day trung binh
  - Doanh thu / chuyen
  - Ngay cao diem trong tuan
  - Khuyen nghi AI: `Nen tang tan suat chay` / `Can nhac tang gia` / `Can kich cau / khuyen mai`

---

### 3. RFM Customer Segmentation — Phan khuc khach hang

Phan loai tung khach hang theo 3 chi so **RFM**:
- **R — Recency:** Ngay dat ve cuoi cach day bao lau
- **F — Frequency:** So lan dat ve thanh cong (CONFIRMED)
- **M — Monetary:** Tong so tien da thanh toan (SUCCESS)

**Cong thuc tinh diem:**

| Chi so | Diem 3 | Diem 2 | Diem 1 |
|--------|--------|--------|--------|
| Recency | <= 7 ngay | <= 30 ngay | > 30 ngay |
| Frequency | >= 5 lan | >= 2 lan | 1 lan |
| Monetary | >= 2.000.000 ₫ | >= 500.000 ₫ | < 500.000 ₫ |

**Nhan phan khuc (tong diem R+F+M):**

| Phan khuc | Tong diem | Mau |
|-----------|-----------|-----|
| 🏆 VIP | >= 8 | Vang |
| 💙 Trung thanh | >= 6 | Xanh duong |
| 💛 Tiem nang | >= 4 | Xanh la |
| 🔴 Can kich cau | < 4 | Do |

**API endpoint:**
```
GET /api/reports/rfm-segments
```

**Hien thi tren Admin Dashboard:**
- Bieu do tron (Donut chart) phan bo 4 phan khuc
- Bang danh sach khach hang voi Recency / Frequency / Monetary / Tong diem / Nhan

---

### 4. Low Demand Alerts — Canh bao chuyen it khach

Quet cac chuyen khai hanh trong vong 2–14 ngay toi:
- So sanh ty le lap day hien tai voi trung binh lich su 90 ngay cung tuyen
- Neu ty le hien tai < 60% ky vong → canh bao LOW DEMAND
- De xuat % giam gia phu hop (toi da 25%)

**API endpoint:**
```
GET /api/reports/low-demand-alerts
```

**Ket qua tra ve:**
- `severity`: `high` (< 15%) / `medium` (< 30%) / `low`
- `currentOccupancy`, `expectedOccupancy`
- `suggestedDiscount` (%)
- `discountedPrice` (gia sau khi giam)

**Hien thi tren Admin Dashboard:**
- Badge so do canh bao tren tab "AI Phan tich"
- Danh sach chuyen kem muc do mau (do / vang / xanh la)
- Hien thi gia goc va gia giam de xuat

---

### 5. AI Chatbot — Tu van dat ve thoi gian thuc

Tich hop **Dify AI Platform** + context du lieu thuc tu MySQL:

**Quy trinh xu ly:**
1. Phan tich y dinh nguoi dung (intent detection): `search_trip` / `list_routes` / `general`
2. Query DB lay du lieu phu hop (chuyen xe, gia ve, ghe trong, thoi gian)
3. Gui context + cau hoi den Dify → nhan tra loi tieng Viet
4. Bot luon tra loi dua tren du lieu thoi gian thuc, khong bịa thong tin

**Cac loai cau hoi bot hieu duoc:**
- "Co chuyen tu Ha Noi di Hue ngay mai khong?"
- "Gia ve tuyen nao re nhat?"
- "Con cho nao ngay 14/6 khong?"

**API endpoint:**
```
POST /api/chatbot/message
Body: { query, conversation_id?, user? }
```

**Hien thi:** Widget chat noi (floating button) tren giao dien khach hang.

---

## Tinh nang bo tro

### Email thong bao tu dong (Gmail SMTP)

He thong tu dong gui email trong cac truong hop:
- **Dang ky thanh cong:** Email chao mung voi thong tin tai khoan
- **Quen mat khau:** Email gui OTP 6 so (het han 15 phut) de reset mat khau
- **Dat ve thanh cong:** Email xac nhan ve voi day du thong tin chuyen

Cau hinh qua bien moi truong `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` trong `backend/.env`.

### Bao cao ca lam viec (Staff)

Nhan vien co the xem bao cao ca lam viec trong ngay:
- Tong so ve da thu tien mat (dat ve tai quay)
- Tong doanh thu tien mat can ban giao
- Chi tiet tung giao dich theo thoi gian

**API endpoint:**
```
GET /api/reports/shift-report
```
*(Yeu cau xac thuc Staff/Admin, chi lay du lieu cua nhan vien dang dang nhap)*

### Dat ve tai quay (Counter Booking — Staff)

Nhan vien co the dat ve truc tiep tai quay:
- Tim kiem chuyen xe theo tuyen + ngay
- Chon so ghe / diem don / diem tra
- Thu tien mat truc tiep (Payment method: CASH)
- Khach hang co the khong co tai khoan (tu dong tao tai khoan an danh)

### Quan ly ho so ca nhan (Customer)

Khach hang co the:
- Xem va chinh sua ho ten, so dien thoai
- Xem vai tro va ngay tham gia
- Doi mat khau (nhap mat khau cu → mat khau moi)
- Chuyen nhanh den trang doi mat khau tu trang ho so

---

## Cau hinh moi truong

### backend/.env day du

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=vinacoach

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=3600
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=604800

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# App
PORT=3000
FRONTEND_URL=http://localhost:5173

# PayOS
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=http://localhost:5173/customer/payment/result
PAYOS_CANCEL_URL=http://localhost:5173/customer/payment/result

# Dify Chatbot
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=

# Gmail SMTP
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="VinaCoach <your_gmail@gmail.com>"
```

> **Luu y Gmail SMTP:** Phai bat "2-Step Verification" va tao "App Password" tai
> `https://myaccount.google.com/apppasswords`. Dung mat khau chinh tai khoan se bi tu choi.

---

## Troubleshooting

### Khong ket noi duoc MySQL

Kiem tra:
- MySQL da start chua
- File `backend/.env` co dung `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- Da import `database.sql` chua

### Frontend khong goi duoc backend

Kiem tra:
- Backend dang chay tai `http://localhost:3000`
- Frontend dang chay tai `http://localhost:5173`
- File `frontend/.env` (neu co) co dung `VITE_API_URL`

### Redis chua cai

Ung dung van co the chay mot so chuc nang, nhung de co co che giu cho 10 phut on dinh thi nen bat Redis.

### Swagger khong mo duoc

Kiem tra backend da chay thanh cong chua, sau do vao:

`http://localhost:3000/api/docs`

### Chatbot khong tra loi

Kiem tra:
- `DIFY_BASE_URL` va `DIFY_API_KEY` da duoc cau hinh trong `.env`
- Ung dung Dify da duoc cau hinh va publish

### Email khong gui duoc

Kiem tra:
- `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` trong `.env`
- Da bat "2-Step Verification" tren Gmail chua
- `MAIL_PASS` la App Password (16 ky tu), khong phai mat khau Gmail chinh

---

## Tai lieu bo sung

- `RUN.md`: huong dan chay nhanh tren Windows + VSCode
- `database.sql`: schema va du lieu mau

---

## Tai lieu nghiep vu tom tat

### Doi tuong nguoi dung
- **Guest:** Tim chuyen xe, xem gia, xem thong tin tuyen
- **Customer:** Dat ve, thanh toan, xem lich su, quan ly ho so, dung chatbot
- **Staff:** Quan ly van hanh, dat ve tai quay, bao cao ca lam viec
- **Admin:** Quan ly he thong, nhan su, xem toan bo bao cao + AI phan tich

### Mo hinh du lieu cot loi
- `roles` — Phan quyen (Admin / Staff / Customer)
- `users` — Nguoi dung
- `routes` — Tuyen duong (diem di, diem den, gia co ban, khoang cach)
- `schedules` — Khung gio chay dinh ky (tuyen + gio xuat phat)
- `buses` — Phuong tien (bien so, loai xe, so ghe)
- `trips` — Chuyen di cu the (ngay + schedule + xe + tai xe)
- `tickets` — Ve xe (lien ket trip + user + diem don/tra + gia)
- `payments` — Thanh toan (PayOS hoac tien mat)

### Luong dat ve truc tuyen
1. Khach tim kiem chuyen (trang tim kiem)
2. Chon chuyen → Xem gia dong (Dynamic Pricing)
3. Dat ve → Ghe bi khoa tam thoi 10 phut (Redis)
4. Thanh toan qua PayOS → Webhook xac nhan → Ghe duoc xac nhan
5. He thong gui email xac nhan ve

### Luong dat ve tai quay
1. Nhan vien tim chuyen xe
2. Nhap thong tin khach, chon ghe, diem don/tra
3. Thu tien mat truc tiep
4. Ve duoc tao voi payment method = CASH
5. Nhan vien co the xem lai trong bao cao ca lam viec
