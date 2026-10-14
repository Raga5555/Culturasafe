"""Saved destinations schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class SaveDestinationRequest(BaseModel):
    destinationId: str = Field(..., min_length=1)
    destinationName: str = Field(..., min_length=1)
    placeType: str = Field(default="attraction")
    notes: Optional[str] = None
