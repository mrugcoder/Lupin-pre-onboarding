from sqlalchemy import Column, Integer, String
from app.database import Base


class User(Base):
    """HR admin users. Passwords are always bcrypt-hashed — never stored in plaintext."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="hr_admin")
