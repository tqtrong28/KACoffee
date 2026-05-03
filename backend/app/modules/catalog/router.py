from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import ProductType
from app.db.session import get_db
from app.modules.catalog.models import Category, Product
from app.modules.catalog.schemas import CategoryResponse, ProductResponse

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Annotated[Session, Depends(get_db)]) -> list[Category]:
    return db.scalars(
        select(Category).where(Category.is_active.is_(True)).order_by(Category.display_order, Category.name)
    ).all()


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    category_id: int | None = None,
    product_type: ProductType | None = None,
    online_only: bool = Query(default=False),
) -> list[ProductResponse]:
    query = select(Product).where(Product.is_active.is_(True))
    if category_id:
        query = query.where(Product.category_id == category_id)
    if product_type:
        query = query.where(Product.product_type == product_type.value)
    if online_only:
        query = query.where(Product.is_online_available.is_(True))
    products = db.scalars(query.order_by(Product.created_at.desc())).all()
    return [
        ProductResponse(
            id=product.id,
            category_id=product.category_id,
            category_name=product.category.name,
            name=product.name,
            slug=product.slug,
            description=product.description,
            product_type=ProductType(product.product_type),
            price_vnd=product.price_vnd,
            small_price_vnd=product.small_price_vnd,
            large_price_vnd=product.large_price_vnd,
            image_url=product.image_url,
            badge_text=product.badge_text,
            flavor_note=product.flavor_note,
            is_featured=product.is_featured,
            is_active=product.is_active,
            track_inventory=product.track_inventory,
            inventory_qty=product.inventory_qty,
            is_online_available=product.is_online_available,
            is_in_store_available=product.is_in_store_available,
            created_at=product.created_at,
        )
        for product in products
    ]


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)]) -> ProductResponse:
    product = db.get(Product, product_id)
    if not product:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductResponse(
        id=product.id,
        category_id=product.category_id,
        category_name=product.category.name,
        name=product.name,
        slug=product.slug,
        description=product.description,
        product_type=ProductType(product.product_type),
        price_vnd=product.price_vnd,
        small_price_vnd=product.small_price_vnd,
        large_price_vnd=product.large_price_vnd,
        image_url=product.image_url,
        badge_text=product.badge_text,
        flavor_note=product.flavor_note,
        is_featured=product.is_featured,
        is_active=product.is_active,
        track_inventory=product.track_inventory,
        inventory_qty=product.inventory_qty,
        is_online_available=product.is_online_available,
        is_in_store_available=product.is_in_store_available,
        created_at=product.created_at,
    )
