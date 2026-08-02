"use client"
import * as React from "react"

type NetworkTier = "4g" | "3g" | "2g" | "slow-2g" | "offline" | "unknown"
type ContentQuality = "full" | "standard" | "low" | "minimal" | "text-only"

const TIER_TO_QUALITY: Record<NetworkTier, ContentQuality> = {
  "4g": "full",
  "3g": "standard",
  "2g": "low",
  "slow-2g": "minimal",
  offline: "text-only",
  unknown: "standard",
}

interface ABRContextValue {
  quality: ContentQuality
  tier: NetworkTier
  effectiveType: string
}

const ABRContext = React.createContext<ABRContextValue>({
  quality: "full",
  tier: "4g",
  effectiveType: "4g",
})

/**
 * The Network Information API — widely shipped, absent from lib.dom and from
 * Safari. Declared narrowly so the rest of Navigator stays typed.
 */
interface NavigatorWithConnection extends Navigator {
  connection?: {
    saveData?: boolean
    effectiveType?: string
    addEventListener?: (type: string, listener: () => void) => void
    removeEventListener?: (type: string, listener: () => void) => void
  }
}

export function ABRProvider({
  children,
  override,
}: {
  children: React.ReactNode
  override?: ContentQuality
}) {
  const [ctx, setCtx] = React.useState<ABRContextValue>({
    quality: override || "full",
    tier: "4g",
    effectiveType: "4g",
  })

  React.useEffect(() => {
    if (override) {
      setCtx((c) => ({ ...c, quality: override }))
      return
    }
    if (typeof navigator === "undefined") return
    const conn = (navigator as NavigatorWithConnection).connection
    if (!conn) return
    const update = () => {
      const effectiveType = conn.effectiveType || "4g"
      const tier = effectiveType as NetworkTier
      setCtx({ quality: TIER_TO_QUALITY[tier] || "standard", tier, effectiveType })
    }
    update()
    conn.addEventListener?.("change", update)
    return () => conn.removeEventListener?.("change", update)
  }, [override])

  return <ABRContext.Provider value={ctx}>{children}</ABRContext.Provider>
}

export function useABR(): ABRContextValue {
  return React.useContext(ABRContext)
}

/** Render different content based on network quality */
export function ABRContent({
  full,
  standard,
  low,
  minimal,
  textOnly,
}: {
  full: React.ReactNode
  standard?: React.ReactNode
  low?: React.ReactNode
  minimal?: React.ReactNode
  textOnly?: React.ReactNode
}) {
  const { quality } = useABR()
  switch (quality) {
    case "full":
      return <>{full}</>
    case "standard":
      return <>{standard || full}</>
    case "low":
      return <>{low || standard || full}</>
    case "minimal":
      return <>{minimal || low || standard || full}</>
    case "text-only":
      return <>{textOnly || minimal || low || standard || full}</>
  }
}

/** Image that adapts quality to network conditions */
export function ABRImage({
  src,
  lowSrc,
  alt,
  ...props
}: { src: string; lowSrc?: string; alt: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
  const { quality } = useABR()
  if (quality === "text-only")
    return (
      <span
        data-slot="nyuchi-abr-image"
        data-portal="https://mzizi.dev/components/nyuchi-abr-image"
        role="img"
        aria-label={alt}
        className="text-xs text-muted-foreground"
      >
        [{alt}]
      </span>
    )
  const effectiveSrc = (quality === "low" || quality === "minimal") && lowSrc ? lowSrc : src
  const loading = quality === "full" ? "eager" : "lazy"
  return (
    <img data-slot="nyuchi-abr-image" src={effectiveSrc} alt={alt} loading={loading} {...props} />
  )
}

export type { NetworkTier, ContentQuality, ABRContextValue }
