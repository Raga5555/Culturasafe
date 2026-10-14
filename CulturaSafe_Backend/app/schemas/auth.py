"""Authentication request and response schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    displayName: Optional[str] = Field(default=None, min_length=2)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class SessionData(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: Optional[int] = None


class UserData(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    displayName: Optional[str] = None


class AuthData(BaseModel):
    user: UserData
    session: Optional[SessionData] = None
