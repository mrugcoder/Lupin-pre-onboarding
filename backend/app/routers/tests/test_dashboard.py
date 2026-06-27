"""Test stubs for GET /dashboard/stats — auth gate checks."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dashboard_stats_requires_auth():
    """GET /dashboard/stats should return 401 when no token is provided."""
    res = client.get("/dashboard/stats")
    assert res.status_code == 401
