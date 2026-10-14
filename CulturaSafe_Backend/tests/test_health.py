"""Tests for Health and Root API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert "CulturaSafe" in data["service"]
        assert "database" in data
        assert data["database"]["provider"] == "Supabase PostgreSQL"


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api")
        assert res.status_code == 200
        data = res.json()
        assert data["service"] == "CulturaSafe Backend API"


@pytest.mark.asyncio
async def test_nonexistent_endpoint_returns_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/nonexistent")
        assert res.status_code == 404
        data = res.json()
        assert data["success"] is False
        assert data["error"]["code"] == "ROUTE_NOT_FOUND"
