import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GRADIENT_OPTIONS, getFacilityGradient } from "@/lib/constants/facility-catalogue";

/**
 * The facility swatches and the no-photo preview drew nothing: every class
 * named a v1 colour (accent-blue-500, primary-500, …) that the v2 theme no
 * longer defines. Each colour must now be a `--color-*` in the `@theme`
 * block of globals.css, which is what makes Tailwind build `from-*`/`to-*`.
 */
function themeColours(): Set<string> {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const theme = css.slice(css.indexOf("@theme"));
  const block = theme.slice(0, theme.indexOf("\n}"));
  return new Set([...block.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
}

const colours = themeColours();

describe("facility gradient catalogue", () => {
  it("reads the theme colours", () => {
    expect(colours.has("ink")).toBe(true);
    expect(colours.size).toBeGreaterThan(20);
  });

  it.each(GRADIENT_OPTIONS.map((g) => [g.key, g.className]))("%s uses only existing v2 tokens", (_key, className) => {
    const parts = className.split(/\s+/);
    expect(parts.some((p) => p.startsWith("from-"))).toBe(true);
    expect(parts.some((p) => p.startsWith("to-"))).toBe(true);
    for (const part of parts) {
      const name = part.replace(/^(from|via|to)-/, "");
      expect(colours.has(name), `${part} has no --color-${name} in @theme`).toBe(true);
    }
  });

  it("keeps the stored keys", () => {
    expect(GRADIENT_OPTIONS.map((g) => g.key)).toEqual([
      "blue-purple",
      "blue-green",
      "purple-blue",
      "yellow-orange",
      "neutral",
      "cyan",
      "green-yellow",
      "neutral-blue",
    ]);
  });

  it("resolves a key, a missing value and an unknown value to a catalogue class", () => {
    const classes = new Set(GRADIENT_OPTIONS.map((g) => g.className));
    expect(getFacilityGradient("cyan")).toBe(GRADIENT_OPTIONS.find((g) => g.key === "cyan")?.className);
    expect(getFacilityGradient(undefined)).toBe(GRADIENT_OPTIONS[0].className);
    expect(getFacilityGradient(null)).toBe(GRADIENT_OPTIONS[0].className);
    expect(classes.has(getFacilityGradient("from-nothing-500 to-nowhere-500"))).toBe(true);
    expect(classes.has(getFacilityGradient("sunset"))).toBe(true);
  });

  it("maps a class string an earlier version saved to the swatch it was", () => {
    const of = (key: string) => GRADIENT_OPTIONS.find((g) => g.key === key)?.className;
    expect(getFacilityGradient("from-accent-blue-500 to-accent-purple-500")).toBe(of("blue-purple"));
    expect(getFacilityGradient("from-neutral-700  to-neutral-900")).toBe(of("neutral"));
    expect(getFacilityGradient("from-primary-500 to-accent-yellow-500")).toBe(of("green-yellow"));
  });
});
