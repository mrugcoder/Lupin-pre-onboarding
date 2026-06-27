"""
Test stubs for the /interviews router.
All tests are minimal stubs that confirm route existence and basic auth gates.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_interviews_requires_auth():
    """GET /interviews/ should return 401 when no token is provided."""
    res = client.get("/interviews/")
    assert res.status_code == 401


def test_get_interview_requires_auth():
    """GET /interviews/1 should return 401 when no token is provided."""
    res = client.get("/interviews/1")
    assert res.status_code == 401


def test_schedule_interview_requires_auth():
    """POST /interviews/1 should return 401 when no token is provided."""
    res = client.post("/interviews/1", json={
        "interview_date": "2026-07-01",
        "panel": "Dr. Sharma, Ms. Desai",
        "department": "R&D",
        "remarks": "First round",
    })
    assert res.status_code == 401
