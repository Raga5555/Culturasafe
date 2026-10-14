"""Offline synchronization schemas."""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

AlertType = Literal["separation", "low_battery", "reconnected", "sos"]


class SyncDestinationItem(BaseModel):
    destinationId: str = Field(..., min_length=1)
    destinationName: str = Field(..., min_length=1)
    placeType: Optional[str] = "attraction"


class SyncItineraryItem(BaseModel):
    id: Optional[str] = None
    destination: str = Field(..., min_length=1)
    travelDate: str = Field(..., min_length=4)
    startTime: str = Field(default="09:00")
    endTime: str = Field(default="18:00")
    interests: List[str] = Field(default_factory=list)
    itineraryData: Dict[str, Any] = Field(default_factory=dict)


class SyncAlertItem(BaseModel):
    belongingId: Optional[str] = None
    alertType: AlertType
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locationName: Optional[str] = None
    createdAt: Optional[str] = None


class SyncOfflinePayload(BaseModel):
    clientSyncId: str = Field(..., min_length=1)
    clientTimestamp: str
    savedDestinations: Optional[List[SyncDestinationItem]] = None
    itineraries: Optional[List[SyncItineraryItem]] = None
    alertEvents: Optional[List[SyncAlertItem]] = None
