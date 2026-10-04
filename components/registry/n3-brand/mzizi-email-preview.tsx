import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * mzizi Email Preview — an email message as a mail client shows it: header
 * lines, a sample opening line, then the HTML under test (a signature, a
 * newsletter block) in a sandboxed frame that can display it but never run
 * anything. The message body is white in every theme, like the email it
 * stands for. Server-safe: no hooks; size the frame from the host if needed.
 */

interface MziziEmailPreviewProps extends Omit<React.ComponentProps<"section">, "children"> {
  /** The HTML to show. Absent shows `placeholder`. */
  html?: string
  /** Decorative header lines. */
  to?: string
  subject?: string
  /** A sample line of message text above the HTML. */
  lead?: string
  /** Frame height in CSS pixels. */
  frameHeight?: number
  placeholder?: React.ReactNode
}

function MziziEmailPreview({
  html,
  to = "a colleague",
  subject = "Following up",
  lead = "Thanks for your time today — notes attached.",
  frameHeight = 220,
  placeholder,
  className,
  ...props
}: MziziEmailPreviewProps) {
  return (
    <section
      data-slot="mzizi-email-preview"
      className={cn("overflow-hidden rounded-[14px] border border-border", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="space-y-1 border-b border-border bg-muted px-4 py-3 text-sm text-foreground/80"
      >
        <p>
          <span className="font-medium text-foreground">To:</span> {to}
        </p>
        <p>
          <span className="font-medium text-foreground">Subject:</span> {subject}
        </p>
      </div>
      <div
        data-slot="mzizi-email-preview-body"
        className="bg-white p-4 [color-scheme:light] sm:p-6"
      >
        <p aria-hidden="true" className="mb-4 text-[15px] leading-relaxed text-black/90">
          {lead}
        </p>
        {html ? (
          <iframe
            data-slot="mzizi-email-preview-frame"
            title="Email preview"
            sandbox=""
            srcDoc={`<!doctype html><body style="margin:0;background:#fff">${html}</body>`}
            className="w-full border-0"
            style={{ height: frameHeight }}
          />
        ) : (
          (placeholder ?? (
            <div className="rounded-[14px] border border-dashed border-black/25 px-6 py-8 text-center">
              <p className="font-medium text-black/90">Your preview appears here</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export { MziziEmailPreview }
export type { MziziEmailPreviewProps }
