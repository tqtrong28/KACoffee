from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.db.imports import load_model_modules

settings = get_settings()

engine_kwargs = {"future": True}
if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_column(table_name: str, column_name: str, definition: str) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if table_name not in tables:
        return
    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {definition}"))


def _run_compat_migrations() -> None:
    _ensure_column("branches", "opening_hours", "opening_hours VARCHAR(100)")
    _ensure_column("branches", "map_url", "map_url VARCHAR(500)")
    _ensure_column("branches", "image_url", "image_url VARCHAR(500)")
    _ensure_column("branches", "amenities_text", "amenities_text TEXT")
    _ensure_column("products", "badge_text", "badge_text VARCHAR(80)")
    _ensure_column("products", "flavor_note", "flavor_note VARCHAR(120)")
    _ensure_column("products", "is_featured", "is_featured BOOLEAN NOT NULL DEFAULT 0")
    _ensure_column("products", "small_price_vnd", "small_price_vnd INTEGER")
    _ensure_column("products", "large_price_vnd", "large_price_vnd INTEGER")
    _ensure_column("order_items", "serving_option", "serving_option VARCHAR(20) NOT NULL DEFAULT 'takeaway'")
    _ensure_column("order_items", "size_option", "size_option VARCHAR(20) NOT NULL DEFAULT 'medium'")
    _ensure_column("order_items", "ice_level", "ice_level VARCHAR(20) NOT NULL DEFAULT 'normal_ice'")
    _ensure_column("order_items", "sugar_level", "sugar_level VARCHAR(20) NOT NULL DEFAULT 'normal_sugar'")
    _ensure_column("audit_logs", "branch_id", "branch_id INTEGER")
    _ensure_column("audit_logs", "actor_name", "actor_name VARCHAR(100)")
    _ensure_column("audit_logs", "description", "description TEXT")
    _ensure_column("audit_logs", "payload_json", "payload_json TEXT")


def init_db(*, run_compat_migrations: bool = False) -> None:
    load_model_modules()
    Base.metadata.create_all(bind=engine)
    if run_compat_migrations:
        _run_compat_migrations()


def check_database_connection() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
