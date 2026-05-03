from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import get_current_customer, require_system_admin
from app.modules.customers.models import Customer
from app.modules.discounts import service
from app.modules.discounts.models import Discount
from app.modules.discounts.schemas import (
    DiscountCreateRequest,
    DiscountResponse,
    DiscountUpdateRequest,
    DiscountValidationRequest,
    DiscountValidationResponse,
)

router = APIRouter(prefix="/discounts", tags=["discounts"])
admin_router = APIRouter(prefix="/admin/discounts", tags=["admin-discounts"])


@router.get("/me/available", response_model=list[DiscountResponse])
def get_available_discounts(
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[DiscountResponse]:
    return [service.serialize_discount(db, discount) for discount in service.list_available_discounts_for_customer(db, customer)]


@router.post("/validate", response_model=DiscountValidationResponse)
def validate_discount(
    payload: DiscountValidationRequest,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> DiscountValidationResponse:
    applied = service.validate_discount_for_customer(db, payload.code, customer, payload.subtotal_vnd)
    return DiscountValidationResponse(
        code=applied.discount.code,
        discount_amount_vnd=applied.discount_amount_vnd,
        final_subtotal_vnd=payload.subtotal_vnd - applied.discount_amount_vnd,
        description=applied.discount.description,
    )


@admin_router.get("", response_model=list[DiscountResponse])
def list_discounts(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[DiscountResponse]:
    return [service.serialize_discount(db, discount) for discount in service.list_discounts(db)]


@admin_router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountCreateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DiscountResponse:
    discount = service.create_discount(db, payload)
    return service.serialize_discount(db, discount)


@admin_router.patch("/{discount_id}", response_model=DiscountResponse)
def update_discount(
    discount_id: int,
    payload: DiscountUpdateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> DiscountResponse:
    discount = db.get(Discount, discount_id)
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")
    updated = service.update_discount(db, discount, payload)
    return service.serialize_discount(db, updated)
