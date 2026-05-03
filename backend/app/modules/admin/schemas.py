from pydantic import BaseModel, Field

from app.common.enums import ProductType


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    description: str | None = None
    display_order: int = 0
    is_active: bool = True


class CategoryUpdateRequest(CategoryCreateRequest):
    pass


class ProductCreateRequest(BaseModel):
    category_id: int
    name: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=150)
    description: str | None = None
    product_type: ProductType
    price_vnd: int = Field(ge=0)
    small_price_vnd: int | None = Field(default=None, ge=0)
    large_price_vnd: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    badge_text: str | None = Field(default=None, max_length=80)
    flavor_note: str | None = Field(default=None, max_length=120)
    is_featured: bool = False
    is_active: bool = True
    track_inventory: bool = False
    inventory_qty: int = Field(default=0, ge=0)
    is_online_available: bool = True
    is_in_store_available: bool = True


class ProductUpdateRequest(ProductCreateRequest):
    pass
