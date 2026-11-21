/**
 * A random id for this browser, sent to the API as `X-Device-Id` on the
 * account endpoints. The API uses it only as a weak hint when deciding whom
 * to slow down after repeated failed sign-ins, so that a stranger's guesses
 * lock out the stranger and not the member. Same idea as the mobile app's
 * install id.
 *
 * It is made here from the browser's random source, holds no device data
 * (no user agent, screen, fonts or canvas: nothing is fingerprinted), is not
 * a credential and identifies no person. Clearing site data makes a new one.
 * Stored in localStorage; if storage is blocked no id is stored and none is
 * sent.
 */
const KEY = "binectics:device-id";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
/** The format the API accepts: 16-64 of [A-Za-z0-9_-]. */
const VALID = /^[A-Za-z0-9_-]{16,64}$/;

/** 32 random characters. Uses crypto.getRandomValues; never Math.random. */
export function newDeviceId(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  // 62 does not divide 256; rejecting the top slice keeps characters uniform.
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  for (let i = 0; out.length < 32; i++) {
    if (i >= bytes.length) {
      globalThis.crypto.getRandomValues(bytes);
      i = 0;
    }
    if (bytes[i] < limit) out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

let cached: string | null = null;

/** The stored id, made on first use. Null when there is no browser storage. */
export function getDeviceId(): string | null {
  if (cached) return cached;
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !VALID.test(id)) {
      id = newDeviceId();
      window.localStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    return null;
  }
}

/** For tests. */
export function resetDeviceIdCache(): void {
  cached = null;
}
