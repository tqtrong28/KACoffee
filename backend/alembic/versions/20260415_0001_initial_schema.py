"""Initial schema baseline.

Revision ID: 20260415_0001
Revises:
Create Date: 2026-04-15 00:00:00
"""

from typing import Sequence, Union

from alembic import op

from app.db.base import Base
from app.db.imports import load_model_modules

# revision identifiers, used by Alembic.
revision: str = "20260415_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    load_model_modules()
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    load_model_modules()
    Base.metadata.drop_all(bind=op.get_bind())
