"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { getProject, type BackendProject } from "@/lib/api"

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

function pickLang(p: BackendProject, lang: "ru" | "kz" | "en") {
  const title =
    (lang === "ru" ? p.titleRu : lang === "kz" ? p.titleKz : p.titleEn) ||
    p.titleEn ||
    p.titleRu ||
    p.titleKz ||
    "Untitled project"

  const descriptionHtml =
    (lang === "ru" ? p.descriptionRu : lang === "kz" ? p.descriptionKz : p.descriptionEn) ||
    p.descriptionEn ||
    p.descriptionRu ||
    p.descriptionKz ||
    ""

  return { title, descriptionHtml }
}

function safeProjectUrl(p: BackendProject) {
  const url = String(p.projectUrl ?? (p as any).project_url ?? "").trim()
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url
}

function normalizeAssetUrl(url?: string) {
  const value = String(url || "").trim()
  if (!value) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("/")) return `${API_BASE}${value}`
  return `${API_BASE}/${value}`
}

function isPdf(url?: string) {
  return /\.pdf(?:$|\?)/i.test(String(url || "").trim())
}

export default function ProjectDetailPage() {
  const { t, language } = useI18n()
  const lang: "ru" | "kz" | "en" = (language as any) || "en"
  const router = useRouter()
  const params = useParams<{ id?: string | string[] }>()
  const routeId = Array.isArray(params?.id) ? params?.id?.[0] : params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [project, setProject] = useState<BackendProject | null>(null)
  const [index, setIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState<string[]>([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next")

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const rawId = String(routeId ?? "").trim()
        if (!rawId || rawId === "undefined" || rawId === "null" || !/^\d+$/.test(rawId)) {
          router.replace("/projects")
          return
        }
        const p = await getProject(rawId)
        if (!alive) return
        setProject(p)
        setIndex(0)
        setBrokenImages([])
      } catch (e: any) {
        if (!alive) return
        setProject(null)
        setError(e?.message || "Failed to load project")
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [routeId, router])

  const { title, descriptionHtml } = useMemo(() => pickLang(project || ({} as any), lang), [project, lang])

  const techs = useMemo(() => {
    if (!project) return []
    return normalizeToArray(project.technologies as any)
  }, [project])

  const images = useMemo(() => {
    if (!project) return []
    const combined = [
      normalizeAssetUrl(project.image),
      ...normalizeToArray((project as any).images).map((url) => normalizeAssetUrl(url)),
    ].filter(Boolean)
    const unique = Array.from(new Set(combined))
    if (!brokenImages.length) return unique
    const broken = new Set(brokenImages)
    return unique.filter((u) => !broken.has(u))
  }, [project, brokenImages])

  function markBroken(url: string) {
    const u = String(url || "").trim()
    if (!u) return
    setBrokenImages((prev) => (prev.includes(u) ? prev : [...prev, u]))
  }

  const canPrev = images.length > 1
  const canNext = images.length > 1

  useEffect(() => {
    if (!images.length) {
      if (index !== 0) setIndex(0)
      return
    }
    if (index >= images.length) setIndex(0)
  }, [images.length, index])

  const prev = useCallback(() => {
    if (images.length <= 1) return
    setSlideDir("prev")
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    if (images.length <= 1) return
    setSlideDir("next")
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!viewerOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerOpen(false)
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [viewerOpen, next, prev])

  const current = images[index] || ""
  const projectUrl = project ? safeProjectUrl(project) : ""
  const videoUrl = normalizeAssetUrl(project?.video)
  const presentationUrl = normalizeAssetUrl(project?.presentation)

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">{t("loading")}</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="glass border border-red-500/30 rounded-2xl p-6 text-red-300 text-center">
            {error || "Project not found"}
            <div className="mt-4">
              <Link href="/projects" className="gradient-text underline">
                {t("projects")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      {viewerOpen && current && (
        <div
          className="fixed inset-0 z-[200] bg-black/90"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewerOpen(false)}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden bg-black border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current}
                src={current}
                alt={title}
                className={cn(
                  "absolute inset-0 w-full h-full object-contain",
                  "animate-in fade-in duration-300",
                  slideDir === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3"
                )}
                onError={() => markBroken(current)}
              />

              <button
                type="button"
                onClick={() => setViewerOpen(false)}
                className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black border border-white/10 text-white hover:border-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="mx-auto" size={18} />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    disabled={!canPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black border border-white/10 text-white hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="mx-auto" size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black border border-white/10 text-white hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next"
                  >
                    <ChevronRight className="mx-auto" size={22} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-colors"
          >
            <ChevronLeft size={18} />
            {t("projects")}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Slider */}
          <div className="glass border border-white/10 rounded-2xl p-4">
            <div className="relative rounded-2xl overflow-hidden bg-black/40 aspect-[16/10] border border-white/10">
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current}
                  src={current}
                  alt={title}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover cursor-zoom-in",
                    "animate-in fade-in duration-300",
                    slideDir === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2"
                  )}
                  onError={() => markBroken(current)}
                  onClick={() => setViewerOpen(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No images
                </div>
              )}

              {current && (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/70 border border-white/10 text-white hover:border-white/20 transition-colors"
                  aria-label="Fullscreen"
                  title="Fullscreen"
                >
                  <Maximize2 className="mx-auto" size={18} />
                </button>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    disabled={!canPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass border border-white/10 text-white hover:border-white/20 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="mx-auto" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass border border-white/10 text-white hover:border-white/20 transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="mx-auto" size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                    {images.slice(0, 10).map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      setSlideDir(i > index ? "next" : "prev")
                      setIndex(i)
                    }}
                    className={cn(
                      "relative rounded-xl overflow-hidden aspect-[4/3] border bg-black/40",
                      i === index ? "border-rose-700/70" : "border-white/10 hover:border-white/20"
                    )}
                    aria-label={`image ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => markBroken(url)}
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="glass border border-white/10 rounded-2xl p-6 flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              {project.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium gradient-bg text-white">
                  {String(project.category).toUpperCase()}
                </span>
              )}
              {Boolean(project.featured) && (
                <span className="px-3 py-1 rounded-full text-xs font-medium border border-rose-700/40 bg-rose-900/20 text-rose-200">
                  Featured
                </span>
              )}
            </div>

            {techs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {techs.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div
              className="prose prose-invert max-w-none text-white/80"
              // backend sanitizes this field
              dangerouslySetInnerHTML={{ __html: descriptionHtml || "" }}
            />

            {projectUrl && (
              <div className="mt-8">
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={18} />
                  {t("viewProject")}
                </a>
              </div>
            )}
          </div>
        </div>

        {(videoUrl || presentationUrl) && (
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
            {videoUrl && (
              <section className="glass border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Видео</h2>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                  <video
                    src={videoUrl}
                    controls
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                </div>
              </section>
            )}

            {presentationUrl && (
              <section className="glass border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-semibold text-white">Презентация</h2>
                  <a
                    href={presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/80 underline hover:text-white"
                  >
                    Открыть файл
                  </a>
                </div>

                {isPdf(presentationUrl) ? (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-white h-[640px]">
                    <iframe
                      src={presentationUrl}
                      title={`${title} presentation`}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/70">
                    Предпросмотр поддерживается для PDF. Для остальных форматов файл можно открыть отдельно.
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
