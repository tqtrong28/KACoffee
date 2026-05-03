from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.deps import get_current_customer
from app.modules.customers.models import Customer
from app.modules.membership.models import CustomerPointLedger, MembershipRank
from app.modules.membership.schemas import (
    MembershipRankResponse,
    MembershipSummaryResponse,
    PointLedgerResponse,
)

router = APIRouter(prefix="/membership", tags=["membership"])


@router.get("/ranks", response_model=list[MembershipRankResponse])
def list_membership_ranks(db: Annotated[Session, Depends(get_db)]) -> list[MembershipRank]:
    return db.scalars(select(MembershipRank).where(MembershipRank.is_active.is_(True)).order_by(MembershipRank.priority)).all()


@router.get("/me", response_model=MembershipSummaryResponse)
def get_membership_summary(customer: Annotated[Customer, Depends(get_current_customer)]) -> MembershipSummaryResponse:
    return MembershipSummaryResponse(
        customer_id=customer.id,
        membership_rank=MembershipRankResponse.model_validate(customer.membership_rank),
        total_points=customer.total_points,
    )


@router.get("/me/point-history", response_model=list[PointLedgerResponse])
def get_point_history(
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[CustomerPointLedger]:
    return db.scalars(
        select(CustomerPointLedger)
        .where(CustomerPointLedger.customer_id == customer.id)
        .order_by(CustomerPointLedger.created_at.desc())
    ).all()
