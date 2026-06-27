"""
Test stubs for the /joining router.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_joining_requires_auth():
    """GET /joining/ should return 401 when no token is provided."""
    res = client.get("/joining/")
    assert res.status_code == 401


def test_get_joining_requires_auth():
    """GET /joining/1 should return 401 when no token is provided."""
    res = client.get("/joining/1")
    assert res.status_code == 401


def test_confirm_joining_requires_auth():
    """POST /joining/1 should return 401 when no token is provided."""
    res = client.post("/joining/1", json={
        "joining_date": "2026-08-01",
        "department": "Quality Assurance",
        "designation": "QA Executive",
        "reporting_manager": "Mr. Rajesh Kulkarni",
    })
    assert res.status_code == 401
