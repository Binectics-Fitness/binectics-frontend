import { describe, expect, it } from "vitest";
import { TONES, TONE_COLORS } from "@/lib/ui/tones";
import { contrast } from "./contrast";

/**
 * Every tone's ink on its fill must pass WCAG AA for normal text (4.5:1):
 * StatusPill draws an 11px label in these colours. Measured from the real
 * tokens in globals.css, so a token change that breaks a pill fails here.
 */

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
