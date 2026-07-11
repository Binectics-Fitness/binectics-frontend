/**
 * Detect errors caused by a STALE BUILD — a long-lived tab (mobile
 * browsers keep tabs for days) navigating after a redeploy fetches
 * chunks/RSC payloads that no longer exist — and recover with one hard
 * reload, which picks up the current deployment.
 *
 * The sessionStorage guard (30s window) prevents a reload loop if the
 * error turns out not to be staleness.
 */
const RELOAD_FLAG = "stale_build_reload_at";

const STALE_PATTERNS =
  /ChunkLoadError|Loading chunk|css chunk|dynamically imported module|import\(\) failed|text\/html.*module script/i;

export function reloadIfStaleBuildError(
  error: (Error & { digest?: string }) | undefined,
): boolean {
  if (typeof window === "undefined" || !error) return false;
  const text = `${error.name ?? ""} ${error.message ?? ""}`;
  if (!STALE_PATTERNS.test(text)) return false;

  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < 30_000) return false; // already tried just now
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    // sessionStorage unavailable — reload anyway, worst case is one loop-less retry
  }
  window.location.reload();
  return true;
}
