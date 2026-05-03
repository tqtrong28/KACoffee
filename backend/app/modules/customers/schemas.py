from datetime import datetime

from pydantic import BaseModel, Field


class CustomerProfileResponse(BaseModel):
    id: int
    phone: str
    full_name: str
    email: str | None
    membership_rank: str
    total_points: int
    default_address_line: str | None
    default_ward: str | None
    default_district: str | None
    default_city: str | None
    created_at: datetime


class CustomerProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    default_address_line: str | None = Field(default=None, max_length=255)
    default_ward: str | None = Field(default=None, max_length=100)
    default_district: str | None = Field(default=None, max_length=100)
    default_city: str | None = Field(default=None, max_length=100)
