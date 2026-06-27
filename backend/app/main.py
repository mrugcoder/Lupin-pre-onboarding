import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth as auth_router
from app.routers import candidates as candidates_router
from app.routers import interviews as interviews_router
from app.routers import documents as documents_router
from app.routers import medical as medical_router
from app.routers import joining as joining_router
from app.routers import dashboard as dashboard_router
from app.routers import reports as reports_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Pre-Onboarding & Recruitment Automation Portal — HR internal tool",
    version="0.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory on startup (files are never web-root-exposed)
_UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(_UPLOADS_DIR, exist_ok=True)

# Routers
app.include_router(auth_router.router)
app.include_router(candidates_router.router)
app.include_router(interviews_router.router)
app.include_router(documents_router.router)
app.include_router(medical_router.router)
app.include_router(joining_router.router)
app.include_router(dashboard_router.router)
app.include_router(reports_router.router)


@app.get("/health", tags=["meta"])
def health_check():
    """Simple liveness check."""
    return {"status": "ok", "app": settings.app_name}
