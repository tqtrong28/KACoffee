from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BottleExchangeRecord(Base):
    __tablename__ = "bottle_exchange_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    processed_by_employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    returned_bottle_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    reward_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    customer_phone_snapshot: Mapped[str | None] = mapped_column(String(20), nullable=True)
    reward_product_name_snapshot: Mapped[str] = mapped_column(String(150), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    branch = relationship("Branch")
    customer = relationship("Customer")
    reward_product = relationship("Product")
    processor = relationship("Employee")
