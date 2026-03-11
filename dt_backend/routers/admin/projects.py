import secrets
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi import Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.engine import Engine

from .auth import require_login
from .html import admin_layout, project_form_html
from ...utils import escape_html, parse_tech_input, safe_filename, sanitize_rich_text_html


def create_admin_projects_router(engine: Engine, uploads_dir: Path) -> APIRouter:
    router = APIRouter(tags=["admin-projects"])

    def _truthy(value: Optional[str]) -> bool:
        if value is None:
            return False
        v = str(value).strip().lower()
        return v in ("1", "true", "on", "yes")

    def _load_lists() -> tuple[list[str], list[str], list[str]]:
        with engine.connect() as conn:
            categories = conn.execute(text("SELECT name FROM categories ORDER BY name ASC")).scalars().all()
            technologies = conn.execute(text("SELECT name FROM technologies ORDER BY name ASC")).scalars().all()
            genres = conn.execute(text("SELECT name FROM genres ORDER BY name ASC")).scalars().all()
        return list(categories or []), list(technologies or []), list(genres or [])

    async def _save_image(upload: UploadFile) -> str:
        fname = safe_filename(upload.filename)
        fname = f"{secrets.token_hex(6)}_{fname}"
        dest = uploads_dir / fname
        dest.write_bytes(await upload.read())
        return f"/static/uploads/{fname}"

    def _delete_upload(path: str) -> None:
        try:
            if not path or not str(path).startswith("/static/uploads/"):
                return
            fname = str(path).split("/static/uploads/")[-1]
            fpath = uploads_dir / fname
            if fpath.exists():
                fpath.unlink()
        except Exception:
            pass

    def _unique_keep_order(items: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for x in items or []:
            s = str(x or "").strip()
            if not s or s in seen:
                continue
            seen.add(s)
            out.append(s)
        return out

    def _upload_exists(url_path: str) -> bool:
        p = str(url_path or "").strip()
        if not p.startswith("/static/uploads/"):
            return True
        fname = p.split("/static/uploads/")[-1]
        if not fname:
            return False
        return (uploads_dir / fname).exists()

    @router.post("/api/admin/projects/cleanup-uploads")
    def cleanup_missing_uploads(request: Request):
        """
        Removes references to missing files in /static/uploads from DB.
        Does NOT delete any existing files.
        """
        require_login(request)

        checked = 0
        updated = 0
        removed_refs = 0

        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, image, images, video, presentation FROM projects ORDER BY id ASC")
            ).mappings().all()

        with engine.begin() as conn:
            for r in rows:
                checked += 1
                pid = int(r["id"])

                image = str(r.get("image") or "").strip()
                images = parse_tech_input(r.get("images"))
                video = str(r.get("video") or "").strip()
                presentation = str(r.get("presentation") or "").strip()

                new_image = image if _upload_exists(image) else ""
                if image and not new_image:
                    removed_refs += 1

                new_images: list[str] = []
                for p in images:
                    if not p:
                        continue
                    if _upload_exists(p):
                        new_images.append(p)
                    else:
                        removed_refs += 1

                new_video = video if _upload_exists(video) else ""
                if video and not new_video:
                    removed_refs += 1

                new_presentation = presentation if _upload_exists(presentation) else ""
                if presentation and not new_presentation:
                    removed_refs += 1

                new_images = _unique_keep_order(new_images)
                if new_image:
                    new_images = [new_image] + [p for p in new_images if p != new_image]

                if (
                    new_image != image
                    or new_images != images
                    or new_video != video
                    or new_presentation != presentation
                ):
                    updated += 1
                    conn.execute(
                        text(
                            "UPDATE projects SET image=:image, images=:images, video=:video, presentation=:presentation WHERE id=:id"
                        ),
                        {
                            "id": pid,
                            "image": new_image,
                            "images": new_images,
                            "video": new_video,
                            "presentation": new_presentation,
                        },
                    )

        return {"ok": True, "checked": checked, "updated": updated, "removedRefs": removed_refs}

    @router.get("/api/admin/projects", response_class=HTMLResponse)
    def admin_projects(request: Request):
        require_login(request)

        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT id, title_ru, title_en, category, featured, project_url, image
                    FROM projects
                    ORDER BY id DESC
                    """
                )
            ).mappings().all()

        items = []
        for r in rows:
            items.append(
                f"""
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #222;">{r["id"]}</td>
                  <td style="padding:10px;border-bottom:1px solid #222;">{escape_html(r.get("title_ru",""))}</td>
                  <td style="padding:10px;border-bottom:1px solid #222;">{escape_html(r.get("title_en",""))}</td>
                  <td style="padding:10px;border-bottom:1px solid #222;">{escape_html(r.get("category",""))}</td>
                  <td style="padding:10px;border-bottom:1px solid #222;">{"✅" if r.get("featured") else "—"}</td>
                  <td style="padding:10px;border-bottom:1px solid #222;">
                    <a style="color:#F5A623" href="/api/admin/projects/{r["id"]}/edit">Edit</a>
                    &nbsp;|&nbsp;
                    <form style="display:inline" method="post" action="/api/admin/projects/{r["id"]}/delete"
                          onsubmit="return confirm('Delete project #{r["id"]}?');">
                      <button style="background:transparent;border:0;color:#ff5b5b;cursor:pointer;">Delete</button>
                    </form>
                  </td>
                </tr>
                """
            )

        body = f"""
            <div style="margin-bottom:14px;">
              <a href="/api/admin/projects/new" style="display:inline-block;padding:10px 12px;border-radius:10px;background:#F5A623;color:#000;font-weight:800;text-decoration:none;">+ Add project</a>
            </div>

            <table style="width:100%;border-collapse:collapse;background:#0b0b0b;border:1px solid #222;border-radius:14px;overflow:hidden;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">ID</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">Title RU</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">Title EN</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">Category</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">Featured</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #222;">Actions</th>
                </tr>
              </thead>
              <tbody>
                {''.join(items) if items else '<tr><td colspan="6" style="padding:12px;opacity:.7;">No projects</td></tr>'}
              </tbody>
            </table>
        """
        return HTMLResponse(admin_layout("Admin • Projects", body))

    @router.get("/api/admin/projects/new", response_class=HTMLResponse)
    def admin_projects_new(request: Request):
        require_login(request)
        categories, technologies, genres = _load_lists()
        return HTMLResponse(
            admin_layout(
                "Admin • New project",
                project_form_html(
                    action="/api/admin/projects/new",
                    categories=categories,
                    technologies=technologies,
                    genres=genres,
                    values={"technologies_selected": [], "genres_selected": []},
                ),
            )
        )

    @router.post("/api/admin/projects/new")
    async def admin_projects_create(
        request: Request,
        title_ru: str = Form(...),
        title_kz: str = Form(...),
        title_en: str = Form(...),
        description_ru: str = Form(...),
        description_kz: str = Form(...),
        description_en: str = Form(...),
        technologies: list[str] = Form([]),
        genres: list[str] = Form([]),
        category: str = Form("web"),
        categories: list[str] = Form([]),
        featured: Optional[str] = Form(None),
        project_url: str = Form(""),
        image_file: Optional[UploadFile] = File(None),
        video_file: Optional[UploadFile] = File(None),
        presentation_file: Optional[UploadFile] = File(None),
        gallery_files: list[UploadFile] = File([]),
    ):
        require_login(request)

        featured_bool = _truthy(featured)
        description_ru = sanitize_rich_text_html(description_ru)
        description_kz = sanitize_rich_text_html(description_kz)
        description_en = sanitize_rich_text_html(description_en)

        image_path = ""
        if image_file and image_file.filename:
            image_path = await _save_image(image_file)

        video_path = ""
        if video_file and video_file.filename:
            video_path = await _save_image(video_file)

        presentation_path = ""
        if presentation_file and presentation_file.filename:
            presentation_path = await _save_image(presentation_file)

        gallery_paths: list[str] = []
        for f in gallery_files or []:
            if f and f.filename:
                gallery_paths.append(await _save_image(f))

        tech_list = parse_tech_input(technologies)
        genres_list = parse_tech_input(genres)
        categories_list = parse_tech_input(categories)
        if not categories_list:
            c = (category or "web").strip() or "web"
            categories_list = [c]
        # Primary category for existing UI/filtering.
        category = categories_list[0]

        images_list = _unique_keep_order(([image_path] if image_path else []) + gallery_paths)

        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO projects (
                        title_ru, title_kz, title_en,
                        description_ru, description_kz, description_en,
                        technologies, genres, image, images, category, categories, featured, project_url, video, presentation
                    ) VALUES (
                        :title_ru, :title_kz, :title_en,
                        :description_ru, :description_kz, :description_en,
                        :technologies, :genres, :image, :images, :category, :categories, :featured, :project_url, :video, :presentation
                    )
                    """
                ),
                {
                    "title_ru": title_ru,
                    "title_kz": title_kz,
                    "title_en": title_en,
                    "description_ru": description_ru,
                    "description_kz": description_kz,
                    "description_en": description_en,
                    "technologies": tech_list,
                    "genres": genres_list,
                    "image": image_path,
                    "images": images_list,
                    "category": category,
                    "categories": categories_list,
                    "featured": featured_bool,
                    "project_url": project_url.strip(),
                    "video": video_path,
                    "presentation": presentation_path,
                },
            )

        return RedirectResponse("/api/admin/projects", status_code=302)

    @router.get("/api/admin/projects/{project_id}/edit", response_class=HTMLResponse)
    def admin_projects_edit(project_id: int, request: Request):
        require_login(request)

        with engine.connect() as conn:
            row = conn.execute(
                text(
                    """
                    SELECT
                        id,
                        title_ru, title_kz, title_en,
                        description_ru, description_kz, description_en,
                        technologies, genres, image, category, featured, project_url, video, presentation
                    FROM projects
                    WHERE id = :id
                    """
                ),
                {"id": project_id},
            ).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Project not found")

        tech_selected = parse_tech_input(row.get("technologies"))
        genres_selected = parse_tech_input(row.get("genres"))
        categories, technologies, genres = _load_lists()

        html = project_form_html(
            action=f"/api/admin/projects/{project_id}/edit",
            categories=categories,
            technologies=technologies,
            genres=genres,
            values={
                "title_ru": row.get("title_ru", ""),
                "title_kz": row.get("title_kz", ""),
                "title_en": row.get("title_en", ""),
                "description_ru": row.get("description_ru", ""),
                "description_kz": row.get("description_kz", ""),
                "description_en": row.get("description_en", ""),
                "technologies_selected": tech_selected,
                "genres_selected": genres_selected,
                "category": row.get("category", "web"),
                "featured": bool(row.get("featured")),
                "project_url": row.get("project_url", "") or "",
                "image": row.get("image", "") or "",
                "video": row.get("video", "") or "",
                "presentation": row.get("presentation", "") or "",
            },
            show_current_image=True,
        )
        return HTMLResponse(admin_layout(f"Admin • Edit project #{project_id}", html))

    @router.post("/api/admin/projects/{project_id}/edit")
    async def admin_projects_update(
        project_id: int,
        request: Request,
        title_ru: str = Form(...),
        title_kz: str = Form(...),
        title_en: str = Form(...),
        description_ru: str = Form(...),
        description_kz: str = Form(...),
        description_en: str = Form(...),
        technologies: list[str] = Form([]),
        genres: list[str] = Form([]),
        category: str = Form("web"),
        categories: list[str] = Form([]),
        featured: Optional[str] = Form(None),
        project_url: str = Form(""),
        image_file: Optional[UploadFile] = File(None),
        video_file: Optional[UploadFile] = File(None),
        presentation_file: Optional[UploadFile] = File(None),
        gallery_files: list[UploadFile] = File([]),
        replace_gallery: Optional[str] = Form(None),
        remove_images: Optional[str] = Form(None),
    ):
        require_login(request)

        featured_bool = _truthy(featured)
        description_ru = sanitize_rich_text_html(description_ru)
        description_kz = sanitize_rich_text_html(description_kz)
        description_en = sanitize_rich_text_html(description_en)

        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT image, images, video, presentation FROM projects WHERE id=:id"),
                {"id": project_id},
            ).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Project not found")

        old_img = row.get("image") or ""
        old_images = parse_tech_input(row.get("images"))
        old_video = row.get("video") or ""
        old_presentation = row.get("presentation") or ""

        image_path = old_img or ""
        if image_file and image_file.filename:
            image_path = await _save_image(image_file)

        video_path = old_video or ""
        if video_file and video_file.filename:
            video_path = await _save_image(video_file)

        presentation_path = old_presentation or ""
        if presentation_file and presentation_file.filename:
            presentation_path = await _save_image(presentation_file)

        tech_list = parse_tech_input(technologies)
        genres_list = parse_tech_input(genres)
        categories_list = parse_tech_input(categories)
        if not categories_list:
            c = (category or "web").strip() or "web"
            categories_list = [c]
        category = categories_list[0]

        remove_list = parse_tech_input(remove_images)
        kept_old_images = [p for p in old_images if p and p not in remove_list]

        gallery_paths: list[str] = []
        for f in gallery_files or []:
            if f and f.filename:
                gallery_paths.append(await _save_image(f))

        replace_gallery_bool = _truthy(replace_gallery)
        base_images = ([] if replace_gallery_bool else kept_old_images) + gallery_paths
        base_images = _unique_keep_order(base_images)

        # Keep cover image first (if any).
        if image_path:
            images_list = [image_path] + [p for p in base_images if p != image_path]
        else:
            images_list = base_images

        with engine.begin() as conn:
            res = conn.execute(
                text(
                    """
                    UPDATE projects
                    SET
                        title_ru=:title_ru,
                        title_kz=:title_kz,
                        title_en=:title_en,
                        description_ru=:description_ru,
                        description_kz=:description_kz,
                        description_en=:description_en,
                        technologies=:technologies,
                        genres=:genres,
                        image=:image,
                        images=:images,
                        category=:category,
                        categories=:categories,
                        featured=:featured,
                        project_url=:project_url,
                        video=:video,
                        presentation=:presentation
                    WHERE id=:id
                    """
                ),
                {
                    "id": project_id,
                    "title_ru": title_ru,
                    "title_kz": title_kz,
                    "title_en": title_en,
                    "description_ru": description_ru,
                    "description_kz": description_kz,
                    "description_en": description_en,
                    "technologies": tech_list,
                    "genres": genres_list,
                    "image": image_path,
                    "images": images_list,
                    "category": category,
                    "categories": categories_list,
                    "featured": featured_bool,
                    "project_url": project_url.strip(),
                    "video": video_path,
                    "presentation": presentation_path,
                },
            )
            if res.rowcount == 0:
                raise HTTPException(status_code=404, detail="Project not found")

        # Cleanup removed uploads (best-effort).
        if remove_list:
            still_used = set(images_list + ([image_path] if image_path else []))
            for p in remove_list:
                if p and p not in still_used:
                    _delete_upload(p)

        if old_video and old_video != video_path:
            _delete_upload(old_video)
        if old_presentation and old_presentation != presentation_path:
            _delete_upload(old_presentation)

        return RedirectResponse("/api/admin/projects", status_code=302)

    @router.post("/api/admin/projects/{project_id}/delete")
    def admin_projects_delete(project_id: int, request: Request):
        require_login(request)

        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT image, images, video, presentation FROM projects WHERE id=:id"),
                {"id": project_id},
            ).mappings().first()
            conn.execute(text("DELETE FROM projects WHERE id=:id"), {"id": project_id})

        img = (row or {}).get("image") or ""
        imgs = parse_tech_input((row or {}).get("images"))
        video = (row or {}).get("video") or ""
        presentation = (row or {}).get("presentation") or ""
        for p in _unique_keep_order(([img] if img else []) + imgs):
            _delete_upload(p)
        _delete_upload(video)
        _delete_upload(presentation)

        return RedirectResponse("/api/admin/projects", status_code=302)

    return router
