@echo off
title VinaCoach - Khoi dong he thong
color 0A

echo.
echo  ================================
echo    VINACOACH - KHOI DONG TAT CA
echo  ================================
echo.

:: 1. Mo XAMPP Control Panel
echo [1/5] Mo XAMPP Control Panel...
start "" "C:\xampp\xampp-control.exe"
echo.
echo  >> Bam START cho MySQL trong XAMPP, sau do bam phim bat ky de tiep tuc...
pause >nul
echo.

:: 2. Khoi dong Backend
echo [2/5] Dang khoi dong Backend (port 3000)...
start "VinaCoach - Backend" cmd /k "cd /d D:\Study\Do_An\backend && npm run start:dev"
timeout /t 3 /nobreak >nul

:: 3. Build Frontend (lay code moi nhat)
echo [3/5] Dang build Frontend (cap nhat code moi nhat)...
cd /d D:\Study\Do_An\frontend
call npx vite build
if %errorlevel% neq 0 (
    echo.
    echo  [LOI] Build that bai! Kiem tra lai code.
    pause
    exit /b 1
)
echo  >> Build thanh cong!
echo.

:: 4. Khoi dong Frontend Preview
echo [4/5] Dang khoi dong Frontend Preview (port 4173)...
start "VinaCoach - Frontend" cmd /k "cd /d D:\Study\Do_An\frontend && npx vite preview --port 4173 --host"
timeout /t 3 /nobreak >nul

:: 5. Khoi dong Cloudflare Tunnel
echo [5/5] Dang khoi dong Cloudflare Tunnel...
start "VinaCoach - Tunnel" cmd /k "cd /d D:\Study\Do_An && .\cloudflared.exe tunnel run vinacoach"

echo.
echo  ================================
echo    Tat ca dang khoi dong!
echo.
echo    Frontend : https://qatienphong.id.vn
echo    API Docs : https://api.qatienphong.id.vn/api/docs
echo    Local    : http://localhost:4173
echo  ================================
echo.
echo  Cho khoang 10-15 giay de backend san sang...
echo  Bam phim bat ky de dong cua so nay.
pause >nul
