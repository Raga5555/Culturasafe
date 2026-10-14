"""API routers export and registration."""

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.user import router as user_router
from app.api.destinations import router as destinations_router
from app.api.itineraries import router as itineraries_router
from app.api.location import router as location_router
from app.api.belongings import router as belongings_router
from app.api.sync import router as sync_router

__all__ = [
    "health_router",
    "auth_router",
    "user_router",
    "destinations_router",
    "itineraries_router",
    "location_router",
    "belongings_router",
    "sync_router"
]
