from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    membership_rank_id: Mapped[int] = mapped_column(ForeignKey("membership_ranks.id"), nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    default_address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_ward: Mapped[str | None] = mapped_column(String(100), nullable=True)
    default_district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    default_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    membership_rank = relationship("MembershipRank")
    point_entries = relationship("CustomerPointLedger", back_populates="customer")
