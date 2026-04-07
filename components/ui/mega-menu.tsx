"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface MegaMenuItem {
  label: string
  href: string
  description?: string
}

interface MegaMenuSection {
  title: string
  items: MegaMenuItem[]
}

interface MegaMenuProps {
  trigger?: string
  sections: MegaMenuSection[]
  className?: string
}

function MegaMenu({ trigger = "Menu", sections, className }: MegaMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button data-slot="mega-menu" variant="ghost" className={cn("gap-1", className)}>
          {trigger}
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(calc(100vw-2rem),56rem)] p-0">
        <div
          data-slot="mega-menu-content"
          className={cn(
            "grid gap-0 divide-x divide-border",
            sections.length === 1 && "grid-cols-1",
            sections.length === 2 && "grid-cols-2",
            sections.length === 3 && "grid-cols-3",
            sections.length >= 4 && "grid-cols-4"
          )}
        >
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col p-4">
              <span className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {section.title}
              </span>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-2.5 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    {item.description && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MegaMenu }
export type { MegaMenuProps, MegaMenuSection, MegaMenuItem }
