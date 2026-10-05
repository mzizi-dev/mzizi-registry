/**
 * One-shot messages across a Post/Redirect/Get: an action sets a flash
 * before redirecting, the next page shows it (as a `Toast`), and it is
 * cleared once shown.
 *
 * The cookie carries only a **key** into a fixed table of messages, never
 * free text, so nothing a URL or a cookie says can be injected into a page.
 */
import { clearCookie, getCookie, serializeCookie } from "./server-cookies.js";

export type FlashTone = "success" | "info" | "error";
export interface FlashMessage {
  tone: FlashTone;
  text: string;
}

export interface FlashOptions<K extends string> {
  /** The cookie's name, e.g. "my_app_flash". */
  cookie: string;
  /** Every message the app can flash, by key. */
  messages: Record<K, FlashMessage>;
  /** Seconds the flash survives unread (default 60). */
  maxAge?: number;
}

export interface Flash<K extends string> {
  /** The `Set-Cookie` value that sets `key`. `secure: false` only for plain-http local development. */
  set(key: K, options?: { secure?: boolean }): string;
  /** The message waiting in this request's `Cookie` header, or null. Unknown keys are ignored. */
  peek(cookieHeader: string | null | undefined): FlashMessage | null;
  /** The `Set-Cookie` value that clears it, sent once a page has shown it. */
  clear(options?: { secure?: boolean }): string;
}

export function createFlash<K extends string>(
  options: FlashOptions<K>,
): Flash<K> {
  const { cookie, messages, maxAge = 60 } = options;
  const has = (key: string): key is K =>
    Object.prototype.hasOwnProperty.call(messages, key);
  return {
    set(key, { secure = true } = {}) {
      if (!has(key))
        throw new Error(`flash: unknown message key ${JSON.stringify(key)}`);
      return serializeCookie(cookie, key, { maxAge, secure });
    },
    peek(cookieHeader) {
      const key = getCookie(cookieHeader, cookie);
      return key !== null && has(key) ? messages[key] : null;
    },
    clear({ secure = true } = {}) {
      return clearCookie(cookie, { secure });
    },
  };
}
