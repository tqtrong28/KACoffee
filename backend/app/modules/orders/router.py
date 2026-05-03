from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import (
    ensure_same_branch,
    get_current_customer,
    require_manager_or_admin,
    require_staff,
    resolve_branch_scope,
)
from app.modules.customers.models import Customer
from app.modules.orders import service
from app.modules.orders.models import Order
from app.modules.orders.schemas import (
    OrderCreateRequest,
    OrderResponse,
    StaffOrderCreateRequest,
    OrderStatusHistoryResponse,
    OrderStatusUpdateRequest,
    OrderTrackingResponse,
)

router = APIRouter(prefix="/orders", tags=["orders"])
staff_router = APIRouter(prefix="/staff/orders", tags=["staff-orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


def _to_order_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        order_no=order.order_no or "",
        source=order.source,
        branch_id=order.branch_id,
        branch_name=order.branch.name,
        customer_id=order.customer_id,
        customer_full_name=order.customer.full_name if order.customer else None,
        customer_phone=order.customer.phone if order.customer else None,
        created_by_employee_id=order.created_by_employee_id,
        fulfillment_method=order.fulfillment_method,
        status=order.status,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        subtotal_vnd=order.subtotal_vnd,
        discount_code_snapshot=order.discount_code_snapshot,
        discount_amount_vnd=order.discount_amount_vnd,
        delivery_fee_vnd=order.delivery_fee_vnd,
        total_vnd=order.total_vnd,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        address_line=order.address_line,
        ward=order.ward,
        district=order.district,
        city=order.city,
        note=order.note,
        created_at=order.created_at,
        completed_at=order.completed_at,
        cancelled_at=order.cancelled_at,
        items=order.items,
    )


def _get_order_or_404(db: Session, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreateRequest,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    return _to_order_response(service.create_online_order(db, customer, payload))


@router.get("/me", response_model=list[OrderResponse])
def list_my_orders(
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[OrderResponse]:
    return [_to_order_response(order) for order in service.list_customer_orders(db, customer.id)]


@router.get("/me/{order_id}", response_model=OrderResponse)
def get_my_order(
    order_id: int,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    return _to_order_response(service.get_customer_order(db, customer.id, order_id))


@router.post("/me/{order_id}/cancel", response_model=OrderResponse)
def cancel_my_order(
    order_id: int,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    order = service.get_customer_order(db, customer.id, order_id)
    return _to_order_response(service.cancel_order(db, order, customer))


@router.get("/{order_no}/tracking", response_model=OrderTrackingResponse)
def get_order_tracking(
    order_no: str,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderTrackingResponse:
    order = service.get_customer_order_by_no(db, customer.id, order_no)
    history = service.get_order_history(db, order.id)
    return OrderTrackingResponse(
        order=_to_order_response(order),
        history=[OrderStatusHistoryResponse.model_validate(item) for item in history],
    )


@staff_router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdateRequest,
    employee: Annotated[Employee, Depends(require_staff)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    order = _get_order_or_404(db, order_id)
    ensure_same_branch(employee, order.branch_id)
    return _to_order_response(service.update_order_status(db, order, employee, payload.status, payload.note))


@staff_router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_staff_order(
    payload: StaffOrderCreateRequest,
    employee: Annotated[Employee, Depends(require_staff)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    return _to_order_response(service.create_staff_order(db, employee, payload))


@staff_router.get("", response_model=list[OrderResponse])
def list_staff_orders(
    employee: Annotated[Employee, Depends(require_staff)],
    db: Annotated[Session, Depends(get_db)],
) -> list[OrderResponse]:
    return [_to_order_response(order) for order in service.list_all_orders(db, branch_id=employee.branch_id)]


@staff_router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_staff_order(
    order_id: int,
    employee: Annotated[Employee, Depends(require_staff)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    order = _get_order_or_404(db, order_id)
    ensure_same_branch(employee, order.branch_id)
    return _to_order_response(service.cancel_order(db, order, employee))


@admin_router.get("", response_model=list[OrderResponse])
def list_orders(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[OrderResponse]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    return [_to_order_response(order) for order in service.list_all_orders(db, branch_id=scoped_branch_id)]


@admin_router.get("/{order_id}", response_model=OrderTrackingResponse)
def get_admin_order(
    order_id: int,
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderTrackingResponse:
    order = _get_order_or_404(db, order_id)
    if employee.role.code == "manager":
        ensure_same_branch(employee, order.branch_id)
    history = service.get_order_history(db, order.id)
    return OrderTrackingResponse(
        order=_to_order_response(order),
        history=[OrderStatusHistoryResponse.model_validate(item) for item in history],
    )
