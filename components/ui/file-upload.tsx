"use client"

import * as React from "react"
import { Upload, X, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Allow multiple files */
  multiple?: boolean
  /** Called when files are selected or dropped */
  onFilesChange?: (files: File[]) => void
  /** Called when a file is removed */
  onFileRemove?: (file: File) => void
  /** Disable the upload zone */
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function FileUpload({
  accept,
  maxSize,
  multiple = false,
  onFilesChange,
  onFileRemove,
  disabled = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validateFiles = (incoming: File[]): File[] => {
    setError(null)
    const valid: File[] = []
    for (const file of incoming) {
      if (maxSize && file.size > maxSize) {
        setError(`${file.name} exceeds ${formatFileSize(maxSize)} limit`)
        continue
      }
      valid.push(file)
    }
    return valid
  }

  const handleFiles = (incoming: File[]) => {
    const validated = validateFiles(incoming)
    if (validated.length === 0) return
    const next = multiple ? [...files, ...validated] : validated.slice(0, 1)
    setFiles(next)
    onFilesChange?.(next)
  }

  const handleRemove = (file: File) => {
    const next = files.filter((f) => f !== file)
    setFiles(next)
    onFileRemove?.(file)
    onFilesChange?.(next)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files)
    handleFiles(dropped)
  }

  return (
    <div data-slot="file-upload" className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept
              ? `Accepted: ${accept}`
              : "Any file type"}
            {maxSize && ` · Max ${formatFileSize(maxSize)}`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? [])
            handleFiles(selected)
            e.target.value = ""
          }}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 shrink-0 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(file)
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { FileUpload }
export type { FileUploadProps }
