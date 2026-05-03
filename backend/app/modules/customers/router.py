from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.deps import get_current_customer
from app.modules.customers.models import Customer
from app.modules.customers.schemas import CustomerProfileResponse, CustomerProfileUpdateRequest

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/me", response_model=CustomerProfileResponse)
def get_profile(customer: Annotated[Customer, Depends(get_current_customer)]) -> CustomerProfileResponse:
    return CustomerProfileResponse(
        id=customer.id,
        phone=customer.phone,
        full_name=customer.full_name,
        email=customer.email,
        membership_rank=customer.membership_rank.name,
        total_points=customer.total_points,
        default_address_line=customer.default_address_line,
        default_ward=customer.default_ward,
        default_district=customer.default_district,
        default_city=customer.default_city,
        created_at=customer.created_at,
    )


@router.patch("/me", response_model=CustomerProfileResponse)
def update_profile(
    payload: CustomerProfileUpdateRequest,
    customer: Annotated[Customer, Depends(get_current_customer)],
    db: Annotated[Session, Depends(get_db)],
) -> CustomerProfileResponse:
    customer.full_name = payload.full_name
    customer.email = payload.email
    customer.default_address_line = payload.default_address_line
    customer.default_ward = payload.default_ward
    customer.default_district = payload.default_district
    customer.default_city = payload.default_city
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return get_profile(customer)
