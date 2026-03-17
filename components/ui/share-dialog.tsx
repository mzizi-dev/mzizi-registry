"use client"

import * as React from "react"
import { Check, Copy, Link2, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface ShareDialogProps {
  /** The URL to share */
  url: string
  /** Title of the content being shared */
  title: string
  /** Optional description for social sharing */
  description?: string
  /** Trigger element (default: Share button) */
  children?: React.ReactNode
  className?: string
}

function ShareDialog({
  url,
  title,
  description,
  children,
  className,
}: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareLinks = [
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: () => (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: () => (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description ?? title}\n\n${url}`)}`,
      icon: Mail,
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <Link2 className="mr-2 size-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        data-slot="share-dialog"
        className={cn("sm:max-w-md", className)}
      >
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Copy link */}
          <div className="flex items-center gap-2">
            <Input value={url} readOnly className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="mr-1 size-4" />
              ) : (
                <Copy className="mr-1 size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <Separator />

          {/* Social links */}
          <div className="flex items-center gap-2">
            {shareLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.name}
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1"
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon />
                    <span className="ml-1.5 hidden sm:inline">
                      {link.name}
                    </span>
                  </a>
                </Button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ShareDialog }
export type { ShareDialogProps }
