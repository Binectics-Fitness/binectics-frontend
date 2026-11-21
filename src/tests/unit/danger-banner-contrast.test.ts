import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The base red (--danger) on its soft fill (--danger-soft) is 3.98:1, under
 * WCAG AA's 4.5:1 for normal text. Error banners must draw their text in
 * --danger-ink (6.0:1). tone-contrast.test.ts guards the pills; this guards
 * the hand-written banners: a fill and a text colour set on the same line
 * (one style object or one className) must not pair the soft fill with the
 * base red. Icons may stay --danger (3:1 is the non-text threshold).
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "tests") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const SOFT_FILL = /background:\s*"var\(--danger-soft[),]|\bbg-danger-soft\b(?!!)|\bbg-\(--danger-soft\)/;
const BASE_RED_TEXT = /\bcolor:\s*"var\(--danger\)"|\btext-danger\b(?!-)|\btext-\(--danger\)/;

// Icon-only circles: the base red colours an SVG glyph, not text, and 3.98:1
// clears the 3:1 non-text threshold.
const ICON_ONLY = new Set(["app/register/invite/InviteContent.tsx", "components/ConfirmationModal.tsx"]);

function findSoftFillBaseRedText(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (ICON_ONLY.has(relative(SRC, file))) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        // hover:bg-danger-soft only paints on hover, next to its own text colour.
        const cleaned = line.replace(/\bhover:bg-danger-soft!?/g, "");
        if (SOFT_FILL.test(cleaned) && BASE_RED_TEXT.test(cleaned)) {
          hits.push(`${relative(SRC, file)}:${i + 1}`);
        }
      });
  }
  return hits;
}

describe("danger banner contrast", () => {
  it("flags the pattern it guards", () => {
    expect(SOFT_FILL.test('style={{ background: "var(--danger-soft)", color: "var(--danger)" }}')).toBe(true);
    expect(BASE_RED_TEXT.test('color: "var(--danger)"')).toBe(true);
    expect(BASE_RED_TEXT.test('color: "var(--danger-ink)"')).toBe(false);
    expect(BASE_RED_TEXT.test("text-danger-ink")).toBe(false);
  });

  it("no source line draws base-red text on the danger soft fill", () => {
    expect(findSoftFillBaseRedText(walk(SRC))).toEqual([]);
  });
});
