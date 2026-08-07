import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { FoodPicker } from "@/app/dashboard/dietitian/meal-plans/FoodPicker";

// FoodPicker searches the dietitian's food library as you type but must still
// accept free-typed foods, dedupe, and never gate the plan on library membership.

const listFoods = vi.fn();
vi.mock("@/lib/api/nutrition", () => ({
  nutritionService: { listFoods: (...args: unknown[]) => listFoods(...args) },
}));

function foods(...names: string[]) {
  return names.map((name, i) => ({
    _id: `f${i}`,
    created_by: "u",
    name,
    serving_label: "1 serving",
    calories_kcal: 100 + i,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    is_archived: false,
    created_at: "",
    updated_at: "",
  }));
}

function ok(items: ReturnType<typeof foods>) {
  return { success: true, data: { items, total: items.length, page: 1, limit: 8 } };
}

/** Controlled wrapper so chips reflect the committed value. */
function Harness({ initial = [] as string[] }: { initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial);
  return <FoodPicker value={value} onChange={setValue} />;
}

const type = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText(/search your food library|add another/i), {
    target: { value: text },
  });

describe("FoodPicker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("searches the library and adds a match as a chip", async () => {
    listFoods.mockResolvedValue(ok(foods("Greek Yoghurt Bowl")));
    render(<Harness />);

    type("gre");
    const option = await screen.findByText("Greek Yoghurt Bowl");
    fireEvent.click(option);

    expect(screen.getByLabelText("Remove Greek Yoghurt Bowl")).toBeInTheDocument();
    expect(listFoods).toHaveBeenCalledWith(expect.objectContaining({ search: "gre" }));
  });

  it("does not offer a food that is already selected", async () => {
    listFoods.mockResolvedValue(ok(foods("Greek Yoghurt Bowl")));
    render(<Harness initial={["Greek Yoghurt Bowl"]} />);

    // Exact query matches the selected chip: no library option, no free-text add.
    type("Greek Yoghurt Bowl");
    expect(await screen.findByText(/no matches in your library/i)).toBeInTheDocument();
  });

  it("adds free-typed food that is not in the library", async () => {
    listFoods.mockResolvedValue(ok([]));
    render(<Harness />);

    type("grapes");
    const addFree = await screen.findByText(/add .*grapes.* as free text/i);
    fireEvent.click(addFree);

    expect(screen.getByLabelText("Remove grapes")).toBeInTheDocument();
  });

  it("removes a chip", () => {
    render(<Harness initial={["Oats"]} />);
    expect(screen.getByLabelText("Remove Oats")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Remove Oats"));
    expect(screen.queryByLabelText("Remove Oats")).not.toBeInTheDocument();
  });

  it("adds the highlighted option on Enter", async () => {
    listFoods.mockResolvedValue(ok(foods("Greek Yoghurt Bowl")));
    render(<Harness />);

    type("gre");
    await screen.findByText("Greek Yoghurt Bowl");
    fireEvent.keyDown(screen.getByPlaceholderText(/search your food library|add another/i), {
      key: "Enter",
    });

    expect(screen.getByLabelText("Remove Greek Yoghurt Bowl")).toBeInTheDocument();
  });
});
