from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import ensure_same_branch, require_manager_or_admin, require_shipper, resolve_branch_scope
from app.modules.deliveries import service
from app.modules.deliveries.models import Delivery
from app.modules.orders.models import Order
from app.modules.deliveries.schemas import (
    DeliveryAdminResponse,
    DeliveryAssignRequest,
    DeliveryFailRequest,
    DeliveryShipperResponse,
    DeliveryStatusHistoryResponse,
)

admin_router = APIRouter(prefix="/admin/deliveries", tags=["admin-deliveries"])
shipper_router = APIRouter(prefix="/shipper/deliveries", tags=["shipper-deliveries"])


def _to_admin_response(delivery: Delivery, include_history: bool = False) -> DeliveryAdminResponse:
    return DeliveryAdminResponse(
        id=delivery.id,
        order_id=delivery.order_id,
        order_no=delivery.order.order_no or "",
        branch_id=delivery.branch_id,
        branch_name=delivery.branch.name,
        shipper_employee_id=delivery.shipper_employee_id,
        shipper_name=delivery.shipper.full_name if delivery.shipper else None,
        status=delivery.status,
        delivery_note=delivery.delivery_note,
        failure_reason=delivery.failure_reason,
        recipient_name=delivery.order.recipient_name,
        recipient_phone=delivery.order.recipient_phone,
        address_line=delivery.order.address_line,
        ward=delivery.order.ward,
        district=delivery.order.district,
        city=delivery.order.city,
        created_at=delivery.created_at,
        assigned_at=delivery.assigned_at,
        picked_up_at=delivery.picked_up_at,
        delivering_at=delivery.delivering_at,
        delivered_at=delivery.delivered_at,
        failed_at=delivery.failed_at,
        history=[DeliveryStatusHistoryResponse.model_validate(item) for item in delivery.history_entries] if include_history else None,
    )


def _to_shipper_response(delivery: Delivery, include_history: bool = False) -> DeliveryShipperResponse:
    return DeliveryShipperResponse(
        id=delivery.id,
        order_id=delivery.order_id,
        order_no=delivery.order.order_no or "",
        status=delivery.status,
        delivery_note=delivery.delivery_note,
        failure_reason=delivery.failure_reason,
        recipient_name=delivery.order.recipient_name,
        recipient_phone=delivery.order.recipient_phone,
        address_line=delivery.order.address_line,
        ward=delivery.order.ward,
        district=delivery.order.district,
        city=delivery.order.city,
        item_summary=[f"{item.quantity} x {item.product_name_snapshot}" for item in delivery.order.items],
        assigned_at=delivery.assigned_at,
        picked_up_at=delivery.picked_up_at,
        delivering_at=delivery.delivering_at,
        delivered_at=delivery.delivered_at,
        failed_at=delivery.failed_at,
        history=[DeliveryStatusHistoryResponse.model_validate(item) for item in delivery.history_entries] if include_history else None,
    )


def _get_scoped_delivery(db: Session, delivery_id: int, employee: Employee) -> Delivery:
    delivery = service.get_delivery(db, delivery_id)
    ensure_same_branch(employee, delivery.branch_id)
    return delivery


@admin_router.get("", response_model=list[DeliveryAdminResponse])
def list_deliveries(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[DeliveryAdminResponse]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    return [_to_admin_response(delivery) for delivery in service.list_deliveries(db, branch_id=scoped_branch_id)]


@admin_router.get("/{delivery_id}", response_model=DeliveryAdminResponse)
def get_delivery(
    delivery_id: int,
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryAdminResponse:
    return _to_admin_response(_get_scoped_delivery(db, delivery_id, employee), include_history=True)


@admin_router.post("/{order_id}/assign", response_model=DeliveryAdminResponse)
def assign_delivery(
    order_id: int,
    payload: DeliveryAssignRequest,
    admin: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryAdminResponse:
    order = db.get(Order, order_id)
    if not order:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    ensure_same_branch(admin, order.branch_id)
    delivery = service.assign_shipper(db, order_id, payload.shipper_employee_id, admin, payload.note)
    return _to_admin_response(delivery, include_history=True)


@admin_router.patch("/{delivery_id}/reassign", response_model=DeliveryAdminResponse)
def reassign_delivery(
    delivery_id: int,
    payload: DeliveryAssignRequest,
    admin: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryAdminResponse:
    existing = _get_scoped_delivery(db, delivery_id, admin)
    delivery = service.assign_shipper(db, existing.order_id, payload.shipper_employee_id, admin, payload.note or "Delivery reassigned")
    return _to_admin_response(delivery, include_history=True)


@shipper_router.get("/me", response_model=list[DeliveryShipperResponse])
def list_shipper_deliveries(
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> list[DeliveryShipperResponse]:
    return [_to_shipper_response(delivery) for delivery in service.list_shipper_deliveries(db, shipper.id)]


@shipper_router.get("/{delivery_id}", response_model=DeliveryShipperResponse)
def get_shipper_delivery(
    delivery_id: int,
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryShipperResponse:
    return _to_shipper_response(service.get_shipper_delivery(db, shipper.id, delivery_id), include_history=True)


@shipper_router.post("/{delivery_id}/pickup", response_model=DeliveryShipperResponse)
def pickup_delivery(
    delivery_id: int,
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryShipperResponse:
    delivery = service.get_shipper_delivery(db, shipper.id, delivery_id)
    return _to_shipper_response(service.shipper_pickup(db, delivery, shipper), include_history=True)


@shipper_router.post("/{delivery_id}/start", response_model=DeliveryShipperResponse)
def start_delivery(
    delivery_id: int,
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryShipperResponse:
    delivery = service.get_shipper_delivery(db, shipper.id, delivery_id)
    return _to_shipper_response(service.shipper_start(db, delivery, shipper), include_history=True)


@shipper_router.post("/{delivery_id}/complete", response_model=DeliveryShipperResponse)
def complete_delivery(
    delivery_id: int,
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryShipperResponse:
    delivery = service.get_shipper_delivery(db, shipper.id, delivery_id)
    return _to_shipper_response(service.shipper_complete(db, delivery, shipper), include_history=True)


@shipper_router.post("/{delivery_id}/fail", response_model=DeliveryShipperResponse)
def fail_delivery(
    delivery_id: int,
    payload: DeliveryFailRequest,
    shipper: Annotated[Employee, Depends(require_shipper)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryShipperResponse:
    delivery = service.get_shipper_delivery(db, shipper.id, delivery_id)
    return _to_shipper_response(service.shipper_fail(db, delivery, shipper, payload.failure_reason), include_history=True)
