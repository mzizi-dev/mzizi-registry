/**
 * Client-side Stytch constants. Only the public token is exposed here —
 * the secret + project ID stay in `lib/stytch.ts` (server-only).
 *
 * Split into a separate file so client components don't accidentally
 * pull in server-only env-var access (which would tree-shake-fail in
 * the browser bundle).
 */

export const STYTCH_PUBLIC_TOKEN = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN ?? ""
