from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import require_system_admin
from app.modules.performance_targets import service
from app.modules.performance_targets.models import BranchTargetPolicy, RoleTargetPolicy
from app.modules.performance_targets.schemas import (
    BranchTargetPolicyCreateRequest,
    BranchTargetPolicyResponse,
    BranchTargetPolicyUpdateRequest,
    RoleTargetPolicyCreateRequest,
    RoleTargetPolicyResponse,
    RoleTargetPolicyUpdateRequest,
)

router = APIRouter(prefix="/admin/performance-targets", tags=["admin-performance-targets"])


def _to_branch_response(policy: BranchTargetPolicy) -> BranchTargetPolicyResponse:
    return BranchTargetPolicyResponse(
        id=policy.id,
        branch_id=policy.branch_id,
        branch_name=policy.branch.name,
        monthly_order_target=policy.monthly_order_target,
        monthly_revenue_target_vnd=policy.monthly_revenue_target_vnd,
        bonus_rate_percent=policy.bonus_rate_percent,
        bonus_flat_vnd=policy.bonus_flat_vnd,
        is_active=policy.is_active,
        updated_at=policy.updated_at,
    )


@router.get("/roles", response_model=list[RoleTargetPolicyResponse])
def list_role_targets(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[RoleTargetPolicy]:
    return service.list_role_target_policies(db)


@router.post("/roles", response_model=RoleTargetPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_role_target(
    payload: RoleTargetPolicyCreateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> RoleTargetPolicy:
    return service.create_role_target_policy(db, payload)


@router.patch("/roles/{policy_id}", response_model=RoleTargetPolicyResponse)
def update_role_target(
    policy_id: int,
    payload: RoleTargetPolicyUpdateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> RoleTargetPolicy:
    policy = db.get(RoleTargetPolicy, policy_id)
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role target policy not found")
    return service.update_role_target_policy(db, policy, payload)


@router.get("/branches", response_model=list[BranchTargetPolicyResponse])
def list_branch_targets(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[BranchTargetPolicyResponse]:
    return [_to_branch_response(policy) for policy in service.list_branch_target_policies(db)]


@router.post("/branches", response_model=BranchTargetPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_branch_target(
    payload: BranchTargetPolicyCreateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> BranchTargetPolicyResponse:
    return _to_branch_response(service.create_branch_target_policy(db, payload))


@router.patch("/branches/{policy_id}", response_model=BranchTargetPolicyResponse)
def update_branch_target(
    policy_id: int,
    payload: BranchTargetPolicyUpdateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> BranchTargetPolicyResponse:
    policy = db.get(BranchTargetPolicy, policy_id)
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch target policy not found")
    return _to_branch_response(service.update_branch_target_policy(db, policy, payload))
