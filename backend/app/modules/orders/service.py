from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import (
    ActorType,
    FulfillmentMethod,
    IceLevel,
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    ProductSize,
    ProductType,
    ServingOption,
    SugarLevel,
)
from app.common.utils import generate_order_no
from app.modules.admin.models import Branch, Employee
from app.modules.audit_logs.service import create_audit_log, create_employee_audit_log
from app.modules.catalog.models import Product
from app.modules.customer_notifications.service import create_customer_notification
from app.modules.customers.models import Customer
from app.modules.discounts import service as discount_service
from app.modules.membership.service import award_points_for_order
from app.modules.orders.models import Order, OrderItem, OrderStatusHistory
from app.modules.orders.pricing_service import calculate_delivery_fee
from app.modules.orders.schemas import OrderCreateRequest, StaffOrderCreateRequest
from app.modules.system_settings.service import get_or_create_settings


def _serialize_actor(actor: Customer | Employee) -> tuple[ActorType, int]:
    if isinstance(actor, Customer):
        return ActorType.CUSTOMER, actor.id
    return ActorType.EMPLOYEE, actor.id


def _get_active_branch(db: Session, branch_id: int) -> Branch:
    branch = db.scalar(select(Branch).where(Branch.id == branch_id, Branch.is_active.is_(True)))
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return branch


def _get_products_for_order(db: Session, product_ids: Iterable[int]) -> list[Product]:
    unique_ids = list(set(product_ids))
    products = db.scalars(
        select(Product).where(Product.id.in_(unique_ids), Product.is_active.is_(True))
    ).all()
    if len(products) != len(unique_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Some products are unavailable")
    return products


def _resolve_unit_price(product: Product, size_option: ProductSize) -> int:
    if size_option == ProductSize.SMALL and product.small_price_vnd is not None:
        return product.small_price_vnd
    if size_option == ProductSize.LARGE and product.large_price_vnd is not None:
        return product.large_price_vnd
    return product.price_vnd


def _build_order_items(
    products_by_id: dict[int, Product],
    items,
    *,
    availability_field: str,
    fulfillment_method: FulfillmentMethod | None = None,
) -> tuple[int, list[OrderItem]]:
    subtotal = 0
    order_items: list[OrderItem] = []
    for item in items:
        product = products_by_id[item.product_id]
        if not getattr(product, availability_field):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{product.name} is not available")
        serving_option = getattr(item, "serving_option", ServingOption.TAKEAWAY)
        if fulfillment_method == FulfillmentMethod.DELIVERY and serving_option == ServingOption.DINE_IN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Don giao hang chi ap dung cho mon mang ve",
            )
        unit_price = _resolve_unit_price(product, item.size_option)
        line_total = unit_price * item.quantity
        subtotal += line_total
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name_snapshot=product.name,
                product_type_snapshot=product.product_type,
                serving_option=serving_option.value,
                size_option=item.size_option.value,
                ice_level=item.ice_level.value,
                sugar_level=item.sugar_level.value,
                unit_price_vnd=unit_price,
                quantity=item.quantity,
                line_total_vnd=line_total,
                is_free_item=False,
                note=item.note,
            )
        )
    return subtotal, order_items


def _resolve_customer_by_phone(db: Session, phone: str | None) -> Customer | None:
    if not phone:
        return None
    customer = db.scalar(select(Customer).where(Customer.phone == phone, Customer.is_active.is_(True)))
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


def _apply_discount(
    db: Session,
    discount_code: str | None,
    customer: Customer | None,
    subtotal: int,
) -> tuple[int, int | None, str | None, object | None]:
    if not discount_code:
        return 0, None, None, None
    if customer is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code requires a member account")
    applied = discount_service.validate_discount_for_customer(db, discount_code, customer, subtotal)
    return applied.discount_amount_vnd, applied.discount.id, applied.discount.code, applied


def _create_order_history(order_id: int, actor_type: ActorType, actor_id: int, note: str) -> OrderStatusHistory:
    return OrderStatusHistory(
        order_id=order_id,
        from_status=None,
        to_status=OrderStatus.PREPARING.value,
        changed_by_actor_type=actor_type.value,
        changed_by_actor_id=actor_id,
        note=note,
    )


def _calculate_points_eligible_amount(order: Order) -> int:
    eligible_amount = sum(item.line_total_vnd for item in order.items if not item.is_free_item)
    return max(eligible_amount - order.discount_amount_vnd, 0)


def finalize_order_completion(db: Session, order: Order) -> None:
    order.status = OrderStatus.COMPLETED.value
    order.payment_status = PaymentStatus.PAID.value
    order.completed_at = datetime.utcnow()

    if order.customer_id and order.points_awarded_at is None:
        customer = db.get(Customer, order.customer_id)
        if customer:
            award_points_for_order(db, customer, order.id, _calculate_points_eligible_amount(order))
            order.points_awarded_at = datetime.utcnow()

    db.add(order)


def create_online_order(db: Session, customer: Customer, payload: OrderCreateRequest) -> Order:
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have at least one item")

    branch = _get_active_branch(db, payload.branch_id)
    products = _get_products_for_order(db, [item.product_id for item in payload.items])
    products_by_id = {product.id: product for product in products}
    subtotal, order_items = _build_order_items(
        products_by_id,
        payload.items,
        availability_field="is_online_available",
        fulfillment_method=payload.fulfillment_method,
    )
    discount_amount, discount_id, discount_code_snapshot, applied_discount = _apply_discount(
        db,
        payload.discount_code,
        customer,
        subtotal,
    )
    system_settings = get_or_create_settings(db)
    delivery_fee = calculate_delivery_fee(payload.fulfillment_method, payload.city, system_settings.delivery_fee_vnd)
    order = Order(
        branch_id=branch.id,
        customer_id=customer.id,
        source=OrderSource.ONLINE.value,
        fulfillment_method=payload.fulfillment_method.value,
        status=OrderStatus.PREPARING.value,
        payment_method=PaymentMethod.OFFLINE.value,
        payment_status=PaymentStatus.UNPAID.value,
        subtotal_vnd=subtotal,
        discount_id=discount_id,
        discount_code_snapshot=discount_code_snapshot,
        discount_amount_vnd=discount_amount,
        delivery_fee_vnd=delivery_fee,
        total_vnd=subtotal - discount_amount + delivery_fee,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        address_line=payload.address_line,
        ward=payload.ward,
        district=payload.district,
        city=payload.city,
        note=payload.note,
        items=order_items,
    )
    db.add(order)
    db.flush()
    order.order_no = generate_order_no(order.id)
    db.add(_create_order_history(order.id, ActorType.CUSTOMER, customer.id, "Order created"))
    create_audit_log(
        db,
        actor_type=ActorType.CUSTOMER.value,
        actor_id=customer.id,
        actor_name=customer.full_name,
        branch_id=order.branch_id,
        action="online_order_created",
        entity_type="order",
        entity_id=order.id,
        description=f"Khach tao don {order.order_no}",
        payload={"order_no": order.order_no, "fulfillment_method": order.fulfillment_method},
    )
    if applied_discount:
        discount_service.register_discount_usage(db, customer, applied_discount.discount, order.id)
    db.commit()
    db.refresh(order)
    return order


def create_staff_order(db: Session, employee: Employee, payload: StaffOrderCreateRequest) -> Order:
    if payload.source not in {OrderSource.IN_STORE, OrderSource.PHONE}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Staff orders must use in_store or phone source")
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must have at least one item")

    customer = _resolve_customer_by_phone(db, payload.customer_phone)
    products = _get_products_for_order(db, [item.product_id for item in payload.items])
    products_by_id = {product.id: product for product in products}
    subtotal, order_items = _build_order_items(
        products_by_id,
        payload.items,
        availability_field="is_in_store_available",
        fulfillment_method=payload.fulfillment_method,
    )
    discount_amount, discount_id, discount_code_snapshot, applied_discount = _apply_discount(
        db,
        payload.discount_code,
        customer,
        subtotal,
    )
    system_settings = get_or_create_settings(db)
    delivery_fee = calculate_delivery_fee(payload.fulfillment_method, payload.city, system_settings.delivery_fee_vnd)
    order = Order(
        branch_id=employee.branch_id,
        customer_id=customer.id if customer else None,
        created_by_employee_id=employee.id,
        source=payload.source.value,
        fulfillment_method=payload.fulfillment_method.value,
        status=OrderStatus.PREPARING.value,
        payment_method=PaymentMethod.OFFLINE.value,
        payment_status=PaymentStatus.UNPAID.value,
        subtotal_vnd=subtotal,
        discount_id=discount_id,
        discount_code_snapshot=discount_code_snapshot,
        discount_amount_vnd=discount_amount,
        delivery_fee_vnd=delivery_fee,
        total_vnd=subtotal - discount_amount + delivery_fee,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        address_line=payload.address_line,
        ward=payload.ward,
        district=payload.district,
        city=payload.city,
        note=payload.note,
        items=order_items,
    )
    db.add(order)
    db.flush()
    order.order_no = generate_order_no(order.id)
    db.add(_create_order_history(order.id, ActorType.EMPLOYEE, employee.id, "Staff order created"))
    if applied_discount and customer:
        discount_service.register_discount_usage(db, customer, applied_discount.discount, order.id)
    create_employee_audit_log(
        db,
        employee=employee,
        action="staff_order_created",
        entity_type="order",
        entity_id=order.id,
        description=f"Tao don {order.order_no} tai {payload.source.value}",
        payload={"source": payload.source.value, "branch_id": employee.branch_id},
    )
    db.commit()
    db.refresh(order)
    return order


def list_customer_orders(db: Session, customer_id: int) -> list[Order]:
    return db.scalars(
        select(Order).where(Order.customer_id == customer_id).order_by(Order.created_at.desc())
    ).all()


def get_customer_order(db: Session, customer_id: int, order_id: int) -> Order:
    order = db.scalar(select(Order).where(Order.id == order_id, Order.customer_id == customer_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def get_customer_order_by_no(db: Session, customer_id: int, order_no: str) -> Order:
    order = db.scalar(select(Order).where(Order.order_no == order_no, Order.customer_id == customer_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def cancel_order(db: Session, order: Order, actor: Customer | Employee, note: str | None = None) -> Order:
    if order.status != OrderStatus.PREPARING.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only preparing orders can be cancelled")
    actor_type, actor_id = _serialize_actor(actor)
    order.status = OrderStatus.CANCELLED.value
    order.payment_status = PaymentStatus.CANCELLED.value
    order.cancelled_at = datetime.utcnow()
    db.add(order)
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=OrderStatus.PREPARING.value,
            to_status=OrderStatus.CANCELLED.value,
            changed_by_actor_type=actor_type.value,
            changed_by_actor_id=actor_id,
            note=note or "Order cancelled",
        )
    )
    if isinstance(actor, Employee):
        create_employee_audit_log(
            db,
            employee=actor,
            action="order_cancelled",
            entity_type="order",
            entity_id=order.id,
            description=f"Huy don {order.order_no}",
            payload={"order_no": order.order_no, "branch_id": order.branch_id},
            branch_id=order.branch_id,
        )
    else:
        create_audit_log(
            db,
            actor_type=ActorType.CUSTOMER.value,
            actor_id=actor.id,
            actor_name=actor.full_name,
            branch_id=order.branch_id,
            action="customer_order_cancelled",
            entity_type="order",
            entity_id=order.id,
            description=f"Khach huy don {order.order_no}",
            payload={"order_no": order.order_no, "branch_id": order.branch_id},
        )
    db.commit()
    db.refresh(order)
    return order


def update_order_status(db: Session, order: Order, employee: Employee, new_status: OrderStatus, note: str | None = None) -> Order:
    allowed_transitions = {
        OrderStatus.PREPARING.value: {OrderStatus.READY.value, OrderStatus.CANCELLED.value},
        OrderStatus.READY.value: (
            {OrderStatus.COMPLETED.value}
            if order.fulfillment_method == FulfillmentMethod.PICKUP.value
            else set()
        ),
        OrderStatus.COMPLETED.value: set(),
        OrderStatus.CANCELLED.value: set(),
    }
    if new_status.value not in allowed_transitions[order.status]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status transition")

    previous_status = order.status
    order.status = new_status.value
    if new_status == OrderStatus.CANCELLED:
        order.payment_status = PaymentStatus.CANCELLED.value
        order.cancelled_at = datetime.utcnow()
    elif new_status == OrderStatus.READY:
        if order.customer_id:
            create_customer_notification(
                db,
                order.customer_id,
                "order_ready",
                f"Đơn {order.order_no} đã sẵn sàng",
                (
                    "Món của bạn đã được chuẩn bị xong. Hãy ghé chi nhánh để nhận món."
                    if order.fulfillment_method == FulfillmentMethod.PICKUP.value
                    else "Món của bạn đã sẵn sàng và đang chờ shipper nhận giao tới bạn."
                ),
            )
        if order.fulfillment_method == FulfillmentMethod.DELIVERY.value:
            from app.modules.deliveries import service as delivery_service

            delivery_service.ensure_delivery_for_ready_order(db, order, employee)
    elif new_status == OrderStatus.COMPLETED:
        finalize_order_completion(db, order)

    db.add(order)
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=previous_status,
            to_status=new_status.value,
            changed_by_actor_type=ActorType.EMPLOYEE.value,
            changed_by_actor_id=employee.id,
            note=note,
        )
    )
    create_employee_audit_log(
        db,
        employee=employee,
        action=f"order_status_{new_status.value}",
        entity_type="order",
        entity_id=order.id,
        description=f"Cap nhat don {order.order_no} sang {new_status.value}",
        payload={"from_status": previous_status, "to_status": new_status.value, "branch_id": order.branch_id},
        branch_id=order.branch_id,
    )
    db.commit()
    db.refresh(order)
    return order


def list_all_orders(db: Session, branch_id: int | None = None) -> list[Order]:
    query = select(Order)
    if branch_id is not None:
        query = query.where(Order.branch_id == branch_id)
    return db.scalars(query.order_by(Order.created_at.desc())).all()


def get_order_history(db: Session, order_id: int) -> list[OrderStatusHistory]:
    return db.scalars(
        select(OrderStatusHistory).where(OrderStatusHistory.order_id == order_id).order_by(OrderStatusHistory.changed_at.asc())
    ).all()
