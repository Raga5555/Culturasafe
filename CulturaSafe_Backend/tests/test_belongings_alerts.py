"""Tests for Belongings and Separation alerts validation."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_belonging_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/belongings", json={
            "name": "Test Backpack Tag",
            "itemType": "backpack"
        })
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_record_alert_event_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/belongings/alerts/events", json={
            "alertType": "separation"
        })
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_record_location_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/location/points", json={
            "latitude": 11.933,
            "longitude": 79.83,
            "consentGiven": False
        })
        assert res.status_code == 401
