import argparse

from app.core.config import get_settings
from app.db.session import SessionLocal, init_db
from app.seed.data import seed_initial_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize and seed the KACoffee database.")
    parser.add_argument(
        "--with-legacy-compat",
        action="store_true",
        help="Run legacy ALTER TABLE compatibility updates for older local SQLite databases.",
    )
    parser.add_argument(
        "--with-seed",
        action="store_true",
        help="Seed demo/system data after schema initialization.",
    )
    args = parser.parse_args()

    settings = get_settings()
    init_db(run_compat_migrations=args.with_legacy_compat)

    if args.with_seed:
        db = SessionLocal()
        try:
            seed_initial_data(db, settings.default_admin_username, settings.default_admin_password)
        finally:
            db.close()

    print("Database bootstrap completed.")


if __name__ == "__main__":
    main()
