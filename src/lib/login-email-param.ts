/**
 * Reads the ?email= hint (gym invite emails link to /login?email=… or
 * /login?mode=signup&email=…). Returns a trimmed, lower-bounded address or ""
 * when absent, over-long or not email-shaped. It only seeds an input's value
 * (React escapes it); nothing is submitted or rendered as markup.
 */
export function parseEmailParam(raw: string | null): string {
  if (!raw) return "";
  const v = raw.trim();
  if (v.length === 0 || v.length > 254) return "";
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v) ? v : "";
}
