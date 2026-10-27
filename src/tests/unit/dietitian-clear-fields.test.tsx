import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MealPlansClient from "@/app/dashboard/dietitian/meal-plans/MealPlansClient";
import FoodDetailPage from "@/app/dashboard/dietitian/foods/[foodId]/page";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { nutritionService, type FoodItem } from "@/lib/api/nutrition";
import { DietPlanDeliveryType, PlanStatus } from "@/lib/types";

/**
 * Emptying an optional field and saving must clear it. A payload that
 * leaves the key out keeps the old value on the API, so the cleared text or
 * figure would come back.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

function resolvedParams<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status?: string; value?: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("food detail: clearing optional fields", () => {
  const jollof: FoodItem = {
    _id: "f1", created_by: "pro", name: "Jollof rice", category: "Grains", serving_label: "1 cup (200 g)",
    calories_kcal: 340, protein_g: 7.5, carbs_g: 52, fat_g: 11, fiber_g: 2.4, sugar_g: 3.1, sodium_mg: 520,
    notes: "Minimal oil.", is_archived: false, created_at: "", updated_at: "",
  };

  it("sends null for an emptied fibre, sugar, sodium, category and notes", async () => {
    vi.spyOn(nutritionService, "getFood").mockResolvedValue({ success: true, data: jollof } as never);
    const update = vi
      .spyOn(nutritionService, "updateFood")
      .mockResolvedValue({ success: true, data: { ...jollof, fiber_g: undefined } } as never);
    const user = userEvent.setup();
    render(
      <Suspense fallback={null}>
        <FoodDetailPage params={resolvedParams({ foodId: "f1" })} />
      </Suspense>,
    );

    for (const value of ["2.4", "3.1", "520", "Grains", "Minimal oil."]) {
      await user.clear(await screen.findByDisplayValue(value));
    }
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [id, payload] = update.mock.calls[0];
    expect(id).toBe("f1");
    expect(payload).toMatchObject({
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
      category: null,
      notes: null,
      // Required figures are untouched.
      caloriesKcal: 340,
      fatG: 11,
    });
  });

  it("keeps a zero, which is a real value", async () => {
    vi.spyOn(nutritionService, "getFood").mockResolvedValue({ success: true, data: jollof } as never);
    const update = vi.spyOn(nutritionService, "updateFood").mockResolvedValue({ success: true, data: jollof } as never);
    const user = userEvent.setup();
    render(
      <Suspense fallback={null}>
        <FoodDetailPage params={resolvedParams({ foodId: "f1" })} />
      </Suspense>,
    );

    const sugar = await screen.findByDisplayValue("3.1");
    await user.clear(sugar);
    await user.type(sugar, "0");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toMatchObject({ sugarG: 0, fiberG: 2.4 });
  });
});

describe("meal plan edit: clearing description and notes", () => {
  const plan = {
    _id: "p1",
    professional_id: "pro",
    created_by: "pro",
    title: "Lean week",
    description: "For a slow cut.",
    dietitian_notes: "Drink water.",
    delivery_type: DietPlanDeliveryType.PLATFORM,
    status: PlanStatus.ACTIVE,
    meals: [],
    days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
  } as unknown as DietPlan;

  it("sends empty strings so the API clears them", async () => {
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: true, data: [plan] });
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({ success: true, data: [] });
    const update = vi
      .spyOn(progressService, "updateStandaloneDietPlan")
      .mockResolvedValue({ success: true, data: { ...plan, description: "", dietitian_notes: "" } } as never);
    const user = userEvent.setup();
    render(<MealPlansClient />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.clear(await screen.findByDisplayValue("For a slow cut."));
    await user.clear(screen.getByDisplayValue("Drink water."));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [id, data] = update.mock.calls[0];
    expect(id).toBe("p1");
    expect(data).toHaveProperty("description", "");
    expect(data).toHaveProperty("dietitian_notes", "");
  });
});
