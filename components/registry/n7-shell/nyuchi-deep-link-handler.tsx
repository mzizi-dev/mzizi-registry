"use client"
import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

interface DeepLinkRoute {
  pattern: string | RegExp
  handler: (params: Record<string, string>) => void
}

interface NyuchiDeepLinkHandlerProps {
  routes: DeepLinkRoute[]
  onUnmatched?: (url: string) => void
  children: React.ReactNode
}

/** The custom event the shell dispatches to hand a deep link to this handler. */
const DEEP_LINK_EVENT = "nyuchi:deep-link"

/** Its payload — declared once so listeners need no `as any` at all. */
type DeepLinkEvent = CustomEvent<{ url?: string }>

export function NyuchiDeepLinkHandler({
  routes,
  onUnmatched,
  children,
}: NyuchiDeepLinkHandlerProps) {
  const { log } = useNyuchiHarness("deep-link-handler")

  const resolve = React.useCallback(
    (url: string) => {
      log.info(`deep_link: ${url}`)
      for (const route of routes) {
        if (typeof route.pattern === "string") {
          const regex = new RegExp("^" + route.pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$")
          const match = url.match(regex)
          if (match?.groups) {
            route.handler(match.groups)
            return
          }
        } else {
          const match = url.match(route.pattern)
          if (match?.groups) {
            route.handler(match.groups)
            return
          }
        }
      }
      log.warn(`deep_link_unmatched: ${url}`)
      onUnmatched?.(url)
    },
    [routes, onUnmatched, log]
  )

  // Listen for popstate and custom deep-link events
  React.useEffect(() => {
    function onEvent(e: Event) {
      resolve((e as DeepLinkEvent).detail?.url || "")
    }
    window.addEventListener(DEEP_LINK_EVENT, onEvent)
    return () => window.removeEventListener(DEEP_LINK_EVENT, onEvent)
  }, [resolve])

  // Check initial URL
  React.useEffect(() => {
    const path = window.location.pathname + window.location.search
    if (path && path !== "/") resolve(path)
  }, [resolve])

  return (
    <div
      data-slot="nyuchi-deep-link-handler"
      data-portal="https://mzizi.dev/components/nyuchi-deep-link-handler"
    >
      {children}
    </div>
  )
}

export type { DeepLinkRoute, NyuchiDeepLinkHandlerProps }
