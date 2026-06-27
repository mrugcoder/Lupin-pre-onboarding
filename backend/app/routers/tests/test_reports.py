"""Test stubs for /reports/export/* — auth gate checks."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_export_excel_requires_auth():
    """GET /reports/export/excel should return 401 when no token is provided."""
    res = client.get("/reports/export/excel")
    assert res.status_code == 401


def test_export_pdf_requires_auth():
    """GET /reports/export/pdf should return 401 when no token is provided."""
    res = client.get("/reports/export/pdf")
    assert res.status_code == 401
