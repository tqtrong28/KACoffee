from datetime import datetime

from pydantic import BaseModel, Field

from app.common.enums import ActorType


class CustomerRegisterRequest(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)


class CustomerLoginRequest(BaseModel):
    phone: str
    password: str


class EmployeeLoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    actor_type: ActorType
    role: str | None = None


class MeResponse(BaseModel):
    actor_type: ActorType
    id: int
    phone: str | None = None
    username: str | None = None
    full_name: str
    role: str | None = None
    membership_rank: str | None = None
    total_points: int | None = None
    branch_id: int | None = None
    branch_name: str | None = None


class RefreshTokenPayload(BaseModel):
    id: int
    actor_type: str
    actor_id: int
    expires_at: datetime
