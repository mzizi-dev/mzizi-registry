"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface ArticlePageProps {
  title?: string
  author?: { name: string; avatar?: string }
  publishedAt?: string
  readTime?: string
  heroImage?: string
  source?: { name: string; credibility?: string }
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function ArticlePage({
  title,
  author,
  publishedAt,
  readTime,
  heroImage,
  source,
  children,
  loading = false,
  className,
}: ArticlePageProps) {
  const { motion } = useNyuchiHarness("article-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="article-page"
        data-portal="https://mzizi.dev/components/article-page"
        data-loading
        role="main"
        className="animate-pulse"
      >
        <div className="aspect-[var(--aspect-media,1/1)] bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </main>
    )
  return (
    <article
      data-slot="article-page"
      role="article"
      style={animStyle}
      className={cn("mx-auto flex max-w-3xl flex-col", className)}
    >
      {heroImage && (
        <img
          src={heroImage}
          alt=""
          className="aspect-[var(--aspect-media,1/1)] w-full object-cover"
        />
      )}
      <div className="px-4 py-6">
        {title && <h1 className="text-2xl leading-tight font-bold sm:text-3xl">{title}</h1>}
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          {author && (
            <div className="flex items-center gap-2">
              {author.avatar && (
                <div className="size-6 overflow-hidden rounded-full bg-muted">
                  <img src={author.avatar} alt="" className="size-full object-cover" />
                </div>
              )}
              <span className="font-medium text-foreground">{author.name}</span>
            </div>
          )}
          {publishedAt && <time>{publishedAt}</time>}
          {readTime && <span>{readTime}</span>}
          {source && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{source.name}</span>
          )}
        </div>
        <div className="prose prose-sm mt-6 max-w-none text-foreground">{children}</div>
      </div>
    </article>
  )
}
export type { ArticlePageProps }
