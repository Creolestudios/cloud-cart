# ============================================================
# Product Service — FastAPI Main Application
# ============================================================

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import settings
from app.database import engine, Base
from app.routers import products, categories
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager — startup and shutdown events."""
    logger.info("🚀 Starting Product Service...")

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Product Service...")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="CloudCart Product Service",
    description="Product catalog management API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ── CORS ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prometheus Metrics ─────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── Request ID Middleware ──────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response: Response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(round(process_time, 4))

    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=round(process_time, 4),
        request_id=request_id,
    )

    return response


# ── Health Check ───────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "product-service",
        "version": "1.0.0",
    }


# ── Readiness Check ───────────────────────────────────────
@app.get("/ready", tags=["Health"])
async def readiness_check():
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        return Response(
            content=f'{{"status": "not ready", "error": "{str(e)}"}}',
            status_code=503,
            media_type="application/json",
        )


# ── Register Routers ──────────────────────────────────────
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
# Also mount at root for API gateway proxy
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
