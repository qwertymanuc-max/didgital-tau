import os
import secrets
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class Settings:
    database_url: str
    admin_user: str
    admin_pass: str
    secret_key: str
    frontend_url: str
    cors_origins: List[str]


def get_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set. Check docker-compose.yml (api -> environment).")

    admin_user = os.getenv("ADMIN_USER", "admin")
    admin_pass = os.getenv("ADMIN_PASS", "admin")
    secret_key = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:18081")

    cors_raw = os.getenv("CORS_ORIGINS") or "http://localhost:18081,http://localhost:13000"
    cors_origins = [o.strip() for o in cors_raw.split(",") if o.strip()]

    return Settings(
        database_url=database_url,
        admin_user=admin_user,
        admin_pass=admin_pass,
        secret_key=secret_key,
        frontend_url=frontend_url,
        cors_origins=cors_origins,
    )
