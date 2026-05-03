from collections.abc import Generator
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.base import Base
from app.db.imports import load_model_modules
from app.db.session import get_db
from app.main import app
from app.seed.data import seed_initial_data


@pytest.fixture()
def session_factory(tmp_path) -> Generator[sessionmaker, None, None]:
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    load_model_modules()
    Base.metadata.create_all(bind=engine)

    with testing_session_factory() as db:
        seed_initial_data(db, "admin", "admin123")

    yield testing_session_factory

    engine.dispose()


@pytest.fixture()
def db_session(session_factory) -> Generator[Session, None, None]:
    with session_factory() as db:
        yield db


@pytest.fixture()
def client(session_factory) -> Generator[TestClient, None, None]:
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
