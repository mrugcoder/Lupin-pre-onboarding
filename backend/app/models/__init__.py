"""
Import all models so SQLAlchemy's metadata is populated before Alembic
generates migrations. Order matters: Candidate must be imported before
the FK-dependent models.
"""

from app.models.user import User  # noqa: F401
from app.models.candidate import Candidate  # noqa: F401
from app.models.interview import Interview  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.medical import MedicalRecord  # noqa: F401
from app.models.joining import JoiningRecord  # noqa: F401
