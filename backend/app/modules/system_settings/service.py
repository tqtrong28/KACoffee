from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.system_settings.models import SystemSetting


DEFAULT_SETTINGS = {
    "site_title": "KACoffee",
    "brand_headline": "Cà phê chuẩn vị, phục vụ chỉn chu và một hệ thành viên dùng chung tại mọi chi nhánh KACoffee.",
    "brand_subheadline": (
        "Khám phá những món signature, đặt hàng trực tuyến nhanh gọn và tận hưởng quyền lợi thành viên "
        "đồng nhất ở bất kỳ chi nhánh nào trong hệ thống KACoffee."
    ),
    "support_phone": "0900 000 000",
    "support_email": "hello@kacoffee.vn",
    "delivery_fee_vnd": 20_000,
    "public_notice": "Dịch vụ giao hàng hiện áp dụng trong nội thành Hà Nội.",
}


def get_or_create_settings(db: Session) -> SystemSetting:
    settings = db.scalar(select(SystemSetting).order_by(SystemSetting.id.asc()))
    if settings:
        return settings

    settings = SystemSetting(**DEFAULT_SETTINGS)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_settings(db: Session, payload) -> SystemSetting:
    settings = get_or_create_settings(db)
    for key, value in payload.model_dump().items():
        setattr(settings, key, value)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
