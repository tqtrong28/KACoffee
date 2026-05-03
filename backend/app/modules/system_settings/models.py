from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_title: Mapped[str] = mapped_column(String(100), default="KACoffee", nullable=False)
    brand_headline: Mapped[str] = mapped_column(
        String(255),
        default="Fresh coffee, trusted service, and one shared membership across every KACoffee branch.",
        nullable=False,
    )
    brand_subheadline: Mapped[str] = mapped_column(
        Text,
        default=(
            "Discover signature drinks, easy online ordering, and branch-to-branch consistency "
            "that lets customers enjoy the same membership benefits anywhere in the KACoffee chain."
        ),
        nullable=False,
    )
    support_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    delivery_fee_vnd: Mapped[int] = mapped_column(Integer, default=20_000, nullable=False)
    public_notice: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
