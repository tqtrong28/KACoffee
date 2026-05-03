from datetime import datetime

from pydantic import BaseModel, Field


class BottleExchangeCreateRequest(BaseModel):
    customer_phone: str | None = Field(default=None, max_length=20)
    returned_bottle_qty: int = Field(ge=5)
    reward_product_id: int
    note: str | None = Field(default=None, max_length=255)


class BottleExchangeResponse(BaseModel):
    id: int
    branch_id: int
    branch_name: str
    customer_id: int | None
    customer_phone_snapshot: str | None
    customer_name: str | None
    processed_by_employee_id: int
    processed_by_employee_name: str
    returned_bottle_qty: int
    reward_product_id: int
    reward_product_name_snapshot: str
    reward_quantity: int
    note: str | None
    created_at: datetime
