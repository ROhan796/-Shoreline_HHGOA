# Shoreline — Frame & Builder ID Card Generator
## Master System Design Document v1.0

---

## Table of Contents

1. [Product Vision & Out-of-the-Box Angle](#1-product-vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack Decision Matrix](#3-tech-stack-decision-matrix)
4. [Data Flow & Request Lifecycle](#4-data-flow--request-lifecycle)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Image Processing Pipeline](#7-image-processing-pipeline)
8. [Database Schema (NeonDB / PostgreSQL)](#8-database-schema)
9. [Authentication Strategy](#9-authentication-strategy-clerk)
10. [Admin Dashboard Architecture](#10-admin-dashboard-architecture)
11. [Share to X Flow](#11-share-to-x-flow)
12. [Animation & UX Flow](#12-animation--ux-flow)
13. [Mobile-First Strategy](#13-mobile-first-strategy)
14. [Deployment & Infrastructure](#14-deployment--infrastructure)
15. [Edge Cases & Error Handling](#15-edge-cases--error-handling)
16. [Performance Benchmarks & Targets](#16-performance-benchmarks--targets)

---

## 1. Product Vision

### The Unique Angle: "Instant Proof You Were There"

Most badge generators are **form-first**: fill name → fill role → upload photo → generate. That's 4 steps with friction.

**Shoreline flips this**: the moment your photo lands, a live preview renders in real time. Name and role fields update the card **live, letter by letter**, no submit button. The entire experience is a single, continuous gesture — drag, type, download. Three moves. Done.

**Second differentiator — the AI Builder Title generator**: instead of letting users type a boring title like "Full Stack Dev", a single-click Claude API call reads their stack input and generates a punchy, event-appropriate builder title like `"The Edge-Case Slayer"` or `"Distributed Chaos Poet"`. This becomes the social hook — people share because the title is the joke, and the card is the context.

**Third differentiator — the OG Image trick**: every generated card gets a unique slug stored on the server with its generated PNG. The Share to X link resolves to a route on your FastAPI backend that returns a dynamic OG image (the actual card PNG), meaning Twitter unfurls the card as a rich preview image automatically — no "open link to see image" friction.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React + Vite)                               │
│                                                                               │
│  ┌──────────────┐    ┌──────────────────────┐    ┌────────────────────────┐  │
│  │  Landing Page│───▶│  Generator Studio    │───▶│  Result + Share Screen │  │
│  │  (no auth)   │    │  (canvas + live form)│    │  (download + X share)  │  │
│  └──────────────┘    └──────────────────────┘    └────────────────────────┘  │
│                                │                                              │
│                    ┌───────────▼──────────┐                                  │
│                    │   Admin Dashboard    │  (Clerk-gated)                   │
│                    │   (shadcn/ui charts) │                                  │
│                    └──────────────────────┘                                  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  HTTPS / REST + FormData
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                        FASTAPI BACKEND (Python)                              │
│                                                                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  /generate      │  │  /share/{slug}   │  │  /admin/* (Clerk JWT)    │   │
│  │  (Pillow + img) │  │  (OG meta server)│  │  (analytics endpoints)   │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────────────────┘   │
│           │                    │                                              │
│  ┌────────▼────────┐  ┌────────▼─────────┐                                  │
│  │  Image Pipeline │  │  Slug Store      │                                  │
│  │  (Pillow/cv2)   │  │  (NeonDB + R2)   │                                  │
│  └────────┬────────┘  └──────────────────┘                                  │
│           │                                                                   │
│  ┌────────▼────────┐                                                         │
│  │  Claude API     │  (Builder Title generation)                             │
│  │  (optional)     │                                                         │
│  └─────────────────┘                                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                           DATA LAYER                                         │
│                                                                               │
│   NeonDB (PostgreSQL)         Cloudflare R2 (Object Storage)                │
│   - generations table         - generated PNG files                          │
│   - admin_users table         - uploaded originals (optional, TTL)          │
│   - analytics table           - frame asset templates                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack Decision Matrix

| Layer | Choice | Why |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Fast HMR, small bundle, broad ecosystem |
| **Styling** | Tailwind CSS v4 | Utility-first, no runtime CSS cost |
| **UI Components** | shadcn/ui | Headless + accessible, matches dark hackathon aesthetic |
| **Canvas Rendering** | `html2canvas` + `fabric.js` | Fabric for live editable canvas; html2canvas for final PNG export fallback |
| **Animation** | Framer Motion | Spring physics for drag/drop, stagger for result reveal |
| **Authentication** | Clerk | Admin-only gate, zero-friction (no sign-up for end users) |
| **Backend** | FastAPI (Python 3.12) | Async, fast, native Pillow integration for image compositing |
| **Image Processing** | Pillow + OpenCV | Smart face crop/centering, frame compositing |
| **Database** | NeonDB (PostgreSQL) | Serverless Postgres, free tier, no cold starts with connection pooling |
| **File Storage** | Cloudflare R2 | Zero egress fees, S3-compatible API |
| **AI Title Gen** | Anthropic Claude API | `claude-haiku` for instant punchy title generation |
| **OG Image Server** | FastAPI custom route | Dynamic OG images without a separate service |
| **Containerization** | Docker + Docker Compose | Consistent dev/prod parity |
| **Deployment** | Render (backend) + Vercel (frontend) | Free-tier friendly, auto-deploy from GitHub |
| **Charts (Admin)** | Recharts | Lightweight, composable, works with shadcn |

---

## 4. Data Flow & Request Lifecycle

### 4.1 — Happy Path: Format B (Builder ID Card)

```
USER ACTION                    CLIENT                      SERVER                    STORAGE
───────────                    ──────                      ──────                    ───────
                               
1. Drag/tap photo         ──▶  FileReader API             
   (jpg/png/HEIC)              converts to base64          
                               ObjectURL for preview       
                                                           
2. Photo preview renders  ──▶  fabric.js canvas           
   instantly (no server)       clips photo to card         
                               shape using CSS mask        
                                                           
3. User types name        ──▶  fabric.js text object      
   (live update on canvas)     re-renders on each          
                               keystroke                   
                               
4. User types stack/role  ──▶  Debounced (500ms)         POST /api/title           
   (optional AI title)         ──────────────────────────▶ Claude haiku call        
                               ◀────────────────────────── returns "The Chaos Poet"  
                               canvas title text updates   
                                                           
5. User clicks "Generate" ──▶  FormData: {               POST /api/generate        
   (or it auto-generates)       image: File,              ──────────────────────▶  
                                name: string,              Pillow composites:       
                                role: string,              - smart crop face        
                                title: string,             - apply frame PNG        
                                format: "B"                - overlay text           
                               }                           - return PNG bytes       
                                                          ◀────────────────────────  
6. Result reveals         ◀──  Blob URL from             stores PNG ──────────────▶ R2 bucket
   with spring animation       response body             generates slug            NeonDB row
                               displays <img>             returns { slug, url }     
                                                           
7. Download button        ──▶  <a download> with         
                               Blob URL                    
                                                           
8. Share to X             ──▶  window.open(              GET /share/{slug}         
                                twitter intent URL)        serves HTML with         
                                with pre-filled caption    OG meta tags pointing    
                                + link to /share/{slug}    to R2 PNG URL            
                                                           Twitter bot fetches      
                                                           OG tags, renders card    
                                                           as link preview          
```

### 4.2 — Format A (PFP Frame) — Simpler Flow

```
Photo upload ──▶ Client-side canvas compositing (no server needed for preview)
             ──▶ "Download" triggers html2canvas export to PNG Blob
             ──▶ Optionally POST to /api/generate for slug + OG image support
             ──▶ Share to X same as Format B
```

**Key insight**: Format A can be **entirely client-side** for the core loop. Server only needed for the OG share link feature.

---

## 5. Frontend Architecture

### 5.1 — Directory Structure

```
src/
├── pages/
│   ├── Home.tsx              # Landing — hero + format picker
│   ├── Generator.tsx         # Main studio — canvas + form
│   ├── Result.tsx            # Download + share screen
│   └── admin/
│       ├── Dashboard.tsx     # Stats overview
│       ├── Generations.tsx   # Table of all generated cards
│       └── Analytics.tsx     # Charts: uploads/hr, format split, share rate
│
├── components/
│   ├── canvas/
│   │   ├── CardCanvas.tsx    # fabric.js canvas wrapper
│   │   ├── FrameOverlay.tsx  # Format A frame compositing
│   │   └── IDCardLayout.tsx  # Format B card layout engine
│   ├── upload/
│   │   ├── DropZone.tsx      # Drag-drop + tap-to-upload, HEIC support
│   │   └── ImageCropper.tsx  # Optional manual crop (pinch-to-zoom on mobile)
│   ├── form/
│   │   ├── LiveNameInput.tsx # Keystroke-synced to canvas
│   │   ├── StackInput.tsx    # Role/stack field with AI title trigger
│   │   └── TitleBadge.tsx    # Animated AI title reveal component
│   ├── result/
│   │   ├── DownloadButton.tsx
│   │   └── ShareToX.tsx      # Pre-fills tweet + opens Twitter intent
│   └── admin/
│       ├── StatCard.tsx
│       ├── GenerationsTable.tsx
│       └── UsageChart.tsx    # Recharts wrapper
│
├── hooks/
│   ├── useImageUpload.ts     # FileReader + HEIC conversion
│   ├── useCanvasSync.ts      # fabric.js ↔ React state bridge
│   ├── useAITitle.ts         # Debounced Claude title generation
│   └── useGenerate.ts        # POST to /api/generate, manages loading/result state
│
├── lib/
│   ├── heicConverter.ts      # heic2any wrapper for iPhone photos
│   ├── canvasExport.ts       # html2canvas PNG export utility
│   ├── shareUrl.ts           # Twitter intent URL builder
│   └── api.ts                # Typed fetch wrappers for all backend routes
│
├── assets/
│   ├── frames/
│   │   ├── frame-a-pfp.png   # Format A frame (1080×1080, transparent center)
│   │   └── frame-b-card.png  # Format B card background template
│   └── fonts/
│       └── (event typeface)
│
└── styles/
    └── globals.css           # Tailwind base + custom CSS variables
```

### 5.2 — Landing Page Design

```
┌─────────────────────────────────────────────────────────┐
│  SHORELINE                              [Admin →]      │
│                                                          │
│                                                          │
│     ████████████████████████████████████████            │
│     █  "Prove you hacked here."            █            │
│     █   Upload a photo. Get your card.     █            │
│     █   Share the flex. Done.              █            │
│     ████████████████████████████████████████            │
│                                                          │
│          [  🖼  PFP Frame  ]  [  🪪  Builder Card  ]   │
│                                                          │
│     → No sign-up. No waiting. One photo in,             │
│       one shareable graphic out.                         │
│                                                          │
│     ────────── Live examples rotating ──────────        │
│     [card 1]  [card 2]  [card 3]  (auto-scroll)         │
└─────────────────────────────────────────────────────────┘
```

**Animation plan for landing**:
- Hero text: staggered word-by-word fade-up on mount (Framer Motion `staggerChildren`)
- Format picker: cards lift on hover with subtle 3D tilt (`rotateX`, `rotateY` on `mousemove`)
- Example cards: auto-scrolling horizontal marquee (CSS `animation: marquee linear infinite`)

### 5.3 — Generator Studio Design

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                              SHORELINE        │
├────────────────────────┬────────────────────────────────┤
│                        │                                │
│   LIVE CARD PREVIEW    │   1. Drop your photo           │
│                        │   ┌──────────────────────────┐ │
│   ┌──────────────────┐ │   │  📁 Drag here or tap     │ │
│   │                  │ │   └──────────────────────────┘ │
│   │   [photo here]   │ │                                │
│   │                  │ │   2. Your name                 │
│   │  ──────────────  │ │   ┌──────────────────────────┐ │
│   │   NAME HERE      │ │   │  Rohan Manna              │ │
│   │   Stack / Role   │ │   └──────────────────────────┘ │
│   │  "Builder Title" │ │                                │
│   │  #Shoreline      │ │   3. Stack / Role              │
│   └──────────────────┘ │   ┌──────────────────────────┐ │
│                        │   │  Next.js + FastAPI + ML   │ │
│  Updates live as       │   └──────────────────────────┘ │
│  you type →            │   ✨ [Generate AI Title]       │
│                        │                                │
│                        │   ────────────────────────    │
│                        │   [ Generate My Card ▶ ]       │
└────────────────────────┴────────────────────────────────┘
```

**Mobile layout**: preview stacks above form. Preview collapses to a smaller thumbnail. Form is full-width.

---

## 6. Backend Architecture

### 6.1 — FastAPI Route Map

```
POST   /api/generate              → Image compositing pipeline, returns PNG + slug
POST   /api/title                 → Claude API title generation
GET    /api/share/{slug}          → OG meta HTML page for Twitter unfurl
GET    /api/image/{slug}          → Direct PNG file from R2 (for download link)

# Admin routes (all require Clerk JWT verification)
GET    /api/admin/stats           → Total generations, format split, share rate
GET    /api/admin/generations     → Paginated list with thumbnails
GET    /api/admin/analytics       → Time-series: generations per hour/day
DELETE /api/admin/generations/{id}→ Remove a generation
```

### 6.2 — FastAPI Project Structure

```
backend/
├── main.py                    # FastAPI app init, CORS, middleware
├── routers/
│   ├── generate.py            # /api/generate endpoint
│   ├── title.py               # /api/title endpoint  
│   ├── share.py               # /api/share/{slug} OG page
│   └── admin.py               # /api/admin/* endpoints
├── services/
│   ├── image_compositor.py    # Pillow-based card compositing logic
│   ├── face_detector.py       # OpenCV face detection for smart crop
│   ├── storage.py             # Cloudflare R2 upload/fetch
│   ├── claude_client.py       # Anthropic API wrapper for title gen
│   └── slug_service.py        # nanoid slug generation + DB write
├── models/
│   ├── generation.py          # Pydantic request/response models
│   └── admin.py               # Admin stats response models
├── db/
│   ├── connection.py          # NeonDB async connection pool
│   ├── queries.py             # Raw SQL queries (no ORM overhead)
│   └── migrations/
│       └── 001_initial.sql    # Schema creation
├── middleware/
│   └── clerk_auth.py          # JWT verification middleware for /admin
├── assets/
│   ├── frame_a.png            # PFP frame template
│   ├── frame_b_bg.png         # ID card background template
│   └── fonts/
│       └── event_font.ttf
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### 6.3 — /api/generate Endpoint Logic

```python
# routers/generate.py

@router.post("/generate")
async def generate_card(
    image: UploadFile = File(...),
    name: str = Form(""),
    role: str = Form(""),
    title: str = Form(""),
    format: str = Form("B"),       # "A" or "B"
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    # 1. Validate file type (jpg, png, heic via pillow-heif)
    # 2. Load image via Pillow
    # 3. Run face detection → get crop rect
    # 4. Composite onto frame template
    # 5. Overlay text (name, role, title)
    # 6. Export to PNG bytes (BytesIO)
    # 7. Generate nanoid slug
    # 8. Upload PNG to R2 (background task for speed)
    # 9. Write generation record to NeonDB (background task)
    # 10. Return PNG bytes directly + slug header
    
    return StreamingResponse(
        png_bytes,
        media_type="image/png",
        headers={"X-Generation-Slug": slug}
    )
```

**Performance trick**: Steps 8 and 9 run as `background_tasks` — the PNG bytes stream back to the client immediately while R2 upload and DB write happen asynchronously. This is why the user gets their image in ~1-2 seconds.

---

## 7. Image Processing Pipeline

### 7.1 — Smart Photo Handling

The biggest UX risk: users upload landscape photos, off-center selfies, group shots. The card needs to look good with all of them.

```
UPLOAD
  │
  ▼
┌─────────────────────────────────────────────────┐
│ 1. FORMAT NORMALIZATION                         │
│    HEIC → JPEG via pillow-heif                  │
│    EXIF rotation correction (auto-rotate)        │
│    Color space: ensure RGB (not CMYK)           │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 2. FACE DETECTION (OpenCV Haar Cascade)         │
│    - If face detected: center crop around face  │
│      with 40% padding above head                │
│    - If no face detected: center crop           │
│      (safe default for logos/illustrations)     │
│    - Multiple faces: use largest/most centered  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 3. SMART CROP TO TARGET DIMENSIONS              │
│    Format A: 1080×1080 (square for PFP)         │
│    Format B: photo zone = 400×400px on card     │
│    - Resize (maintain aspect, fill mode)         │
│    - Center-crop to exact target                │
│    - Apply circular mask (Format A)             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 4. FRAME COMPOSITING (Pillow RGBA paste)        │
│    Format A: paste frame PNG over user photo    │
│              frame has transparent center       │
│    Format B: paste user photo into card zone    │
│              card template is base layer        │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 5. TEXT OVERLAY (Pillow ImageDraw + TTFont)     │
│    Format B only:                               │
│    - Name: event typeface, 48px, white          │
│    - Role: 28px, accent color                   │
│    - Builder Title: italic, 24px, muted         │
│    - #Shoreline #Shoreline: 20px, footer zone │
│    Auto-fit: reduce font size if name too long  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ 6. EXPORT                                       │
│    PNG at 90% quality (good balance)            │
│    Target: < 500KB for fast download/share      │
│    Return as BytesIO stream                     │
└─────────────────────────────────────────────────┘
```

---

## 8. Database Schema

```sql
-- migrations/001_initial.sql

-- Core generations table
CREATE TABLE generations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(12) UNIQUE NOT NULL,        -- nanoid, used in share URLs
    format      CHAR(1) NOT NULL CHECK (format IN ('A', 'B')),
    name        VARCHAR(100),
    role        VARCHAR(100),
    ai_title    VARCHAR(150),
    r2_key      VARCHAR(255) NOT NULL,              -- R2 object key for PNG
    r2_url      TEXT NOT NULL,                      -- Public CDN URL
    share_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    ip_hash     VARCHAR(64),                        -- SHA256 of IP, for abuse detection
    user_agent  TEXT
);

-- Indexes for admin queries
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_format ON generations(format);
CREATE INDEX idx_generations_slug ON generations(slug);

-- Share events (separate table to avoid write contention)
CREATE TABLE share_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id   UUID REFERENCES generations(id) ON DELETE CASCADE,
    platform        VARCHAR(20) DEFAULT 'twitter',  -- extensible
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Download events
CREATE TABLE download_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id   UUID REFERENCES generations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users (Clerk user IDs)
CREATE TABLE admin_users (
    clerk_user_id   VARCHAR(100) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    added_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized view for admin dashboard (refresh every 5 min via pg_cron or on-demand)
CREATE MATERIALIZED VIEW hourly_stats AS
SELECT
    date_trunc('hour', created_at) AS hour,
    COUNT(*) AS total_generations,
    COUNT(*) FILTER (WHERE format = 'A') AS pfp_count,
    COUNT(*) FILTER (WHERE format = 'B') AS card_count,
    SUM(share_count) AS total_shares,
    SUM(download_count) AS total_downloads
FROM generations
GROUP BY 1
ORDER BY 1 DESC;
```

---

## 9. Authentication Strategy (Clerk)

### Design Principle: **Zero auth for end users. Clerk only for admin.**

```
END USER JOURNEY:
  Landing → Generator → Result
  ← No login wall anywhere in this path →

ADMIN JOURNEY:
  /admin → Clerk Sign-In (magic link or Google OAuth)
         → Verified Clerk JWT
         → FastAPI middleware validates JWT against Clerk JWKS
         → Admin dashboard unlocked
```

### Clerk Integration Points

**Frontend**:
```tsx
// main.tsx
import { ClerkProvider } from '@clerk/clerk-react'

// Only wrap /admin routes with <SignedIn> guard
// Public routes use zero Clerk components
```

**Backend JWT Verification**:
```python
# middleware/clerk_auth.py

import httpx
from jose import jwt

CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"

async def verify_clerk_token(authorization: str) -> dict:
    token = authorization.replace("Bearer ", "")
    # Fetch JWKS from Clerk (cached)
    # Decode and verify JWT
    # Return user claims
    # Raise 401 if invalid
```

**Admin user whitelist**: Admin users are seeded in `admin_users` table. Clerk verifies they're logged in; DB check verifies they're allowed.

---

## 10. Admin Dashboard Architecture

### 10.1 — Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  SHORELINE — Admin                    [Clerk UserButton]      │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  📊 Overview     │   STAT CARDS (row)                          │
│  🪪 Generations  │   ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  📈 Analytics    │   │ 847      │ │ 62%      │ │ 39%      │  │
│  ⚙️  Settings    │   │ Total    │ │ Format B │ │ Share    │  │
│                  │   │ Cards    │ │ Cards    │ │ Rate     │  │
│                  │   └──────────┘ └──────────┘ └──────────┘  │
│                  │                                              │
│                  │   GENERATIONS OVER TIME (Recharts line)      │
│                  │   ┌────────────────────────────────────────┐ │
│                  │   │         📈 (sparkline chart)           │ │
│                  │   └────────────────────────────────────────┘ │
│                  │                                              │
│                  │   RECENT GENERATIONS (table)                │
│                  │   ┌──────┬──────┬──────┬──────┬──────────┐ │
│                  │   │ Thumb│ Name │ Fmt  │ Time │ Actions  │ │
│                  │   ├──────┼──────┼──────┼──────┼──────────┤ │
│                  │   │ 🖼   │ Ro.. │  B   │ 2m   │ [Delete] │ │
│                  │   └──────┴──────┴──────┴──────┴──────────┘ │
└──────────────────┴──────────────────────────────────────────────┘
```

### 10.2 — Analytics Endpoints Response Shape

```typescript
// GET /api/admin/stats
interface AdminStats {
  total_generations: number;
  format_a_count: number;
  format_b_count: number;
  total_shares: number;
  total_downloads: number;
  share_rate: number;           // shares / generations
  generations_today: number;
  avg_per_hour: number;
}

// GET /api/admin/analytics?period=24h|7d|30d
interface HourlyDataPoint {
  hour: string;                 // ISO timestamp
  total_generations: number;
  pfp_count: number;
  card_count: number;
  total_shares: number;
}
```

---

## 11. Share to X Flow

### The OG Image Trick — Full Breakdown

```
USER CLICKS "Share to X"
         │
         ▼
Client builds Twitter intent URL:
https://twitter.com/intent/tweet
  ?text=I'm+going+to+HH+Goa+2026!+%23FrameInGoa+%23HHGoa2026
  &url=https://hhgoa2026.yourdomain.com/share/abc123
         │
         ▼
Opens twitter.com in new tab/Twitter app
         │
         ▼
Twitter's bot fetches /share/abc123 to generate link preview
         │
         ▼
FastAPI /share/{slug} returns HTML:
┌──────────────────────────────────────────────────────┐
│ <html>                                               │
│   <head>                                             │
│     <!-- Twitter Card tags -->                       │
│     <meta name="twitter:card" content="summary_large_image">
│     <meta name="twitter:title" content="My Shoreline Builder Card">
│     <meta name="twitter:image" content="https://r2.yourdomain.com/abc123.png">
│     <!-- OG tags for other platforms -->             │
│     <meta property="og:image" content="...same..."> │
│     <!-- Redirect for real users -->                 │
│     <meta http-equiv="refresh" content="0; url=/">  │
│   </head>                                             │
│   <body>Loading...</body>                            │
│ </html>                                              │
└──────────────────────────────────────────────────────┘
         │
         ▼
Twitter renders the R2 PNG as a large card image
User's generated card appears as the tweet preview image
         │
         ▼
Real human who clicks the link gets JS redirect to homepage
(or a nice landing page showing the shared card + CTA to make their own)
```

**Why this works**: Twitter's crawler fetches the `/share/{slug}` URL looking for OG tags. Your FastAPI serves a minimal HTML page whose `og:image` points directly to the R2-hosted PNG. Twitter renders that as the tweet's rich preview. The actual card image shows up in the tweet without the user needing to manually attach it.

---

## 12. Animation & UX Flow

### 12.1 — Upload → Preview Transition

```
State: IDLE
  ↓ (user drops/selects photo)
State: LOADING_PREVIEW (200ms)
  - Skeleton card pulses
  - FileReader decodes image
  - HEIC converted if needed
  ↓
State: PREVIEW_READY
  - Card animates in: scale(0.9) → scale(1), opacity 0 → 1
  - Duration: 300ms, ease-out spring
  - Photo appears with subtle fade
  - Form fields slide in from right (stagger 50ms each)
```

### 12.2 — AI Title Generation Animation

```
User types in stack field (debounce 500ms after last keystroke)
  ↓
[Generate AI Title] button pulses with a loading shimmer
  ↓
API returns title (typically < 1 second with claude-haiku-3-5)
  ↓
Title text types itself in: character by character (typewriter effect)
Canvas updates to show the new title
  ↓
Small "✨ AI-generated" badge fades in below the field
```

### 12.3 — Generate → Result Transition

```
User clicks "Generate My Card"
  ↓
Button text: "Generating..." + spinner
Canvas blurs slightly (filter: blur(2px))
  ↓
Server responds (~1-2 seconds) with PNG
  ↓
Full page transition:
  - Generator form slides out LEFT (translateX: 0 → -100%)
  - Result screen slides in RIGHT (translateX: 100% → 0)
  - Duration: 400ms, ease-in-out
  ↓
Result screen:
  - Card image drops in from above (translateY: -20px → 0, spring)
  - Download button scales in (delay: 200ms)
  - Share button scales in (delay: 350ms)
  - Confetti burst (canvas-confetti, 500ms after card appears)
```

### 12.4 — Framer Motion Config

```tsx
// Shared animation variants
export const cardReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } }
}

export const slideInRight = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
}
```

---

## 13. Mobile-First Strategy

### 13.1 — Layout Decisions

| Breakpoint | Generator Layout | Canvas Size |
|---|---|---|
| < 640px (mobile) | Stacked: preview top, form bottom | 280px wide, full card aspect |
| 640–1024px (tablet) | Side-by-side 50/50 | 380px wide |
| > 1024px (desktop) | Side-by-side 45/55 | 460px wide |

### 13.2 — Mobile-Specific Concerns

**HEIC from iPhone**: `heic2any` npm package converts client-side before upload. No server-side HEIC handling needed, saves bandwidth.

**Touch interactions**:
- Drop zone has a large tap target (full-width, min 120px height)
- "Tap to upload" triggers `<input type="file" accept="image/*" capture="user">` — on iOS, opens camera roll directly
- Pinch-to-zoom on canvas preview (optional, nice to have)

**Performance on mobile**:
- Fabric.js canvas is hardware-accelerated
- Images are resized client-side to max 2000px before upload (reduces payload by 80%+ for 12MP phone photos)
- Service Worker caches frame assets so repeat visitors load instantly

**Share on mobile**:
- If `navigator.share` is available (iOS Safari, Chrome Android): use native share sheet with image blob
- Fallback: open Twitter intent in new tab
- Download: standard `<a download>` with blob URL — works on all mobile browsers

```tsx
const handleShare = async (imageBlob: Blob) => {
  if (navigator.share && navigator.canShare({ files: [imageFile] })) {
    await navigator.share({
      title: "My Shoreline Builder Card",
      text: "I'm going to Shoreline! #Shoreline #Shoreline",
      files: [new File([imageBlob], "hhgoa2026.png", { type: "image/png" })]
    });
  } else {
    // Twitter intent fallback
    window.open(twitterIntentUrl, "_blank");
  }
};
```

---

## 14. Deployment & Infrastructure

### 14.1 — Docker Compose (Dev)

```yaml
# docker-compose.yml

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}           # NeonDB connection string
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}
      - R2_BUCKET_NAME=${R2_BUCKET_NAME}
      - R2_PUBLIC_URL=${R2_PUBLIC_URL}
      - CLERK_JWKS_URL=${CLERK_JWKS_URL}
    volumes:
      - ./backend:/app
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
    command: npm run dev
```

### 14.2 — Production Deployment

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Render.com    │     │  Cloudflare R2  │
│   (Frontend)    │────▶│   (FastAPI)     │────▶│  (PNG Storage)  │
│                 │     │   Docker-based  │     │                 │
│   - CDN global  │     │   - Auto-scale  │     │  - 0 egress fee │
│   - HTTPS auto  │     │   - Free tier   │     │  - S3 compat.   │
│   - Env vars    │     │   - GitHub CD   │     │  - Fast CDN     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                        ┌──────▼──────────┐
                        │   NeonDB        │
                        │   (PostgreSQL)  │
                        │   - Serverless  │
                        │   - Free tier   │
                        │   - Branching   │
                        └─────────────────┘
```

### 14.3 — Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=https://your-app.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Backend (.env)
DATABASE_URL=postgresql://...@neon.tech/hhgoa2026?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET_NAME=hhgoa2026-cards
R2_PUBLIC_URL=https://pub-xxx.r2.dev
CLERK_JWKS_URL=https://your-app.clerk.accounts.dev/.well-known/jwks.json
ALLOWED_ORIGINS=https://hhgoa2026.vercel.app,http://localhost:5173
```

---

## 15. Edge Cases & Error Handling

### 15.1 — Upload Edge Cases

| Case | Handling |
|---|---|
| HEIC file | `heic2any` client-side conversion before upload |
| Portrait photo (tall) | Face detection → crop top 70% where face lives |
| Landscape photo (wide) | Face detection → center crop square around face |
| Group photo | Use largest face, center crop around it |
| No face detected | Center crop, no bias toward top/bottom |
| File > 10MB | Client-side resize to max 2000px before upload |
| Corrupted image | Pillow raises exception → 422 response → toast error |
| Non-image file | MIME type check on both client and server |
| WebP format | Pillow handles natively |

### 15.2 — API Error States

```tsx
// useGenerate.ts
type GenerateState = 
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'processing' }
  | { status: 'success'; imageUrl: string; slug: string }
  | { status: 'error'; message: string; retryable: boolean }

// Error messages (user-facing, not technical):
// 422: "We couldn't read that photo. Try a different format."
// 413: "That photo is too large. Try a smaller one."
// 500: "Something went wrong. Try again in a moment."
// timeout: "This is taking too long. Try a smaller photo."
```

### 15.3 — Rate Limiting

```python
# FastAPI middleware (simple in-memory for hackathon scale)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/generate")
@limiter.limit("10/minute")  # 10 generations per IP per minute
async def generate_card(...):
    ...
```

### 15.4 — Storage Cleanup

Generated PNGs have a 7-day TTL in R2 (set via R2 lifecycle rule). DB records are kept permanently for analytics. This prevents unbounded storage growth without losing data insights.

---

## 16. Performance Benchmarks & Targets

| Metric | Target | How |
|---|---|---|
| Photo upload to preview | < 200ms | Client-side FileReader, no server |
| AI title generation | < 800ms | claude-haiku-3-5, short prompt |
| Generate card (server) | < 2000ms | Pillow async, Render free tier |
| PNG download start | < 3000ms end-to-end | StreamingResponse, background R2 upload |
| Share URL OG resolution | < 500ms | Minimal HTML, direct R2 CDN URL |
| Mobile Lighthouse score | > 85 | Code splitting, lazy fabric.js |
| Frame asset load (cached) | < 50ms | Service Worker cache |

### Optimization Tactics

1. **Lazy load fabric.js**: Only imported when Generator page mounts
2. **Background tasks**: R2 upload and DB write happen after streaming response starts
3. **Image resize on client**: Reduces upload payload by 60–80% for phone photos
4. **NeonDB connection pooling**: `asyncpg` pool with min_size=2, max_size=10
5. **Pillow JIT**: Pre-load frame template PNGs at startup (`@app.on_event("startup")`)
6. **R2 as CDN**: Cloudflare's global network serves PNGs faster than your origin

---

## Quick Start Checklist

### Day 1 — Core Loop
- [ ] Vite + React + Tailwind scaffold
- [ ] Drop zone component with HEIC support
- [ ] fabric.js canvas with frame A overlay (client-side only, no server)
- [ ] html2canvas PNG export + download button
- [ ] Landing page with format picker

### Day 2 — Server + Format B
- [ ] FastAPI project structure + Docker Compose
- [ ] NeonDB schema + connection
- [ ] `/api/generate` with Pillow compositing
- [ ] Format B text overlay (name, role, title)
- [ ] R2 bucket + upload service
- [ ] Slug system + `/api/share/{slug}` OG page

### Day 3 — Polish + Admin + Share
- [ ] Twitter intent share flow + OG meta verification (use Twitter Card Validator)
- [ ] Claude API title generation endpoint + frontend hook
- [ ] Clerk admin setup + admin dashboard (stats + table)
- [ ] Mobile layout testing on real device
- [ ] Error handling + loading states
- [ ] Deploy to Vercel + Render
- [ ] Test full flow end-to-end
- [ ] README with live link

---

*System design by and for builders who ship. Shoreline. #Shoreline*