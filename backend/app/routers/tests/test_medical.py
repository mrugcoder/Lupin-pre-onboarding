"""
Test stubs for the /medical router.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_medical_requires_auth():
    """GET /medical/ should return 401 when no token is provided."""
    res = client.get("/medical/")
    assert res.status_code == 401


def test_get_medical_requires_auth():
    """GET /medical/1 should return 401 when no token is provided."""
    res = client.get("/medical/1")
    assert res.status_code == 401


def test_patch_medical_requires_auth():
    """PATCH /medical/1 should return 401 when no token is provided."""
    res = client.patch("/medical/1", json={"medical_status": "Report received"})
    assert res.status_code == 401
