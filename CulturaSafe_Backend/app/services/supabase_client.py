"""Supabase client factories and RLS-scoped context helpers."""

from typing import Optional
from supabase import create_client, Client, ClientOptions
from app.core.config import settings
from app.core.logging import logger


_supabase_public: Optional[Client] = None
_supabase_admin: Optional[Client] = None


def get_supabase_public() -> Client:
    """Returns the public / anonymous Supabase client instance."""
    global _supabase_public
    if _supabase_public is None:
        url = settings.SUPABASE_URL or "https://placeholder.supabase.co"
        anon_key = settings.SUPABASE_ANON_KEY or "placeholder-anon-key"
        opts = ClientOptions(
            auto_refresh_token=False,
            persist_session=False
        )
        _supabase_public = create_client(url, anon_key, options=opts)
    return _supabase_public


def get_supabase_admin() -> Client:
    """Returns administrative service-role client instance for backend checks."""
    global _supabase_admin
    if _supabase_admin is None:
        url = settings.SUPABASE_URL or "https://placeholder.supabase.co"
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or "placeholder-key"
        opts = ClientOptions(
            auto_refresh_token=False,
            persist_session=False
        )
        _supabase_admin = create_client(url, key, options=opts)
    return _supabase_admin


def get_user_client(token: str) -> Client:
    """
    Creates a scoped Supabase client with the caller's JWT access token.
    This guarantees that PostgreSQL Row Level Security (RLS) policies are
    evaluated using the caller's identity (auth.uid()).
    """
    url = settings.SUPABASE_URL or "https://placeholder.supabase.co"
    anon_key = settings.SUPABASE_ANON_KEY or "placeholder-anon-key"
    opts = ClientOptions(
        headers={"Authorization": f"Bearer {token}"},
        auto_refresh_token=False,
        persist_session=False
    )
    return create_client(url, anon_key, options=opts)
