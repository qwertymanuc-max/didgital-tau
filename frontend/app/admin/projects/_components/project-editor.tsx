"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

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

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")

function normalizeToArray(input?: string[] | string) {
  if (!input) return []
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean)
  const raw = String(input).trim()
  if (!raw) return []
  const s = raw.startsWith("{") && raw.endsWith("}") ? raw.slice(1, -1) : raw
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}

function toBoolString(v: boolean) {
  return v ? "true" : "false"
}

type Mode =
  | { kind: "create" }
  | {
      kind: "edit"
      id: string
    }

export function ProjectEditor({ mode }: { mode: Mode }) {
  const { t } = useI18n()
  const router = useRouter()

  const [loading, setLoading] = useState(mode.kind === "edit")
  const [error, setError] = useState("")

  const [activeLang, setActiveLang] = useState<"ru" | "kz" | "en">("ru")

  const [titleRu, setTitleRu] = useState("")
  const [titleKz, setTitleKz] = useState("")
  const [titleEn, setTitleEn] = useState("")

  const [descriptionRu, setDescriptionRu] = useState("")
  const [descriptionKz, setDescriptionKz] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")

  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["web"])
  const [featured, setFeatured] = useState(false)
  const [projectUrl, setProjectUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [currentImage, setCurrentImage] = useState<string>("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [currentVideo, setCurrentVideo] = useState<string>("")
  const [presentationFile, setPresentationFile] = useState<File | null>(null)
  const [currentPresentation, setCurrentPresentation] = useState<string>("")
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [currentGallery, setCurrentGallery] = useState<string[]>([])
  const [removedGallery, setRemovedGallery] = useState<string[]>([])
  const [replaceGallery, setReplaceGallery] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([])
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  async function loadLookups() {
    try {
      const [catsRes, techRes, genresRes] = await Promise.all([
        fetch(`${API_BASE}/api/categories`, { cache: "no-store" }),
        fetch(`${API_BASE}/api/technologies`, { cache: "no-store" }),
        fetch(`${API_BASE}/api/genres`, { cache: "no-store" }),
      ])

      const catsRaw = catsRes.ok ? ((await catsRes.json()) as any) : []
      const techs = techRes.ok ? ((await techRes.json()) as string[]) : []
      const gens = genresRes.ok ? ((await genresRes.json()) as string[]) : []

      const cats = Array.isArray(catsRaw)
        ? catsRaw
            .map((c: any) => (typeof c === "string" ? c : c?.code))
            .filter(Boolean)
        : []

      setAvailableCategories(cats)
      setAvailableTechnologies(Array.isArray(techs) ? techs : [])
      setAvailableGenres(Array.isArray(gens) ? gens : [])
    } catch {
      setAvailableCategories([])
      setAvailableTechnologies([])
      setAvailableGenres([])
    }
  }

  async function loadProject(id: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(id)}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`GET /api/projects/${id} failed: ${res.status}`)
      const p = (await res.json()) as BackendProject

      setTitleRu(p.titleRu || "")
      setTitleKz(p.titleKz || "")
      setTitleEn(p.titleEn || "")

      setDescriptionRu(p.descriptionRu || "")
      setDescriptionKz(p.descriptionKz || "")
      setDescriptionEn(p.descriptionEn || "")

      setSelectedTechnologies(normalizeToArray(p.technologies))
      setSelectedGenres(normalizeToArray(p.genres))
      const cats = normalizeToArray(p.categories)
      setSelectedCategories(cats.length ? cats : [p.category || "web"].filter(Boolean))
      setFeatured(Boolean(p.featured))
      setProjectUrl(p.projectUrl || (p as any).project_url || "")
      setCurrentImage(p.image || "")
      setCurrentVideo(p.video || "")
      setCurrentPresentation(p.presentation || "")
      setCurrentGallery(normalizeToArray((p as any).images))
      setImageFile(null)
      setVideoFile(null)
      setPresentationFile(null)
      setGalleryFiles([])
      setRemovedGallery([])
      setReplaceGallery(false)
    } catch (e: any) {
      setError(e?.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLookups()
  }, [])

  useEffect(() => {
    if (mode.kind !== "edit") return

    const rawId = String((mode as any)?.id ?? "").trim()
    if (!rawId || rawId === "undefined" || rawId === "null" || !/^\d+$/.test(rawId)) {
      setError("Invalid project id")
      setLoading(false)
      return
    }

    loadProject(rawId)
  }, [mode.kind, (mode as any)?.id])

  const langTabs = useMemo(
    () => [
      { key: "ru" as const, label: "RU" },
      { key: "kz" as const, label: "KZ" },
      { key: "en" as const, label: "EN" },
    ],
    []
  )

  const langTitle =
    activeLang === "ru" ? titleRu : activeLang === "kz" ? titleKz : titleEn
  const setLangTitle =
    activeLang === "ru" ? setTitleRu : activeLang === "kz" ? setTitleKz : setTitleEn
  const langDesc =
    activeLang === "ru"
      ? descriptionRu
      : activeLang === "kz"
        ? descriptionKz
        : descriptionEn
  const setLangDesc =
    activeLang === "ru"
      ? setDescriptionRu
      : activeLang === "kz"
        ? setDescriptionKz
        : setDescriptionEn

  async function submit() {
    setSubmitting(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("title_ru", titleRu)
      fd.append("title_kz", titleKz)
      fd.append("title_en", titleEn)
      fd.append("description_ru", descriptionRu)
      fd.append("description_kz", descriptionKz)
      fd.append("description_en", descriptionEn)
      fd.append("technologies", selectedTechnologies.join(", "))
      fd.append("genres", selectedGenres.join(", "))
      const cats = selectedCategories.length ? selectedCategories : ["web"]
      fd.append("categories", cats.join(", "))
      fd.append("category", cats[0] || "web")
      fd.append("featured", toBoolString(featured))
      fd.append("project_url", projectUrl)

      if (imageFile) fd.append("image_file", imageFile)
      if (videoFile) fd.append("video_file", videoFile)
      if (presentationFile) fd.append("presentation_file", presentationFile)
      for (const f of galleryFiles) fd.append("gallery_files", f)
      if (replaceGallery) fd.append("replace_gallery", "true")
      if (removedGallery.length) fd.append("remove_images", removedGallery.join(", "))

      const url =
        mode.kind === "edit"
          ? `${API_BASE}/api/admin/projects/${encodeURIComponent(mode.id)}/edit`
          : `${API_BASE}/api/admin/projects/new`

      const res = await fetch(url, {
        method: "POST",
        body: fd,
        credentials: "include",
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Save failed: ${res.status} ${text}`)
      }

      router.push("/admin/projects")
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Save failed")
    } finally {
      setSubmitting(false)
    }
  }

  const galleryUrls = useMemo(() => {
    const combined = [currentImage, ...currentGallery].filter(Boolean)
    return Array.from(new Set(combined))
  }, [currentImage, currentGallery])

  const visibleGalleryUrls = useMemo(() => {
    if (!removedGallery.length) return galleryUrls
    const removed = new Set(removedGallery)
    return galleryUrls.filter((u) => !removed.has(u))
  }, [galleryUrls, removedGallery])

  function toggleRemoveImage(url: string) {
    const u = String(url || "").trim()
    if (!u) return
    setRemovedGallery((prev) => {
      const set = new Set(prev)
      if (set.has(u)) set.delete(u)
      else set.add(u)
      return Array.from(set)
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10
                       text-white/80 hover:text-white hover:border-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
            {t("projects")}
          </Link>

          <h1 className="text-3xl font-bold gradient-text">
            {mode.kind === "edit" ? t("editProject") : t("addProject")}
          </h1>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white font-medium
                     transition-all duration-300 hover:scale-105 glow-hover disabled:opacity-60 disabled:hover:scale-100"
        >
          <Save size={18} />
          {submitting ? t("saving") : t("submit")}
        </button>
      </div>

      {error && (
        <div className="mb-6 glass border border-red-500/30 rounded-2xl p-4 text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">{t("loading")}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Language block */}
          <div className="xl:col-span-2 glass border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {langTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveLang(tab.key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                    activeLang === tab.key
                      ? "gradient-bg text-white border-transparent"
                      : "glass border-white/10 text-white/70 hover:text-white hover:border-white/20"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5">
              <Field
                label={
                  activeLang === "ru"
                    ? t("fieldTitleRu")
                    : activeLang === "kz"
                      ? t("fieldTitleKz")
                      : t("fieldTitleEn")
                }
                value={langTitle}
                onChange={setLangTitle}
                placeholder="Title"
              />

              <RichTextEditor
                label={
                  activeLang === "ru"
                    ? t("fieldDescRu")
                    : activeLang === "kz"
                      ? t("fieldDescKz")
                      : t("fieldDescEn")
                }
                value={langDesc}
                onChange={setLangDesc}
              />
            </div>
          </div>

          {/* Meta block */}
          <div className="glass border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <MultiSelect
                  label={`${t("category")} (multi)`}
                  options={
                    availableCategories.length ? availableCategories : ["web", "mobile", "iot", "aiml", "vrar"]
                  }
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  emptyHint="Add options in Admin → Categories"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">{t("featured")}</label>
                  <p className="text-xs text-muted-foreground/70">Show this project as featured.</p>
                </div>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-5 w-5 accent-rose-700"
                />
              </div>

              <Field label={t("fieldProjectUrl")} value={projectUrl} onChange={setProjectUrl} placeholder="https://..." />

              <MultiSelect
                label={t("fieldTech")}
                options={availableTechnologies}
                selected={selectedTechnologies}
                onChange={setSelectedTechnologies}
                emptyHint="Add options in Admin → Technologies"
              />

              <MultiSelect
                label="Genres"
                options={availableGenres}
                selected={selectedGenres}
                onChange={setSelectedGenres}
                emptyHint="Add options in Admin → Genres"
              />

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t("fieldImage")}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white
                             focus:outline-none focus:border-white/30 transition-colors bg-transparent"
                />
                {mode.kind === "edit" && (
                  <p className="text-xs text-muted-foreground mt-2">{t("keepImageHint")}</p>
                )}
                {mode.kind === "edit" && currentImage && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentImage} alt="current" className="w-full h-36 object-cover opacity-90" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Video fragment</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white
                             focus:outline-none focus:border-white/30 transition-colors bg-transparent"
                />
                {mode.kind === "edit" && currentVideo && !videoFile && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <video src={currentVideo} controls className="w-full h-52 bg-black" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Presentation file</label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={(e) => setPresentationFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white
                             focus:outline-none focus:border-white/30 transition-colors bg-transparent"
                />
                <p className="mt-2 text-xs text-muted-foreground">PDF previews best in browser.</p>
                {mode.kind === "edit" && currentPresentation && !presentationFile && (
                  <a
                    href={currentPresentation}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm text-white/80 underline hover:text-white"
                  >
                    Open current presentation
                  </a>
                )}
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Gallery images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white
                             focus:outline-none focus:border-white/30 transition-colors bg-transparent"
                />

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={replaceGallery}
                    onChange={(e) => setReplaceGallery(e.target.checked)}
                    className="h-4 w-4 accent-rose-700"
                  />
                  <span>Replace gallery on save</span>
                </div>

                {galleryFiles.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Selected: <span className="text-white/80">{galleryFiles.length}</span>
                  </div>
                )}

                {mode.kind === "edit" && visibleGalleryUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {visibleGalleryUrls.map((url) => {
                      const willRemove = removedGallery.includes(url)
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => toggleRemoveImage(url)}
                          className={cn(
                            "relative rounded-xl overflow-hidden border bg-black/40 aspect-[4/3]",
                            willRemove ? "border-red-500/50 opacity-60" : "border-white/10 hover:border-white/20"
                          )}
                          title={willRemove ? "Will be removed" : "Click to remove"}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="gallery" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute top-1 right-1 px-2 py-1 rounded-lg text-[10px] bg-black/60 text-white/80">
                            {willRemove ? "Undo" : "Remove"}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {removedGallery.length > 0 && (
                  <div className="mt-2 text-xs text-red-300">
                    Will remove: <span className="text-white/80">{removedGallery.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-xs text-muted-foreground">
        {mode.kind === "edit"
          ? "Editing saves to /api/admin/projects/:id/edit (cookie session)."
          : "Creating saves to /api/admin/projects/new (cookie session)."}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-2">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white
                   focus:outline-none focus:border-white/30 transition-colors"
      />
    </div>
  )
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  emptyHint,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  emptyHint?: string
}) {
  const hasOptions = Array.isArray(options) && options.length > 0

  function toggle(name: string) {
    const clean = String(name).trim()
    if (!clean) return
    const set = new Set(selected)
    if (set.has(clean)) set.delete(clean)
    else set.add(clean)
    onChange(Array.from(set))
  }

  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-2">{label}</label>
      <div className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-white bg-transparent">
        {!hasOptions ? (
          <div className="text-xs text-muted-foreground">{emptyHint || "No options"}</div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
            {options.map((opt) => {
              const active = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm border transition-colors",
                    active
                      ? "border-rose-700/70 bg-rose-900/30 text-white"
                      : "border-white/10 hover:border-white/20 text-muted-foreground hover:text-white"
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {selected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5"
              >
                {s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="text-muted-foreground hover:text-white"
                  aria-label={`remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
