"""Consent-based GPS location history and tracking endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from app.schemas.location import RecordLocationRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/location", tags=["Location"])


@router.post("/points", status_code=status.HTTP_201_CREATED)
async def record_location_point(payload: RecordLocationRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Ingest a single opt-in location coordinate with strict 10s rate throttling."""
    client = get_user_client(current_user.token)

    try:
        # Check timestamp of most recent point for throttling
        recent_res = client.table("location_history").select("recorded_at").eq("user_id", current_user.id).order("recorded_at", desc=True).limit(1).execute()
        if recent_res.data and len(recent_res.data) > 0:
            last_recorded_str = recent_res.data[0]["recorded_at"]
            last_recorded = datetime.fromisoformat(last_recorded_str.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if (now - last_recorded).total_seconds() < 10:
                raise AppException(
                    status_code=429,
                    code="RATE_THROTTLED",
                    message="Location point submitted too frequently. Minimum 10 seconds required between writes."
                )

        record = {
            "user_id": current_user.id,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "accuracy_meters": payload.accuracyMeters,
            "speed": payload.speed,
            "heading": payload.heading,
            "consent_verified": payload.consentGiven
        }

        res = client.table("location_history").insert(record).execute()
        saved = res.data[0] if res.data and len(res.data) > 0 else record
        return {
            "success": True,
            "message": "Location point securely recorded.",
            "data": saved
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(status_code=400, code="SAVE_FAILED", message=str(exc))


@router.get("/history")
async def get_location_history(
    limit: int = Query(default=50, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve chronologically ordered opt-in location history points."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("location_history").select("*").eq("user_id", current_user.id).order("recorded_at", desc=True).limit(limit).execute()
        return {
            "success": True,
            "data": res.data or []
        }
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))


@router.delete("/history")
async def clear_location_history(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Erase all logged location data in accordance with user privacy rights."""
    client = get_user_client(current_user.token)
    try:
        client.table("location_history").delete().eq("user_id", current_user.id).execute()
        return {
            "success": True,
            "message": "All private location history deleted."
        }
    except Exception as exc:
        raise AppException(status_code=400, code="DELETE_FAILED", message=str(exc))
