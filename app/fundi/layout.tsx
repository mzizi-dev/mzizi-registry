"use client"

import { StytchB2BProvider, createStytchB2BUIClient } from "@stytch/nextjs/b2b"
import { useMemo, type ReactNode } from "react"
import { STYTCH_PUBLIC_TOKEN } from "@/lib/stytch.client"

/**
 * Gates everything under /fundi behind a Stytch B2B session.
 *
 * The middleware (`middleware.ts`) handles the redirect to
 * `/fundi/login` when there's no session JWT cookie. This layout only
 * wraps the tree with the Stytch provider so client components can call
 * `useStytchB2BClient()`, `useStytchMember()`, etc.
 *
 * If Stytch isn't configured (no NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN), we
 * still mount the children — pages render a "not configured" empty
 * state instead of breaking dev navigation.
 */
export default function FundiLayout({ children }: { children: ReactNode }) {
  const stytch = useMemo(() => {
    if (!STYTCH_PUBLIC_TOKEN) return null
    return createStytchB2BUIClient(STYTCH_PUBLIC_TOKEN)
  }, [])

  if (!stytch) {
    return <>{children}</>
  }

  return <StytchB2BProvider stytch={stytch}>{children}</StytchB2BProvider>
}
