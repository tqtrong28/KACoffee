import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import ActorType
from app.modules.admin.models import Employee
from app.modules.audit_logs.models import AuditLog


def create_audit_log(
    db: Session,
    *,
    actor_type: str,
    actor_id: int,
    actor_name: str | None,
    branch_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int,
    description: str | None = None,
    payload: dict | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        actor_name=actor_name,
        branch_id=branch_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        payload_json=json.dumps(payload, ensure_ascii=False) if payload else None,
    )
    db.add(audit_log)
    return audit_log


def create_employee_audit_log(
    db: Session,
    *,
    employee: Employee,
    action: str,
    entity_type: str,
    entity_id: int,
    description: str | None = None,
    payload: dict | None = None,
    branch_id: int | None = None,
) -> AuditLog:
    return create_audit_log(
        db,
        actor_type=ActorType.EMPLOYEE.value,
        actor_id=employee.id,
        actor_name=employee.full_name,
        branch_id=branch_id if branch_id is not None else employee.branch_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        payload=payload,
    )


def list_audit_logs(db: Session, branch_id: int | None = None, action: str | None = None, query: str | None = None) -> list[AuditLog]:
    stmt = select(AuditLog)
    if branch_id is not None:
        stmt = stmt.where(AuditLog.branch_id == branch_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if query:
        normalized = f"%{query.strip()}%"
        stmt = stmt.where(
            AuditLog.description.ilike(normalized)
            | AuditLog.actor_name.ilike(normalized)
            | AuditLog.entity_type.ilike(normalized)
            | AuditLog.action.ilike(normalized)
        )
    return db.scalars(stmt.order_by(AuditLog.created_at.desc())).all()
