import re
from typing import Any, Dict, List

import html
from html.parser import HTMLParser
from typing import Optional, Tuple
from urllib.parse import urlparse


def escape_html(s: Any) -> str:
    return (
        str(s if s is not None else "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#039;")
    )


def safe_filename(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name)
    name = name.strip("._")
    return name or "file"


def _parse_csv_tags(s: str) -> List[str]:
    """
    Accept:
      - "Python, React, FastAPI"
      - "{Python,React}" (postgres style)
    Return list[str]
    """
    if not s:
        return []
    s = s.strip()
    if s.startswith("{") and s.endswith("}"):
        s = s[1:-1]
    parts = [p.strip() for p in s.split(",")]
    return [p for p in parts if p]


def parse_tech_input(value: Any) -> List[str]:
    """
    Принимает:
      - list[str] (например, из <select multiple>)
      - "a,b,c" (например, из input text или FormData)
      - "{a,b,c}" (postgres style)
    """
    if value is None:
        return []

    if isinstance(value, list):
        cleaned = [str(x).strip() for x in value if x is not None and str(x).strip()]
        # Совместимость: если пришла одна строка "a,b,c" — распарсим как CSV.
        if len(cleaned) == 1 and "," in cleaned[0]:
            return _parse_csv_tags(cleaned[0])
        return cleaned

    if isinstance(value, str):
        return _parse_csv_tags(value)

    return _parse_csv_tags(str(value))


def row_to_project(row: Dict[str, Any]) -> Dict[str, Any]:
    tech = row.get("technologies")
    if tech is None:
        tech_list: List[str] = []
    elif isinstance(tech, list):
        tech_list = [str(x) for x in tech]
    elif isinstance(tech, str):
        tech_list = _parse_csv_tags(tech)
    else:
        tech_list = []

    genres = row.get("genres")
    if genres is None:
        genres_list: List[str] = []
    elif isinstance(genres, list):
        genres_list = [str(x) for x in genres]
    elif isinstance(genres, str):
        genres_list = _parse_csv_tags(genres)
    else:
        genres_list = []

    categories = row.get("categories")
    if categories is None:
        categories_list: List[str] = []
    elif isinstance(categories, list):
        categories_list = [str(x) for x in categories]
    elif isinstance(categories, str):
        categories_list = _parse_csv_tags(categories)
    else:
        categories_list = []

    images = row.get("images")
    if images is None:
        images_list: List[str] = []
    elif isinstance(images, list):
        images_list = [str(x) for x in images]
    elif isinstance(images, str):
        images_list = _parse_csv_tags(images)
    else:
        images_list = []

    return {
        "id": str(row.get("id")),
        "titleRu": row.get("title_ru"),
        "titleKz": row.get("title_kz"),
        "titleEn": row.get("title_en"),
        "descriptionRu": row.get("description_ru"),
        "descriptionKz": row.get("description_kz"),
        "descriptionEn": row.get("description_en"),
        "technologies": tech_list,
        "genres": genres_list,
        "image": row.get("image"),
        "images": images_list,
        "category": row.get("category"),
        "categories": categories_list,
        "featured": bool(row.get("featured")),
        "projectUrl": row.get("project_url"),
        "video": row.get("video"),
        "presentation": row.get("presentation"),
    }


class _RichTextSanitizer(HTMLParser):
    # Minimal allowlist for rich text descriptions.
    _ALLOWED_TAGS = {
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "a",
    }
    _SELF_CLOSING = {"br"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self._out: list[str] = []
        self._open: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[Tuple[str, Optional[str]]]) -> None:
        t = (tag or "").lower()
        if t not in self._ALLOWED_TAGS:
            return

        if t == "a":
            href = ""
            for k, v in attrs or []:
                if (k or "").lower() == "href" and v:
                    href = str(v).strip()
                    break

            safe_href = ""
            if href:
                try:
                    u = urlparse(href)
                    if u.scheme in ("http", "https", "mailto"):
                        safe_href = href
                except Exception:
                    safe_href = ""

            if safe_href:
                self._out.append(
                    f'<a href="{html.escape(safe_href, quote=True)}" target="_blank" rel="noopener noreferrer nofollow">'
                )
                self._open.append("a")
            else:
                # No href -> treat as formatting-less span by skipping tag.
                return
        else:
            self._out.append(f"<{t}>")
            if t not in self._SELF_CLOSING:
                self._open.append(t)

    def handle_endtag(self, tag: str) -> None:
        t = (tag or "").lower()
        if t not in self._ALLOWED_TAGS or t in self._SELF_CLOSING:
            return

        # Close the latest matching tag to keep nesting valid.
        if t in self._open:
            while self._open:
                last = self._open.pop()
                self._out.append(f"</{last}>")
                if last == t:
                    break

    def handle_data(self, data: str) -> None:
        if not data:
            return
        self._out.append(html.escape(data))

    def handle_entityref(self, name: str) -> None:
        self._out.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self._out.append(f"&#{name};")

    def get_html(self) -> str:
        while self._open:
            self._out.append(f"</{self._open.pop()}>")
        return "".join(self._out)


def sanitize_rich_text_html(raw: Any) -> str:
    """
    Sanitizes rich text HTML from the admin editor.
    - Allows only a small set of tags (no inline styles, no arbitrary attributes).
    - For <a>, keeps only safe href schemes: http/https/mailto.
    """
    s = str(raw if raw is not None else "").strip()
    if not s:
        return ""
    parser = _RichTextSanitizer()
    parser.feed(s)
    parser.close()
    return parser.get_html()
