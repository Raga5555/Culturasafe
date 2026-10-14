"""Travel itinerary planning and management endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from app.schemas.itineraries import CreateItineraryRequest, UpdateItineraryRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])


@router.get("")
async def get_itineraries(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Fetch all itineraries created by the authenticated tourist."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("itineraries").select("*").eq("user_id", current_user.id).order("travel_date", desc=True).execute()
        return {
            "success": True,
            "data": res.data or []
        }
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))


@router.get("/{id}")
async def get_itinerary_by_id(id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve details for a single specific itinerary."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("itineraries").select("*").eq("id", id).eq("user_id", current_user.id).execute()
        if not res.data or len(res.data) == 0:
            raise AppException(status_code=404, code="NOT_FOUND", message="Itinerary not found.")
        return {
            "success": True,
            "data": res.data[0]
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_itinerary(payload: CreateItineraryRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Create a new travel itinerary plan."""
    client = get_user_client(current_user.token)
    insert_record = {
        "user_id": current_user.id,
        "destination": payload.destination,
        "travel_date": payload.travelDate,
        "start_time": payload.startTime,
        "end_time": payload.endTime,
        "interests": payload.interests,
        "itinerary_data": payload.itineraryData,
        "status": payload.status
    }

    try:
        res = client.table("itineraries").insert(insert_record).execute()
        created = res.data[0] if res.data and len(res.data) > 0 else insert_record
        return {
            "success": True,
            "message": "Itinerary created successfully.",
            "data": created
        }
    except Exception as exc:
        raise AppException(status_code=400, code="CREATE_FAILED", message=str(exc))


@router.put("/{id}")
async def update_itinerary(id: str, payload: UpdateItineraryRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Modify details of an existing itinerary plan."""
    client = get_user_client(current_user.token)
    updates = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if payload.destination is not None:
        updates["destination"] = payload.destination
    if payload.travelDate is not None:
        updates["travel_date"] = payload.travelDate
    if payload.startTime is not None:
        updates["start_time"] = payload.startTime
    if payload.endTime is not None:
        updates["end_time"] = payload.endTime
    if payload.interests is not None:
        updates["interests"] = payload.interests
    if payload.itineraryData is not None:
        updates["itinerary_data"] = payload.itineraryData
    if payload.status is not None:
        updates["status"] = payload.status

    try:
        res = client.table("itineraries").update(updates).eq("id", id).eq("user_id", current_user.id).execute()
        if not res.data or len(res.data) == 0:
            raise AppException(status_code=404, code="NOT_FOUND", message="Itinerary not found.")
        return {
            "success": True,
            "message": "Itinerary updated successfully.",
            "data": res.data[0]
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(status_code=400, code="UPDATE_FAILED", message=str(exc))


@router.delete("/{id}")
async def delete_itinerary(id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Delete an itinerary."""
    client = get_user_client(current_user.token)
    try:
        client.table("itineraries").delete().eq("id", id).eq("user_id", current_user.id).execute()
        return {
            "success": True,
            "message": "Itinerary deleted successfully."
        }
    except Exception as exc:
        raise AppException(status_code=400, code="DELETE_FAILED", message=str(exc))
