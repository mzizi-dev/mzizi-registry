"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Search } from "lucide-react"

const components: { name: string; category: string }[] = [
  // Forms & Input
  { name: "autocomplete", category: "input" },
  { name: "address-input", category: "input" },
  { name: "calendar", category: "input" },
  { name: "checkbox", category: "input" },
  { name: "code-editor", category: "input" },
  { name: "color-picker", category: "input" },
  { name: "combobox", category: "input" },
  { name: "command", category: "input" },
  { name: "date-picker", category: "input" },
  { name: "date-range-picker", category: "input" },
  { name: "field", category: "input" },
  { name: "file-upload", category: "input" },
  { name: "form", category: "input" },
  { name: "input", category: "input" },
  { name: "input-group", category: "input" },
  { name: "input-otp", category: "input" },
  { name: "label", category: "input" },
  { name: "mention-input", category: "input" },
  { name: "native-select", category: "input" },
  { name: "number-input", category: "input" },
  { name: "phone-input", category: "input" },
  { name: "radio-group", category: "input" },
  { name: "rich-text-editor", category: "input" },
  { name: "search-bar", category: "input" },
  { name: "select", category: "input" },
  { name: "slider", category: "input" },
  { name: "switch", category: "input" },
  { name: "tag-input", category: "input" },
  { name: "textarea", category: "input" },
  { name: "time-picker", category: "input" },
  { name: "time-slot-picker", category: "input" },
  { name: "transfer-list", category: "input" },
  // Action
  { name: "button", category: "action" },
  { name: "button-group", category: "action" },
  { name: "copy-button", category: "action" },
  { name: "rating", category: "action" },
  { name: "toggle", category: "action" },
  { name: "toggle-group", category: "action" },
  // Data Display
  { name: "avatar", category: "data" },
  { name: "avatar-group", category: "data" },
  { name: "badge", category: "data" },
  { name: "chart", category: "data" },
  { name: "data-table", category: "data" },
  { name: "description-list", category: "data" },
  { name: "json-viewer", category: "data" },
  { name: "kanban-board", category: "data" },
  { name: "kbd", category: "data" },
  { name: "pricing-card", category: "data" },
  { name: "property-list", category: "data" },
  { name: "schema-viewer", category: "data" },
  { name: "stats-card", category: "data" },
  { name: "status-indicator", category: "data" },
  { name: "table", category: "data" },
  { name: "timeline", category: "data" },
  { name: "tree-view", category: "data" },
  { name: "typography", category: "data" },
  { name: "virtual-list", category: "data" },
  // Feedback
  { name: "alert", category: "feedback" },
  { name: "announcement-bar", category: "feedback" },
  { name: "changelog-entry", category: "feedback" },
  { name: "cookie-consent", category: "feedback" },
  { name: "empty", category: "feedback" },
  { name: "maintenance-page", category: "feedback" },
  { name: "onboarding-tour", category: "feedback" },
  { name: "password-strength", category: "feedback" },
  { name: "progress", category: "feedback" },
  { name: "skeleton", category: "feedback" },
  { name: "sonner", category: "feedback" },
  { name: "spinner", category: "feedback" },
  { name: "toast", category: "feedback" },
  { name: "toaster", category: "feedback" },
  // Layout
  { name: "accordion", category: "layout" },
  { name: "aspect-ratio", category: "layout" },
  { name: "card", category: "layout" },
  { name: "carousel", category: "layout" },
  { name: "collapsible", category: "layout" },
  { name: "dashboard-layout", category: "layout" },
  { name: "detail-layout", category: "layout" },
  { name: "drawer", category: "layout" },
  { name: "infinite-scroll", category: "layout" },
  { name: "masonry-grid", category: "layout" },
  { name: "page-header", category: "layout" },
  { name: "pull-to-refresh", category: "layout" },
  { name: "resizable", category: "layout" },
  { name: "scroll-area", category: "layout" },
  { name: "section-header", category: "layout" },
  { name: "separator", category: "layout" },
  { name: "settings-layout", category: "layout" },
  { name: "sheet", category: "layout" },
  { name: "sidebar", category: "layout" },
  { name: "split-view", category: "layout" },
  { name: "sticky-bar", category: "layout" },
  // Navigation
  { name: "bottom-sheet", category: "navigation" },
  { name: "breadcrumb", category: "navigation" },
  { name: "mega-menu", category: "navigation" },
  { name: "menubar", category: "navigation" },
  { name: "navigation-menu", category: "navigation" },
  { name: "pagination", category: "navigation" },
  { name: "stepper", category: "navigation" },
  { name: "tabs", category: "navigation" },
  // Overlay
  { name: "alert-dialog", category: "overlay" },
  { name: "context-menu", category: "overlay" },
  { name: "dialog", category: "overlay" },
  { name: "dropdown-menu", category: "overlay" },
  { name: "filter-bar", category: "overlay" },
  { name: "hover-card", category: "overlay" },
  { name: "notification-bell", category: "overlay" },
  { name: "popover", category: "overlay" },
  { name: "share-dialog", category: "overlay" },
  { name: "tooltip", category: "overlay" },
  { name: "user-menu", category: "overlay" },
  // Chat & Messaging
  { name: "chat-bubble", category: "chat" },
  { name: "chat-input", category: "chat" },
  { name: "chat-layout", category: "chat" },
  { name: "chat-list", category: "chat" },
  { name: "message-thread", category: "chat" },
  { name: "reaction-picker", category: "chat" },
  { name: "typing-indicator", category: "chat" },
  // AI & Chatbot
  { name: "ai-chat", category: "ai" },
  { name: "ai-feedback", category: "ai" },
  { name: "ai-response-card", category: "ai" },
  { name: "prompt-input", category: "ai" },
  { name: "source-citation", category: "ai" },
  { name: "streaming-text", category: "ai" },
  { name: "suggested-prompts", category: "ai" },
  // User & Profile
  { name: "activity-feed", category: "user" },
  { name: "notification-list", category: "user" },
  { name: "profile-header", category: "user" },
  { name: "user-card", category: "user" },
  // E-commerce
  { name: "cart-item", category: "commerce" },
  { name: "invoice-row", category: "commerce" },
  { name: "order-summary", category: "commerce" },
  { name: "payment-method-card", category: "commerce" },
  { name: "price-display", category: "commerce" },
  { name: "product-card", category: "commerce" },
  { name: "subscription-card", category: "commerce" },
  // Calendar & Scheduling
  { name: "agenda-view", category: "calendar" },
  { name: "calendar-day-view", category: "calendar" },
  { name: "calendar-week-view", category: "calendar" },
  { name: "event-card", category: "calendar" },
  // Content & Media
  { name: "audio-player", category: "media" },
  { name: "file-preview", category: "media" },
  { name: "lightbox", category: "media" },
  { name: "markdown-renderer", category: "media" },
  { name: "video-player", category: "media" },
  // Developer Tools
  { name: "api-key-display", category: "developer" },
  { name: "code-block", category: "developer" },
  { name: "code-tabs", category: "developer" },
  { name: "endpoint-card", category: "developer" },
  { name: "env-editor", category: "developer" },
  { name: "log-viewer", category: "developer" },
  { name: "webhook-card", category: "developer" },
  // Security & Auth
  { name: "audit-log-entry", category: "security" },
  { name: "mfa-setup", category: "security" },
  { name: "permission-badge", category: "security" },
  { name: "role-selector", category: "security" },
  { name: "session-list", category: "security" },
  // Productivity
  { name: "checklist", category: "productivity" },
  { name: "comment-thread", category: "productivity" },
  { name: "drag-handle", category: "productivity" },
  { name: "note-card", category: "productivity" },
  { name: "todo-item", category: "productivity" },
  // Directory & Listings
  { name: "category-browser", category: "directory" },
  { name: "contact-card", category: "directory" },
  { name: "featured-card", category: "directory" },
  { name: "listing-card", category: "directory" },
  { name: "review-card", category: "directory" },
  // Mukoko Ecosystem
  { name: "app-switcher", category: "ecosystem" },
  { name: "mukoko-bottom-nav", category: "ecosystem" },
  { name: "mukoko-footer", category: "ecosystem" },
  { name: "mukoko-header", category: "ecosystem" },
  { name: "mukoko-sidebar", category: "ecosystem" },
  // Infrastructure
  { name: "error-boundary", category: "infra" },
  { name: "lazy-section", category: "infra" },
  { name: "section-error-boundary", category: "infra" },
  // Hooks
  { name: "use-memory-pressure", category: "hook" },
  { name: "use-mobile", category: "hook" },
  { name: "use-toast", category: "hook" },
  // Lib Utilities
  { name: "utils", category: "lib" },
  { name: "observability", category: "lib" },
  { name: "circuit-breaker", category: "lib" },
  { name: "retry", category: "lib" },
  { name: "timeout", category: "lib" },
  { name: "fallback-chain", category: "lib" },
  { name: "ai-safety", category: "lib" },
  { name: "chaos", category: "lib" },
  { name: "architecture", category: "lib" },
]

const categories = [
  "all",
  "input",
  "action",
  "data",
  "feedback",
  "layout",
  "navigation",
  "overlay",
  "chat",
  "ai",
  "user",
  "commerce",
  "calendar",
  "media",
  "developer",
  "security",
  "productivity",
  "directory",
  "ecosystem",
  "infra",
  "hook",
  "lib",
]

const categoryDots: Record<string, string> = {
  input: "bg-[var(--color-cobalt)]",
  action: "bg-[var(--color-tanzanite)]",
  data: "bg-[var(--color-malachite)]",
  feedback: "bg-[var(--color-gold)]",
  layout: "bg-[var(--color-terracotta)]",
  navigation: "bg-[var(--color-cobalt)]",
  overlay: "bg-[var(--color-tanzanite)]",
  chat: "bg-[var(--color-malachite)]",
  ai: "bg-[var(--color-tanzanite)]",
  user: "bg-[var(--color-cobalt)]",
  commerce: "bg-[var(--color-gold)]",
  calendar: "bg-[var(--color-terracotta)]",
  media: "bg-[var(--color-malachite)]",
  developer: "bg-[var(--color-cobalt)]",
  security: "bg-[var(--color-terracotta)]",
  productivity: "bg-[var(--color-gold)]",
  directory: "bg-[var(--color-malachite)]",
  ecosystem: "bg-[var(--color-tanzanite)]",
  infra: "bg-muted-foreground",
  hook: "bg-muted-foreground",
  lib: "bg-muted-foreground",
}

function CatalogItem({ name, category }: { name: string; category: string }) {
  const [copied, setCopied] = useState(false)
  const installCmd = `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${name}`

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(installCmd)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-foreground/12"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`size-1.5 rounded-full ${categoryDots[category] || "bg-muted-foreground"}`}
        />
        <span className="font-mono text-sm text-foreground">{name}</span>
      </div>
      <span className="flex size-6 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? (
          <Check className="size-3.5 text-[var(--color-malachite)]" />
        ) : (
          <Copy className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </span>
    </button>
  )
}

export function ComponentCatalog() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const filtered = components.filter((c) => {
    const matchesSearch = c.name.includes(search.toLowerCase())
    const matchesCategory = activeCategory === "all" || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section id="catalog" className="px-4 py-16 sm:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-3 text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Full Catalog
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl md:text-4xl">
            All {components.length} registry items
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Click any item to copy its install command. Components, hooks, blocks, and utilities.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {cat !== "all" && (
                  <span
                    className={`size-1.5 rounded-full ${
                      activeCategory === cat
                        ? "bg-background"
                        : categoryDots[cat] || "bg-muted-foreground"
                    }`}
                  />
                )}
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <CatalogItem key={c.name} name={c.name} category={c.category} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">No components match your filter.</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="font-mono">{filtered.length}</span> of {components.length} shown
          </Badge>
        </div>
      </div>
    </section>
  )
}
