# RUN GUIDE - VinaCoach (VSCode)

Tai lieu nay huong dan chay du an VinaCoach tren may Windows + VSCode.

## 1) Yeu cau

- Node.js >= 18
- XAMPP (su dung MySQL)
- VSCode
- (Khuyen nghi) Redis chay local o port `6379`

## 2) Mo project trong VSCode

1. Mo VSCode
2. Chon `File -> Open Folder...`
3. Chon thu muc: `D:\Study\Do_An`

## 3) Khoi dong MySQL bang XAMPP

1. Mo `XAMPP Control Panel`
2. Bam `Start` o dong `MySQL`
3. (Tuy chon) Bam `Start` o dong `Apache` de vao phpMyAdmin

## 4) Import database

### Cach A - phpMyAdmin (de nhat)

1. Mo: `http://localhost/phpmyadmin`
2. Chon tab `Import`
3. Chon file: `D:\Study\Do_An\database.sql`
4. Bam `Go`

### Cach B - Command line

```bash
mysql -u root -p < database.sql
```

## 5) Chay Backend (Terminal 1)

Mo terminal moi trong VSCode:

```bash
cd backend
npm install
npm run start:dev
```

Backend se chay tai:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

## 6) Chay Frontend (Terminal 2)

Mo terminal thu 2 trong VSCode:

```bash
cd frontend
npm install
npm run dev
```

Frontend se chay tai:

- App: `http://localhost:5173`

## 7) Tai khoan test

Mat khau cho tat ca tai khoan: `123456`

- Admin: `admin@vinacoach.vn`
- Staff (Nhan vien dieu hanh): `staff@vinacoach.vn`
- Customer: `customer@vinacoach.vn`

## 8) Luu y quan trong

- He thong chi co 3 role dang login: `Admin`, `Staff`, `Customer`.
- Tai xe KHONG la role login; tai xe duoc nhap dang text (`driver_name`) khi tao chuyen.
- Neu ban da import SQL thi backend da du data mau.

## 9) Troubleshooting nhanh

### Loi ket noi MySQL

- Kiem tra MySQL trong XAMPP da `Start` chua.
- Kiem tra file `backend/.env`:
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_USERNAME=root`
  - `DB_PASSWORD=` (de trong neu XAMPP mac dinh khong password)
  - `DB_DATABASE=vinacoach`

### Frontend khong goi duoc backend

- Kiem tra backend dang chay o `http://localhost:3000`
- Kiem tra frontend dang chay o `http://localhost:5173`

### Redis chua cai

- App van chay duoc (co fallback).
- De dung giu cho 10 phut on dinh nhat, nen cai va chay Redis sau.
