import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";

/**
 * The routes the App Router serves, read from src/app: every folder holding
 * a page file. Route groups "(x)" add no segment; "[id]" and "[...slug]"
 * match any segment(s). For tests that nav links go somewhere real.
 */
const APP_DIR = resolve(__dirname, "../../app");

function collect(dir: string, segments: string[], out: string[][]) {
  const entries = readdirSync(dir);
  if (entries.some((e) => /^page\.(tsx|ts|jsx|js)$/.test(e))) out.push(segments);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory() || entry.startsWith("_") || entry.startsWith("@")) continue;
    const isGroup = entry.startsWith("(") && entry.endsWith(")");
    collect(full, isGroup ? segments : [...segments, entry], out);
  }
}

const ROUTES: string[][] = (() => {
  const out: string[][] = [];
  collect(APP_DIR, [], out);
  return out;
})();

function matches(route: string[], parts: string[]): boolean {
  for (let i = 0; i < route.length; i++) {
    const seg = route[i];
    if (/^\[\[?\.\.\./.test(seg)) return true;
    if (i >= parts.length) return false;
    if (/^\[.+\]$/.test(seg)) continue;
    if (seg !== parts[i]) return false;
  }
  return route.length === parts.length;
}

/** Whether an in-app href (query and hash ignored) resolves to a page. */
export function isAppRoute(href: string): boolean {
  const path = href.split(/[?#]/)[0];
  const parts = path.split("/").filter(Boolean);
  return ROUTES.some((route) => matches(route, parts));
}
