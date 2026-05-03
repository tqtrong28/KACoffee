from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import RoleCode
from app.core.security import get_password_hash
from app.db.session import get_db
from app.modules.admin.models import Branch, Employee, Role
from app.modules.audit_logs.service import create_employee_audit_log
from app.modules.auth.deps import get_current_employee, require_manager_or_admin, resolve_branch_scope
from app.modules.customers.models import Customer
from app.modules.employees.schemas import (
    EmployeeCreateRequest,
    EmployeeResponse,
    EmployeeUpdateRequest,
    StaffCustomerLookupResponse,
)

router = APIRouter(tags=["employees"])


def _to_employee_response(employee: Employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=employee.id,
        username=employee.username,
        full_name=employee.full_name,
        phone=employee.phone,
        role=employee.role.code,
        branch_id=employee.branch_id,
        branch_name=employee.branch.name,
        is_active=employee.is_active,
    )


def _resolve_manageable_role(db: Session, role_code: str, actor: Employee) -> Role:
    allowed_roles = {RoleCode.EMPLOYEE.value, RoleCode.SHIPPER.value}
    if actor.role.code == RoleCode.ADMIN.value:
        allowed_roles = {RoleCode.EMPLOYEE.value, RoleCode.SHIPPER.value, RoleCode.MANAGER.value, RoleCode.ADMIN.value}
    if role_code not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage this role")
    role = db.scalar(select(Role).where(Role.code == role_code, Role.is_active.is_(True)))
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
    return role


def _resolve_manageable_branch(db: Session, requested_branch_id: int, actor: Employee) -> Branch:
    scoped_branch_id = resolve_branch_scope(actor, requested_branch_id)
    if scoped_branch_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch is required")
    branch = db.scalar(select(Branch).where(Branch.id == scoped_branch_id, Branch.is_active.is_(True)))
    if not branch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch not found")
    return branch


@router.get("/employees/me", response_model=EmployeeResponse)
def get_employee_me(employee: Annotated[Employee, Depends(get_current_employee)]) -> EmployeeResponse:
    return _to_employee_response(employee)


@router.get("/staff/customers/search", response_model=StaffCustomerLookupResponse)
def search_customer_by_phone(
    phone: str,
    _: Annotated[Employee, Depends(get_current_employee)],
    db: Annotated[Session, Depends(get_db)],
) -> StaffCustomerLookupResponse:
    customer = db.scalar(select(Customer).where(Customer.phone == phone, Customer.is_active.is_(True)))
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return StaffCustomerLookupResponse(
        id=customer.id,
        phone=customer.phone,
        full_name=customer.full_name,
        membership_rank=customer.membership_rank.name,
        total_points=customer.total_points,
    )


@router.get("/admin/employees", response_model=list[EmployeeResponse])
def list_employees(
    actor: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[EmployeeResponse]:
    scoped_branch_id = resolve_branch_scope(actor, branch_id)
    query = select(Employee)
    if scoped_branch_id is not None:
        query = query.where(Employee.branch_id == scoped_branch_id)
    if actor.role.code == RoleCode.MANAGER.value:
        query = query.join(Role, Employee.role_id == Role.id).where(Role.code.in_([RoleCode.EMPLOYEE.value, RoleCode.SHIPPER.value]))
    employees = db.scalars(query.order_by(Employee.created_at.desc())).all()
    return [_to_employee_response(employee) for employee in employees]


@router.post("/admin/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreateRequest,
    admin: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> EmployeeResponse:
    if db.scalar(select(Employee).where(Employee.username == payload.username)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    role = _resolve_manageable_role(db, payload.role_code, admin)
    branch = _resolve_manageable_branch(db, payload.branch_id, admin)
    employee = Employee(
        branch_id=branch.id,
        role_id=role.id,
        username=payload.username,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        is_active=True,
    )
    db.add(employee)
    db.flush()
    create_employee_audit_log(
        db,
        employee=admin,
        action="employee_created",
        entity_type="employee",
        entity_id=employee.id,
        description=f"Tao tai khoan {employee.username} cho vai tro {payload.role_code}",
        payload={"role_code": payload.role_code, "branch_id": branch.id},
        branch_id=branch.id,
    )
    db.commit()
    db.refresh(employee)
    return _to_employee_response(employee)


@router.patch("/admin/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdateRequest,
    actor: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> EmployeeResponse:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if actor.role.code == RoleCode.MANAGER.value and employee.branch_id != actor.branch_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager can only manage employees in their own branch")
    role = _resolve_manageable_role(db, payload.role_code, actor)
    branch = _resolve_manageable_branch(db, payload.branch_id, actor)
    employee.full_name = payload.full_name
    employee.phone = payload.phone
    employee.role_id = role.id
    employee.branch_id = branch.id
    employee.is_active = payload.is_active
    if payload.password:
        employee.password_hash = get_password_hash(payload.password)
    db.add(employee)
    create_employee_audit_log(
        db,
        employee=actor,
        action="employee_updated",
        entity_type="employee",
        entity_id=employee.id,
        description=f"Cap nhat tai khoan {employee.username}",
        payload={"role_code": payload.role_code, "branch_id": branch.id, "is_active": payload.is_active},
        branch_id=branch.id,
    )
    db.commit()
    db.refresh(employee)
    return _to_employee_response(employee)
