from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.deliveries.models import Delivery
from app.modules.admin.models import Employee
from app.modules.auth.deps import require_manager_or_admin, resolve_branch_scope
from app.modules.orders.models import Order
from app.modules.reporting import service
from app.modules.reporting.schemas import (
    BranchTargetProgressPoint,
    DeliveryPerformancePoint,
    EmployeePerformancePoint,
    RevenueReportPoint,
)

router = APIRouter(prefix="/admin/reports", tags=["reporting"])


@router.get("/revenue", response_model=list[RevenueReportPoint])
def revenue_report(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[RevenueReportPoint]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    filters = [Order.branch_id == scoped_branch_id] if scoped_branch_id is not None else []
    rows = db.execute(
        select(
            func.date(Order.completed_at).label("report_date"),
            func.count(Order.id).label("completed_orders"),
            func.coalesce(func.sum(Order.total_vnd), 0).label("revenue_vnd"),
        )
        .where(Order.status == "completed", Order.completed_at.is_not(None), *filters)
        .group_by(func.date(Order.completed_at))
        .order_by(func.date(Order.completed_at).desc())
    ).all()
    return [
        RevenueReportPoint(
            report_date=str(row.report_date),
            completed_orders=int(row.completed_orders),
            revenue_vnd=int(row.revenue_vnd),
        )
        for row in rows
    ]


@router.get("/delivery-performance", response_model=list[DeliveryPerformancePoint])
def delivery_performance_report(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[DeliveryPerformancePoint]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    filters = [Delivery.branch_id == scoped_branch_id] if scoped_branch_id is not None else []
    rows = db.execute(
        select(
            Delivery.status.label("status"),
            func.count(Delivery.id).label("deliveries"),
        )
        .where(*filters)
        .group_by(Delivery.status)
        .order_by(Delivery.status.asc())
    ).all()
    return [
        DeliveryPerformancePoint(
            status=str(row.status),
            deliveries=int(row.deliveries),
        )
        for row in rows
    ]


@router.get("/employee-performance", response_model=list[EmployeePerformancePoint])
def employee_performance_report(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[EmployeePerformancePoint]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    return service.get_employee_performance_report(db, scoped_branch_id)


@router.get("/branch-target-progress", response_model=list[BranchTargetProgressPoint])
def branch_target_progress_report(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> list[BranchTargetProgressPoint]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    return service.get_branch_target_progress_report(db, scoped_branch_id)
