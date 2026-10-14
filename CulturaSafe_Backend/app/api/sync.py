"""Offline batch synchronization endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.schemas.sync import SyncOfflinePayload
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_user_client

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])


@router.post("")
async def sync_offline_data(payload: SyncOfflinePayload, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Reconcile offline client actions, queued destinations, and offline alerts."""
    client = get_user_client(current_user.token)
    user_id = current_user.id
    now_iso = datetime.now(timezone.utc).isoformat()

    summary = {
        "destinationsSynced": 0,
        "itinerariesSynced": 0,
        "alertsSynced": 0,
        "errors": []
    }

    # 1. Process Saved Destinations
    if payload.savedDestinations:
        for dest in payload.savedDestinations:
            try:
                client.table("saved_destinations").upsert({
                    "user_id": user_id,
                    "destination_id": dest.destinationId,
                    "destination_name": dest.destinationName,
                    "place_type": dest.placeType or "attraction"
                }, on_conflict="user_id,destination_id").execute()
                summary["destinationsSynced"] += 1
            except Exception as exc:
                summary["errors"].append(f"Destination {dest.destinationId}: {str(exc)}")

    # 2. Process Itineraries
    if payload.itineraries:
        for itin in payload.itineraries:
            try:
                if itin.id and "-" in itin.id and len(itin.id) >= 32:
                    client.table("itineraries").upsert({
                        "id": itin.id,
                        "user_id": user_id,
                        "destination": itin.destination,
                        "travel_date": itin.travelDate,
                        "start_time": itin.startTime,
                        "end_time": itin.endTime,
                        "interests": itin.interests,
                        "itinerary_data": itin.itineraryData,
                        "updated_at": now_iso
                    }).execute()
                else:
                    client.table("itineraries").insert({
                        "user_id": user_id,
                        "destination": itin.destination,
                        "travel_date": itin.travelDate,
                        "start_time": itin.startTime,
                        "end_time": itin.endTime,
                        "interests": itin.interests,
                        "itinerary_data": itin.itineraryData
                    }).execute()
                summary["itinerariesSynced"] += 1
            except Exception as exc:
                summary["errors"].append(f"Itinerary {itin.destination}: {str(exc)}")

    # 3. Process Alert Events
    if payload.alertEvents:
        for alert in payload.alertEvents:
            try:
                client.table("alert_events").insert({
                    "user_id": user_id,
                    "belonging_id": alert.belongingId,
                    "alert_type": alert.alertType,
                    "latitude": alert.latitude,
                    "longitude": alert.longitude,
                    "location_name": alert.locationName,
                    "created_at": alert.createdAt or now_iso
                }).execute()
                summary["alertsSynced"] += 1
            except Exception as exc:
                summary["errors"].append(f"Alert {alert.alertType}: {str(exc)}")

    # 4. Log synchronization session
    try:
        client.table("sync_log").insert({
            "user_id": user_id,
            "client_sync_id": payload.clientSyncId,
            "entities_synced": summary,
            "client_timestamp": payload.clientTimestamp,
            "server_timestamp": now_iso,
            "status": "partial" if len(summary["errors"]) > 0 else "completed"
        }).execute()
    except Exception:
        pass

    return {
        "success": True,
        "message": "Offline synchronization completed.",
        "data": {
            "clientSyncId": payload.clientSyncId,
            "serverTimestamp": now_iso,
            "summary": summary
        }
    }
