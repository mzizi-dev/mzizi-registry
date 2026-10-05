/**
 * Same-origin return paths, for `?return_to=` and `back` form fields, so a
 * redirect after sign-in or a form post can never be pointed off-site.
 */

/**
 * `value` when it is a path on this origin, otherwise `fallback`.
 *
 * Accepted: a path starting with a single "/". Refused: an absolute URL,
 * a scheme-relative "//host", a backslash (browsers read "/\host" as
 * "//host"), and any control character or whitespace (browsers strip tabs
 * and newlines, so "/\t/host" would become "//host").
 */
export function safeBack(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return fallback;
  }
  return value;
}
