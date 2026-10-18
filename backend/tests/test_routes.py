"""Integration tests for EVARIS REST API routes."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "EVARIS"
        assert "Intelligence That Makes Learning Visible" in data["tagline"]


@pytest.mark.asyncio
async def test_list_lessons_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/lessons")
        assert response.status_code == 200
        lessons = response.json()
        assert len(lessons) >= 3
        subjects = [l["subject"] for l in lessons]
        assert "Mathematics" in subjects
        assert "Computer Science" in subjects
