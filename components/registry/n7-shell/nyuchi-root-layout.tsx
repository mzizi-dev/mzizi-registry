"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
// L8 ASSURANCE — wired into the root layout
// import { initRum } from "@/lib/assurance/nyuchi-rum"
// import { getErrorTracker } from "@/lib/assurance/nyuchi-error-tracker"
// import { initPerfProbe } from "@/lib/assurance/nyuchi-perf-probe"
// import { initFundiReporter } from "@/lib/fundi/nyuchi-fundi-reporter"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ROOT LAYOUT — Layer 7 App Shell
   The outermost wrapper. Composes all providers.
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiRootLayoutProps {
  /** Font class names to apply to body (e.g. noto serif, sans, mono) */
  fontClasses?: string
  /** Default locale */
  defaultLocale?: string
  /** Enable service worker */
  enableServiceWorker?: boolean
  children: React.ReactNode
  className?: string
}

export function NyuchiRootLayout({
  fontClasses = "",
  defaultLocale = "en",
  enableServiceWorker = false,
  children,
  className,
}: NyuchiRootLayoutProps) {
  // Register service worker for offline support
  React.useEffect(() => {
    if (enableServiceWorker && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [enableServiceWorker])

  // L8 ASSURANCE: Initialize observability on mount
  // React.useEffect(() => {
  //   initRum({ sampleRate: 0.1 })
  //   initPerfProbe({ sampleRate: 0.1, trackComponents: true })
  //   const tracker = getErrorTracker({
  //     onCritical: (error) => {
  //       const reporter = initFundiReporter({ fundiEndpoint: "/api/fundi" })
  //       reporter.report({
  //         component: error.componentName || "unknown",
  //         layer: error.layer || 0,
  //         severity: error.severity,
  //         errorType: "render",
  //         source: "error-tracker",
  //         title: error.message,
  //         description: error.stack || error.message,
  //         portalUrl: error.portalUrl,
  //         blastRadius: error.blastRadius,
  //       })
  //     }
  //   })
  //   window.addEventListener("error", (e) => tracker.track(e.error))
  //   window.addEventListener("unhandledrejection", (e) => tracker.track(new Error(String(e.reason))))
  // }, [])

  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body
        data-slot="nyuchi-root-layout"
        data-portal="https://mzizi.dev/components/nyuchi-root-layout"
        className={cn(
          "min-h-screen bg-background text-foreground antialiased",
          fontClasses,
          className
        )}
      >
        {/* ThemeProvider wraps everything */}
        {/* <NyuchiThemeProvider defaultTheme={defaultTheme}> */}
        {/*   <SidebarProvider> */}
        {/*     <LiveRegionPortal /> */}
        {/*     <NyuchiConnectivityBar /> */}
        {/*     <NyuchiToastProvider> */}
        {children}
        {/*     </NyuchiToastProvider> */}
        {/*   </SidebarProvider> */}
        {/* </NyuchiThemeProvider> */}
      </body>
    </html>
  )
}

export type { NyuchiRootLayoutProps }
