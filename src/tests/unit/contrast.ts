import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WCAG 2.x contrast measured from the real :root tokens in globals.css, so a
 * token change that breaks a pairing fails the tests that use it.
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

/** Contrast ratio of two colours: tokens as var(--x) or literal oklch(). */
export function contrast(fg: string, bg: string): number {
  const lum = (c: string) => {
    const [r, g, b] = oklchToLinearRgb(resolveColor(c));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
