from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.audit_logs.schemas import AuditLogResponse
from app.modules.audit_logs import service
from app.modules.auth.deps import require_manager_or_admin, resolve_branch_scope

router = APIRouter(prefix="/admin/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogResponse])
def list_admin_audit_logs(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
    action: str | None = None,
    query: str | None = None,
) -> list[AuditLogResponse]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    return [AuditLogResponse.model_validate(item) for item in service.list_audit_logs(db, scoped_branch_id, action, query)]
