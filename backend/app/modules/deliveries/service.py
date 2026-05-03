from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.common.enums import ActorType, DeliveryStatus, FulfillmentMethod, OrderStatus, RoleCode
from app.modules.admin.models import Employee
from app.modules.audit_logs.service import create_employee_audit_log
from app.modules.customer_notifications.service import create_customer_notification
from app.modules.deliveries.models import Delivery, DeliveryStatusHistory
from app.modules.orders.models import Order, OrderStatusHistory


def _create_history(
    delivery_id: int,
    changed_by_employee_id: int,
    to_status: DeliveryStatus,
    from_status: str | None = None,
    note: str | None = None,
) -> DeliveryStatusHistory:
    return DeliveryStatusHistory(
        delivery_id=delivery_id,
        from_status=from_status,
        to_status=to_status.value,
        changed_by_employee_id=changed_by_employee_id,
        note=note,
    )


def ensure_delivery_for_ready_order(db: Session, order: Order, employee: Employee) -> Delivery | None:
    if order.fulfillment_method != FulfillmentMethod.DELIVERY.value or order.status != OrderStatus.READY.value:
        return None

    existing = db.scalar(select(Delivery).where(Delivery.order_id == order.id))
    if existing:
        return existing

    delivery = Delivery(
        order_id=order.id,
        branch_id=order.branch_id,
        shipper_employee_id=None,
        status=DeliveryStatus.PENDING_ASSIGNMENT.value,
        delivery_note=order.note,
    )
    db.add(delivery)
    db.flush()
    db.add(
        _create_history(
            delivery_id=delivery.id,
            changed_by_employee_id=employee.id,
            from_status=None,
            to_status=DeliveryStatus.PENDING_ASSIGNMENT,
            note="Delivery created when order became ready",
        )
    )
    create_employee_audit_log(
        db,
        employee=employee,
        action="delivery_created",
        entity_type="delivery",
        entity_id=delivery.id,
        description=f"Tao luong giao hang cho don {order.order_no}",
        payload={"order_id": order.id, "branch_id": order.branch_id},
        branch_id=order.branch_id,
    )
    return delivery


def _get_delivery_with_order(db: Session, delivery_id: int) -> Delivery:
    delivery = db.scalar(
        select(Delivery)
        .options(
            selectinload(Delivery.order).selectinload(Order.items),
            selectinload(Delivery.branch),
            selectinload(Delivery.shipper),
            selectinload(Delivery.history_entries),
        )
        .where(Delivery.id == delivery_id)
    )
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


def list_deliveries(db: Session, branch_id: int | None = None) -> list[Delivery]:
    query = (
        select(Delivery)
        .options(
            selectinload(Delivery.order).selectinload(Order.items),
            selectinload(Delivery.branch),
            selectinload(Delivery.shipper),
            selectinload(Delivery.history_entries),
        )
    )
    if branch_id is not None:
        query = query.where(Delivery.branch_id == branch_id)
    return db.scalars(query.order_by(Delivery.created_at.desc())).all()


def get_delivery(db: Session, delivery_id: int) -> Delivery:
    return _get_delivery_with_order(db, delivery_id)


def assign_shipper(db: Session, order_id: int, shipper_employee_id: int, actor: Employee, note: str | None = None) -> Delivery:
    order = db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.fulfillment_method != FulfillmentMethod.DELIVERY.value or order.status != OrderStatus.READY.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery assignment only applies to ready delivery orders")

    delivery = db.scalar(select(Delivery).where(Delivery.order_id == order.id))
    if not delivery:
        delivery = ensure_delivery_for_ready_order(db, order, actor)

    shipper = db.scalar(select(Employee).where(Employee.id == shipper_employee_id, Employee.is_active.is_(True)))
    if not shipper or shipper.role.code != RoleCode.SHIPPER.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected employee is not a shipper")
    if shipper.branch_id != order.branch_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shipper must belong to the same branch as the order")

    previous_status = delivery.status
    had_shipper = delivery.shipper_employee_id is not None
    action_note = note or ("Shipper reassigned" if delivery.shipper_employee_id else "Shipper assigned")
    delivery.shipper_employee_id = shipper.id
    delivery.status = DeliveryStatus.ASSIGNED.value
    delivery.assigned_at = datetime.utcnow()
    db.add(delivery)
    db.add(
        _create_history(
            delivery_id=delivery.id,
            changed_by_employee_id=actor.id,
            from_status=previous_status,
            to_status=DeliveryStatus.ASSIGNED,
            note=action_note,
        )
    )
    create_employee_audit_log(
        db,
        employee=actor,
        action="delivery_reassigned" if had_shipper else "delivery_assigned",
        entity_type="delivery",
        entity_id=delivery.id,
        description=f"Phan cong shipper cho don {order.order_no}",
        payload={"shipper_employee_id": shipper.id, "order_id": order.id, "branch_id": order.branch_id},
        branch_id=order.branch_id,
    )
    db.commit()
    return _get_delivery_with_order(db, delivery.id)


def list_shipper_deliveries(db: Session, shipper_id: int) -> list[Delivery]:
    return db.scalars(
        select(Delivery)
        .options(selectinload(Delivery.order).selectinload(Order.items), selectinload(Delivery.history_entries))
        .where(Delivery.shipper_employee_id == shipper_id)
        .order_by(Delivery.created_at.desc())
    ).all()


def get_shipper_delivery(db: Session, shipper_id: int, delivery_id: int) -> Delivery:
    delivery = _get_delivery_with_order(db, delivery_id)
    if delivery.shipper_employee_id != shipper_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Delivery is not assigned to this shipper")
    return delivery


def shipper_pickup(db: Session, delivery: Delivery, shipper: Employee) -> Delivery:
    if delivery.status != DeliveryStatus.ASSIGNED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only assigned deliveries can be picked up")
    previous = delivery.status
    delivery.status = DeliveryStatus.PICKED_UP.value
    delivery.picked_up_at = datetime.utcnow()
    db.add(delivery)
    db.add(_create_history(delivery.id, shipper.id, DeliveryStatus.PICKED_UP, previous, "Shipper picked up the order"))
    db.commit()
    return _get_delivery_with_order(db, delivery.id)


def shipper_start(db: Session, delivery: Delivery, shipper: Employee) -> Delivery:
    if delivery.status not in {DeliveryStatus.ASSIGNED.value, DeliveryStatus.PICKED_UP.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery cannot be started from current status")
    previous = delivery.status
    delivery.status = DeliveryStatus.DELIVERING.value
    delivery.delivering_at = datetime.utcnow()
    db.add(delivery)
    db.add(_create_history(delivery.id, shipper.id, DeliveryStatus.DELIVERING, previous, "Shipper started delivery"))
    db.commit()
    return _get_delivery_with_order(db, delivery.id)


def shipper_complete(db: Session, delivery: Delivery, shipper: Employee) -> Delivery:
    if delivery.status not in {DeliveryStatus.PICKED_UP.value, DeliveryStatus.DELIVERING.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery cannot be completed from current status")
    previous = delivery.status
    delivery.status = DeliveryStatus.DELIVERED.value
    delivery.delivered_at = datetime.utcnow()
    from app.modules.orders.service import finalize_order_completion

    finalize_order_completion(db, delivery.order)
    db.add(delivery)
    db.add(
        OrderStatusHistory(
            order_id=delivery.order_id,
            from_status=OrderStatus.READY.value,
            to_status=OrderStatus.COMPLETED.value,
            changed_by_actor_type=ActorType.EMPLOYEE.value,
            changed_by_actor_id=shipper.id,
            note="Completed after successful delivery",
        )
    )
    db.add(_create_history(delivery.id, shipper.id, DeliveryStatus.DELIVERED, previous, "Delivery completed"))
    create_employee_audit_log(
        db,
        employee=shipper,
        action="delivery_completed",
        entity_type="delivery",
        entity_id=delivery.id,
        description=f"Giao thanh cong don {delivery.order.order_no}",
        payload={"order_id": delivery.order_id, "branch_id": delivery.branch_id},
        branch_id=delivery.branch_id,
    )
    db.commit()
    return _get_delivery_with_order(db, delivery.id)


def shipper_fail(db: Session, delivery: Delivery, shipper: Employee, failure_reason: str) -> Delivery:
    if delivery.status not in {DeliveryStatus.ASSIGNED.value, DeliveryStatus.PICKED_UP.value, DeliveryStatus.DELIVERING.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery cannot fail from current status")
    previous = delivery.status
    delivery.status = DeliveryStatus.FAILED.value
    delivery.failed_at = datetime.utcnow()
    delivery.failure_reason = failure_reason
    delivery.order.status = OrderStatus.READY.value
    db.add(delivery.order)
    db.add(delivery)
    db.add(_create_history(delivery.id, shipper.id, DeliveryStatus.FAILED, previous, failure_reason))
    if delivery.order.customer_id:
        create_customer_notification(
            db,
            delivery.order.customer_id,
            "delivery_failed",
            f"Don {delivery.order.order_no} giao chua thanh cong",
            "Shipper chua giao thanh cong don hang. KACoffee se som cap nhat huong xu ly tiep theo cho ban.",
        )
    create_employee_audit_log(
        db,
        employee=shipper,
        action="delivery_failed",
        entity_type="delivery",
        entity_id=delivery.id,
        description=f"Giao that bai don {delivery.order.order_no}",
        payload={"reason": failure_reason, "order_id": delivery.order_id, "branch_id": delivery.branch_id},
        branch_id=delivery.branch_id,
    )
    db.commit()
    return _get_delivery_with_order(db, delivery.id)
