"use client"

import * as React from "react"
import {
  CloudSunIcon,
  NewspaperIcon,
  CalendarIcon,
  LayoutGridIcon,
  GlobeIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface AppItem {
  name: string
  icon?: LucideIcon
  href: string
  active?: boolean
}

interface AppSwitcherProps {
  apps?: AppItem[]
  currentApp?: string
  className?: string
}

const DEFAULT_APPS: AppItem[] = [
  { name: "mukoko", icon: LayoutGridIcon, href: "https://mukoko.com" },
  { name: "weather", icon: CloudSunIcon, href: "https://weather.mukoko.com" },
  { name: "news", icon: NewspaperIcon, href: "https://news.mukoko.com" },
  { name: "nhimbe", icon: CalendarIcon, href: "https://events.mukoko.com" },
  { name: "registry", icon: GlobeIcon, href: "https://registry.mukoko.com" },
]

function AppSwitcher({
  apps = DEFAULT_APPS,
  currentApp,
  className,
}: AppSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-slot="app-switcher"
          variant="ghost"
          size="icon"
          aria-label="Switch app"
          className={cn(className)}
        >
          <LayoutGridIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
          Mukoko Ecosystem
        </div>
        <div className="grid grid-cols-3 gap-1">
          {apps.map((app) => {
            const Icon = app.icon ?? GlobeIcon
            const isCurrent = app.name === currentApp
            return (
              <a
                key={app.name}
                href={app.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-xs transition-colors hover:bg-muted",
                  isCurrent && "bg-muted font-medium"
                )}
              >
                <Icon className="size-5 text-muted-foreground" />
                <span className="truncate">{app.name}</span>
              </a>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { AppSwitcher }
export type { AppSwitcherProps, AppItem }
