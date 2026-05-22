# VinaCoach

He thong dat ve xe khach truc tuyen va quan ly van hanh nha xe.

Project gom:
- `frontend`: ung dung React + Vite + TailwindCSS
- `backend`: API NestJS + TypeORM
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

## Cong nghe su dung

- Frontend: React 19, Vite, TypeScript, TailwindCSS, shadcn/ui
- Backend: NestJS, TypeORM, JWT, Swagger
- Database: MySQL
- Cache / slot locking: Redis
- Thanh toan: VNPay sandbox

## Cau truc thu muc

```text
Do_An/
|-- backend/
|-- frontend/
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

### Public / Customer
- Trang chu va tim chuyen xe
- Dang ky / dang nhap
- Dat ve va giu cho tam thoi
- Thanh toan VNPay
- Xem lich su ve

### Staff
- Quan ly tuyen duong
- Quan ly khung gio
- Quan ly chuyen di
- Dat ve tai quay

### Admin
- Dashboard bao cao
- Quan ly phuong tien
- Quan ly nhan su
- **[AI] Phan tich & Du bao doanh thu** (xem section ben duoi)

## Tinh nang AI

VinaCoach tich hop 2 tinh nang AI tu xay dung, khong su dung API AI tra phi ben ngoai.
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

**Hien thi tren Admin Dashboard (`/admin/dashboard`):**

- **4 KPI cards gradient:** Xu huong (Tang truong / Suy giam / On dinh), Toc do tang truong %, Du bao tong doanh thu, Toc do thay doi trung binh/ngay
- **Forecast Chart:** Bieu do ket hop duong thuc te (mau tim) + duong du bao net dut (mau cam), voi duong phan cach "Hom nay"
- **Selector:** Chon du bao 7 / 14 / 30 ngay
- **Bang Route Insights:** Phan tich tung tuyen duong trong 90 ngay qua
  - Ty le lap day trung binh
  - Doanh thu / chuyen
  - Ngay cao diem trong tuan
  - Khuyen nghi AI: `Nen tang tan suat chay` / `Can nhac tang gia` / `Can kich cau / khuyen mai`

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

### Redis chua cai

Ung dung van co the chay mot so chuc nang, nhung de co co che giu cho 10 phut on dinh thi nen bat Redis.

### Swagger khong mo duoc

Kiem tra backend da chay thanh cong chua, sau do vao:

`http://localhost:3000/api/docs`

## Tai lieu bo sung

- `RUN.md`: huong dan chay nhanh tren Windows + VSCode
- `database.sql`: schema va du lieu mau

## Tai lieu nghiep vu tom tat

### Doi tuong nguoi dung
- Guest: tim chuyen xe, xem gia
- Customer: dat ve, thanh toan, xem lich su
- Staff: quan ly van hanh va dat ve tai quay
- Admin: quan ly he thong, nhan su, bao cao

### Mo hinh du lieu cot loi
- `roles`
- `users`
- `routes`
- `schedules`
- `buses`
- `trips`
- `tickets`
- `payments`
