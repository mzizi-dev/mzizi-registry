/**
 * The appearance preference: follow the system, or always light or dark.
 * Pair it with `@bundu/ui/styles/color-scheme.css` and set `data-theme` on
 * `<html>` from it on the server, so the first paint is right with no script.
 */
import { getCookie, serializeCookie } from "./server-cookies.js";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** A theme from untrusted input; anything unknown is "system". */
export function parseTheme(value: string | null | undefined): Theme {
  return (THEMES as readonly string[]).includes(value ?? "")
    ? (value as Theme)
    : "system";
}

/** The theme in a `Cookie` header. */
export function readTheme(
  cookieHeader: string | null | undefined,
  cookie: string,
): Theme {
  return parseTheme(getCookie(cookieHeader, cookie));
}

/**
 * The `Set-Cookie` value that stores `theme` for a year. It is a preference,
 * not a secret, but it stays `HttpOnly`: only the server reads it.
 */
export function themeCookie(
  cookie: string,
  theme: Theme,
  { secure = true }: { secure?: boolean } = {},
): string {
  return serializeCookie(cookie, parseTheme(theme), {
    maxAge: 60 * 60 * 24 * 365,
    secure,
  });
}

/** The `data-theme` attribute for `<html>`: undefined for "system", so the OS decides. */
export function themeAttribute(theme: Theme): "light" | "dark" | undefined {
  return theme === "system" ? undefined : theme;
}
