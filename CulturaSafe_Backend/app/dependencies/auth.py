"""Authentication dependency for protecting FastAPI endpoints."""

from typing import Optional
from fastapi import Request
from app.core.security import AuthenticatedUser, AppException
from app.services.supabase_client import get_supabase_public
from app.core.logging import logger


async def get_current_user(request: Request) -> AuthenticatedUser:
    """
    Extracts and validates the Supabase Bearer token from the Authorization header.
    Returns the AuthenticatedUser identity with user ID and token context.
    """
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise AppException(
            status_code=401,
            code="UNAUTHORIZED",
            message="Missing or invalid Authorization header. Provide a valid Bearer token."
        )

    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or not parts[1].strip():
        raise AppException(
            status_code=401,
            code="UNAUTHORIZED",
            message="Bearer token format invalid."
        )

    token = parts[1].strip()

    try:
        supabase = get_supabase_public()
        user_response = supabase.auth.get_user(jwt=token)

        if not user_response or not getattr(user_response, "user", None):
            raise AppException(
                status_code=401,
                code="TOKEN_INVALID",
                message="Authentication session has expired or is invalid."
            )

        user = user_response.user
        return AuthenticatedUser(
            id=str(user.id),
            email=getattr(user, "email", "") or "",
            role=getattr(user, "role", None),
            token=token
        )
    except AppException:
        raise
    except Exception as exc:
        err_msg = str(exc)
        logger.warning(f"Supabase auth validation failed: {err_msg}")
        raise AppException(
            status_code=401,
            code="TOKEN_INVALID",
            message="Authentication session has expired or is invalid."
        )
