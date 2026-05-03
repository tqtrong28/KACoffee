from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.enums import ActorType
from app.db.session import get_db
from app.modules.auth import service
from app.modules.auth.deps import get_current_payload
from app.modules.auth.schemas import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    EmployeeLoginRequest,
    LogoutRequest,
    MeResponse,
    RefreshRequest,
    TokenResponse,
)
from app.modules.customers.models import Customer
from app.modules.admin.models import Employee

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/customers/register", response_model=TokenResponse)
def register_customer(payload: CustomerRegisterRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    customer = service.register_customer(
        db,
        phone=payload.phone,
        password=payload.password,
        full_name=payload.full_name,
        email=payload.email,
    )
    return service.issue_tokens(db, ActorType.CUSTOMER, customer.id)


@router.post("/customers/login", response_model=TokenResponse)
def login_customer(payload: CustomerLoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    customer = service.authenticate_customer(db, payload.phone, payload.password)
    return service.issue_tokens(db, ActorType.CUSTOMER, customer.id)


@router.post("/employees/login", response_model=TokenResponse)
def login_employee(payload: EmployeeLoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    employee = service.authenticate_employee(db, payload.username, payload.password)
    return service.issue_tokens(db, ActorType.EMPLOYEE, employee.id, role=employee.role.code)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    return service.refresh_access_token(db, payload.refresh_token)


@router.post("/logout")
def logout(payload: LogoutRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    service.revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Logged out"}


@router.get("/me", response_model=MeResponse)
def get_me(
    payload: Annotated[dict, Depends(get_current_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    if payload["actor_type"] == ActorType.CUSTOMER.value:
        customer = db.get(Customer, int(payload["sub"]))
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return MeResponse(
            actor_type=ActorType.CUSTOMER,
            id=customer.id,
            phone=customer.phone,
            full_name=customer.full_name,
            membership_rank=customer.membership_rank.name,
            total_points=customer.total_points,
        )
    employee = db.get(Employee, int(payload["sub"]))
    if employee:
        return MeResponse(
            actor_type=ActorType.EMPLOYEE,
            id=employee.id,
            username=employee.username,
            full_name=employee.full_name,
            role=employee.role.code,
            branch_id=employee.branch_id,
            branch_name=employee.branch.name,
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
