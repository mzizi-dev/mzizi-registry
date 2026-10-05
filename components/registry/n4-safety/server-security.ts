/**
 * Security headers for server-rendered pages that ship no script of their
 * own. Apply them to every response from middleware; an app with its own
 * script or third-party embeds passes a different `csp`.
 */

/** A Content-Security-Policy for pages with no inline script and no third-party origin. */
export const STRICT_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "content-security-policy": STRICT_CSP,
};

export interface SecurityHeaderOptions {
  /** Replace the CSP, or `false` to send none (e.g. in a dev server with HMR). */
  csp?: string | false;
  /** Add `cache-control: no-store` (do this whenever the response sets a cookie). */
  noStore?: boolean;
}

/**
 * `response` with the security headers it does not already set. Headers the
 * app set itself win. A response with immutable headers is rebuilt.
 */
export function withSecurityHeaders(
  response: Response,
  options: SecurityHeaderOptions = {},
): Response {
  const { csp, noStore = response.headers.has("set-cookie") } = options;
  const wanted: Record<string, string> = { ...SECURITY_HEADERS };
  if (csp === false) delete wanted["content-security-policy"];
  else if (typeof csp === "string") wanted["content-security-policy"] = csp;
  const apply = (headers: Headers) => {
    for (const [k, v] of Object.entries(wanted))
      if (!headers.has(k)) headers.set(k, v);
    if (noStore) headers.set("cache-control", "no-store");
  };
  try {
    apply(response.headers);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    apply(headers);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
