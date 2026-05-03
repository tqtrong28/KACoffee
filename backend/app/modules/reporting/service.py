from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.common.enums import RoleCode
from app.modules.admin.models import Branch, Employee
from app.modules.deliveries.models import Delivery
from app.modules.orders.models import Order
from app.modules.performance_targets.models import BranchTargetPolicy, RoleTargetPolicy
from app.modules.reporting.schemas import BranchTargetProgressPoint, EmployeePerformancePoint


def _current_month_range() -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    if now.month == 12:
        end = datetime(now.year + 1, 1, 1)
    else:
        end = datetime(now.year, now.month + 1, 1)
    return start, end


def _meets_target(actual: int, target: int) -> bool:
    return target <= 0 or actual >= target


def _calculate_role_commission(
    policy: RoleTargetPolicy | None,
    *,
    actual_orders: int,
    actual_revenue_vnd: int,
    actual_deliveries: int,
) -> tuple[int, bool]:
    if not policy or not policy.is_active:
        return 0, False

    met_target = all(
        [
            _meets_target(actual_orders, policy.monthly_order_target),
            _meets_target(actual_revenue_vnd, policy.monthly_revenue_target_vnd),
            _meets_target(actual_deliveries, policy.monthly_delivery_target),
        ]
    )
    extra_orders = max(actual_orders - policy.monthly_order_target, 0)
    extra_revenue = max(actual_revenue_vnd - policy.monthly_revenue_target_vnd, 0)
    extra_deliveries = max(actual_deliveries - policy.monthly_delivery_target, 0)
    commission = (
        extra_revenue * policy.bonus_rate_percent // 100
        + extra_orders * policy.bonus_per_extra_order_vnd
        + extra_deliveries * policy.bonus_per_extra_delivery_vnd
    )
    if met_target:
        commission += policy.bonus_flat_vnd
    return commission, met_target


def _calculate_branch_bonus(
    policy: BranchTargetPolicy | None,
    *,
    actual_orders: int,
    actual_revenue_vnd: int,
) -> tuple[int, bool]:
    if not policy or not policy.is_active:
        return 0, False

    met_target = _meets_target(actual_orders, policy.monthly_order_target) and _meets_target(
        actual_revenue_vnd,
        policy.monthly_revenue_target_vnd,
    )
    extra_revenue = max(actual_revenue_vnd - policy.monthly_revenue_target_vnd, 0)
    bonus = extra_revenue * policy.bonus_rate_percent // 100
    if met_target:
        bonus += policy.bonus_flat_vnd
    return bonus, met_target


def get_employee_performance_report(db: Session, branch_id: int | None = None) -> list[EmployeePerformancePoint]:
    period_start, period_end = _current_month_range()
    employee_query = (
        select(Employee)
        .options(selectinload(Employee.branch), selectinload(Employee.role))
        .where(Employee.is_active.is_(True), Employee.role_id.is_not(None))
    )
    if branch_id is not None:
        employee_query = employee_query.where(Employee.branch_id == branch_id)

    employees = db.scalars(employee_query.order_by(Employee.full_name.asc())).all()
    relevant_employees = [employee for employee in employees if employee.role.code in {RoleCode.EMPLOYEE.value, RoleCode.MANAGER.value, RoleCode.SHIPPER.value}]
    if not relevant_employees:
        return []

    role_policies = {
        policy.role_code: policy
        for policy in db.scalars(select(RoleTargetPolicy)).all()
    }

    order_filters = [
        Order.status == "completed",
        Order.completed_at.is_not(None),
        Order.completed_at >= period_start,
        Order.completed_at < period_end,
    ]
    if branch_id is not None:
        order_filters.append(Order.branch_id == branch_id)

    order_rows = db.execute(
        select(
            Order.created_by_employee_id.label("employee_id"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_vnd), 0).label("revenue"),
        )
        .where(Order.created_by_employee_id.is_not(None), *order_filters)
        .group_by(Order.created_by_employee_id)
    ).all()
    order_metrics = {
        int(row.employee_id): {
            "orders": int(row.orders),
            "revenue": int(row.revenue),
        }
        for row in order_rows
    }

    delivery_filters = [
        Delivery.status == "delivered",
        Delivery.delivered_at.is_not(None),
        Delivery.delivered_at >= period_start,
        Delivery.delivered_at < period_end,
    ]
    if branch_id is not None:
        delivery_filters.append(Delivery.branch_id == branch_id)

    delivery_rows = db.execute(
        select(
            Delivery.shipper_employee_id.label("employee_id"),
            func.count(Delivery.id).label("deliveries"),
        )
        .where(Delivery.shipper_employee_id.is_not(None), *delivery_filters)
        .group_by(Delivery.shipper_employee_id)
    ).all()
    delivery_metrics = {
        int(row.employee_id): int(row.deliveries)
        for row in delivery_rows
    }

    branch_rows = db.execute(
        select(
            Order.branch_id.label("branch_id"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_vnd), 0).label("revenue"),
        )
        .where(*order_filters)
        .group_by(Order.branch_id)
    ).all()
    branch_metrics = {
        int(row.branch_id): {
            "orders": int(row.orders),
            "revenue": int(row.revenue),
        }
        for row in branch_rows
    }

    report: list[EmployeePerformancePoint] = []
    for employee in relevant_employees:
        role_code = employee.role.code
        if role_code == RoleCode.MANAGER.value:
            actual_orders = branch_metrics.get(employee.branch_id, {}).get("orders", 0)
            actual_revenue_vnd = branch_metrics.get(employee.branch_id, {}).get("revenue", 0)
            actual_deliveries = 0
        else:
            actual_orders = order_metrics.get(employee.id, {}).get("orders", 0)
            actual_revenue_vnd = order_metrics.get(employee.id, {}).get("revenue", 0)
            actual_deliveries = delivery_metrics.get(employee.id, 0)

        policy = role_policies.get(role_code)
        estimated_commission_vnd, met_target = _calculate_role_commission(
            policy,
            actual_orders=actual_orders,
            actual_revenue_vnd=actual_revenue_vnd,
            actual_deliveries=actual_deliveries,
        )
        report.append(
            EmployeePerformancePoint(
                employee_id=employee.id,
                employee_name=employee.full_name,
                role_code=role_code,
                branch_id=employee.branch_id,
                branch_name=employee.branch.name,
                monthly_order_target=policy.monthly_order_target if policy else 0,
                monthly_revenue_target_vnd=policy.monthly_revenue_target_vnd if policy else 0,
                monthly_delivery_target=policy.monthly_delivery_target if policy else 0,
                actual_orders=actual_orders,
                actual_revenue_vnd=actual_revenue_vnd,
                actual_deliveries=actual_deliveries,
                estimated_commission_vnd=estimated_commission_vnd,
                met_target=met_target,
            )
        )
    return report


def get_branch_target_progress_report(db: Session, branch_id: int | None = None) -> list[BranchTargetProgressPoint]:
    period_start, period_end = _current_month_range()
    branch_query = select(Branch).where(Branch.is_active.is_(True))
    if branch_id is not None:
        branch_query = branch_query.where(Branch.id == branch_id)
    branches = db.scalars(branch_query.order_by(Branch.name.asc())).all()
    if not branches:
        return []

    policies = {
        policy.branch_id: policy
        for policy in db.scalars(
            select(BranchTargetPolicy).options(selectinload(BranchTargetPolicy.branch))
        ).all()
    }
    filters = [
        Order.status == "completed",
        Order.completed_at.is_not(None),
        Order.completed_at >= period_start,
        Order.completed_at < period_end,
    ]
    if branch_id is not None:
        filters.append(Order.branch_id == branch_id)
    rows = db.execute(
        select(
            Order.branch_id.label("branch_id"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_vnd), 0).label("revenue"),
        )
        .where(*filters)
        .group_by(Order.branch_id)
    ).all()
    branch_metrics = {
        int(row.branch_id): {
            "orders": int(row.orders),
            "revenue": int(row.revenue),
        }
        for row in rows
    }

    report: list[BranchTargetProgressPoint] = []
    for branch in branches:
        actual_orders = branch_metrics.get(branch.id, {}).get("orders", 0)
        actual_revenue_vnd = branch_metrics.get(branch.id, {}).get("revenue", 0)
        policy = policies.get(branch.id)
        estimated_bonus_vnd, met_target = _calculate_branch_bonus(
            policy,
            actual_orders=actual_orders,
            actual_revenue_vnd=actual_revenue_vnd,
        )
        report.append(
            BranchTargetProgressPoint(
                branch_id=branch.id,
                branch_name=branch.name,
                monthly_order_target=policy.monthly_order_target if policy else 0,
                monthly_revenue_target_vnd=policy.monthly_revenue_target_vnd if policy else 0,
                actual_orders=actual_orders,
                actual_revenue_vnd=actual_revenue_vnd,
                estimated_bonus_vnd=estimated_bonus_vnd,
                met_target=met_target,
            )
        )
    return report
