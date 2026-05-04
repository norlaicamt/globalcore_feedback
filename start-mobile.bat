@echo off
echo ==========================================
echo   MOBILE TESTING SETUP - GLOBAL CORE
echo ==========================================
echo.
echo Local IP: 192.168.1.47
echo.
echo 1. Starting Backend on all interfaces...
start cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo.
echo 2. Starting Frontend on all interfaces...
set HOST=0.0.0.0
cd frontend && npm start
