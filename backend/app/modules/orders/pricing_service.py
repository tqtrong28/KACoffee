from fastapi import HTTPException, status

from app.common.enums import FulfillmentMethod
from app.common.validators import is_hanoi_city


def calculate_delivery_fee(fulfillment_method: FulfillmentMethod, city: str | None, delivery_fee_vnd: int) -> int:
    if fulfillment_method == FulfillmentMethod.PICKUP:
        return 0
    if not is_hanoi_city(city):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery is only available in Hanoi for Phase 1",
        )
    return delivery_fee_vnd
