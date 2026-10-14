"""Belongings and BLE alerts schemas."""

from typing import Optional, Literal
from pydantic import BaseModel, Field

ItemType = Literal["backpack", "wallet", "camera", "luggage", "passport", "keys", "other"]
AlertType = Literal["separation", "low_battery", "reconnected", "sos"]
SeverityType = Literal["info", "warning", "critical"]


class RegisterBelongingRequest(BaseModel):
    name: str = Field(..., min_length=1)
    itemType: ItemType = Field(default="backpack")
    tagMacAddress: Optional[str] = None
    tagUuid: Optional[str] = None
    batteryLevel: Optional[int] = Field(default=100, ge=0, le=100)
    alertOnSeparation: bool = Field(default=True)


class UpdateBelongingRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    itemType: Optional[ItemType] = None
    batteryLevel: Optional[int] = Field(default=None, ge=0, le=100)
    lastSeenAt: Optional[str] = None
    lastSeenLocationName: Optional[str] = None
    lastSeenLat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lastSeenLng: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    isActive: Optional[bool] = None
    alertOnSeparation: Optional[bool] = None


class RecordAlertEventRequest(BaseModel):
    belongingId: Optional[str] = None
    alertType: AlertType
    severity: SeverityType = Field(default="warning")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    locationName: Optional[str] = None
