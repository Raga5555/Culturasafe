"""Belongings registration, BLE tracking tag metadata, and separation alert endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from app.schemas.belongings import RegisterBelongingRequest, UpdateBelongingRequest, RecordAlertEventRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/belongings", tags=["Belongings & BLE Tracking"])


@router.get("")
async def get_belongings(current_user: AuthenticatedUser = Depends(get_current_user)):
    """List all registered belongings and paired tag configurations."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("belongings").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        return {
            "success": True,
            "data": res.data or []
        }
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))


@router.post("", status_code=status.HTTP_201_CREATED)
async def register_belonging(payload: RegisterBelongingRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Pair and register a tourist item or BLE beacon tag."""
    client = get_user_client(current_user.token)
    record = {
        "user_id": current_user.id,
        "name": payload.name,
        "item_type": payload.itemType,
        "tag_mac_address": payload.tagMacAddress,
        "tag_uuid": payload.tagUuid,
        "battery_level": payload.batteryLevel if payload.batteryLevel is not None else 100,
        "alert_on_separation": payload.alertOnSeparation if payload.alertOnSeparation is not None else True
    }

    try:
        res = client.table("belongings").insert(record).execute()
        saved = res.data[0] if res.data and len(res.data) > 0 else record
        return {
            "success": True,
            "message": "Belonging tag registered successfully.",
            "data": saved
        }
    except Exception as exc:
        raise AppException(status_code=400, code="REGISTER_FAILED", message=str(exc))


@router.put("/{id}")
async def update_belonging(id: str, payload: UpdateBelongingRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Update belonging metadata, battery level, or last-known coordinates."""
    client = get_user_client(current_user.token)
    updates = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.itemType is not None:
        updates["item_type"] = payload.itemType
    if payload.batteryLevel is not None:
        updates["battery_level"] = payload.batteryLevel
    if payload.lastSeenAt is not None:
        updates["last_seen_at"] = payload.lastSeenAt
    if payload.lastSeenLocationName is not None:
        updates["last_seen_location_name"] = payload.lastSeenLocationName
    if payload.lastSeenLat is not None:
        updates["last_seen_lat"] = payload.lastSeenLat
    if payload.lastSeenLng is not None:
        updates["last_seen_lng"] = payload.lastSeenLng
    if payload.isActive is not None:
        updates["is_active"] = payload.isActive
    if payload.alertOnSeparation is not None:
        updates["alert_on_separation"] = payload.alertOnSeparation

    try:
        res = client.table("belongings").update(updates).eq("id", id).eq("user_id", current_user.id).execute()
        if not res.data or len(res.data) == 0:
            raise AppException(status_code=404, code="NOT_FOUND", message="Belonging not found.")
        return {
            "success": True,
            "message": "Belonging details updated.",
            "data": res.data[0]
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(status_code=400, code="UPDATE_FAILED", message=str(exc))


@router.delete("/{id}")
async def delete_belonging(id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Unregister and remove an item tag."""
    client = get_user_client(current_user.token)
    try:
        client.table("belongings").delete().eq("id", id).eq("user_id", current_user.id).execute()
        return {
            "success": True,
            "message": "Belonging unregistered successfully."
        }
    except Exception as exc:
        raise AppException(status_code=400, code="DELETE_FAILED", message=str(exc))


@router.post("/alerts/events", status_code=status.HTTP_201_CREATED)
async def record_alert_event(payload: RecordAlertEventRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Log a separation, low-battery, or reconnected hardware alert event."""
    client = get_user_client(current_user.token)
    event_record = {
        "user_id": current_user.id,
        "belonging_id": payload.belongingId,
        "alert_type": payload.alertType,
        "severity": payload.severity or "warning",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "location_name": payload.locationName,
        "resolved": payload.alertType == "reconnected"
    }

    try:
        res = client.table("alert_events").insert(event_record).execute()
        saved = res.data[0] if res.data and len(res.data) > 0 else event_record

        # Synchronize belonging last-seen coordinates if provided
        if payload.belongingId and (payload.latitude or payload.locationName):
            client.table("belongings").update({
                "last_seen_at": datetime.now(timezone.utc).isoformat(),
                "last_seen_location_name": payload.locationName,
                "last_seen_lat": payload.latitude,
                "last_seen_lng": payload.longitude
            }).eq("id", payload.belongingId).eq("user_id", current_user.id).execute()

        return {
            "success": True,
            "message": "Belonging alert event recorded.",
            "data": saved
        }
    except Exception as exc:
        raise AppException(status_code=400, code="ALERT_FAILED", message=str(exc))


@router.get("/alerts/events")
async def get_alert_events(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve chronologically ordered separation and hardware alert history."""
    client = get_user_client(current_user.token)
    try:
        res = client.table("alert_events").select("*, belongings(name, item_type)").eq("user_id", current_user.id).order("created_at", desc=True).limit(limit).execute()
        return {
            "success": True,
            "data": res.data or []
        }
    except Exception as exc:
        raise AppException(status_code=400, code="FETCH_FAILED", message=str(exc))
