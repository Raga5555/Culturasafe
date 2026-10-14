"""Saved destinations and points of interest endpoints."""

from fastapi import APIRouter, Depends, status
from app.schemas.destinations import SaveDestinationRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/destinations", tags=["Destinations"])


@router.get("/saved")
async def get_saved_destinations(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Fetch saved tourist destinations for the authenticated user."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("saved_destinations").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        return {
            "success": True,
            "data": res.data or []
        }
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))


@router.post("/saved", status_code=status.HTTP_201_CREATED)
async def save_destination(payload: SaveDestinationRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Bookmark or update a saved destination in user's favourites."""
    client = get_user_client(current_user.token)
    record = {
        "user_id": current_user.id,
        "destination_id": payload.destinationId,
        "destination_name": payload.destinationName,
        "place_type": payload.placeType,
        "notes": payload.notes
    }

    try:
        res = client.table("saved_destinations").upsert(
            record,
            on_conflict="user_id,destination_id"
        ).execute()
        saved = res.data[0] if res.data and len(res.data) > 0 else record
        return {
            "success": True,
            "message": "Destination saved to favourites.",
            "data": saved
        }
    except Exception as exc:
        raise AppException(status_code=400, code="SAVE_FAILED", message=str(exc))


@router.delete("/saved/{destination_id}")
async def delete_saved_destination(destination_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Remove a destination from saved favourites."""
    client = get_user_client(current_user.token)
    try:
        client.table("saved_destinations").delete().eq("user_id", current_user.id).eq("destination_id", destination_id).execute()
        return {
            "success": True,
            "message": "Destination removed from favourites."
        }
    except Exception as exc:
        raise AppException(status_code=400, code="DELETE_FAILED", message=str(exc))
