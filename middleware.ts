import { NextResponse, type NextRequest } from "next/server"
import { STYTCH_SESSION_JWT_COOKIE, isStytchConfigured } from "@/lib/stytch"

/**
 * Gate `/fundi/*` routes — the observability-as-a-service dashboard.
 *
 * Auth model:
 *   - All non-/fundi routes are public (registry, MCP, brand, docs, etc.)
 *   - /fundi/login is public (entry point for sign-in)
 *   - /fundi/* (everything else) requires a Stytch B2B session JWT cookie.
 *     Unauthenticated requests are redirected to /fundi/login with a
 *     `?return_to=` query param so we can land them where they intended
 *     after sign-in.
 *
 * We do NOT call Stytch's session-authenticate endpoint here — that's a
 * hot path on every request and adds latency. The middleware only checks
 * for the presence of the JWT cookie. Full validation happens server-side
 * inside the protected route handlers, which can call
 * `authenticateSessionJwt()` from `lib/stytch.ts` and 401/redirect on
 * invalid / expired sessions.
 *
 * Behaviour when Stytch isn't configured (dev without env vars):
 *   - Pass through unchanged. The dashboard pages themselves render a
 *     "Stytch not configured" empty state so a developer can still
 *     navigate locally.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page + anything not under /fundi
  if (pathname === "/fundi/login" || !pathname.startsWith("/fundi")) {
    return NextResponse.next()
  }

  // If Stytch isn't configured at all, don't try to gate the route —
  // the page itself will surface the unconfigured state.
  if (!isStytchConfigured()) {
    return NextResponse.next()
  }

  const jwt = request.cookies.get(STYTCH_SESSION_JWT_COOKIE)?.value
  if (jwt) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/fundi/login", request.url)
  loginUrl.searchParams.set("return_to", pathname + request.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Only run on /fundi/* — every other route is public and skipping the
  // middleware avoids edge cold-start cost.
  matcher: ["/fundi/:path*"],
}
