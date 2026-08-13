# Shoreline — Local Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **Python** | 3.13+ | [python.org](https://python.org) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/shoreline.git
cd shoreline
```

Open **two terminals** — one for the backend, one for the frontend.

---

## Terminal 1: Backend (FastAPI)

```bash
cd HH-backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in your keys
cp .env.example .env

# Start the server
python main.py
```

Backend runs at `http://localhost:8000`

API docs available at `http://localhost:8000/docs`

---

## Terminal 2: Frontend (React + Vite)

```bash
cd HH-frontend

# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.example .env

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

### Backend (`HH-backend/.env`)

```env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173

# Clerk Authentication (required)
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY

# NeonDB PostgreSQL (required)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Cloudflare R2 (optional — falls back to local storage)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=hhgoa2026-cards
R2_PUBLIC_URL=

# Gemini AI (optional — falls back to random titles)
GEMINI_API_KEY=

# Local Storage
UPLOAD_DIR=./uploads
```

### Frontend (`HH-frontend/.env`)

```env
# Points to local backend
VITE_API_URL=http://localhost:8000

# Clerk (same key as backend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

---

## How the Dev Proxy Works

In development, the Vite dev server proxies API requests to the backend:

```
Browser → localhost:5173 (Vite)
  ├── /api/*     → proxy → localhost:8000 (FastAPI)
  ├── /uploads/* → proxy → localhost:8000 (FastAPI)
  └── /*         → Vite serves React (HMR enabled)
```

This is configured in `HH-frontend/vite.config.ts`:
```ts
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true },
    '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
  },
},
```

No CORS issues in development — same origin via proxy.

---

## Getting API Keys

### Clerk (Authentication)
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** from the API Keys page
4. Use the same keys in both backend and frontend `.env` files

### NeonDB (Database)
1. Go to [neon.tech](https://neon.tech)
2. Create a project
3. Copy the connection string from the dashboard
4. Paste as `DATABASE_URL` in backend `.env`

### Gemini (AI Titles — Optional)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Get an API key
3. Paste as `GEMINI_API_KEY` in backend `.env`
4. Without this, the app uses random fallback titles

---

## Database

The app auto-creates tables on first run:
- `users` — Clerk user info + admin flag
- `generations` — Card generation records
- `admin_users` — Admin tracking
- `share_events` / `download_events` — Analytics

A seed script populates 12 demo cards on first run.

---

## Project Structure

```
shoreline/
├── HH-frontend/              # React + Vite
│   ├── src/
│   │   ├── main.tsx          # Entry: ClerkProvider + BrowserRouter
│   │   ├── App.tsx           # Route definitions
│   │   ├── api.ts            # apiFetch() helper
│   │   ├── types.ts          # TypeScript types
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SharePage.tsx
│   │   └── components/
│   │       ├── Navigation.tsx
│   │       ├── ProtectedRoute.tsx
│   │       ├── AdminRoute.tsx
│   │       ├── LandingHero.tsx
│   │       ├── GeneratorStudio.tsx
│   │       ├── ResultScreen.tsx
│   │       ├── SocialGallery.tsx
│   │       ├── AdminDashboard.tsx
│   │       └── 3d/           # Three.js 3D card components
│   ├── package.json
│   └── vite.config.ts
│
├── HH-backend/               # FastAPI
│   ├── main.py               # App entry, CORS, routers
│   ├── config.py             # Pydantic Settings
│   ├── requirements.txt
│   ├── routers/
│   │   ├── cards.py          # /api/cards CRUD
│   │   ├── title.py          # /api/title AI generation
│   │   ├── admin.py          # /api/admin/stats
│   │   └── auth.py           # /api/auth/me
│   ├── middleware/
│   │   └── clerk_auth.py     # JWT verification
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response
│   ├── db/
│   │   ├── connection.py     # asyncpg pool
│   │   ├── migrate.py        # CREATE TABLE
│   │   ├── queries.py        # All DB queries
│   │   └── seed.py           # Demo data
│   └── services/
│       ├── ai_title.py       # Gemini integration
│       └── storage.py        # R2 + local storage
│
└── .gitignore
```

---

## Common Commands

```bash
# Backend
cd HH-backend
python main.py                  # Start dev server
pip install -r requirements.txt # Install deps
python -m pytest                # Run tests (if added)

# Frontend
cd HH-frontend
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run lint                    # TypeScript check
npm run preview                 # Preview production build
```

---

## Windows Users

Use the included startup scripts to run both servers:

```bash
# From the project root
start.bat
```

This opens two PowerShell windows — one for backend, one for frontend.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError` | Activate your Python venv: `.venv\Scripts\activate` |
| `npm: command not found` | Install Node.js from nodejs.org |
| CORS errors in browser | Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env` |
| Port 8000 already in use | Change `PORT` in backend `.env` or kill the process using it |
| Database connection failed | Check `DATABASE_URL` in backend `.env`; ensure NeonDB allows local IPs |
| Clerk auth not working | Verify keys match between frontend and backend `.env` files |
| Vite proxy not working | Ensure backend is running on port 8000 before starting frontend |
