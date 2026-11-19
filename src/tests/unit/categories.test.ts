import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  LOG_CATEGORY,
  LOG_ICON,
  TARGET_CATEGORY,
  isCategory,
  restingIcon,
  selectedFill,
  selectedLabel,
} from "@/lib/ui/categories";
import { TONES, categoryTone, toneColors } from "@/lib/ui/tones";

const globals = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");

describe("category map", () => {
  it("has the four categories, each drawn from globals.css tokens", () => {
    expect(CATEGORIES).toEqual(["fast", "water", "move", "meal"]);
    for (const c of CATEGORIES) {
      expect(CATEGORY_COLORS[c]).toEqual({ accent: `var(--${c})`, soft: `var(--${c}-soft)`, ink: `var(--${c}-ink)` });
      for (const step of ["", "-soft", "-ink"]) expect(globals).toMatch(new RegExp(`^\\s*--${c}${step}:`, "m"));
    }
  });

  it("keeps the approved values (colour-motion README, 19 Nov 2026)", () => {
    const value = (name: string) => globals.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, "m"))?.[1];
    expect(value("water")).toBe("oklch(0.74 0.11 232)");
    expect(value("water-soft")).toBe("oklch(0.95 0.03 232)");
    expect(value("water-ink")).toBe("oklch(0.45 0.10 235)");
    expect(value("move")).toBe("oklch(0.76 0.10 180)");
    expect(value("move-soft")).toBe("oklch(0.95 0.035 180)");
    expect(value("move-ink")).toBe("oklch(0.44 0.08 185)");
    expect(value("meal")).toBe("oklch(0.72 0.11 300)");
    expect(value("meal-ink")).toBe("oklch(0.42 0.13 300)");
    // Fast reuses trainer amber, meal the dietitian soft fill.
    expect(value("fast")).toBe("var(--trainer)");
    expect(value("fast-soft")).toBe("var(--trainer-soft)");
    expect(value("fast-ink")).toBe("oklch(0.45 0.12 75)");
    expect(value("meal-soft")).toBe("var(--dietitian-soft)");
  });

  it("selected is the category accent with an ink label, else ink with paper", () => {
    expect(selectedFill("water")).toBe("var(--water)");
    expect(selectedLabel("water")).toBe("var(--ink)");
    expect(selectedFill(null)).toBe("var(--ink)");
    expect(selectedLabel(undefined)).toBe("var(--bg)");
    expect(restingIcon("meal")).toBe("var(--meal-ink)");
    expect(restingIcon(null)).toBe("var(--fg-2)");
  });

  it("keeps weight and notes neutral, so no colour judges a body number", () => {
    expect(LOG_CATEGORY.weight).toBeNull();
    expect(LOG_CATEGORY.note).toBeNull();
    expect(TARGET_CATEGORY.weight).toBeNull();
    expect(categoryTone(LOG_CATEGORY.weight)).toBe("neutral");
  });

  it("maps every member tool the same way as mobile", () => {
    expect(LOG_CATEGORY).toEqual({ fast: "fast", water: "water", activity: "move", session: "move", meal: "meal", weight: null, note: null });
    expect(TARGET_CATEGORY).toEqual({ weight: null, fasting: "fast", water: "water" });
    expect(Object.keys(LOG_ICON).sort()).toEqual(Object.keys(LOG_CATEGORY).sort());
  });

  it("gives each category a tone: soft tile, ink icon", () => {
    for (const c of CATEGORIES) {
      expect(TONES).toContain(c);
      expect(toneColors(c)).toEqual({ fill: CATEGORY_COLORS[c].soft, ink: CATEGORY_COLORS[c].ink });
    }
    expect(isCategory("water")).toBe(true);
    expect(isCategory("weight")).toBe(false);
  });
});
