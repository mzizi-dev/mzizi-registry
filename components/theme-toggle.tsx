"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle theme">
        <Monitor className="size-4" />
      </Button>
    )
  }

  function cycle() {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={cycle}
      aria-label={`Current theme: ${theme}. Click to switch.`}
    >
      {theme === "light" && <Sun className="size-4" />}
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
    </Button>
  )
}
