#!/bin/bash

echo "============================================"
echo "  Shoreline - Full Stack Startup Script"
echo "  FastAPI Backend + React Frontend"
echo "============================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/HH-backend"
FRONTEND_DIR="$ROOT_DIR/HH-frontend"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH."
    echo "Please install Python 3.10+ from https://python.org"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "[1/6] Checking Python virtual environment..."
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo "Creating Python virtual environment..."
    cd "$BACKEND_DIR"
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
fi

echo "[2/6] Installing Python dependencies..."
cd "$BACKEND_DIR"
source .venv/bin/activate
pip install -r requirements.txt -q
if [ $? -ne 0 ]; then
    echo "[WARNING] Some Python dependencies may have failed to install"
fi

echo "[3/6] Checking Node.js dependencies..."
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install frontend dependencies"
        exit 1
    fi
fi

echo "[4/6] Creating uploads directory..."
mkdir -p "$BACKEND_DIR/uploads"

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "[5/6] Starting FastAPI Backend (port 8000)..."
cd "$BACKEND_DIR"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[6/6] Starting React Frontend (port 5173)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "============================================"
echo "  Both servers are running!"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop both servers..."
wait
