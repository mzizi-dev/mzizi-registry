/**
 * Sealed values: AES-256-GCM over a JSON payload, so a cookie is both
 * secret and tamper-evident, and every sealed value is bound to a
 * **purpose** (the associated data). A value sealed as a sign-in state can
 * never be replayed as a session, or the other way round.
 *
 * Wire format, identical to the Rust sealer in the Nyuchi console backend
 * (`seal.rs`) and Mzizi Roots: the key is SHA-256 of the secret; the output
 * is base64url (no padding) of a 12-byte random nonce followed by the
 * ciphertext and its 16-byte tag; the purpose string's UTF-8 bytes are the
 * associated data. A value sealed on one side unseals on the other.
 *
 * Web Crypto only, so it runs in Node 20+, Cloudflare Workers, Deno and Bun.
 */
import { fromBase64Url, toBase64Url } from "./server-base64url.js";

const NONCE_LEN = 12;
const TAG_LEN = 16;

/** The shortest secret accepted. 32 characters, as the Nyuchi gateway requires. */
export const MIN_SECRET_LENGTH = 32;

export interface Sealer {
  /** Seal `value` (anything JSON can carry) for `purpose`. */
  seal(purpose: string, value: unknown): Promise<string>;
  /**
   * The payload, or null when the value is missing, malformed, sealed with
   * another key or for another purpose, or tampered with. Never throws.
   */
  unseal<T = unknown>(
    purpose: string,
    sealed: string | null | undefined,
  ): Promise<T | null>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * A sealer for `secret`. Throws when the secret is shorter than
 * {@link MIN_SECRET_LENGTH}: a short secret is a configuration error to fail
 * on at start-up, not a request-time surprise.
 */
export function createSealer(secret: string): Sealer {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `createSealer: the secret must be at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  const key: Promise<CryptoKey> = crypto.subtle
    .digest("SHA-256", encoder.encode(secret))
    .then((digest) =>
      crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]),
    );

  return {
    async seal(purpose, value) {
      assertPurpose(purpose);
      const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LEN));
      const plaintext = encoder.encode(JSON.stringify(value));
      const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: nonce,
            additionalData: encoder.encode(purpose),
          },
          await key,
          plaintext,
        ),
      );
      const out = new Uint8Array(NONCE_LEN + ciphertext.length);
      out.set(nonce, 0);
      out.set(ciphertext, NONCE_LEN);
      return toBase64Url(out);
    },

    async unseal<T>(
      purpose: string,
      sealed: string | null | undefined,
    ): Promise<T | null> {
      assertPurpose(purpose);
      if (!sealed) return null;
      const raw = fromBase64Url(sealed);
      if (!raw || raw.length < NONCE_LEN + TAG_LEN) return null;
      try {
        const plaintext = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: raw.slice(0, NONCE_LEN),
            additionalData: encoder.encode(purpose),
          },
          await key,
          raw.slice(NONCE_LEN),
        );
        return JSON.parse(decoder.decode(plaintext)) as T;
      } catch {
        return null;
      }
    },
  };
}

function assertPurpose(purpose: string): void {
  if (typeof purpose !== "string" || purpose.length === 0) {
    throw new Error('seal: a purpose is required, e.g. "my-app/session/v1"');
  }
}

/** `n` random bytes as base64url, for OAuth `state`, a PKCE verifier or a CSRF token. */
export function randomToken(n = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(n)));
}

/** The PKCE S256 challenge for `verifier` (RFC 7636 §4.2). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}
