/**
 * Stytch B2B SaaS Auth — server-side helpers
 *
 * Used to gate `/fundi/*` (the observability-as-a-service dashboard).
 * Other routes on design.nyuchi.com remain public.
 *
 * Env vars (set in Vercel project + .env.local for dev):
 *   STYTCH_PROJECT_ID                 — Stytch project ID (server-only)
 *   STYTCH_SECRET                     — Stytch project secret (server-only)
 *   NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN   — public token, safe in browser
 *
 * Stytch B2B model:
 *   - Organization     — a customer (e.g. another bundu app team)
 *   - Member           — a user inside an organization
 *   - Session          — a JWT carrying member_id + organization_id
 *
 * The full flow lives in `app/fundi/`:
 *   /fundi/login   — magic-link / SSO entry point
 *   /fundi         — gated dashboard
 */

const STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID
const STYTCH_SECRET = process.env.STYTCH_SECRET

export const STYTCH_PUBLIC_TOKEN = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN ?? ""

/**
 * True when the three Stytch env vars are present. Used by route handlers
 * and middleware to short-circuit cleanly when auth isn't configured
 * (local dev without Stytch, preview branches, etc.) — instead of throwing.
 */
export function isStytchConfigured(): boolean {
  return Boolean(STYTCH_PROJECT_ID && STYTCH_SECRET && STYTCH_PUBLIC_TOKEN)
}

interface SessionAuthenticateResponse {
  status_code: number
  member_session?: {
    member_id: string
    organization_id: string
    expires_at: string
  }
  member?: {
    member_id: string
    email_address: string
    name?: string | null
  }
  organization?: {
    organization_id: string
    organization_name: string
    organization_slug: string
  }
}

/**
 * Authenticate a Stytch B2B session JWT against the Stytch HTTP API.
 *
 * Returns the member + organization on success, or null on any failure
 * (expired, revoked, malformed, network error). Never throws.
 *
 * Use from server components, route handlers, and middleware.
 */
export async function authenticateSessionJwt(jwt: string): Promise<{
  memberId: string
  email: string
  name: string | null
  organizationId: string
  organizationName: string
  organizationSlug: string
  expiresAt: string
} | null> {
  if (!isStytchConfigured()) return null
  if (!jwt) return null

  try {
    const auth = btoa(`${STYTCH_PROJECT_ID}:${STYTCH_SECRET}`)
    const res = await fetch("https://api.stytch.com/v1/b2b/sessions/authenticate", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_jwt: jwt }),
      // Stytch session validation is hot-path; cache aggressively at the
      // edge but never share across requests.
      cache: "no-store",
    })

    if (!res.ok) return null

    const data = (await res.json()) as SessionAuthenticateResponse
    if (!data.member_session || !data.member || !data.organization) return null

    return {
      memberId: data.member_session.member_id,
      email: data.member.email_address,
      name: data.member.name ?? null,
      organizationId: data.organization.organization_id,
      organizationName: data.organization.organization_name,
      organizationSlug: data.organization.organization_slug,
      expiresAt: data.member_session.expires_at,
    }
  } catch {
    return null
  }
}

/**
 * Cookie name Stytch's frontend SDK uses for the session JWT. Middleware
 * reads this directly so we never have to hit Stytch from the edge for
 * anything other than full validation.
 */
export const STYTCH_SESSION_JWT_COOKIE = "stytch_session_jwt"
