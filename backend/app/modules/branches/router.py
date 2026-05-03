from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Branch, Employee
from app.modules.audit_logs.service import create_employee_audit_log
from app.modules.auth.deps import require_system_admin
from app.modules.branches.schemas import BranchCreateRequest, BranchResponse, BranchUpdateRequest

router = APIRouter(tags=["branches"])
admin_router = APIRouter(prefix="/admin/branches", tags=["admin-branches"])


@router.get("/branches", response_model=list[BranchResponse])
def list_branches(db: Annotated[Session, Depends(get_db)]) -> list[Branch]:
    return db.scalars(select(Branch).where(Branch.is_active.is_(True)).order_by(Branch.name.asc())).all()


@admin_router.get("", response_model=list[BranchResponse])
def list_admin_branches(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Branch]:
    return db.scalars(select(Branch).order_by(Branch.name.asc())).all()


@admin_router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Branch:
    existing = db.scalar(select(Branch).where(Branch.code == payload.code.strip().lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch code already exists")

    branch = Branch(
        code=payload.code.strip().lower(),
        name=payload.name.strip(),
        address=payload.address,
        city=payload.city,
        phone=payload.phone,
        opening_hours=payload.opening_hours,
        map_url=payload.map_url,
        image_url=payload.image_url,
        amenities_text=payload.amenities_text,
        is_active=payload.is_active,
    )
    db.add(branch)
    db.flush()
    create_employee_audit_log(
        db,
        employee=admin,
        action="branch_created",
        entity_type="branch",
        entity_id=branch.id,
        description=f"Tạo chi nhánh {branch.name}",
        payload={"code": branch.code, "is_active": branch.is_active},
        branch_id=branch.id,
    )
    db.commit()
    db.refresh(branch)
    return branch


@admin_router.patch("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: int,
    payload: BranchUpdateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Branch:
    branch = db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")

    normalized_code = payload.code.strip().lower()
    existing = db.scalar(select(Branch).where(Branch.code == normalized_code, Branch.id != branch_id))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch code already exists")

    branch.code = normalized_code
    branch.name = payload.name.strip()
    branch.address = payload.address
    branch.city = payload.city
    branch.phone = payload.phone
    branch.opening_hours = payload.opening_hours
    branch.map_url = payload.map_url
    branch.image_url = payload.image_url
    branch.amenities_text = payload.amenities_text
    branch.is_active = payload.is_active
    db.add(branch)
    create_employee_audit_log(
        db,
        employee=admin,
        action="branch_updated",
        entity_type="branch",
        entity_id=branch.id,
        description=f"Cập nhật chi nhánh {branch.name}",
        payload={"code": branch.code, "is_active": branch.is_active},
        branch_id=branch.id,
    )
    db.commit()
    db.refresh(branch)
    return branch
