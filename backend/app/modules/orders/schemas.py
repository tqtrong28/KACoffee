from datetime import datetime

from pydantic import BaseModel, Field

from app.common.enums import (
    FulfillmentMethod,
    IceLevel,
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    ProductSize,
    ProductType,
    ServingOption,
    SugarLevel,
)


class OnlineOrderItemCreateRequest(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=50)
    size_option: ProductSize = ProductSize.MEDIUM
    ice_level: IceLevel = IceLevel.NORMAL_ICE
    sugar_level: SugarLevel = SugarLevel.NORMAL_SUGAR
    note: str | None = Field(default=None, max_length=255)


class StaffOrderItemCreateRequest(OnlineOrderItemCreateRequest):
    serving_option: ServingOption = ServingOption.TAKEAWAY


class BaseOrderCreateRequest(BaseModel):
    fulfillment_method: FulfillmentMethod
    recipient_name: str = Field(min_length=1, max_length=100)
    recipient_phone: str = Field(min_length=8, max_length=20)
    address_line: str | None = Field(default=None, max_length=255)
    ward: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    discount_code: str | None = Field(default=None, max_length=50)
    note: str | None = Field(default=None, max_length=500)
class OrderCreateRequest(BaseOrderCreateRequest):
    branch_id: int
    items: list[OnlineOrderItemCreateRequest]


class StaffOrderCreateRequest(BaseOrderCreateRequest):
    source: OrderSource
    customer_phone: str | None = Field(default=None, max_length=20)
    items: list[StaffOrderItemCreateRequest]


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name_snapshot: str
    product_type_snapshot: ProductType
    serving_option: ServingOption
    size_option: ProductSize
    ice_level: IceLevel
    sugar_level: SugarLevel
    unit_price_vnd: int
    quantity: int
    line_total_vnd: int
    is_free_item: bool
    note: str | None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_no: str
    source: str
    branch_id: int
    branch_name: str
    customer_id: int | None = None
    customer_full_name: str | None = None
    customer_phone: str | None = None
    created_by_employee_id: int | None = None
    fulfillment_method: FulfillmentMethod
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    subtotal_vnd: int
    discount_code_snapshot: str | None = None
    discount_amount_vnd: int
    delivery_fee_vnd: int
    total_vnd: int
    recipient_name: str
    recipient_phone: str
    address_line: str | None
    ward: str | None
    district: str | None
    city: str | None
    note: str | None
    created_at: datetime
    completed_at: datetime | None
    cancelled_at: datetime | None
    items: list[OrderItemResponse]


class OrderStatusHistoryResponse(BaseModel):
    id: int
    from_status: str | None
    to_status: str
    changed_by_actor_type: str
    changed_by_actor_id: int
    note: str | None
    changed_at: datetime

    model_config = {"from_attributes": True}


class OrderTrackingResponse(BaseModel):
    order: OrderResponse
    history: list[OrderStatusHistoryResponse]


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=255)
