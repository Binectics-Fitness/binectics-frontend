/**
 * Where the app sends someone whose sign-in is refused or whose session
 * ends, and the small amount of state those pages need.
 *
 * The pages only ever show what the API actually said: the suspension
 * reason and date an admin recorded, the lockout's remaining time, the
 * throttler's Retry-After. Nothing is rendered as HTML.
 */

export const ACCOUNT_STATE_ROUTES = {
  SUSPENDED: "/account-suspended",
  LOCKED: "/account-locked",
  DELETED: "/account-deleted",
  SESSION_EXPIRED: "/session-expired",
  RATE_LIMIT: "/rate-limit",
} as const;

/** A 401 on one of these pages must not bounce the visitor to /login. */
export function isAccountStateRoute(pathname: string): boolean {
  return Object.values(ACCOUNT_STATE_ROUTES).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Same rule the login redirect uses: same-origin relative paths only, so
 *  a crafted link can't turn these pages into an open redirect. */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  return raw;
}

// The API's reason column is capped at 500 characters; anything longer did
// not come from it.
const MAX_REASON_LENGTH = 500;
// Lockouts top out at an hour and login throttling at a minute; a far-future
// deadline in a URL is junk, not a reason to show a day-long countdown.
const MAX_WAIT_MS = 24 * 60 * 60 * 1000;

export interface SuspensionNotice {
  /** The reason an admin recorded, or null when none was. */
  reason: string | null;
  /** ISO date the suspension happened, or null when the API doesn't know. */
  suspendedAt: string | null;
}

const SUSPENSION_KEY = "binectics:suspension-notice";

function cleanReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_REASON_LENGTH) : null;
}

function cleanDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

/**
 * Hand the suspension details to /account-suspended through sessionStorage
 * rather than the URL, so the reason never lands in history, logs or a
 * Referer header. Storage can be blocked; the page then shows the generic
 * copy.
 */
export function saveSuspensionNotice(details: Record<string, unknown> | undefined): void {
  const notice: SuspensionNotice = {
    reason: cleanReason(details?.suspension_reason),
    suspendedAt: cleanDate(details?.suspended_at),
  };
  try {
    window.sessionStorage.setItem(SUSPENSION_KEY, JSON.stringify(notice));
  } catch {
    // Storage blocked: the page falls back to the generic message.
  }
}

/** The stored notice as a raw string (a stable value for
 *  useSyncExternalStore), or null. */
export function readSuspensionNoticeRaw(): string | null {
  try {
    return window.sessionStorage.getItem(SUSPENSION_KEY);
  } catch {
    return null;
  }
}

export function readSuspensionNotice(): SuspensionNotice | null {
  return parseSuspensionNotice(readSuspensionNoticeRaw());
}

export function parseSuspensionNotice(raw: string | null): SuspensionNotice | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      reason: cleanReason(parsed?.reason),
      suspendedAt: cleanDate(parsed?.suspendedAt),
    };
  } catch {
    return null;
  }
}

/** Seconds-from-now → an absolute deadline (epoch ms) a page can count down
 *  to, so a reload doesn't restart the timer. Null when not usable. */
export function deadlineFromSeconds(seconds: unknown, now = Date.now()): number | null {
  const n = typeof seconds === "string" ? Number(seconds) : seconds;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  return now + Math.min(Math.ceil(n) * 1000, MAX_WAIT_MS);
}

/** Read an `until` query value back; null when missing or implausible. */
export function parseDeadline(raw: string | null | undefined, now = Date.now()): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const until = Number(raw);
  if (!Number.isSafeInteger(until) || until > now + MAX_WAIT_MS) return null;
  return until;
}

export interface LoginFailure {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Where a refused sign-in should go, or null to stay on the login form and
 * show the message. Saves what the destination page needs.
 */
export function routeForLoginFailure(res: LoginFailure, now = Date.now()): string | null {
  if (res.code === "AUTH_ACCOUNT_SUSPENDED") {
    saveSuspensionNotice(res.details);
    return ACCOUNT_STATE_ROUTES.SUSPENDED;
  }
  if (res.code === "AUTH_ACCOUNT_LOCKED") {
    const until = deadlineFromSeconds(res.details?.retry_after_seconds, now);
    return until
      ? `${ACCOUNT_STATE_ROUTES.LOCKED}?until=${until}`
      : ACCOUNT_STATE_ROUTES.LOCKED;
  }
  if (res.status === 429) {
    const params = new URLSearchParams({ next: "/login" });
    const until = deadlineFromSeconds(res.details?.retry_after_seconds, now);
    if (until) params.set("until", String(until));
    return `${ACCOUNT_STATE_ROUTES.RATE_LIMIT}?${params.toString()}`;
  }
  return null;
}

/** Whole seconds left until `until`, never negative. */
export function secondsUntil(until: number | null, now = Date.now()): number {
  if (until === null) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** "14:05" style countdown; hours appear only when needed. */
export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
