from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from .config import Settings


def create_db_engine(settings: Settings) -> Engine:
    return create_engine(settings.database_url, pool_pre_ping=True)


def ensure_schema(engine: Engine) -> None:
    # Idempotent: полезно для пустого volume без init-скрипта.
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS categories (
                  id SERIAL PRIMARY KEY,
                  name TEXT NOT NULL UNIQUE
                );
                """
            )
        )

        # Мультиязычные названия категорий (name = код/slug).
        conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ru TEXT NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_kz TEXT NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT ''"))

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS genres (
                  id SERIAL PRIMARY KEY,
                  name TEXT NOT NULL UNIQUE
                );
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS projects (
                  id SERIAL PRIMARY KEY,

                  title_ru TEXT NOT NULL,
                  title_kz TEXT NOT NULL,
                  title_en TEXT NOT NULL,

                  description_ru TEXT NOT NULL,
                  description_kz TEXT NOT NULL,
                  description_en TEXT NOT NULL,

                  technologies TEXT[] NOT NULL DEFAULT '{}',
                  genres TEXT[] NOT NULL DEFAULT '{}',

                  image TEXT NOT NULL DEFAULT '',
                  images TEXT[] NOT NULL DEFAULT '{}',
                  category TEXT NOT NULL DEFAULT 'web',
                  categories TEXT[] NOT NULL DEFAULT '{}',
                  featured BOOLEAN NOT NULL DEFAULT FALSE,

                  project_url TEXT NOT NULL DEFAULT '',
                  video TEXT NOT NULL DEFAULT '',
                  presentation TEXT NOT NULL DEFAULT ''
                );
                """
            )
        )

        # Если projects уже есть (например, после старой версии схемы) — добавим недостающие поля.
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS genres TEXT[] NOT NULL DEFAULT '{}'"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}'"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS video TEXT NOT NULL DEFAULT ''"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS presentation TEXT NOT NULL DEFAULT ''"))

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS technologies (
                  id SERIAL PRIMARY KEY,
                  name TEXT NOT NULL UNIQUE
                );
                """
            )
        )

        # Базовые категории (если хотите свои — добавляйте/удаляйте в /admin/categories).
        conn.execute(
            text(
                """
                INSERT INTO categories (name, name_ru, name_kz, name_en) VALUES
                  ('aiml', 'AI/ML', 'AI/ML', 'AI/ML'),
                  ('iot', 'IoT', 'IoT', 'IoT'),
                  ('web', 'Web', 'Web', 'Web'),
                  ('mobile', 'Mobile', 'Mobile', 'Mobile'),
                  ('vrar', 'VR/AR', 'VR/AR', 'VR/AR')
                ON CONFLICT (name) DO UPDATE SET
                  name_ru = EXCLUDED.name_ru,
                  name_kz = EXCLUDED.name_kz,
                  name_en = EXCLUDED.name_en;
                """
            )
        )
