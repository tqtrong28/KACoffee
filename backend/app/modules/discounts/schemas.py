from datetime import datetime

from pydantic import BaseModel, Field

from app.common.enums import DiscountType


class DiscountCreateRequest(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    description: str | None = Field(default=None, max_length=255)
    discount_type: DiscountType
    value: int = Field(ge=1)
    min_order_value_vnd: int | None = Field(default=None, ge=0)
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_active: bool = True
    eligible_rank_ids: list[int] = []


class DiscountUpdateRequest(DiscountCreateRequest):
    pass


class DiscountResponse(BaseModel):
    id: int
    code: str
    description: str | None
    discount_type: DiscountType
    value: int
    min_order_value_vnd: int | None
    start_at: datetime | None
    end_at: datetime | None
    is_active: bool
    eligible_rank_ids: list[int]
    eligible_rank_names: list[str]


class DiscountValidationRequest(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    subtotal_vnd: int = Field(ge=0)


class DiscountValidationResponse(BaseModel):
    code: str
    discount_amount_vnd: int
    final_subtotal_vnd: int
    description: str | None
