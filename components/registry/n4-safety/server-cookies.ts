/**
 * Cookie plumbing on plain strings and `Response`s, so it works with any
 * framework: parse a `Cookie` header, read a `Set-Cookie`, write one, and
 * add `Set-Cookie` headers to a response (rebuilding it when its headers
 * are immutable, as a `Response.redirect` has).
 */

export interface CookieOptions {
  path?: string;
  /** Seconds. 0 clears the cookie. */
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  domain?: string;
}

const NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const VALUE = /^[!#-+\--:<-[\]-~]*$/;

/**
 * A `Set-Cookie` header value. Defaults are the safe ones: `Path=/`,
 * `HttpOnly`, `SameSite=Lax`, and `Secure` unless `secure: false` (pass that
 * only for plain-http local development). Names and values must already be
 * cookie-safe (seal or encode them first); anything else throws rather than
 * writing a header a browser would split or ignore.
 */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  if (!NAME.test(name))
    throw new Error(
      `serializeCookie: invalid cookie name ${JSON.stringify(name)}`,
    );
  if (!VALUE.test(value))
    throw new Error(
      `serializeCookie: the value for ${name} is not cookie-safe`,
    );
  const {
    path = "/",
    maxAge,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    domain,
  } = options;
  const parts = [`${name}=${value}`, `Path=${path}`];
  if (domain) parts.push(`Domain=${domain}`);
  if (maxAge !== undefined)
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  if (httpOnly) parts.push("HttpOnly");
  if (secure || sameSite === "None") parts.push("Secure");
  parts.push(`SameSite=${sameSite}`);
  return parts.join("; ");
}

/** A `Set-Cookie` value that clears `name` (same path and flags it was set with). */
export function clearCookie(
  name: string,
  options: Omit<CookieOptions, "maxAge"> = {},
): string {
  return serializeCookie(name, "", { ...options, maxAge: 0 });
}

/** The pairs in a `Cookie` request header, in order. Malformed parts are skipped. */
export function parseCookieHeader(
  header: string | null | undefined,
): [string, string][] {
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((pair): [string, string][] => {
      const at = pair.indexOf("=");
      return at > 0
        ? [[pair.slice(0, at).trim(), pair.slice(at + 1).trim()]]
        : [];
    });
}

/** One cookie's value from a `Cookie` header, or null. The first wins, as in browsers' ordering. */
export function getCookie(
  header: string | null | undefined,
  name: string,
): string | null {
  for (const [k, v] of parseCookieHeader(header)) if (k === name) return v;
  return null;
}

/** The name, value and whether it clears the cookie, from a `Set-Cookie` value. */
export function parseSetCookie(
  header: string,
): { name: string; value: string; cleared: boolean } | null {
  const [pair, ...attrs] = header.split(";");
  if (!pair) return null;
  const at = pair.indexOf("=");
  if (at <= 0) return null;
  const name = pair.slice(0, at).trim();
  const value = pair.slice(at + 1).trim();
  const cleared =
    value === "" || attrs.some((a) => /^\s*max-age\s*=\s*0\s*$/i.test(a));
  return { name, value, cleared };
}

/**
 * `response` with `cookies` appended as `Set-Cookie`. A response whose
 * headers are immutable (from `Response.redirect`) is rebuilt with the same
 * status and body.
 */
export function withSetCookies(
  response: Response,
  cookies: readonly string[],
): Response {
  if (cookies.length === 0) return response;
  try {
    for (const c of cookies) response.headers.append("set-cookie", c);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    for (const c of cookies) headers.append("set-cookie", c);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
