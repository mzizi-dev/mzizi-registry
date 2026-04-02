"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function StreamingText({
  className,
  text,
  speed = 20,
  onComplete,
  ...props
}: React.ComponentProps<"span"> & {
  text: string
  speed?: number
  onComplete?: () => void
}) {
  const [displayed, setDisplayed] = React.useState("")
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    setDisplayed("")
    setDone(false)
    let index = 0

    const interval = setInterval(() => {
      index++
      if (index >= text.length) {
        setDisplayed(text)
        setDone(true)
        clearInterval(interval)
        onComplete?.()
      } else {
        setDisplayed(text.slice(0, index))
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span
      data-slot="streaming-text"
      data-complete={done}
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      {displayed}
      {!done && (
        <span className="streaming-cursor ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-[0.15em] bg-foreground">
          <style>{`
            @keyframes cursor-blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            .streaming-cursor {
              animation: cursor-blink 0.8s step-end infinite;
            }
          `}</style>
        </span>
      )}
    </span>
  )
}

export { StreamingText }
