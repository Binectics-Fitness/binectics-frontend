import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import MemberMealPlanDetailPage from "@/app/dashboard/member/meal-plans/[planId]/page";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { DietPlanDeliveryType, MealSlot, PlanStatus } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

const PLAN = {
  _id: "p1",
  professional_id: "pro",
  created_by: "pro",
  title: "Weekly plan",
  delivery_type: DietPlanDeliveryType.PLATFORM,
  status: PlanStatus.ACTIVE,
  meals: [],
  days: [
    { day_of_week: "every_day", meals: [{ meal_type: MealSlot.LUNCH, title: "Daily lunch", foods: ["Brown rice"], order: 1 }] },
    { day_of_week: "monday", meals: [{ meal_type: MealSlot.DINNER, title: "Monday dinner", foods: ["salmon"], order: 1 }] },
  ],
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
} as unknown as DietPlan;

// The page unwraps `params` with use(), which suspends: render inside an
// awaited act so React can resolve it.
const renderPage = async () => {
  const params = Promise.resolve({ planId: "p1" });
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <MemberMealPlanDetailPage params={params} />
      </Suspense>,
    );
  });
};

describe("member meal plan page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getMyDietPlanById").mockResolvedValue({ success: true, data: PLAN });
    vi.spyOn(progressService, "markMyDietPlanViewed").mockResolvedValue({ success: true } as never);
  });

  it("still renders when stored shopping state has no weeks", async () => {
    window.localStorage.setItem("mealplan-shop:u1:p1", JSON.stringify({ have: [] }));
    await renderPage();
    expect(await screen.findByText("Shopping list · this week")).toBeInTheDocument();
  });

  it("day pills expose aria-pressed and follow the selection", async () => {
    await renderPage();
    await screen.findByText("Daily lunch");
    const mon = screen.getByRole("button", { name: /^Mon/ });
    const tue = screen.getByRole("button", { name: /^Tue/ });
    fireEvent.click(mon);
    expect(mon).toHaveAttribute("aria-pressed", "true");
    expect(tue).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });

  it("each Have it button names its item", async () => {
    await renderPage();
    await screen.findByText("Shopping list · this week");
    expect(screen.getByRole("button", { name: "Have it: Brown rice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Have it: salmon" })).toBeInTheDocument();
  });
});
