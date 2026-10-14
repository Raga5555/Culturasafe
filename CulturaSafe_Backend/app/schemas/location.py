"""Location tracking schemas."""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RecordLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracyMeters: Optional[float] = Field(default=None, gt=0)
    speed: Optional[float] = Field(default=None, ge=0)
    heading: Optional[float] = Field(default=None, ge=0, le=360.0)
    consentGiven: bool

    @field_validator("consentGiven")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("Explicit user consent is mandatory for storing location history.")
        return v
