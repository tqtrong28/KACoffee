from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import require_staff, require_system_admin
from app.modules.bottle_exchange import service
from app.modules.bottle_exchange.models import BottleExchangeRecord
from app.modules.bottle_exchange.schemas import BottleExchangeCreateRequest, BottleExchangeResponse

staff_router = APIRouter(prefix="/staff/bottle-exchanges", tags=["staff-bottle-exchanges"])
admin_router = APIRouter(prefix="/admin/bottle-exchanges", tags=["admin-bottle-exchanges"])


def _to_response(record: BottleExchangeRecord) -> BottleExchangeResponse:
    return BottleExchangeResponse(
        id=record.id,
        branch_id=record.branch_id,
        branch_name=record.branch.name,
        customer_id=record.customer_id,
        customer_phone_snapshot=record.customer_phone_snapshot,
        customer_name=record.customer.full_name if record.customer else None,
        processed_by_employee_id=record.processed_by_employee_id,
        processed_by_employee_name=record.processor.full_name,
        returned_bottle_qty=record.returned_bottle_qty,
        reward_product_id=record.reward_product_id,
        reward_product_name_snapshot=record.reward_product_name_snapshot,
        reward_quantity=record.reward_quantity,
        note=record.note,
        created_at=record.created_at,
    )


@staff_router.post("", response_model=BottleExchangeResponse)
def create_bottle_exchange(
    payload: BottleExchangeCreateRequest,
    employee: Annotated[Employee, Depends(require_staff)],
    db: Annotated[Session, Depends(get_db)],
) -> BottleExchangeResponse:
    return _to_response(
        service.create_exchange(
            db=db,
            employee=employee,
            customer_phone=payload.customer_phone,
            returned_bottle_qty=payload.returned_bottle_qty,
            reward_product_id=payload.reward_product_id,
            note=payload.note,
        )
    )


@admin_router.get("", response_model=list[BottleExchangeResponse])
def list_bottle_exchanges(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[BottleExchangeResponse]:
    return [_to_response(record) for record in service.list_exchanges(db)]
