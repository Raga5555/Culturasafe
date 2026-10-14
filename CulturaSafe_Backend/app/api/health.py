"""Health and root discovery endpoints."""

import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.services.supabase_client import get_supabase_admin, get_supabase_public

router = APIRouter(tags=["Health"])

START_TIME = time.time()


@router.get("/health")
async def health_check():
    """System health check endpoint verifying database connectivity."""
    db_status = "healthy"
    db_latency_ms = 0
    start = time.time()

    try:
        # Prefer admin client if service role key available, fallback to public client
        client = get_supabase_admin() or get_supabase_public()
        # Ping table with limit 1
        client.table("profiles").select("id").limit(1).execute()
        db_latency_ms = int((time.time() - start) * 1000)
    except Exception:
        db_latency_ms = int((time.time() - start) * 1000)
        db_status = "degraded"

    return {
        "status": "ok",
        "service": "CulturaSafe Backend REST API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptimeSeconds": int(time.time() - START_TIME),
        "database": {
            "provider": "Supabase PostgreSQL",
            "status": db_status,
            "latencyMs": db_latency_ms
        }
    }


@router.get("")
@router.get("/")
async def root():
    """Root discovery endpoint providing service overview."""
    return {
        "service": "CulturaSafe Backend API",
        "description": "Smart tourism, belongings safety & BLE tracking backend service",
        "docs": "/api/docs",
        "health": "/api/health",
        "version": "1.0.0"
    }
