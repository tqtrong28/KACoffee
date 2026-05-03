from datetime import datetime

from pydantic import BaseModel

from app.common.enums import ProductType


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    display_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: int
    category_id: int
    category_name: str
    name: str
    slug: str
    description: str | None
    product_type: ProductType
    price_vnd: int
    small_price_vnd: int | None
    large_price_vnd: int | None
    image_url: str | None
    badge_text: str | None
    flavor_note: str | None
    is_featured: bool
    is_active: bool
    track_inventory: bool
    inventory_qty: int
    is_online_available: bool
    is_in_store_available: bool
    created_at: datetime


class ProductListResponse(ProductResponse):
    pass
