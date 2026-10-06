/**
 * Test helper: WCAG contrast between two globals.css colour tokens.
 * Reads the token values from src/app/globals.css (`--name: oklch(L C H);`)
 * so a token change re-checks every pair that a test asserts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): [number, number, number] {
  const m = css.match(new RegExp(`^\\s*--${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`, "m"));
  if (!m) throw new Error(`token --${name} is not a plain oklch() value in globals.css`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function luminance([L, C, h]: [number, number, number]): number {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

/** Contrast ratio of two tokens, e.g. contrast("fg-2", "bg-2"). */
export function contrast(fg: string, bg: string): number {
  const y1 = luminance(token(fg));
  const y2 = luminance(token(bg));
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}

/** "var(--fg-2)" → "fg-2". */
export function tokenOf(cssValue: string): string {
  const m = cssValue.match(/^var\(--([\w-]+)\)$/);
  if (!m) throw new Error(`not a token reference: ${cssValue}`);
  return m[1];
}
