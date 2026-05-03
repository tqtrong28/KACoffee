from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.customer_notifications.service import create_customer_notification
from app.modules.customers.models import Customer
from app.modules.membership.models import CustomerPointLedger, MembershipRank


def get_highest_rank_for_points(db: Session, points: int) -> MembershipRank:
    ranks = db.scalars(
        select(MembershipRank)
        .where(MembershipRank.is_active.is_(True), MembershipRank.min_points <= points)
        .order_by(MembershipRank.min_points.desc())
    ).all()
    return ranks[0]


def award_points_for_order(db: Session, customer: Customer, order_id: int, eligible_amount_vnd: int) -> int:
    existing = db.scalar(
        select(CustomerPointLedger).where(CustomerPointLedger.order_id == order_id)
    )
    if existing:
        return existing.points_delta

    previous_rank = customer.membership_rank
    points = max(eligible_amount_vnd // 1000, 0)
    ledger = CustomerPointLedger(
        customer_id=customer.id,
        order_id=order_id,
        points_delta=points,
        reason="completed_order",
    )
    customer.total_points += points
    next_rank = get_highest_rank_for_points(db, customer.total_points)
    customer.membership_rank = next_rank
    db.add(ledger)
    db.add(customer)
    if previous_rank and next_rank.id != previous_rank.id:
        create_customer_notification(
            db,
            customer.id,
            "membership_rank_up",
            f"Chúc mừng bạn đã lên hạng {next_rank.name}",
            f"Bạn đã đạt mốc điểm mới và được nâng cấp từ {previous_rank.name} lên {next_rank.name}. Hãy tiếp tục đặt món để nhận thêm ưu đãi.",
        )
    return points
