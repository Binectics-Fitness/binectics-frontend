import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrast } from "./contrast";

/**
 * The base red (--danger) as small text on the page background is 4.49:1,
 * just under WCAG AA's 4.5:1, and lower still on --bg-2 / --bg-3. Red TEXT
 * (inline errors, required asterisks, outlined destructive buttons, debit
 * amounts) uses --danger-ink instead. danger-banner-contrast.test.ts guards
 * the soft-fill banners; this guards every other place red is a text colour.
 *
 * Non-text marks may stay --danger: icons, dots, borders, bars and filled
 * buttons only need 3:1. A line that draws an <svg> is treated as an icon.
 *
 * Line-based, like the banner test: it sees `color: "var(--danger)"` (also as
 * one branch of a ternary on the same line), a bare `text-danger` class, and
 * `color: var(--danger)` in CSS. A ternary split over several lines is not
 * seen, so review those by hand.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "tests") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(path);
  }
  return out;
}

// `color:` (not borderColor, not background) whose value, up to the next
// comma, semicolon or brace, names the base red.
const COLOR_BASE_RED = /(?<![\w-])color:\s*[^,;}\n]*?(["'`]?)var\(--danger\)\1/;
// The Tailwind text utility for the base red. hover:text-danger is left out:
// it only tints a control (usually an icon button) while the pointer is on it.
const TEXT_DANGER_CLASS = /(?<![\w:-])text-danger(?![\w-])|\btext-\(--danger\)|\btext-\[var\(--danger\)\]/;

// Icons whose colour sits on a line of its own (the <svg> tag is a line above).
// [file, snippet on the line]
const ICONS: Array<[string, string]> = [
  // Warning glyph inside the admin login error banner.
  ["app/admin/page.tsx", 'className="h-5 w-5 shrink-0 text-danger mt-0.5"'],
  // Error glyph above the "invite can't be accepted" message.
  ["app/teams/invite/accept/page.tsx", 'className="h-8 w-8 text-danger"'],
  // Icon-only circles (also allowlisted by danger-banner-contrast.test.ts).
  ["app/register/invite/InviteContent.tsx", 'style={{ background: "var(--danger-soft)", color: "var(--danger)" }}'],
  ["components/ConfirmationModal.tsx", "bg-danger-soft text-danger"],
];

function findBaseRedText(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const rel = relative(SRC, file);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes("<svg")) return;
        if (ICONS.some(([f, snippet]) => f === rel && line.includes(snippet))) return;
        if (COLOR_BASE_RED.test(line) || TEXT_DANGER_CLASS.test(line)) hits.push(`${rel}:${i + 1}`);
      });
  }
  return hits;
}

describe("danger text contrast", () => {
  it("the base red misses AA as small text on the page; the ink passes on every page surface", () => {
    expect(contrast("var(--danger)", "var(--bg)")).toBeLessThan(4.5);
    for (const bg of ["var(--bg)", "var(--bg-2)", "var(--bg-3)", "oklch(1 0 0)"]) {
      expect(contrast("var(--danger-ink)", bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("flags the patterns it guards", () => {
    expect(COLOR_BASE_RED.test('style={{ color: "var(--danger)" }}')).toBe(true);
    expect(COLOR_BASE_RED.test('style={{ color: ok ? "var(--signal-ink)" : "var(--danger)" }}')).toBe(true);
    expect(COLOR_BASE_RED.test(".x { color: var(--danger); }")).toBe(true);
    expect(COLOR_BASE_RED.test('style={{ color: "var(--danger-ink)" }}')).toBe(false);
    expect(COLOR_BASE_RED.test('style={{ borderColor: "var(--danger)", color: "var(--ink)" }}')).toBe(false);
    expect(COLOR_BASE_RED.test('style={{ background: "var(--danger)", color: "white" }}')).toBe(false);
    expect(TEXT_DANGER_CLASS.test('className="text-sm text-danger"')).toBe(true);
    expect(TEXT_DANGER_CLASS.test('className="text-danger-ink"')).toBe(false);
    expect(TEXT_DANGER_CLASS.test('className="hover:text-danger"')).toBe(false);
  });

  it("no source line draws text in the base red", () => {
    expect(findBaseRedText(walk(SRC))).toEqual([]);
  });
});
