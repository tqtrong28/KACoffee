from datetime import datetime

from pydantic import BaseModel, Field


class RoleTargetPolicyCreateRequest(BaseModel):
    role_code: str = Field(min_length=1, max_length=30)
    monthly_order_target: int = Field(ge=0)
    monthly_revenue_target_vnd: int = Field(ge=0)
    monthly_delivery_target: int = Field(ge=0)
    bonus_rate_percent: int = Field(ge=0)
    bonus_per_extra_order_vnd: int = Field(ge=0)
    bonus_per_extra_delivery_vnd: int = Field(ge=0)
    bonus_flat_vnd: int = Field(ge=0)
    is_active: bool = True


class RoleTargetPolicyUpdateRequest(RoleTargetPolicyCreateRequest):
    pass


class RoleTargetPolicyResponse(BaseModel):
    id: int
    role_code: str
    monthly_order_target: int
    monthly_revenue_target_vnd: int
    monthly_delivery_target: int
    bonus_rate_percent: int
    bonus_per_extra_order_vnd: int
    bonus_per_extra_delivery_vnd: int
    bonus_flat_vnd: int
    is_active: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class BranchTargetPolicyCreateRequest(BaseModel):
    branch_id: int
    monthly_order_target: int = Field(ge=0)
    monthly_revenue_target_vnd: int = Field(ge=0)
    bonus_rate_percent: int = Field(ge=0)
    bonus_flat_vnd: int = Field(ge=0)
    is_active: bool = True


class BranchTargetPolicyUpdateRequest(BranchTargetPolicyCreateRequest):
    pass


class BranchTargetPolicyResponse(BaseModel):
    id: int
    branch_id: int
    branch_name: str
    monthly_order_target: int
    monthly_revenue_target_vnd: int
    bonus_rate_percent: int
    bonus_flat_vnd: int
    is_active: bool
    updated_at: datetime
