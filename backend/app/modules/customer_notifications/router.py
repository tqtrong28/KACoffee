from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.deps import get_current_customer
from app.modules.customer_notifications import service
from app.modules.customer_notifications.schemas import CustomerNotificationResponse
from app.modules.customers.models import Customer

router = APIRouter(prefix="/notifications", tags=["customer-notifications"])


@router.get("/me", response_model=list[CustomerNotificationResponse])
def list_my_notifications(
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[CustomerNotificationResponse]:
    return service.list_customer_notifications(db, customer.id)


@router.patch("/me/read-all")
def mark_my_notifications_read(
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    updated = service.mark_all_customer_notifications_read(db, customer.id)
    db.commit()
    return {"updated": updated}
