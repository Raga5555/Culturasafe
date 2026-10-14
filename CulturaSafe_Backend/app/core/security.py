"""Security models, exceptions, and token utilities."""

from typing import Optional, Any, List
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    id: str
    email: str = ""
    role: Optional[str] = None
    token: str = ""


class AppException(Exception):
    def __init__(
        self,
        status_code: int = 400,
        code: str = "ERROR",
        message: str = "An error occurred",
        details: Optional[List[Any]] = None
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)
