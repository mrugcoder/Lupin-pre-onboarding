"""
Test stubs for the /documents router.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_documents_requires_auth():
    """GET /documents/ should return 401 when no token is provided."""
    res = client.get("/documents/")
    assert res.status_code == 401


def test_get_candidate_documents_requires_auth():
    """GET /documents/1 should return 401 when no token is provided."""
    res = client.get("/documents/1")
    assert res.status_code == 401


def test_patch_document_requires_auth():
    """PATCH /documents/1/resume should return 401 when no token is provided."""
    res = client.patch("/documents/1/resume", json={"status": "Complete"})
    assert res.status_code == 401
