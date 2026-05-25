export type BackendProject = {
  id: string | number
  titleRu?: string
  titleKz?: string
  titleEn?: string
  descriptionRu?: string
  descriptionKz?: string
  descriptionEn?: string
  technologies?: string[] | string
  genres?: string[] | string
  image?: string
  images?: string[] | string
  category?: string
  categories?: string[] | string
  featured?: boolean
  projectUrl?: string
  project_url?: string
  video?: string
  presentation?: string
}

export type Stats = {
  projects: number
  students: number
  technologies: number
}

export type BackendCategory = {
  id?: number | string
  code: string
  nameRu?: string
  nameKz?: string
  nameEn?: string
}

export type LoginResponse = {
  access_token?: string
  token?: string
  type?: string
}

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || ""

// Для server-side запросов (внутри docker-сети) localhost указывает на контейнер frontend,
// поэтому используем отдельную переменную с дефолтом на сервис `api`.
const INTERNAL_API_BASE =
  process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "") || "http://api:8000"

const API_BASE = typeof window === "undefined" ? INTERNAL_API_BASE : PUBLIC_API_BASE

// ---- token helpers (простая схема) ----
const TOKEN_KEY = "dt_token"

export function setToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
}

// ---- base requests ----
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${path} failed: ${res.status} ${text}`)
  }

  const contentType = res.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    throw new Error(
      `API ${path} returned non-JSON (${contentType || "unknown content type"}) from ${res.url}. Check reverse proxy /api routing.`
    )
  }

  return res.json() as Promise<T>
}

async function apiAuth<T>(path: string, init: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${path} failed: ${res.status} ${text}`)
  }

  // иногда DELETE возвращает пусто
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) return {} as T
  return res.json() as Promise<T>
}

// ---- public ----
export function getStats() {
  return apiGet<Stats>("/api/stats")
}

export function getProjects(category?: string) {
  const q = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : ""
  return apiGet<BackendProject[]>(`/api/projects${q}`)
}

export function getProject(id: string | number) {
  return apiGet<BackendProject>(`/api/projects/${encodeURIComponent(String(id))}`)
}

export function getTechnologies() {
  return apiGet<string[]>("/api/technologies")
}

export function getCategories() {
  return apiGet<BackendCategory[]>("/api/categories")
}

// ---- admin/auth ----
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Login failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as LoginResponse
  const token = data.access_token || data.token
  if (!token) throw new Error("Login ok, but token not found in response")
  setToken(token)
  return token
}

// CRUD (под твою текущую админку на бэке)
export function adminCreateProject(payload: Partial<BackendProject>) {
  return apiAuth<BackendProject>("/api/admin/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function adminUpdateProject(id: string | number, payload: Partial<BackendProject>) {
  return apiAuth<BackendProject>(`/api/admin/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function adminDeleteProject(id: string | number) {
  return apiAuth<{ ok?: boolean }>(`/api/admin/projects/${id}`, {
    method: "DELETE",
  })
}
