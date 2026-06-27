"""
Seed script: creates one HR admin user for local development.

Usage (from the /backend directory):
    python scripts/seed_admin.py

This script is SAFE to run multiple times — it skips creation if the user
already exists. NEVER run this against a production database.
"""
import sys
import os

# Make sure the app package is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from passlib.context import CryptContext
from app.database import SessionLocal
from app.models.user import User

ADMIN_EMAIL = "admin@lupin-hr.local"
ADMIN_PASSWORD = "Admin@123"   # Plaintext only appears here — hashed before storage
ADMIN_NAME = "HR Admin"
ADMIN_ROLE = "hr_admin"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"[seed] User '{ADMIN_EMAIL}' already exists — skipping.")
            return

        hashed = pwd_context.hash(ADMIN_PASSWORD)
        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=hashed,
            role=ADMIN_ROLE,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("=" * 50)
        print("[seed] HR admin user created successfully.")
        print(f"  Email   : {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}  ← change this in production!")
        print(f"  Role    : {ADMIN_ROLE}")
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    seed()
