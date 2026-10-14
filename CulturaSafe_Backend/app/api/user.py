"""User profile and travel preferences management endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.schemas.user import UpdateProfileRequest, UpdatePreferencesRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile")
async def get_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Fetch profile data for the authenticated tourist."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("profiles").select("*").eq("id", current_user.id).execute()
        data = res.data[0] if res.data and len(res.data) > 0 else {"id": current_user.id, "display_name": None}
        return {
            "success": True,
            "data": data
        }
    except Exception as exc:
        raise AppException(status_code=400, code="PROFILE_FETCH_FAILED", message=str(exc))


@router.put("/profile")
async def update_profile(payload: UpdateProfileRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Update or upsert profile details."""
    client = get_user_client(current_user.token)
    now_iso = datetime.now(timezone.utc).isoformat()

    upsert_record = {
        "id": current_user.id,
        "updated_at": now_iso
    }
    if payload.displayName is not None:
        upsert_record["display_name"] = payload.displayName
    if payload.avatarUrl is not None:
        upsert_record["avatar_url"] = str(payload.avatarUrl)
    if payload.phone is not None:
        upsert_record["phone"] = payload.phone
    if payload.emergencyContact is not None:
        upsert_record["emergency_contact"] = payload.emergencyContact

    try:
        res = client.table("profiles").upsert(upsert_record).execute()
        updated = res.data[0] if res.data and len(res.data) > 0 else upsert_record
        return {
            "success": True,
            "message": "Profile updated successfully.",
            "data": updated
        }
    except Exception as exc:
        raise AppException(status_code=400, code="PROFILE_UPDATE_FAILED", message=str(exc))


@router.get("/preferences")
async def get_preferences(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Fetch customized exploration preferences."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("user_preferences").select("*").eq("user_id", current_user.id).execute()
        data = res.data[0] if res.data and len(res.data) > 0 else {
            "user_id": current_user.id,
            "interests": ["heritage", "culture", "beaches"],
            "transport_mode": "walking",
            "exploration_pace": "moderate",
            "alerts_enabled": True
        }
        return {
            "success": True,
            "data": data
        }
    except Exception as exc:
        raise AppException(status_code=400, code="PREFERENCES_FETCH_FAILED", message=str(exc))


@router.put("/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Update or upsert exploration and notification preferences."""
    client = get_user_client(current_user.token)
    now_iso = datetime.now(timezone.utc).isoformat()

    upsert_record = {
        "user_id": current_user.id,
        "interests": payload.interests if payload.interests is not None else [],
        "transport_mode": payload.transportMode or "walking",
        "exploration_pace": payload.explorationPace or "moderate",
        "alerts_enabled": payload.alertsEnabled if payload.alertsEnabled is not None else True,
        "updated_at": now_iso
    }

    try:
        res = client.table("user_preferences").upsert(upsert_record, on_conflict="user_id").execute()
        updated = res.data[0] if res.data and len(res.data) > 0 else upsert_record
        return {
            "success": True,
            "message": "Preferences updated successfully.",
            "data": updated
        }
    except Exception as exc:
        raise AppException(status_code=400, code="PREFERENCES_UPDATE_FAILED", message=str(exc))
