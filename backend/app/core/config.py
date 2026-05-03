from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "KACoffee API"
    api_prefix: str = "/api/v1"
    debug: bool = True
    database_url: str | None = None
    database_socket: str | None = None
    database_host: str = "127.0.0.1"
    database_port: int = 3306
    database_name: str = "kacoffee"
    database_user: str = "root"
    database_password: str = ""
    database_charset: str = "utf8mb4"
    auto_init_db_on_startup: bool = False
    auto_seed_on_startup: bool = False
    run_legacy_compat_migrations: bool = False
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 14
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @model_validator(mode="after")
    def populate_database_url(self) -> "Settings":
        if self.database_url:
            return self

        encoded_user = quote_plus(self.database_user)
        encoded_password = quote_plus(self.database_password)
        if self.database_socket:
            encoded_socket = quote_plus(self.database_socket)
            self.database_url = (
                f"mysql+pymysql://{encoded_user}:{encoded_password}@localhost/{self.database_name}"
                f"?unix_socket={encoded_socket}&charset={self.database_charset}"
            )
        else:
            self.database_url = (
                f"mysql+pymysql://{encoded_user}:{encoded_password}"
                f"@{self.database_host}:{self.database_port}/{self.database_name}"
                f"?charset={self.database_charset}"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
