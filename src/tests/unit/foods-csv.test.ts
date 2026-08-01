import { describe, it, expect } from "vitest";
import { buildFoodsCsv, FOODS_CSV_HEADERS } from "@/app/dashboard/dietitian/foods/foods-csv";

// The Export button on the dietitian food-database page downloads this
// CSV. These tests pin the header row and RFC 4180 escaping so a food
// named `Rice, "jollof" style` can't silently corrupt the export.

const base = {
  name: "Chicken breast",
  category: "Protein",
  serving_label: "100 g grilled",
  calories_kcal: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
  fiber_g: 0,
  sugar_g: undefined,
  sodium_mg: 74,
};

describe("buildFoodsCsv", () => {
  it("emits the header row even for an empty list", () => {
    expect(buildFoodsCsv([])).toBe(FOODS_CSV_HEADERS.join(","));
    expect(buildFoodsCsv([]).startsWith("Name,Category,Serving,")).toBe(true);
  });

  it("emits one line per food with macros in header order", () => {
    const csv = buildFoodsCsv([base]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("Chicken breast,Protein,100 g grilled,165,31,0,3.6,0,,74");
  });

  it("leaves missing optional fields blank rather than printing undefined", () => {
    const csv = buildFoodsCsv([
      { ...base, category: undefined, fiber_g: undefined, sugar_g: undefined, sodium_mg: undefined },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("Chicken breast,,100 g grilled,165,31,0,3.6,,,");
    expect(csv).not.toContain("undefined");
  });

  it("quotes fields containing commas", () => {
    const csv = buildFoodsCsv([{ ...base, name: "Rice, long grain" }]);
    expect(csv.split("\n")[1].startsWith('"Rice, long grain",Protein,')).toBe(true);
  });

  it("escapes embedded quotes by doubling them", () => {
    const csv = buildFoodsCsv([{ ...base, name: 'Jollof "party" rice' }]);
    expect(csv.split("\n")[1].startsWith('"Jollof ""party"" rice",')).toBe(true);
  });

  it("quotes fields containing newlines", () => {
    const csv = buildFoodsCsv([{ ...base, serving_label: "1 cup\ncooked" }]);
    expect(csv).toContain('"1 cup\ncooked"');
  });

  it("keeps a zero distinct from a missing value", () => {
    const csv = buildFoodsCsv([{ ...base, carbs_g: 0, sugar_g: undefined }]);
    const cells = csv.split("\n")[1].split(",");
    // carbs (index 5) is an explicit 0; sugar (index 8) is absent.
    expect(cells[5]).toBe("0");
    expect(cells[8]).toBe("");
  });
});
