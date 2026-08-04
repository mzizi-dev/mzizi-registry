"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import {
  X,
  Image as ImageIcon,
  Play,
  FileText,
  MapPin,
  Mic,
  BookOpen,
  Type,
  Minus,
  Plus,
} from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI MEDIA COMPONENTS
   
   Content & media handling for a super app with:
   - Bytes (short video)
   - Novels (reading)  
   - News (articles)
   - Campfire (messaging with media)
   - Content (creative works)
   
   These brand components standardize how media is displayed,
   consumed, and shared across all Mukoko products.
   ═══════════════════════════════════════════════════════════════ */

// ─── 1. IMAGE GALLERY ──────────────────────────────────────
// Multi-image display with grid layout and lightbox expansion.

interface GalleryImage {
  src: string
  alt?: string
  width?: number
  height?: number
}

interface NyuchiImageGalleryProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  images: GalleryImage[]
  maxVisible?: number
  onImageTap?: (index: number) => void
  className?: string
}

export function NyuchiImageGallery({
  loading = false,
  images,
  maxVisible = 4,
  onImageTap,
  className,
}: NyuchiImageGalleryProps) {
  if (loading)
    return (
      <div
        data-slot="nyuchi-image-gallery"
        data-portal="https://mzizi.dev/components/nyuchi-image-gallery"
        data-loading
        role="group"
        aria-label="Image gallery"
        className={cn(
          "grid animate-pulse gap-1 overflow-hidden rounded-[var(--radius-lg,14px)]",
          className
        )}
      >
        <div className="aspect-video bg-muted" />
        <div className="grid grid-cols-3 gap-1">
          <div className="aspect-square bg-muted" />
          <div className="aspect-square bg-muted" />
          <div className="aspect-square bg-muted" />
        </div>
      </div>
    )

  const visible = images.slice(0, maxVisible)
  const remaining = Math.max(images.length - maxVisible, 0)
  const count = visible.length

  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : count === 3
          ? "grid-cols-2 [&>*:first-child]:row-span-2"
          : "grid-cols-2"

  return (
    <div
      data-slot="nyuchi-image-gallery"
      role="group"
      aria-label="Image gallery"
      className={cn(
        "grid gap-1 overflow-hidden rounded-[var(--radius-card,14px)]",
        gridClass,
        className
      )}
    >
      {visible.map((img, i) => {
        const isLast = i === visible.length - 1 && remaining > 0
        return (
          <button
            key={i}
            onClick={() => onImageTap?.(i)}
            className={cn(
              "relative overflow-hidden bg-muted",
              count === 1
                ? "aspect-video"
                : count === 3 && i === 0
                  ? "aspect-[9/16]"
                  : "aspect-square"
            )}
          >
            <img
              src={img.src}
              alt={img.alt || ""}
              className="size-full object-cover transition-transform hover:scale-105"
            />
            {isLast && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-2xl font-bold text-white">+{remaining}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── 2. READER MODE ────────────────────────────────────────
// Long-form content reader for articles and novel chapters.

type ReaderTheme = "dark" | "light" | "sepia"

interface NyuchiReaderModeProps {
  title: string
  content: string
  author?: string
  publishedAt?: string
  estimatedReadTime?: string
  onClose?: () => void
  className?: string
}

export function NyuchiReaderMode({
  title,
  content,
  author,
  publishedAt,
  estimatedReadTime,
  onClose,
  className,
}: NyuchiReaderModeProps) {
  const [fontSize, setFontSize] = React.useState(18)
  const [lineHeight] = React.useState(1.8)
  const [theme, setTheme] = React.useState<ReaderTheme>("dark")
  const [showControls, setShowControls] = React.useState(false)

  const themeBg = { dark: "var(--muted,#050504)", light: "#FAFAF8", sepia: "#F4ECD8" }
  const themeText = { dark: "#E0E0E0", light: "#1A1A1A", sepia: "#5B4636" }

  return (
    <div
      data-slot="nyuchi-reader-mode"
      className={cn("min-h-screen", className)}
      style={{ backgroundColor: themeBg[theme], color: themeText[theme] }}
    >
      {/* Toolbar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 backdrop-blur-xl"
        style={{ backgroundColor: `${themeBg[theme]}CC` }}
      >
        <button onClick={onClose} className="p-1">
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          {estimatedReadTime && (
            <span className="flex items-center gap-1 text-xs opacity-60">
              <BookOpen className="size-3" />
              {estimatedReadTime}
            </span>
          )}
          <button
            onClick={() => setShowControls(!showControls)}
            className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            <Type className="size-4" />
          </button>
        </div>
      </div>

      {/* Reading controls panel */}
      {showControls && (
        <div
          className="mx-5 mb-4 flex items-center justify-between rounded-[var(--radius-card,14px)] p-3"
          style={{
            backgroundColor:
              theme === "dark" ? "var(--card,#100F0E)" : theme === "light" ? "#F0F0F0" : "#EDE3CC",
          }}
        >
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize((f) => Math.max(14, f - 2))}>
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-xs">{fontSize}</span>
            <button onClick={() => setFontSize((f) => Math.min(28, f + 2))}>
              <Plus className="size-4" />
            </button>
          </div>
          <div className="flex gap-1">
            {(["dark", "light", "sepia"] as ReaderTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "size-7 rounded-full border-2",
                  theme === t ? "border-[var(--color-malachite)]" : "border-transparent"
                )}
                style={{ backgroundColor: themeBg[t] }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <article className="mx-auto max-w-2xl px-5 pb-20">
        <h1
          className="font-serif text-3xl leading-tight font-bold"
          style={{ fontSize: fontSize + 12 }}
        >
          {title}
        </h1>
        {(author || publishedAt) && (
          <div className="mt-3 flex items-center gap-2 text-sm opacity-50">
            {author && <span>{author}</span>}
            {publishedAt && <span>· {publishedAt}</span>}
          </div>
        )}
        <div
          className="mt-8 font-serif"
          style={{ fontSize, lineHeight }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </div>
  )
}

// ─── 3. MEDIA MESSAGE (Campfire) ───────────────────────────
// Standardized media attachment format for chat messages.

type MediaType = "image" | "video" | "audio" | "document" | "location"

interface NyuchiMediaMessageProps {
  type: MediaType
  src?: string
  fileName?: string
  fileSize?: string
  duration?: string
  thumbnail?: string
  locationName?: string
  coordinates?: { lat: number; lng: number }
  caption?: string
  onClick?: () => void
  className?: string
}

const mediaIcons: Record<MediaType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  image: ImageIcon,
  video: Play,
  audio: Mic,
  document: FileText,
  location: MapPin,
}

export function NyuchiMediaMessage({
  type,
  src,
  fileName,
  fileSize,
  duration,
  thumbnail,
  locationName,
  caption,
  onClick,
  className,
}: NyuchiMediaMessageProps) {
  const Icon = mediaIcons[type]

  if (type === "image" && src) {
    return (
      <div
        data-slot="nyuchi-media-message"
        onClick={onClick}
        className={cn("cursor-pointer overflow-hidden rounded-2xl", className)}
      >
        <img src={src} alt={caption || ""} className="max-h-64 w-full object-cover" />
        {caption && <p className="mt-1 text-xs opacity-70">{caption}</p>}
      </div>
    )
  }

  if (type === "video") {
    return (
      <div
        data-slot="nyuchi-media-message"
        onClick={onClick}
        className={cn("relative cursor-pointer overflow-hidden rounded-2xl bg-muted", className)}
      >
        {thumbnail && <img src={thumbnail} alt="" className="aspect-video w-full object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play className="ml-0.5 size-6 text-white" fill="white" />
          </div>
        </div>
        {duration && (
          <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {duration}
          </span>
        )}
      </div>
    )
  }

  if (type === "audio") {
    return (
      <div
        data-slot="nyuchi-media-message"
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-foreground/[0.04] px-3 py-2.5",
          className
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <Mic className="size-5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1">
          <div className="h-1 w-full rounded-full bg-foreground/10">
            <div className="h-full w-1/3 rounded-full bg-[var(--color-primary)]" />
          </div>
        </div>
        {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
      </div>
    )
  }

  // Document / Location / fallback
  return (
    <div
      data-slot="nyuchi-media-message"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl bg-foreground/[0.04] px-3 py-2.5",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)] bg-[var(--color-cobalt)]/10">
        <Icon className="size-5 text-[var(--color-cobalt)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {fileName || locationName || type}
        </div>
        {fileSize && <div className="text-xs text-muted-foreground">{fileSize}</div>}
      </div>
    </div>
  )
}

// ─── 4. STORY RING ─────────────────────────────────────────
// Ephemeral content avatar ring (Instagram/WhatsApp style).

interface NyuchiStoryRingProps {
  avatar?: string
  name: string
  hasUnseen?: boolean
  size?: number
  onClick?: () => void
  className?: string
}

export function NyuchiStoryRing({
  avatar,
  name,
  hasUnseen = false,
  size = 64,
  onClick,
  className,
}: NyuchiStoryRingProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
  const ringSize = size + 8

  return (
    <button
      data-slot="nyuchi-story-ring"
      onClick={onClick}
      className={cn("flex flex-col items-center gap-1.5", className)}
    >
      <div
        className="rounded-full p-[3px]"
        style={{
          width: ringSize,
          height: ringSize,
          background: hasUnseen
            ? "linear-gradient(135deg, var(--color-malachite,#64FFDA), var(--color-cobalt,#00B0FF), var(--color-tanzanite,#B388FF), var(--color-gold,#FFD740))"
            : "var(--color-border, #2A2A2A)",
        }}
      >
        <div className="size-full overflow-hidden rounded-full bg-[var(--color-background)] p-[2px]">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-muted">
            {avatar ? (
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
            )}
          </div>
        </div>
      </div>
      <span className="max-w-[64px] truncate text-[10px] text-muted-foreground">
        {name.split(" ")[0]}
      </span>
    </button>
  )
}

export type {
  GalleryImage,
  NyuchiImageGalleryProps,
  NyuchiReaderModeProps,
  NyuchiMediaMessageProps,
  NyuchiStoryRingProps,
  ReaderTheme,
  MediaType,
}
