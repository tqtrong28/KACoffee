from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.common.enums import ProductType
from app.modules.admin.models import Employee
from app.modules.audit_logs.service import create_employee_audit_log
from app.modules.bottle_exchange.models import BottleExchangeRecord
from app.modules.catalog.models import Product
from app.modules.customers.models import Customer


def create_exchange(
    db: Session,
    employee: Employee,
    customer_phone: str | None,
    returned_bottle_qty: int,
    reward_product_id: int,
    note: str | None,
) -> BottleExchangeRecord:
    if returned_bottle_qty % 5 != 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bottle exchange requires multiples of 5 bottles")

    reward_product = db.scalar(select(Product).where(Product.id == reward_product_id, Product.is_active.is_(True)))
    if not reward_product or reward_product.product_type != ProductType.BOTTLED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reward product must be an active bottled product")

    customer = None
    if customer_phone:
        customer = db.scalar(select(Customer).where(Customer.phone == customer_phone, Customer.is_active.is_(True)))
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    reward_quantity = returned_bottle_qty // 5
    record = BottleExchangeRecord(
        branch_id=employee.branch_id,
        customer_id=customer.id if customer else None,
        processed_by_employee_id=employee.id,
        returned_bottle_qty=returned_bottle_qty,
        reward_product_id=reward_product.id,
        reward_quantity=reward_quantity,
        customer_phone_snapshot=customer.phone if customer else customer_phone,
        reward_product_name_snapshot=reward_product.name,
        note=note,
    )
    db.add(record)
    db.flush()
    create_employee_audit_log(
        db,
        employee=employee,
        action="bottle_exchange_created",
        entity_type="bottle_exchange",
        entity_id=record.id,
        description=f"Ghi nhận đổi {returned_bottle_qty} vỏ chai tại chi nhánh",
        payload={"reward_product_id": reward_product.id, "reward_quantity": reward_quantity, "branch_id": employee.branch_id},
        branch_id=employee.branch_id,
    )
    db.commit()
    db.refresh(record)
    return get_exchange(db, record.id)


def list_exchanges(db: Session) -> list[BottleExchangeRecord]:
    return db.scalars(
        select(BottleExchangeRecord)
        .options(
            selectinload(BottleExchangeRecord.branch),
            selectinload(BottleExchangeRecord.customer),
            selectinload(BottleExchangeRecord.reward_product),
            selectinload(BottleExchangeRecord.processor),
        )
        .order_by(BottleExchangeRecord.created_at.desc())
    ).all()


def get_exchange(db: Session, exchange_id: int) -> BottleExchangeRecord:
    record = db.scalar(
        select(BottleExchangeRecord)
        .options(
            selectinload(BottleExchangeRecord.branch),
            selectinload(BottleExchangeRecord.customer),
            selectinload(BottleExchangeRecord.reward_product),
            selectinload(BottleExchangeRecord.processor),
        )
        .where(BottleExchangeRecord.id == exchange_id)
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bottle exchange not found")
    return record
