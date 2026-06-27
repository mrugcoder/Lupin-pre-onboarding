from pydantic import BaseModel


class UserOut(BaseModel):
    """Safe public representation of a user — never includes password_hash."""

    id: int
    name: str
    email: str
    role: str

    model_config = {"from_attributes": True}
