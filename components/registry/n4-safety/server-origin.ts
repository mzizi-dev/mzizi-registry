/**
 * Bare-origin checks for configuration: an upstream or public origin must
 * be `https://host[:port]` with no path, query, fragment or credentials.
 * Plain http is allowed only on loopback and, when asked, on a private
 * network suffix (Fly's `.internal` / `.flycast` by default), traffic that
 * never leaves the machine or an encrypted private network.
 *
 * The same rules as `parse_origin` in the Nyuchi console backend.
 */

export class OriginError extends Error {
  readonly setting: string;
  constructor(setting: string, reason: string) {
    super(`${setting}: ${reason}`);
    this.name = "OriginError";
    this.setting = setting;
  }
}

export interface OriginOptions {
  /** Allow plain http on `privateSuffixes` (default false). */
  privateNetworkOk?: boolean;
  /** Host suffixes treated as a private network (default `.internal`, `.flycast`). */
  privateSuffixes?: readonly string[];
}

/**
 * The serialised origin (`https://api.example.com`) of `value`, or an
 * {@link OriginError} naming `setting` and what is wrong.
 */
export function parseOrigin(
  setting: string,
  value: string,
  options: OriginOptions = {},
): string {
  const {
    privateNetworkOk = false,
    privateSuffixes = [".internal", ".flycast"],
  } = options;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new OriginError(setting, "is not a URL");
  }
  if (url.username || url.password)
    throw new OriginError(setting, "credentials are not allowed");
  if (
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    /[?#]/.test(value.slice(url.origin.length))
  ) {
    throw new OriginError(
      setting,
      "must be a bare origin, with no path, query or fragment",
    );
  }
  if (!url.hostname) throw new OriginError(setting, "has no host");
  if (url.protocol === "https:") return url.origin;
  if (url.protocol === "http:") {
    if (isLoopback(url.hostname)) return url.origin;
    if (
      privateNetworkOk &&
      privateSuffixes.some((s) => url.hostname.endsWith(s))
    )
      return url.origin;
    throw new OriginError(setting, "must use https");
  }
  throw new OriginError(
    setting,
    `unsupported scheme ${JSON.stringify(url.protocol.replace(/:$/, ""))}`,
  );
}

/** Whether `hostname` (as `URL.hostname` gives it) is this machine. */
export function isLoopback(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  return /^127(\.\d{1,3}){3}$/.test(hostname);
}

/** Whether `url` is served from this machine, e.g. to allow non-Secure cookies in development. */
export function isLocalUrl(url: URL): boolean {
  return isLoopback(url.hostname);
}
