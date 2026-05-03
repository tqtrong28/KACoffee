from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RoleTargetPolicy(Base):
    __tablename__ = "role_target_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    monthly_order_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    monthly_revenue_target_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    monthly_delivery_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_rate_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_per_extra_order_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_per_extra_delivery_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_flat_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class BranchTargetPolicy(Base):
    __tablename__ = "branch_target_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False, unique=True)
    monthly_order_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    monthly_revenue_target_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_rate_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bonus_flat_vnd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    branch = relationship("Branch")
