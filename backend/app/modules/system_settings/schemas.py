from datetime import datetime

from pydantic import BaseModel, Field


class PublicSystemSettingsResponse(BaseModel):
    site_title: str
    brand_headline: str
    brand_subheadline: str
    support_phone: str | None
    support_email: str | None
    delivery_fee_vnd: int
    public_notice: str | None


class SystemSettingsResponse(PublicSystemSettingsResponse):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SystemSettingsUpdateRequest(BaseModel):
    site_title: str = Field(min_length=1, max_length=100)
    brand_headline: str = Field(min_length=1, max_length=255)
    brand_subheadline: str = Field(min_length=1)
    support_phone: str | None = Field(default=None, max_length=20)
    support_email: str | None = Field(default=None, max_length=255)
    delivery_fee_vnd: int = Field(ge=0)
    public_notice: str | None = None
