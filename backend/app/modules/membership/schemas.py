from datetime import datetime

from pydantic import BaseModel


class MembershipRankResponse(BaseModel):
    id: int
    code: str
    name: str
    min_points: int

    model_config = {"from_attributes": True}


class MembershipSummaryResponse(BaseModel):
    customer_id: int
    membership_rank: MembershipRankResponse
    total_points: int


class PointLedgerResponse(BaseModel):
    id: int
    order_id: int
    points_delta: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}
