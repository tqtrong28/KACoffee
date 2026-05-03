#!/bin/sh
set -e

echo "Waiting for MySQL to become available..."
python - <<'PY'
import os
import time

from sqlalchemy import create_engine, text

user = os.environ["DATABASE_USER"]
password = os.environ["DATABASE_PASSWORD"]
host = os.environ["DATABASE_HOST"]
port = os.environ["DATABASE_PORT"]
name = os.environ["DATABASE_NAME"]
charset = os.environ.get("DATABASE_CHARSET", "utf8mb4")
url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset={charset}"

for attempt in range(30):
    try:
        engine = create_engine(url, future=True)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("MySQL is ready.")
        break
    except Exception as exc:
        if attempt == 29:
            raise
        print(f"MySQL not ready yet ({exc}). Retrying...")
        time.sleep(2)
PY

echo "Running Alembic migrations..."
alembic upgrade head

echo "Bootstrapping demo data..."
python -m app.db.bootstrap --with-seed

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
