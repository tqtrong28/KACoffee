from dataclasses import dataclass
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import DiscountType
from app.modules.customers.models import Customer
from app.modules.discounts.models import CustomerDiscountUsage, Discount, DiscountRankEligibility
from app.modules.membership.models import MembershipRank


@dataclass
class AppliedDiscount:
    discount: Discount
    discount_amount_vnd: int


def _get_discount(db: Session, code: str) -> Discount:
    discount = db.scalar(select(Discount).where(Discount.code == code.strip().upper()))
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount code not found")
    return discount


def _get_eligible_ranks(db: Session, discount_id: int) -> list[MembershipRank]:
    return db.scalars(
        select(MembershipRank)
        .join(DiscountRankEligibility, DiscountRankEligibility.membership_rank_id == MembershipRank.id)
        .where(DiscountRankEligibility.discount_id == discount_id)
        .order_by(MembershipRank.min_points.asc())
    ).all()


def _ensure_discount_is_active(discount: Discount) -> None:
    now = datetime.utcnow()
    if not discount.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount is inactive")
    if discount.start_at and discount.start_at > now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount has not started")
    if discount.end_at and discount.end_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount has expired")


def validate_discount_for_customer(
    db: Session,
    code: str,
    customer: Customer,
    subtotal_vnd: int,
) -> AppliedDiscount:
    discount = _get_discount(db, code)
    _ensure_discount_is_active(discount)

    if discount.min_order_value_vnd is not None and subtotal_vnd < discount.min_order_value_vnd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order value is {discount.min_order_value_vnd} VND",
        )

    eligible_ranks = _get_eligible_ranks(db, discount.id)
    if eligible_ranks and customer.membership_rank_id not in {rank.id for rank in eligible_ranks}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount is not eligible for this membership rank")

    if discount.discount_type == DiscountType.PERCENTAGE.value:
        discount_amount = subtotal_vnd * discount.value // 100
    else:
        discount_amount = discount.value
    discount_amount = max(min(discount_amount, subtotal_vnd), 0)
    return AppliedDiscount(discount=discount, discount_amount_vnd=discount_amount)


def list_available_discounts_for_customer(db: Session, customer: Customer) -> list[Discount]:
    discounts = db.scalars(select(Discount).order_by(Discount.code.asc())).all()
    available: list[Discount] = []
    for discount in discounts:
        try:
            validate_discount_for_customer(db, discount.code, customer, subtotal_vnd=max(discount.min_order_value_vnd or 0, 0))
        except HTTPException:
            continue
        available.append(discount)
    return available


def create_discount(db: Session, payload) -> Discount:
    code = payload.code.strip().upper()
    existing = db.scalar(select(Discount).where(Discount.code == code))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code already exists")

    discount = Discount(
        code=code,
        description=payload.description,
        discount_type=payload.discount_type.value,
        value=payload.value,
        min_order_value_vnd=payload.min_order_value_vnd,
        start_at=payload.start_at,
        end_at=payload.end_at,
        is_active=payload.is_active,
    )
    db.add(discount)
    db.flush()
    for rank_id in payload.eligible_rank_ids:
        db.add(DiscountRankEligibility(discount_id=discount.id, membership_rank_id=rank_id))
    db.commit()
    db.refresh(discount)
    return discount


def update_discount(db: Session, discount: Discount, payload) -> Discount:
    discount.code = payload.code.strip().upper()
    discount.description = payload.description
    discount.discount_type = payload.discount_type.value
    discount.value = payload.value
    discount.min_order_value_vnd = payload.min_order_value_vnd
    discount.start_at = payload.start_at
    discount.end_at = payload.end_at
    discount.is_active = payload.is_active
    db.add(discount)
    db.query(DiscountRankEligibility).filter(DiscountRankEligibility.discount_id == discount.id).delete()
    for rank_id in payload.eligible_rank_ids:
        db.add(DiscountRankEligibility(discount_id=discount.id, membership_rank_id=rank_id))
    db.commit()
    db.refresh(discount)
    return discount


def list_discounts(db: Session) -> list[Discount]:
    return db.scalars(select(Discount).order_by(Discount.code.asc())).all()


def serialize_discount(db: Session, discount: Discount):
    eligible_ranks = _get_eligible_ranks(db, discount.id)
    from app.modules.discounts.schemas import DiscountResponse

    return DiscountResponse(
        id=discount.id,
        code=discount.code,
        description=discount.description,
        discount_type=discount.discount_type,
        value=discount.value,
        min_order_value_vnd=discount.min_order_value_vnd,
        start_at=discount.start_at,
        end_at=discount.end_at,
        is_active=discount.is_active,
        eligible_rank_ids=[rank.id for rank in eligible_ranks],
        eligible_rank_names=[rank.name for rank in eligible_ranks],
    )


def register_discount_usage(db: Session, customer: Customer, discount: Discount, order_id: int) -> None:
    db.add(
        CustomerDiscountUsage(
            customer_id=customer.id,
            discount_id=discount.id,
            order_id=order_id,
        )
    )
