"""Authentication routes for registration, login, logout, and profile discovery."""

from fastapi import APIRouter, Request, Depends, status
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import AuthenticatedUser, AppException
from app.dependencies.auth import get_current_user
from app.services.supabase_client import get_supabase_public, get_user_client
from app.utils.rate_limiter import limit_auth_requests

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: Request, payload: RegisterRequest):
    """Register a new user account with Supabase Auth."""
    limit_auth_requests(request)
    supabase = get_supabase_public()

    display_name = payload.displayName or payload.email.split("@")[0]

    try:
        res = supabase.auth.sign_up({
            "email": str(payload.email),
            "password": payload.password,
            "options": {
                "data": {
                    "display_name": display_name
                }
            }
        })

        if not res or not getattr(res, "user", None):
            raise AppException(
                status_code=400,
                code="REGISTRATION_FAILED",
                message="Registration could not be completed."
            )

        user_data = {
            "id": str(res.user.id),
            "email": res.user.email,
            "displayName": display_name
        }

        session_data = None
        if getattr(res, "session", None):
            session_data = {
                "accessToken": res.session.access_token,
                "refreshToken": res.session.refresh_token,
                "expiresAt": getattr(res.session, "expires_at", None)
            }

        return {
            "success": True,
            "message": "User registered successfully.",
            "data": {
                "user": user_data,
                "session": session_data
            }
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(
            status_code=400,
            code="REGISTRATION_FAILED",
            message=str(exc)
        )


@router.post("/login")
async def login(request: Request, payload: LoginRequest):
    """Authenticate existing user credentials and return JWT session."""
    limit_auth_requests(request)
    supabase = get_supabase_public()

    try:
        res = supabase.auth.sign_in_with_password({
            "email": str(payload.email),
            "password": payload.password
        })

        if not res or not getattr(res, "session", None) or not getattr(res, "user", None):
            raise AppException(
                status_code=401,
                code="INVALID_CREDENTIALS",
                message="Invalid email or password."
            )

        metadata = getattr(res.user, "user_metadata", {}) or {}
        display_name = metadata.get("display_name") or (res.user.email.split("@")[0] if res.user.email else "")

        return {
            "success": True,
            "message": "Login successful.",
            "data": {
                "user": {
                    "id": str(res.user.id),
                    "email": res.user.email,
                    "displayName": display_name
                },
                "session": {
                    "accessToken": res.session.access_token,
                    "refreshToken": res.session.refresh_token,
                    "expiresAt": getattr(res.session, "expires_at", None)
                }
            }
        }
    except AppException:
        raise
    except Exception as exc:
        raise AppException(
            status_code=401,
            code="INVALID_CREDENTIALS",
            message=str(exc) or "Invalid email or password."
        )


@router.post("/logout")
async def logout(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Sign out the current active session."""
    try:
        client = get_user_client(current_user.token)
        client.auth.sign_out()
    except Exception:
        pass

    return {
        "success": True,
        "message": "Logged out successfully."
    }


@router.get("/me")
async def get_current_user_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve caller identity and associated profile metadata."""
    client = get_user_client(current_user.token)
    profile = None

    try:
        res = client.table("profiles").select("*").eq("id", current_user.id).execute()
        if res.data and len(res.data) > 0:
            profile = res.data[0]
    except Exception:
        profile = None

    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "profile": profile
        }
    }
