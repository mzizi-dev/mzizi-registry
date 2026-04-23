"use client"

import { StytchB2B, B2BProducts, AuthFlowType, StytchEventType } from "@stytch/nextjs/b2b"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { STYTCH_PUBLIC_TOKEN } from "@/lib/stytch.client"

/**
 * Stytch B2B login page for /fundi.
 *
 * Auth flow: Discovery — the user signs in with email magic link or
 * SSO, then picks (or creates) the organisation they're acting on
 * behalf of. Stytch handles the multi-org selector for us.
 *
 * On successful authentication, returns the user to whatever page
 * triggered the redirect (`?return_to=...` set by `middleware.ts`).
 */
export default function FundiLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("return_to") ?? "/fundi"

  const onSuccess = useCallback(() => {
    router.replace(returnTo)
  }, [router, returnTo])

  if (!STYTCH_PUBLIC_TOKEN) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="font-serif text-3xl font-bold">Sign in</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Stytch is not configured for this environment. Set{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN</code>,{" "}
          <code className="font-mono text-xs">STYTCH_PROJECT_ID</code>, and{" "}
          <code className="font-mono text-xs">STYTCH_SECRET</code> on the deployment to enable the
          fundi dashboard.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">FUNDI</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Observability-as-a-service for the bundu ecosystem. Sign in with your organisation email
          or SSO provider.
        </p>
      </header>

      <StytchB2B
        config={{
          authFlowType: AuthFlowType.Discovery,
          products: [B2BProducts.emailMagicLinks, B2BProducts.sso],
          sessionOptions: {
            sessionDurationMinutes: 60 * 24 * 7, // 7 days
          },
        }}
        callbacks={{
          onEvent: (e) => {
            if (
              e.type === StytchEventType.B2BMagicLinkAuthenticate ||
              e.type === StytchEventType.B2BSSOAuthenticate ||
              e.type === StytchEventType.B2BDiscoveryIntermediateSessionExchange ||
              e.type === StytchEventType.B2BDiscoveryOrganizationsCreate
            ) {
              onSuccess()
            }
          },
        }}
      />
    </main>
  )
}
