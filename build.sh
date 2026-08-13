#!/bin/bash
# ─── Build Script for Render Deployment ───────────────────────────────────────
# This script:
# 1. Installs Node.js (for frontend build)
# 2. Builds the React/Vite frontend into HH-backend/../HH-frontend/dist/
# 3. Installs Python backend dependencies
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo "=== Shoreline — Build Script ==="

# ─── Step 1: Install Node.js for frontend build ──────────────────────────────
echo ""
echo "--- Step 1: Setting up Node.js ---"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
apt-get install -y nodejs 2>/dev/null || npm --version
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# ─── Step 2: Build React Frontend ────────────────────────────────────────────
echo ""
echo "--- Step 2: Building React frontend ---"
cd HH-frontend
npm install
npm run build
echo "Frontend built to: $(pwd)/dist/"
ls -la dist/ 2>/dev/null || echo "dist/ listing skipped"
cd ..

# ─── Step 3: Install Python Backend Dependencies ─────────────────────────────
echo ""
echo "--- Step 3: Installing Python dependencies ---"
cd HH-backend
pip install --upgrade pip
pip install -r requirements.txt
echo "Python dependencies installed"

# ─── Step 4: Create uploads directory ────────────────────────────────────────
echo ""
echo "--- Step 4: Creating uploads directory ---"
mkdir -p uploads
echo "uploads/ directory ready"

echo ""
echo "=== Build Complete ==="
echo "Frontend dist: HH-frontend/dist/"
echo "Backend: HH-backend/"
echo "Start command: cd HH-backend && uvicorn main:app --host 0.0.0.0 --port \$PORT"
