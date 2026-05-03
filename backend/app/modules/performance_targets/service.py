from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.common.enums import RoleCode
from app.modules.admin.models import Branch
from app.modules.performance_targets.models import BranchTargetPolicy, RoleTargetPolicy


def _normalize_role_code(role_code: str) -> str:
    normalized = role_code.strip().lower()
    if normalized not in {RoleCode.EMPLOYEE.value, RoleCode.MANAGER.value, RoleCode.SHIPPER.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported role for target policy")
    return normalized


def list_role_target_policies(db: Session) -> list[RoleTargetPolicy]:
    return db.scalars(select(RoleTargetPolicy).order_by(RoleTargetPolicy.role_code.asc())).all()


def create_role_target_policy(db: Session, payload) -> RoleTargetPolicy:
    role_code = _normalize_role_code(payload.role_code)
    existing = db.scalar(select(RoleTargetPolicy).where(RoleTargetPolicy.role_code == role_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role target policy already exists")

    policy = RoleTargetPolicy(role_code=role_code, **payload.model_dump(exclude={"role_code"}))
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def update_role_target_policy(db: Session, policy: RoleTargetPolicy, payload) -> RoleTargetPolicy:
    policy.role_code = _normalize_role_code(payload.role_code)
    for key, value in payload.model_dump(exclude={"role_code"}).items():
        setattr(policy, key, value)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def list_branch_target_policies(db: Session) -> list[BranchTargetPolicy]:
    return db.scalars(
        select(BranchTargetPolicy)
        .options(selectinload(BranchTargetPolicy.branch))
        .order_by(BranchTargetPolicy.branch_id.asc())
    ).all()


def create_branch_target_policy(db: Session, payload) -> BranchTargetPolicy:
    branch = db.get(Branch, payload.branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    existing = db.scalar(select(BranchTargetPolicy).where(BranchTargetPolicy.branch_id == payload.branch_id))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch target policy already exists")

    policy = BranchTargetPolicy(**payload.model_dump())
    db.add(policy)
    db.commit()
    return get_branch_target_policy(db, policy.id)


def get_branch_target_policy(db: Session, policy_id: int) -> BranchTargetPolicy:
    policy = db.scalar(
        select(BranchTargetPolicy)
        .options(selectinload(BranchTargetPolicy.branch))
        .where(BranchTargetPolicy.id == policy_id)
    )
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch target policy not found")
    return policy


def update_branch_target_policy(db: Session, policy: BranchTargetPolicy, payload) -> BranchTargetPolicy:
    branch = db.get(Branch, payload.branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    existing = db.scalar(
        select(BranchTargetPolicy).where(
            BranchTargetPolicy.branch_id == payload.branch_id,
            BranchTargetPolicy.id != policy.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Branch target policy already exists")

    for key, value in payload.model_dump().items():
        setattr(policy, key, value)
    db.add(policy)
    db.commit()
    return get_branch_target_policy(db, policy.id)
