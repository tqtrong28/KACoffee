from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.common.enums import ProductType
from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.audit_logs.service import create_employee_audit_log
from app.modules.admin.schemas import (
    CategoryCreateRequest,
    CategoryUpdateRequest,
    ProductCreateRequest,
    ProductUpdateRequest,
)
from app.modules.auth.deps import require_manager_or_admin, require_system_admin, resolve_branch_scope
from app.modules.catalog.models import Category, Product
from app.modules.catalog.schemas import CategoryResponse, ProductResponse
from app.modules.customers.models import Customer
from app.modules.orders.models import Order

router = APIRouter(prefix="/admin", tags=["admin"])


def _to_product_response(product: Product) -> ProductResponse:
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


@router.get("/dashboard/summary")
def get_dashboard_summary(
    employee: Annotated[Employee, Depends(require_manager_or_admin)],
    db: Annotated[Session, Depends(get_db)],
    branch_id: int | None = None,
) -> dict[str, int]:
    scoped_branch_id = resolve_branch_scope(employee, branch_id)
    order_filter = [Order.branch_id == scoped_branch_id] if scoped_branch_id is not None else []
    total_orders = db.scalar(select(func.count(Order.id)).where(*order_filter)) or 0
    completed_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "completed", *order_filter)) or 0
    preparing_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "preparing", *order_filter)) or 0
    ready_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "ready", *order_filter)) or 0
    cancelled_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "cancelled", *order_filter)) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total_vnd), 0)).where(Order.status == "completed", *order_filter)) or 0
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_categories = db.scalar(select(func.count(Category.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "preparing_orders": preparing_orders,
        "ready_orders": ready_orders,
        "cancelled_orders": cancelled_orders,
        "revenue_vnd": revenue,
        "total_products": total_products,
        "total_categories": total_categories,
        "total_customers": total_customers,
    }


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    db.flush()
    create_employee_audit_log(
        db,
        employee=admin,
        action="category_created",
        entity_type="category",
        entity_id=category.id,
        description=f"Tao danh muc {category.name}",
    )
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    db.add(category)
    create_employee_audit_log(
        db,
        employee=admin,
        action="category_updated",
        entity_type="category",
        entity_id=category.id,
        description=f"Cap nhat danh muc {category.name}",
    )
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductResponse:
    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()
    create_employee_audit_log(
        db,
        employee=admin,
        action="product_created",
        entity_type="product",
        entity_id=product.id,
        description=f"Tao san pham {product.name}",
    )
    db.commit()
    db.refresh(product)
    return _to_product_response(product)


@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdateRequest,
    admin: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductResponse:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    db.add(product)
    create_employee_audit_log(
        db,
        employee=admin,
        action="product_updated",
        entity_type="product",
        entity_id=product.id,
        description=f"Cap nhat san pham {product.name}",
    )
    db.commit()
    db.refresh(product)
    return _to_product_response(product)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
