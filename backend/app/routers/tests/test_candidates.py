"""
Test stubs for the candidates router.

These are minimal stubs per the AGENTS.md coding conventions.
Run with:  pytest app/routers/tests/test_candidates.py -v
"""

import io
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_form(overrides: dict | None = None) -> dict:
    """Return a valid multipart form payload for the registration endpoint."""
    data = {
        "full_name": "Priya Sharma",
        "dob": "1998-05-15",
        "mobile": "9876543210",
        "email": "priya.sharma@example.com",
        "address": "123 MG Road, Mumbai",
        "qualification": "B.Pharm",
        "university": "University of Mumbai",
        "passing_year": "2021",
        "percentage": "78.5",
        "department_applied": "Quality Assurance",
    }
    if overrides:
        data.update(overrides)
    return data


def _pdf_file(name: str = "resume.pdf") -> tuple:
    """Return a minimal valid-looking PDF tuple for multipart upload."""
    fake_pdf = b"%PDF-1.4 fake pdf content for testing"
    return (name, io.BytesIO(fake_pdf), "application/pdf")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_register_candidate_success(tmp_path, monkeypatch):
    """Happy path: complete form + valid PDF → 201 with candidate_code."""
    monkeypatch.setattr(
        "app.routers.candidates.UPLOADS_BASE", str(tmp_path)
    )
    resp = client.post(
        "/candidates/register",
        data=_make_form(),
        files={"resume": _pdf_file()},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "candidate_code" in body
    assert body["candidate_code"].startswith("LUP-TAR-")
    assert body["full_name"] == "Priya Sharma"


def test_register_candidate_invalid_mime(tmp_path, monkeypatch):
    """Uploading an executable must be rejected with 422."""
    monkeypatch.setattr(
        "app.routers.candidates.UPLOADS_BASE", str(tmp_path)
    )
    resp = client.post(
        "/candidates/register",
        data=_make_form(),
        files={"resume": ("malware.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")},
    )
    assert resp.status_code == 422
    assert "application/octet-stream" in resp.text or "only PDF" in resp.text


def test_register_candidate_file_too_large(tmp_path, monkeypatch):
    """A file larger than 5 MB must be rejected with 422."""
    monkeypatch.setattr(
        "app.routers.candidates.UPLOADS_BASE", str(tmp_path)
    )
    big_content = b"%PDF-1.4 " + b"A" * (5 * 1024 * 1024 + 1)
    resp = client.post(
        "/candidates/register",
        data=_make_form(),
        files={"resume": ("big.pdf", io.BytesIO(big_content), "application/pdf")},
    )
    assert resp.status_code == 422
    assert "5 MB" in resp.text or "limit" in resp.text


def test_list_candidates_requires_auth():
    """GET /candidates/ without a JWT must return 401."""
    resp = client.get("/candidates/")
    assert resp.status_code == 401


def test_get_candidate_detail_requires_auth():
    """GET /candidates/{id} without a JWT must return 401."""
    resp = client.get("/candidates/1")
    assert resp.status_code == 401
