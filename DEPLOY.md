# Shoreline — Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MONOREPO                               │
│                                                             │
│  ┌─────────────────────┐       ┌──────────────────────────┐ │
│  │    HH-frontend/     │       │      HH-backend/         │ │
│  │    React + Vite     │       │      FastAPI (Python)    │ │
│  └─────────┬───────────┘       └────────────┬─────────────┘ │
│            │                                │               │
└────────────┼────────────────────────────────┼───────────────┘
             │                                │
     ┌───────▼────────┐              ┌────────▼────────┐
     │     VERCEL     │              │      RENDER     │
     │   (Frontend)   │─────────────▶│    (Backend)    │
     │   Static SPA   │   /api/*     │   FastAPI :8000 │
     └────────────────┘   proxy      └────────┬────────┘
                                              │
                               ┌──────────────┼──────────────┐
                               │              │              │
                          ┌────▼────┐   ┌────▼────┐   ┌─────▼─────┐
                          │ NeonDB  │   │  Clerk  │   │  Gemini   │
                          │(extern) │   │ (extern)│   │ (extern)  │
                          └─────────┘   └─────────┘   └───────────┘
```

**Two separate deployments, one monorepo:**

| Service | Platform | URL Pattern |
|---------|----------|-------------|
| **Frontend** | Vercel | `https://your-app.vercel.app` |
| **Backend** | Render | `https://your-app.onrender.com` |

- **Vercel** serves the React SPA as static files with client-side routing
- **Render** runs the FastAPI backend (API only, no SPA catch-all in production)
- Frontend calls backend via `VITE_API_URL` environment variable

---

## Prerequisites

| Service | URL | Purpose |
|---------|-----|---------|
| **Vercel** | vercel.com | Frontend hosting |
| **Render** | render.com | Backend hosting |
| **NeonDB** | neon.tech | PostgreSQL database |
| **Clerk** | dashboard.clerk.com | Authentication |
| **GitHub** | github.com | Source code |
| **Google AI Studio** | aistudio.google.com | Gemini API key (optional) |

---

## Step 1: Push Code to GitHub

```bash
cd C:\INTERNSHIP_TASK\TASK24_Pratyasha

git init
git add .
git commit -m "Shoreline - Full Stack App"
git remote add origin https://github.com/YOUR_USERNAME/shoreline.git
git push -u origin main
```

---

## Step 2: Create NeonDB Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click **Create Project**
3. Choose a region (closest to your users)
4. Copy the **Connection String**:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this — you'll need it for Render

---

## Step 3: Set Up Clerk Authentication

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Go to **API Keys** section
4. Copy both keys:
   - **Publishable Key** (`pk_test_...`)
   - **Secret Key** (`sk_test_...`)
5. Save both — you'll need them for Render AND Vercel

---

## Step 4: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and auto-configure a Python web service
5. Go to the **Environment** tab and set these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your NeonDB connection string |
| `CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | Your Clerk secret key |
| `FRONTEND_URL` | `https://your-app.vercel.app` (set after Vercel deploy) |
| `GEMINI_API_KEY` | Your Gemini API key (optional) |

6. Click **Create Web Service**

### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `shoreline-backend` |
| **Runtime** | Python |
| **Build Command** | `pip install -r HH-backend/requirements.txt` |
| **Start Command** | `cd HH-backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

5. Add a **Persistent Disk**:
   - Name: `uploads`
   - Mount Path: `/opt/render/project/src/HH-backend/uploads`
   - Size: 1 GB

6. Add Environment Variables (same as Option A)

7. Click **Create Web Service**

### Backend Environment Variables (Render Dashboard)

```
DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
FRONTEND_URL=https://your-app.vercel.app
ENVIRONMENT=production
GEMINI_API_KEY=your_key_here
PYTHON_VERSION=3.13
PORT=8000
```

> **Note:** Set `FRONTEND_URL` to your Vercel URL *after* you deploy the frontend in Step 5.

---

## Step 5: Deploy Frontend to Vercel

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect the framework (Vite)

### Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `HH-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Set Environment Variables

In Vercel Dashboard → your project → **Settings** → **Environment Variables**, add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://your-app.onrender.com` | Production |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_xxxx` | Production |

> **Important:** `VITE_API_URL` must be your Render backend URL. The `VITE_` prefix is required for Vite to expose it to the browser.

### Deploy

1. Click **Deploy**
2. Wait for the build (usually 1-2 minutes)
3. Your frontend is live at `https://your-app.vercel.app`

### Configure Custom Domain (Optional)

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update `FRONTEND_URL` in Render to match

---

## Step 6: Finalize CORS on Backend

After both deployments are live:

1. Go to Render Dashboard → your backend service → **Environment**
2. Set `FRONTEND_URL` to your exact Vercel URL (e.g., `https://shoreline.vercel.app`)
3. The backend will allow requests from this origin

---

## Step 7: Verify Deployment

### Backend (Render)
1. Visit `https://your-app.onrender.com/api/health`
2. You should see: `{"status": "ok", "database": "connected", ...}`

### Frontend (Vercel)
1. Visit `https://your-app.vercel.app`
2. You should see the landing page
3. Test sign-in at `/login`
4. Test card generation at `/generator`

---

## How It Works

### Frontend (Vercel)
- Built with `npm run build` → outputs to `HH-frontend/dist/`
- Vercel serves static files and handles SPA routing via `vercel.json` rewrites
- All API calls go to `VITE_API_URL` (your Render backend)
- Clerk authentication runs client-side with `VITE_CLERK_PUBLISHABLE_KEY`

### Backend (Render)
- FastAPI running on port 8000 (Render sets `$PORT`)
- API routes: `/api/cards`, `/api/title`, `/api/admin/stats`, `/api/auth/me`
- **No SPA catch-all in production** — frontend is served by Vercel
- Auth: Clerk JWT verification + first-user-is-admin logic
- Storage: Local `uploads/` folder (persistent disk on Render)

### Data Flow
```
Browser → Vercel (static SPA)
  ├── /api/* → Vercel proxy → Render (FastAPI) → NeonDB
  ├── /uploads/* → Render (FastAPI) → Persistent Disk
  └── /* → Vercel serves index.html (client-side routing)
```

---

## First User = Admin

1. User visits `https://your-app.vercel.app/login`
2. Signs up via Clerk (first ever sign-up)
3. Backend creates user in `users` table with `is_admin = true`
4. All subsequent sign-ups get `is_admin = false`
5. Only admin can access `/admin` dashboard

---

## Persistent Disk (Uploads)

- Render's persistent disk keeps `uploads/` alive across deploys
- Mount path: `/opt/render/project/src/HH-backend/uploads`
- 1 GB is enough for thousands of card images
- If using Cloudflare R2, uploads go to R2 instead (configured via env vars)

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `FRONTEND_URL` | Yes | Vercel frontend URL (for CORS) |
| `ENVIRONMENT` | Yes | `production` |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI titles |
| `PYTHON_VERSION` | Yes | `3.13` |
| `PORT` | Yes | `8000` (Render sets this) |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Render backend URL (e.g., `https://your-app.onrender.com`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **CORS errors** | Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly (including `https://`) |
| **API calls fail from frontend** | Check `VITE_API_URL` in Vercel env vars points to your Render backend |
| **Backend build fails** | Check Render build logs; ensure Python 3.13 and correct paths |
| **DB connection failed** | Check `DATABASE_URL` in Render env vars; ensure NeonDB allows connections |
| **403 on admin** | First user is admin; sign out and sign in as the first user who signed up |
| **Uploads lost** | Check persistent disk is mounted at correct path in Render |
| **Vercel 404 on refresh** | Ensure `vercel.json` rewrites are configured (included in repo) |
| **Frontend shows "API running" message** | `VITE_API_URL` is not set or pointing to wrong URL |

---

## File Structure

```
shoreline/                          # Monorepo root
├── DEPLOY.md                       # This file
├── SETUP.md                        # Local development setup
├── render.yaml                     # Render deployment config (backend)
├── vercel.json                     # Vercel deployment config (frontend)
├── build.sh                        # Legacy build script (single-service)
├── Dockerfile                      # Alternative: Docker deployment
│
├── HH-frontend/                    # React + Vite (deployed to Vercel)
│   ├── src/
│   │   ├── main.tsx                # Entry (ClerkProvider + BrowserRouter)
│   │   ├── App.tsx                 # Routes: /, /login, /generator, etc.
│   │   ├── api.ts                  # API fetch helper (uses VITE_API_URL)
│   │   ├── pages/                  # LoginPage, SharePage
│   │   └── components/             # Navigation, ProtectedRoute, AdminRoute
│   ├── package.json
│   ├── vite.config.ts              # Dev proxy to :8000
│   ├── vercel.json                 # Vercel rewrites for SPA
│   └── .env.example                # Frontend env template
│
├── HH-backend/                     # FastAPI (deployed to Render)
│   ├── main.py                     # App entry, CORS, API routers
│   ├── config.py                   # Pydantic Settings (.env loader)
│   ├── requirements.txt            # Python deps
│   ├── .env.example                # Backend env template
│   ├── routers/                    # cards, title, admin, auth
│   ├── middleware/                  # Clerk JWT verification
│   ├── models/                     # Pydantic schemas
│   ├── db/                         # NeonDB queries, migration, seed
│   └── services/                   # Storage, AI title
│
└── .gitignore
```
