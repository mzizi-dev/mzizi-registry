import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"

interface DetailLayoutProps {
  title: string
  subtitle?: string
  metadata?: React.ReactNode
  heroImage?: string
  actions?: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}

export function DetailLayout({
  title,
  subtitle,
  metadata,
  heroImage,
  actions,
  children,
  aside,
  backHref,
  backLabel = "Back",
  className,
}: DetailLayoutProps) {
  return (
    <article
      data-slot="detail-layout"
      className={cn("mx-auto w-full max-w-5xl px-4 py-6 sm:px-6", className)}
    >
      {/* Back navigation */}
      {backHref && (
        <a
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </a>
      )}

      {/* Hero image */}
      {heroImage && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl">
          <img
            src={heroImage}
            alt=""
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="space-y-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
            {metadata && (
              <div className="flex flex-wrap items-center gap-3">
                {metadata}
              </div>
            )}
          </header>

          {/* Actions */}
          {actions && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {actions}
              </div>
              <Separator className="my-6" />
            </>
          )}

          {!actions && <Separator className="my-6" />}

          {/* Body */}
          <div className="prose prose-neutral dark:prose-invert max-w-3xl">
            {children}
          </div>
        </div>

        {/* Aside */}
        {aside && (
          <aside className="w-full shrink-0 lg:w-72">
            <div className="sticky top-20 space-y-4">{aside}</div>
          </aside>
        )}
      </div>
    </article>
  )
}
