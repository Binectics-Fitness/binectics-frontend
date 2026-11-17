import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DARK_FROM,
  DAWN_COLORS,
  DAWN_MIN_CONTRAST,
  DAWN_MIN_LARGE_CONTRAST,
  DAWN_SAMPLE_POINTS,
  LIGHT_UP_TO,
  blendAmount,
  contrastRatio,
  dawnPalette,
  hexToRgb,
  mix,
  worstContrast,
} from "@/lib/solo/fastingRules";

/**
 * The running-fast hero is the one gradient in the product. Text on it must
 * keep WCAG AA (4.5:1) everywhere it sits and its large numerals 3:1. This is
 * measured with the real colours (the theme tokens, converted from globals.css)
 * at 0, 25, 49, 51, 75 and 100 percent and at every percent in between, and
 * at five heights down the surface. It fails if a stop or the flip point is
 * moved so that contrast drops below the threshold.
 */

// oklch -> sRGB hex, enough to read the theme tokens in globals.css.
function oklchToHex(L: number, C: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const enc = (v: number) => {
    const c = Math.min(1, Math.max(0, v));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return `#${lin.map((v) => Math.round(enc(v) * 255).toString(16).padStart(2, "0")).join("")}`;
}

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\)`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return oklchToHex(Number(m[1]), Number(m[2]), Number(m[3]));
}
const near = (a: string, b: string) => hexToRgb(a).every((v, i) => Math.abs(v - hexToRgb(b)[i]) <= 2);

describe("the dawn colours are the theme's own tokens", () => {
  it("night is ink to ink-2, morning is trainer soft to bone, text is paper or ink", () => {
    expect(near(DAWN_COLORS.nightTop, token("ink"))).toBe(true);
    expect(near(DAWN_COLORS.nightBottom, token("ink-2"))).toBe(true);
    expect(near(DAWN_COLORS.dayTop, token("trainer-soft"))).toBe(true);
    expect(near(DAWN_COLORS.dayBottom, token("bg-2"))).toBe(true);
    expect(near(DAWN_COLORS.lightText, token("bg"))).toBe(true);
    expect(near(DAWN_COLORS.darkText, token("ink"))).toBe(true);
  });
});

describe("hero text contrast (measured)", () => {
  const POINTS = [0, 0.25, 0.49, 0.5, 0.51, 0.75, 1];

  it("text keeps at least 4.5:1 at 0, 25, 49, 50, 51, 75 and 100 percent, top to bottom of the surface", () => {
    for (const p of POINTS) {
      const pal = dawnPalette(p);
      expect(worstContrast(pal), `progress ${p} (${pal.tone} text)`).toBeGreaterThanOrEqual(DAWN_MIN_CONTRAST);
    }
  });

  it("holds at every percent of progress, so no stretch of the fast dips below AA", () => {
    let worst = Infinity;
    for (let i = 0; i <= 100; i += 1) {
      const pal = dawnPalette(i / 100);
      worst = Math.min(worst, worstContrast(pal));
    }
    expect(worst).toBeGreaterThanOrEqual(DAWN_MIN_CONTRAST);
  });

  it("the large numerals and the arc's progress stroke keep at least 3:1", () => {
    for (let i = 0; i <= 100; i += 1) {
      const pal = dawnPalette(i / 100);
      expect(worstContrast(pal, pal.text)).toBeGreaterThanOrEqual(DAWN_MIN_LARGE_CONTRAST);
    }
  });

  it("flips from paper to ink text at the halfway point and only there", () => {
    expect(dawnPalette(0.49).tone).toBe("light");
    expect(dawnPalette(0.5).tone).toBe("dark");
    expect(dawnPalette(0).text).toBe(DAWN_COLORS.lightText);
    expect(dawnPalette(1).text).toBe(DAWN_COLORS.darkText);
  });

  it("the blend steps across the unreadable middle band at the flip instead of lingering in it", () => {
    expect(blendAmount(0)).toBe(0);
    expect(blendAmount(1)).toBe(1);
    expect(blendAmount(0.5)).toBeCloseTo(DARK_FROM, 10);
    expect(blendAmount(0.4999999)).toBeCloseTo(LIGHT_UP_TO, 5);
    // Monotone: the surface only ever moves from night towards morning.
    let prev = -1;
    for (let i = 0; i <= 100; i += 1) {
      const a = blendAmount(i / 100);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
  });

  it("a plain linear ramp with the same flip does NOT pass (why the step exists)", () => {
    // The design as first drawn: linear blend, light text below 50 percent.
    let worst = Infinity;
    for (let i = 0; i <= 100; i += 1) {
      const p = i / 100;
      const top = mix(DAWN_COLORS.nightTop, DAWN_COLORS.dayTop, p);
      const bottom = mix(DAWN_COLORS.nightBottom, DAWN_COLORS.dayBottom, p);
      const text = p < 0.5 ? DAWN_COLORS.lightText : DAWN_COLORS.darkText;
      for (const f of DAWN_SAMPLE_POINTS) worst = Math.min(worst, contrastRatio(text, mix(top, bottom, f)));
    }
    expect(worst).toBeLessThan(DAWN_MIN_CONTRAST);
    expect(worst).toBeGreaterThan(2.5);
  });
});
