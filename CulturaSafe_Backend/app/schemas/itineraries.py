"""Itinerary schemas."""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class CreateItineraryRequest(BaseModel):
    destination: str = Field(..., min_length=1)
    travelDate: str = Field(..., min_length=4)
    startTime: str = Field(default="09:00")
    endTime: str = Field(default="18:00")
    interests: List[str] = Field(default_factory=list)
    itineraryData: Dict[str, Any] = Field(default_factory=dict)
    status: Literal["planned", "in_progress", "completed", "cancelled"] = Field(default="planned")


class UpdateItineraryRequest(BaseModel):
    destination: Optional[str] = None
    travelDate: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    interests: Optional[List[str]] = None
    itineraryData: Optional[Dict[str, Any]] = None
    status: Optional[Literal["planned", "in_progress", "completed", "cancelled"]] = None
