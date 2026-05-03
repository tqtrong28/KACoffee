from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.customer_notifications.models import CustomerNotification


def create_customer_notification(
    db: Session,
    customer_id: int,
    notification_type: str,
    title: str,
    message: str,
) -> CustomerNotification:
    notification = CustomerNotification(
        customer_id=customer_id,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )
    db.add(notification)
    return notification


def list_customer_notifications(db: Session, customer_id: int) -> list[CustomerNotification]:
    return db.scalars(
        select(CustomerNotification)
        .where(CustomerNotification.customer_id == customer_id)
        .order_by(CustomerNotification.created_at.desc())
    ).all()


def mark_all_customer_notifications_read(db: Session, customer_id: int) -> int:
    notifications = db.scalars(
        select(CustomerNotification).where(
            CustomerNotification.customer_id == customer_id,
            CustomerNotification.is_read.is_(False),
        )
    ).all()
    for notification in notifications:
        notification.is_read = True
        db.add(notification)
    return len(notifications)
