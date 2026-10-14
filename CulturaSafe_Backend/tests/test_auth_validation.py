"""Tests for Auth validation and protected route middleware."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_validation_failure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "123"
        })
        assert res.status_code == 400
        data = res.json()
        assert data["success"] is False
        assert data["error"]["code"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_protected_route_missing_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/destinations/saved")
        assert res.status_code == 401
        data = res.json()
        assert data["success"] is False
        assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_protected_route_invalid_token_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(
            "/api/v1/itineraries",
            headers={"Authorization": "Bearer invalid-dummy-token-12345"}
        )
        assert res.status_code == 401
        data = res.json()
        assert data["success"] is False
        assert data["error"]["code"] == "TOKEN_INVALID"
