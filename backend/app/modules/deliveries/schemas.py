from datetime import datetime

from pydantic import BaseModel, Field

from app.common.enums import DeliveryStatus


class DeliveryAssignRequest(BaseModel):
    shipper_employee_id: int
    note: str | None = Field(default=None, max_length=255)


class DeliveryFailRequest(BaseModel):
    failure_reason: str = Field(min_length=1, max_length=255)


class DeliveryStatusHistoryResponse(BaseModel):
    id: int
    from_status: str | None
    to_status: str
    changed_by_employee_id: int
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliveryAdminResponse(BaseModel):
    id: int
    order_id: int
    order_no: str
    branch_id: int
    branch_name: str
    shipper_employee_id: int | None
    shipper_name: str | None
    status: DeliveryStatus
    delivery_note: str | None
    failure_reason: str | None
    recipient_name: str
    recipient_phone: str
    address_line: str | None
    ward: str | None
    district: str | None
    city: str | None
    created_at: datetime
    assigned_at: datetime | None
    picked_up_at: datetime | None
    delivering_at: datetime | None
    delivered_at: datetime | None
    failed_at: datetime | None
    history: list[DeliveryStatusHistoryResponse] | None = None


class DeliveryShipperResponse(BaseModel):
    id: int
    order_id: int
    order_no: str
    status: DeliveryStatus
    delivery_note: str | None
    failure_reason: str | None
    recipient_name: str
    recipient_phone: str
    address_line: str | None
    ward: str | None
    district: str | None
    city: str | None
    item_summary: list[str]
    assigned_at: datetime | None
    picked_up_at: datetime | None
    delivering_at: datetime | None
    delivered_at: datetime | None
    failed_at: datetime | None
    history: list[DeliveryStatusHistoryResponse] | None = None
