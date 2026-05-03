from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.common.enums import ActorType, RoleCode
from app.core.security import decode_token
from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.customers.models import Customer

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    if payload.get("token_type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    return payload


def get_current_customer(
    payload: Annotated[dict[str, Any], Depends(get_current_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> Customer:
    if payload.get("actor_type") != ActorType.CUSTOMER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required")
    customer = db.get(Customer, int(payload["sub"]))
    if not customer or not customer.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer not found")
    return customer


def get_current_employee(
    payload: Annotated[dict[str, Any], Depends(get_current_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> Employee:
    if payload.get("actor_type") != ActorType.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")
    employee = db.get(Employee, int(payload["sub"]))
    if not employee or not employee.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    return employee


def require_admin(employee: Annotated[Employee, Depends(get_current_employee)]) -> Employee:
    if employee.role.code not in {RoleCode.ADMIN.value, RoleCode.MANAGER.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return employee


def require_manager_or_admin(employee: Annotated[Employee, Depends(get_current_employee)]) -> Employee:
    if employee.role.code not in {RoleCode.ADMIN.value, RoleCode.MANAGER.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or admin access required")
    return employee


def require_system_admin(employee: Annotated[Employee, Depends(get_current_employee)]) -> Employee:
    if employee.role.code != RoleCode.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System admin access required")
    return employee


def require_staff(employee: Annotated[Employee, Depends(get_current_employee)]) -> Employee:
    if employee.role.code not in {RoleCode.EMPLOYEE.value, RoleCode.MANAGER.value, RoleCode.ADMIN.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return employee


def require_shipper(employee: Annotated[Employee, Depends(get_current_employee)]) -> Employee:
    if employee.role.code != RoleCode.SHIPPER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Shipper access required")
    return employee


def is_system_admin(employee: Employee) -> bool:
    return employee.role.code == RoleCode.ADMIN.value


def resolve_branch_scope(employee: Employee, requested_branch_id: int | None = None) -> int | None:
    if employee.role.code == RoleCode.MANAGER.value:
        if requested_branch_id is not None and requested_branch_id != employee.branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager can only access their own branch")
        return employee.branch_id
    return requested_branch_id


def ensure_same_branch(employee: Employee, branch_id: int) -> None:
    if employee.role.code in {RoleCode.EMPLOYEE.value, RoleCode.MANAGER.value, RoleCode.SHIPPER.value} and employee.branch_id != branch_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This action is limited to your branch")
