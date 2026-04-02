import * as React from "react"
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File,
} from "lucide-react"

import { cn } from "@/lib/utils"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function getFileIcon(type: string) {
  const t = type.toLowerCase()
  if (t.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(t)) return FileImage
  if (t.startsWith("video/") || /\.(mp4|mov|avi|webm)$/i.test(t)) return FileVideo
  if (t.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/i.test(t)) return FileAudio
  if (/\.(zip|rar|7z|tar|gz)$/i.test(t) || t.includes("zip") || t.includes("archive")) return FileArchive
  if (/\.(js|ts|tsx|jsx|py|rb|go|rs|html|css|json|xml)$/i.test(t) || t.includes("javascript") || t.includes("json")) return FileCode
  if (/\.(csv|xls|xlsx)$/i.test(t) || t.includes("spreadsheet") || t.includes("csv")) return FileSpreadsheet
  if (/\.(pdf|doc|docx|txt|md)$/i.test(t) || t.includes("text") || t.includes("pdf")) return FileText
  return File
}

function FilePreview({
  className,
  name,
  size,
  type,
  thumbnail,
  ...props
}: React.ComponentProps<"div"> & {
  name: string
  size: number
  type: string
  thumbnail?: string
}) {
  const Icon = getFileIcon(type)

  return (
    <div
      data-slot="file-preview"
      className={cn(
        "ring-foreground/10 flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1",
        className
      )}
      {...props}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={name}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(size)}
        </p>
      </div>
    </div>
  )
}

export { FilePreview }
