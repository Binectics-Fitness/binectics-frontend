import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TONES, TONE_COLORS } from "@/lib/ui/tones";

/**
 * Every tone's ink on its fill must pass WCAG AA for normal text (4.5:1):
 * StatusPill draws an 11px label in these colours. Measured from the real
 * tokens in globals.css, so a token change that breaks a pill fails here.
 */

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"), "utf8");
const rootStart = css.indexOf(":root {");
const rootBlock = css.slice(rootStart, css.indexOf("\n}", rootStart));
const tokens: Record<string, string> = {};
for (const m of rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();

function resolveColor(value: string): string {
  let v = value.trim();
  for (let i = 0; i < 6; i++) {
    const m = v.match(/^var\(--([\w-]+)\)$/);
    if (!m) break;
    const next = tokens[m[1]];
    if (!next) throw new Error(`unknown token --${m[1]}`);
    v = next;
  }
  return v;
}

/** oklch(L C H) -> linear sRGB (clamped), per the CSS Color 4 matrices. */
function oklchToLinearRgb(value: string): [number, number, number] {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!m) throw new Error(`not an oklch colour: ${value}`);
  const L = Number(m[1]);
  const C = Number(m[2]);
  const h = (Number(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
  ];
}

function contrast(fg: string, bg: string): number {
  const lum = (c: string) => {
    const [r, g, b] = oklchToLinearRgb(resolveColor(c));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tone contrast", () => {
  it("measures the tokens it is given (black on white is 21:1)", () => {
    expect(contrast("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 1);
  });

  it.each(TONES.map((t) => [t]))("%s ink on its fill reaches 4.5:1", (tone) => {
    const { fill, ink } = TONE_COLORS[tone];
    expect(contrast(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it("danger pills use the danger ink, not the base red", () => {
    expect(TONE_COLORS.danger.ink).toBe("var(--danger-ink)");
    expect(contrast("var(--danger)", "var(--danger-soft)")).toBeLessThan(4.5);
  });
});
