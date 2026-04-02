"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react"

const categories = ["All", "Articles", "People", "Events", "Places"]

const results = [
  {
    title: "Building Resilient Microservices in Africa",
    href: "#",
    excerpt: "A practical guide to designing fault-tolerant distributed systems tailored for African infrastructure challenges and connectivity patterns...",
    tags: ["Technology", "Architecture"],
    author: "Kuda R.",
    date: "Mar 28, 2026",
  },
  {
    title: "Matobo Hills: A Complete Travel Guide",
    href: "#",
    excerpt: "Everything you need to know about visiting the UNESCO World Heritage site. From rock formations to ancient San paintings, discover the hidden gems...",
    tags: ["Travel", "Tourism"],
    author: "Noma S.",
    date: "Mar 25, 2026",
  },
  {
    title: "Best Maize Varieties for Southern Africa",
    href: "#",
    excerpt: "Comparing drought-resistant maize varieties across different rainfall zones. Field trial results from the 2025-2026 growing season show promising yields...",
    tags: ["Farming"],
    author: "Farai C.",
    date: "Mar 20, 2026",
  },
  {
    title: "Harare Tech Community Meetup Recap",
    href: "#",
    excerpt: "Over 200 developers gathered at the Harare Innovation Hub for the monthly tech meetup. Highlights include talks on Flutter, AI safety, and the mukoko ecosystem...",
    tags: ["Technology", "Events"],
    author: "Tendai M.",
    date: "Mar 15, 2026",
  },
]

function SearchResults() {
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [showFilters, setShowFilters] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-10"
            placeholder="Search mukoko..."
            defaultValue="African technology"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>

        {/* Category filters */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors ${
                activeCategory === cat
                  ? "border-cobalt/30 bg-cobalt/10 font-medium text-cobalt"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter sidebar (expandable) */}
        {showFilters && (
          <Card className="mt-4" size="sm">
            <CardContent className="flex flex-wrap gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Date range</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs">Past week</Button>
                  <Button variant="outline" size="xs">Past month</Button>
                  <Button variant="outline" size="xs">Past year</Button>
                </div>
              </div>
              <Separator orientation="vertical" className="hidden self-stretch sm:block" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Sort by</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs">Relevance</Button>
                  <Button variant="outline" size="xs">Newest</Button>
                  <Button variant="outline" size="xs">Popular</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{results.length}</span> results for{" "}
            <span className="font-medium text-foreground">&quot;African technology&quot;</span>
          </p>
        </div>

        <Separator className="mt-3" />

        {/* Results list */}
        <div className="mt-4 space-y-4">
          {results.map((result) => (
            <article key={result.title} className="group">
              <a href={result.href} className="block space-y-1.5">
                <h3 className="text-base font-medium text-foreground group-hover:text-cobalt">
                  {result.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {result.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {result.author} &middot; {result.date}
                  </span>
                </div>
              </a>
              <Separator className="mt-4" />
            </article>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled>
            <ChevronLeft className="size-4" />
          </Button>
          {[1, 2, 3].map((page) => (
            <Button
              key={page}
              variant={page === 1 ? "secondary" : "ghost"}
              size="icon-sm"
            >
              {page}
            </Button>
          ))}
          <Button variant="ghost" size="icon-sm">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { SearchResults }
