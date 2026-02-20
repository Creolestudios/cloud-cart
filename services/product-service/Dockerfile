# ============================================================
# Product Service — Multi-stage Dockerfile
# ============================================================

# ── Stage 1: Base ──────────────────────────────────────────
FROM python:3.11-slim AS base

LABEL maintainer="CloudCart Team"
LABEL description="Product Service - FastAPI"
LABEL version="1.0.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# ── Stage 2: Development ──────────────────────────────────
FROM base AS development

RUN pip install -r requirements.txt

COPY . .

# Create non-root user
RUN groupadd -r appgroup && \
    useradd -r -g appgroup -s /bin/false appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
    CMD curl -f http://localhost:4002/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4002", "--reload"]

# ── Stage 3: Production ───────────────────────────────────
FROM base AS production

RUN pip install -r requirements.txt

COPY . .

# Remove unnecessary files
RUN rm -rf tests/ .flake8 .mypy.ini

# Create non-root user
RUN groupadd -r appgroup && \
    useradd -r -g appgroup -s /bin/false appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
    CMD curl -f http://localhost:4002/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4002", "--workers", "4"]
