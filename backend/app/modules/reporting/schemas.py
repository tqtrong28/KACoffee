from pydantic import BaseModel


class RevenueReportPoint(BaseModel):
    report_date: str
    completed_orders: int
    revenue_vnd: int


class DeliveryPerformancePoint(BaseModel):
    status: str
    deliveries: int


class EmployeePerformancePoint(BaseModel):
    employee_id: int
    employee_name: str
    role_code: str
    branch_id: int
    branch_name: str
    monthly_order_target: int
    monthly_revenue_target_vnd: int
    monthly_delivery_target: int
    actual_orders: int
    actual_revenue_vnd: int
    actual_deliveries: int
    estimated_commission_vnd: int
    met_target: bool


class BranchTargetProgressPoint(BaseModel):
    branch_id: int
    branch_name: str
    monthly_order_target: int
    monthly_revenue_target_vnd: int
    actual_orders: int
    actual_revenue_vnd: int
    estimated_bonus_vnd: int
    met_target: bool
