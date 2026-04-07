"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Clock,
  FileText,
  Home,
  LayoutDashboard,
  Palette,
  Search,
  Settings,
  User,
  Zap,
} from "lucide-react"

const recents = [
  { icon: Home, label: "Home", shortcut: "G H" },
  { icon: LayoutDashboard, label: "Dashboard", shortcut: "G D" },
  { icon: User, label: "Profile", shortcut: "G P" },
]

const pages = [
  { icon: Home, label: "Home" },
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: User, label: "Profile" },
  { icon: Settings, label: "Settings" },
  { icon: Palette, label: "Brand" },
]

const components = [
  { icon: Zap, label: "Button" },
  { icon: Zap, label: "Card" },
  { icon: Zap, label: "Dialog" },
  { icon: Zap, label: "Tabs" },
]

const actions = [
  { icon: Search, label: "Search everything...", shortcut: "/ " },
  { icon: Palette, label: "Toggle theme", shortcut: "T T" },
  { icon: Settings, label: "Open settings", shortcut: "G S" },
  { icon: FileText, label: "New post", shortcut: "N P" },
]

function CommandCenter() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-64 items-center gap-2 rounded-4xl border border-border bg-input/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-input/50"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search mukoko...</span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
          </CommandEmpty>

          <CommandGroup heading="Recent">
            {recents.map((item) => (
              <CommandItem key={item.label}>
                <Clock className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Pages">
            {pages.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Components">
            {components.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="size-4 text-cobalt" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            {actions.map((item) => (
              <CommandItem key={item.label}>
                <item.icon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        {/* Keyboard hints footer */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  )
}

export { CommandCenter }
