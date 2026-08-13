@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Shoreline - Full Stack Startup Script
echo   FastAPI Backend + React Frontend
echo ============================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%HH-backend"
set "FRONTEND_DIR=%ROOT_DIR%HH-frontend"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/6] Checking Python virtual environment...
if not exist "%BACKEND_DIR%\.venv" (
    echo Creating Python virtual environment...
    cd /d "%BACKEND_DIR%"
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo [2/6] Installing Python dependencies...
cd /d "%BACKEND_DIR%"
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [WARNING] Some Python dependencies may have failed to install
)

echo [3/6] Checking Node.js dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

echo [4/6] Creating uploads directory...
if not exist "%BACKEND_DIR%\uploads" (
    mkdir "%BACKEND_DIR%\uploads"
)

echo [5/6] Starting FastAPI Backend (port 8000)...
cd /d "%BACKEND_DIR%"
start "HH-Backend" cmd /c ".venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [6/6] Starting React Frontend (port 5173)...
cd /d "%FRONTEND_DIR%"
start "HH-Frontend" cmd /c "npm run dev"

echo.
echo ============================================
echo   Both servers are starting...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to stop both servers...
pause >nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq HH-Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq HH-Frontend" /F >nul 2>&1
echo Servers stopped.
