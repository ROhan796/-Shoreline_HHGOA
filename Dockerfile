# ─── Multi-stage Dockerfile for HH Goa 2026 ──────────────────────────────────
# Stage 1: Build React frontend
# Stage 2: Run Python backend + serve frontend
# ──────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Build Frontend ─────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/HH-frontend

COPY HH-frontend/package.json HH-frontend/package-lock.json ./
RUN npm ci

COPY HH-frontend/ ./
RUN npm run build

# ─── Stage 2: Run Backend ───────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Install Python dependencies
COPY HH-backend/requirements.txt ./HH-backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r HH-backend/requirements.txt

# Copy backend code
COPY HH-backend/ ./HH-backend/

# Copy built frontend into the path main.py expects
# main.py looks for ../HH-frontend/dist relative to HH-backend/
COPY --from=frontend-builder /app/HH-frontend/dist/ ./HH-frontend/dist/

# Create uploads directory
RUN mkdir -p HH-backend/uploads

# Set environment
ENV ENVIRONMENT=production
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

WORKDIR /app/HH-backend

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
