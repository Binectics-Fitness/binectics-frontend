/** The browser's IANA time zone, sent on every solo read and write. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * A unique id per tap (the API accepts [A-Za-z0-9_-]{8,64}). A retry of the
 * same tap sends the same id, so a glass is never counted twice.
 */
export function newOpId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
