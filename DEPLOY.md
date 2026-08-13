# Shoreline — Deployment Guide (Render)

## Architecture

```
┌──────────────────────────────────────────┐
│         RENDER WEB SERVICE               │
│       (Single Python Service)            │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │   FastAPI     │  │  React/Vite      │  │
│  │   Backend     │  │  Frontend (dist) │  │
│  │   :8000       │  │  Static files    │  │
│  └──────┬───────┘  └────────┬─────────┘  │
│         │                   │             │
│    /api/* routes       /* SPA routes      │
│         │                   │             │
│         └─────────┬─────────┘             │
│                   │                       │
│              uploads/                     │
│          (persistent disk)                │
└──────────────────┬───────────────────────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
┌────▼────┐  ┌────▼────┐  ┌─────▼─────┐
│ NeonDB  │  │  Clerk  │  │  Gemini   │
│(extern) │  │ (extern)│  │ (extern)  │
└─────────┘  └─────────┘  └───────────┘
```

**One URL serves everything.** The FastAPI backend serves:
- `/api/*` — API endpoints
- `/uploads/*` — Stored card images
- `/*` — React frontend (SPA with client-side routing)

---

## Prerequisites

Before deploying, you need accounts on:

| Service | URL | What for |
|---------|-----|----------|
| **Render** | render.com | Hosting |
| **NeonDB** | neon.tech | PostgreSQL database |
| **Clerk** | dashboard.clerk.com | Authentication |
| **GitHub** | github.com | Source code |

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
cd C:\INTERNSHIP_TASK\TASK24_Pratyasha

git init
git add .
git commit -m "Shoreline - Full Stack App"
git remote add origin https://github.com/YOUR_USERNAME/shoreline.git
git push -u origin main
```

**Important:** Make sure `.gitignore` excludes `.env` files and `node_modules/`.

---

### Step 2: Create NeonDB Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click **Create Project**
3. Choose a region (closest to your users)
4. Copy the **Connection String** (looks like):
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this — you'll need it for Render

---

### Step 3: Set Up Clerk Authentication

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Go to **API Keys** section
4. Copy both keys:
   - **Publishable Key** (`pk_test_...`)
   - **Secret Key** (`sk_test_...`)
5. Save both — you'll need them for Render

---

### Step 4: Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and auto-configure
5. Go to the **Environment** tab and set these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your NeonDB connection string |
| `CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | Your Clerk secret key |
| `FRONTEND_URL` | `https://your-app-name.onrender.com` |

6. Click **Create Web Service**

#### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `shoreline` |
| **Runtime** | Python |
| **Build Command** | `./build.sh` |
| **Start Command** | `cd HH-backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

5. Add a **Persistent Disk**:
   - Name: `uploads`
   - Mount Path: `/opt/render/project/src/HH-backend/uploads`
   - Size: 1 GB

6. Add Environment Variables (same as Option A)

7. Click **Create Web Service**

---

### Step 5: Set Environment Variables

In Render Dashboard → your service → **Environment** tab, add:

```
DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
FRONTEND_URL=https://your-app-name.onrender.com
ENVIRONMENT=production
GEMINI_API_KEY=your_key_here (optional)
```

---

### Step 6: Verify Deployment

1. Wait for the build to complete (usually 3-5 minutes)
2. Visit `https://your-app-name.onrender.com`
3. You should see the landing page
4. Visit `https://your-app-name.onrender.com/api/health` to verify API
5. Test sign-in at `/login`

---

## How It Works

### Frontend (React + Vite)
- Built with `npm run build` → outputs to `HH-frontend/dist/`
- Static files served by FastAPI's `StaticFiles` mount
- Client-side routing via React Router (`/login`, `/generator`, `/admin`, etc.)

### Backend (FastAPI)
- Runs on port 8000 (Render sets `$PORT`)
- API routes: `/api/cards`, `/api/title`, `/api/admin/stats`, `/api/auth/me`
- Serves frontend: `/*` catch-all returns `index.html` for SPA routing
- Auth: Clerk JWT verification + first-user-is-admin logic
- Storage: Local `uploads/` folder (persistent disk on Render)

### Data Flow
```
Browser → Render URL
  ├── /api/* → FastAPI → NeonDB
  ├── /uploads/* → FastAPI → Persistent Disk
  └── /* → FastAPI → React SPA (index.html)
                        └── Client-side routing
```

---

## First User = Admin

The first person to sign up via Clerk becomes the admin:
1. User visits `/login`
2. Signs up via Clerk (first ever sign-up)
3. Backend creates user in `users` table with `is_admin = true`
4. All subsequent sign-ups get `is_admin = false`
5. Only admin can access `/admin` dashboard

---

## Persistent Disk (Uploads)

Since you're using local storage (not R2):
- Render's persistent disk keeps `uploads/` alive across deploys
- Mount path: `/opt/render/project/src/HH-backend/uploads`
- The app creates this directory on startup automatically
- 1 GB is enough for thousands of card images

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check build logs; ensure Node.js 20 and Python 3.13 |
| "Frontend not built" | Build script didn't run; check `build.sh` permissions |
| CORS errors | Set `FRONTEND_URL` to your Render URL |
| DB connection failed | Check `DATABASE_URL` in env vars |
| 403 on admin | First user is admin; sign out and sign in as first user |
| Uploads lost | Check persistent disk is mounted at correct path |

---

## Local Development

```bash
# Terminal 1: Backend
cd HH-backend
pip install -r requirements.txt
python main.py

# Terminal 2: Frontend
cd HH-frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, proxies API to `http://localhost:8000`.

---

## File Structure

```
shoreline/
├── render.yaml              # Render deployment config
├── build.sh                 # Build script (frontend + backend)
├── Dockerfile               # Alternative: Docker deployment
├── HH-frontend/             # React + Vite
│   ├── src/
│   │   ├── main.tsx         # Entry (ClerkProvider + BrowserRouter)
│   │   ├── App.tsx          # Routes: /, /login, /generator, etc.
│   │   ├── api.ts           # Shared apiFetch helper
│   │   ├── pages/           # LoginPage, SharePage
│   │   └── components/      # Navigation, ProtectedRoute, AdminRoute
│   ├── package.json
│   └── vite.config.ts       # Proxy to :8000 in dev
│
├── HH-backend/              # FastAPI
│   ├── main.py              # App entry, CORS, SPA catch-all
│   ├── config.py            # Pydantic Settings (.env loader)
│   ├── requirements.txt     # Python deps
│   ├── .env                 # LOCAL secrets (gitignored)
│   ├── routers/             # cards, title, admin, auth
│   ├── middleware/           # Clerk JWT verification
│   ├── models/              # Pydantic schemas
│   ├── db/                  # NeonDB queries, migration, seed
│   └── services/            # Storage, AI title
│
└── .gitignore
```
