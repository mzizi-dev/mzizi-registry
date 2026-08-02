"use client"
import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ROUTE GUARD — Layer 7 App Shell
   Route-level protection. Composes L4 safety gates.
   ═══════════════════════════════════════════════════════════════ */

type AuthRequirement = "none" | "authenticated" | "verified" | "admin"
type SubscriptionTier = "free" | "premium" | "business" | "enterprise"

interface RouteGuardConfig {
  auth?: AuthRequirement
  roles?: string[]
  subscription?: SubscriptionTier
  verificationTier?: string
  /** Custom check function */
  check?: () => boolean | Promise<boolean>
  /** Where to redirect if guard fails */
  fallback?: string
}

interface NyuchiRouteGuardProps {
  config: RouteGuardConfig
  /** Current auth state — injected by the auth provider */
  isAuthenticated?: boolean
  userRole?: string
  userTier?: string
  userVerification?: string
  /** Loading state while checking */
  loadingFallback?: React.ReactNode
  /** Unauthorized fallback (instead of redirect) */
  unauthorizedFallback?: React.ReactNode
  onRedirect?: (path: string) => void
  children: React.ReactNode
}

export function NyuchiRouteGuard({
  config,
  isAuthenticated = false,
  userRole,
  userTier,
  userVerification,
  loadingFallback,
  unauthorizedFallback,
  onRedirect,
  children,
}: NyuchiRouteGuardProps) {
  const { log } = useNyuchiHarness("route-guard")
  const [checking, setChecking] = React.useState(true)
  const [allowed, setAllowed] = React.useState(false)

  React.useEffect(() => {
    async function check() {
      setChecking(true)
      let pass = true

      // Auth check
      if (config.auth && config.auth !== "none" && !isAuthenticated) {
        log.warn("route_guard: auth required, not authenticated")
        pass = false
      }

      // Role check
      if (pass && config.roles && config.roles.length > 0 && userRole) {
        if (!config.roles.includes(userRole)) {
          log.warn(`route_guard: role ${userRole} not in ${config.roles}`)
          pass = false
        }
      }

      // Subscription check
      if (pass && config.subscription && userTier) {
        const tiers: SubscriptionTier[] = ["free", "premium", "business", "enterprise"]
        if (tiers.indexOf(userTier as SubscriptionTier) < tiers.indexOf(config.subscription)) {
          pass = false
        }
      }

      // Verification check
      if (pass && config.verificationTier && userVerification) {
        const vtiers = ["unverified", "community", "otp", "government", "licensed"]
        if (vtiers.indexOf(userVerification) < vtiers.indexOf(config.verificationTier)) {
          pass = false
        }
      }

      // Custom check
      if (pass && config.check) {
        try {
          pass = await config.check()
        } catch {
          pass = false
        }
      }

      if (!pass && config.fallback && onRedirect) {
        onRedirect(config.fallback)
      }
      setAllowed(pass)
      setChecking(false)
    }
    check()
  }, [config, isAuthenticated, userRole, userTier, userVerification])

  if (checking)
    return (
      <>
        {loadingFallback || (
          <div
            data-slot="nyuchi-route-guard"
            data-portal="https://mzizi.dev/components/nyuchi-route-guard"
            data-loading
            role="status"
            aria-label="Checking access"
            className="flex min-h-screen items-center justify-center"
          >
            <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        )}
      </>
    )
  if (!allowed) return <>{unauthorizedFallback || null}</>
  return <>{children}</>
}

export type { RouteGuardConfig, AuthRequirement, SubscriptionTier, NyuchiRouteGuardProps }
