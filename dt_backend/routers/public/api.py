from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.engine import Engine

from ...utils import row_to_project


def create_public_api_router(engine: Engine) -> APIRouter:
    router = APIRouter()

    @router.get("/api/stats")
    def api_stats():
        try:
            with engine.connect() as conn:
                projects_count = conn.execute(text("SELECT COUNT(*) FROM projects")).scalar_one()

                tech_count = conn.execute(
                    text(
                        """
                        SELECT COALESCE(COUNT(DISTINCT t), 0) AS cnt
                        FROM projects
                        LEFT JOIN LATERAL unnest(technologies) AS t ON TRUE
                        """
                    )
                ).scalar_one()

            return {
                "projects": int(projects_count),
                "students": 500,  # stub
                "technologies": int(tech_count),
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"stats db error: {e}")

    @router.get("/api/projects")
    def api_projects(category: Optional[str] = Query(default=None)):
        try:
            sql = """
                SELECT
                    id,
                    title_ru, title_kz, title_en,
                    description_ru, description_kz, description_en,
                    technologies,
                    genres,
                    image,
                    images,
                    category,
                    categories,
                    featured,
                    project_url,
                    video,
                    presentation
                FROM projects
            """
            params: Dict[str, Any] = {}

            if category and category != "all":
                sql += " WHERE category = :category OR :category = ANY(categories)"
                params["category"] = category

            sql += " ORDER BY featured DESC, id ASC"

            with engine.connect() as conn:
                rows = conn.execute(text(sql), params).mappings().all()

            return [row_to_project(dict(r)) for r in rows]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"projects db error: {e}")

    @router.get("/api/projects/{project_id}")
    def api_project(project_id: int):
        try:
            with engine.connect() as conn:
                row = conn.execute(
                    text(
                        """
                        SELECT
                            id,
                            title_ru, title_kz, title_en,
                            description_ru, description_kz, description_en,
                            technologies,
                            genres,
                            image,
                            images,
                            category,
                            categories,
                            featured,
                            project_url,
                            video,
                            presentation
                        FROM projects
                        WHERE id = :id
                        """
                    ),
                    {"id": project_id},
                ).mappings().first()

            if not row:
                raise HTTPException(status_code=404, detail="Project not found")

            return row_to_project(dict(row))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"project db error: {e}")

    @router.get("/api/technologies")
    def api_technologies():
        try:
            with engine.connect() as conn:
                rows = conn.execute(text("SELECT name FROM technologies ORDER BY name ASC")).mappings().all()
                if rows:
                    return [r["name"] for r in rows]

                derived = conn.execute(
                    text(
                        """
                        SELECT DISTINCT t AS name
                        FROM projects
                        LEFT JOIN LATERAL unnest(technologies) AS t ON TRUE
                        WHERE t IS NOT NULL AND t <> ''
                        ORDER BY name ASC
                        """
                    )
                ).mappings().all()
                return [r["name"] for r in derived]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"technologies db error: {e}")

    @router.get("/api/categories")
    def api_categories():
        try:
            with engine.connect() as conn:
                rows = conn.execute(
                    text("SELECT id, name, name_ru, name_kz, name_en FROM categories ORDER BY name ASC")
                ).mappings().all()
                if rows:
                    out = []
                    for r in rows:
                        code = r["name"]
                        out.append(
                            {
                                "id": int(r["id"]),
                                "code": code,
                                "nameRu": r.get("name_ru") or code,
                                "nameKz": r.get("name_kz") or code,
                                "nameEn": r.get("name_en") or code,
                            }
                        )
                    return out

                derived = conn.execute(
                    text(
                        """
                        SELECT DISTINCT category AS name
                        FROM projects
                        WHERE category IS NOT NULL AND category <> ''
                        ORDER BY name ASC
                        """
                    )
                ).mappings().all()
                return [{"code": r["name"], "nameRu": r["name"], "nameKz": r["name"], "nameEn": r["name"]} for r in derived]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"categories db error: {e}")

    @router.get("/api/genres")
    def api_genres():
        try:
            with engine.connect() as conn:
                rows = conn.execute(text("SELECT name FROM genres ORDER BY name ASC")).mappings().all()
                if rows:
                    return [r["name"] for r in rows]

                derived = conn.execute(
                    text(
                        """
                        SELECT DISTINCT g AS name
                        FROM projects
                        LEFT JOIN LATERAL unnest(genres) AS g ON TRUE
                        WHERE g IS NOT NULL AND g <> ''
                        ORDER BY name ASC
                        """
                    )
                ).mappings().all()
                return [r["name"] for r in derived]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"genres db error: {e}")

    @router.get("/health")
    def health():
        return {"status": "ok"}

    @router.get("/api/health")
    def api_health():
        return {"status": "ok"}

    return router
