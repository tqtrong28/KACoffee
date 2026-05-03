from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.models import Employee
from app.modules.auth.deps import require_system_admin
from app.modules.system_settings.schemas import (
    PublicSystemSettingsResponse,
    SystemSettingsResponse,
    SystemSettingsUpdateRequest,
)
from app.modules.system_settings.service import get_or_create_settings, update_settings

router = APIRouter(prefix="/system-settings", tags=["system-settings"])
admin_router = APIRouter(prefix="/admin/system-settings", tags=["admin-system-settings"])


@router.get("/public", response_model=PublicSystemSettingsResponse)
def get_public_system_settings(
    db: Annotated[Session, Depends(get_db)],
) -> PublicSystemSettingsResponse:
    settings = get_or_create_settings(db)
    return PublicSystemSettingsResponse(
        site_title=settings.site_title,
        brand_headline=settings.brand_headline,
        brand_subheadline=settings.brand_subheadline,
        support_phone=settings.support_phone,
        support_email=settings.support_email,
        delivery_fee_vnd=settings.delivery_fee_vnd,
        public_notice=settings.public_notice,
    )


@admin_router.get("", response_model=SystemSettingsResponse)
def get_admin_system_settings(
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> SystemSettingsResponse:
    return get_or_create_settings(db)


@admin_router.patch("", response_model=SystemSettingsResponse)
def patch_admin_system_settings(
    payload: SystemSettingsUpdateRequest,
    _: Annotated[Employee, Depends(require_system_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> SystemSettingsResponse:
    return update_settings(db, payload)
