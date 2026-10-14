"""User profile and preferences schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    displayName: Optional[str] = Field(default=None, min_length=1)
    avatarUrl: Optional[str] = None
    phone: Optional[str] = None
    emergencyContact: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    interests: List[str] = Field(default_factory=list)
    transportMode: Optional[str] = "walking"
    explorationPace: Optional[str] = "moderate"
    alertsEnabled: Optional[bool] = True
