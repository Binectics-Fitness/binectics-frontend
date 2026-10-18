import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MealPlansClient from "@/app/dashboard/dietitian/meal-plans/MealPlansClient";
import DietitianFoodsPage from "@/app/dashboard/dietitian/foods/page";
import FoodDetailPage from "@/app/dashboard/dietitian/foods/[foodId]/page";
import DietitianProtocolsPage from "@/app/dashboard/dietitian/protocols/page";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { nutritionService, type FoodItem, type Protocol } from "@/lib/api/nutrition";
import { DietPlanDeliveryType, PlanStatus } from "@/lib/types";
import { toast } from "@/components/Toast";
import { findConfirmDialog } from "@/test/confirmDialog";

/**
 * The dietitian's archive actions (meal plan, food, protocol) ask in the
 * app's dialog, never window.confirm, and say what archiving does.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const dietPlan = (over: Partial<DietPlan>): DietPlan =>
  ({
    _id: "p",
    professional_id: "pro",
    created_by: "pro",
    title: "Plan",
    delivery_type: DietPlanDeliveryType.PLATFORM,
    status: PlanStatus.ACTIVE,
    meals: [],
    days: [],
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...over,
  }) as DietPlan;

const oats: FoodItem = {
  _id: "f1", created_by: "pro", name: "Oats", serving_label: "40 g", calories_kcal: 150,
  protein_g: 5, carbs_g: 27, fat_g: 3, is_archived: false, created_at: "", updated_at: "",
};
const gutReset: Protocol = {
  _id: "pr1", created_by: "pro", name: "Gut reset", steps: [{ title: "Fibre" }], is_archived: false,
  created_at: "2026-10-01T00:00:00.000Z", updated_at: "2026-10-01T00:00:00.000Z",
};

function resolvedParams<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status?: string; value?: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

let nativeConfirm: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  nativeConfirm = vi.spyOn(window, "confirm");
});

describe("meal plans: archive", () => {
  beforeEach(() => {
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({
      success: true,
      data: [
        dietPlan({ _id: "a1", title: "Assigned week", client_profile_id: "cp1", client_id: { _id: "u1", first_name: "Bola", last_name: "Ade", email: "b@example.com" } as never }),
      ],
    });
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({ success: true, data: [] });
  });

  it("archives only after the dialog, which says the client loses it", async () => {
    const archive = vi.spyOn(progressService, "archiveStandaloneDietPlan").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    render(<MealPlansClient />);
    await user.click(await screen.findByRole("button", { name: "Archive" }));
    const dialog = await findConfirmDialog('Archive "Assigned week"?');
    expect(dialog).toHaveTextContent("your client's meal plans");
    expect(archive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive meal plan" }));
    await waitFor(() => expect(archive).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(screen.queryByText("Assigned week")).toBeNull());
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("does nothing on Cancel", async () => {
    const archive = vi.spyOn(progressService, "archiveStandaloneDietPlan");
    const user = userEvent.setup();
    render(<MealPlansClient />);
    await user.click(await screen.findByRole("button", { name: "Archive" }));
    const dialog = await findConfirmDialog('Archive "Assigned week"?');
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(archive).not.toHaveBeenCalled();
    expect(screen.getByText("Assigned week")).toBeInTheDocument();
  });
});

describe("food library: archive", () => {
  it("archives from the list only after the dialog", async () => {
    vi.spyOn(nutritionService, "listFoods").mockResolvedValue({ success: true, data: { items: [oats], total: 1 } } as never);
    const archive = vi.spyOn(nutritionService, "archiveFood").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    render(<DietitianFoodsPage />);
    await user.click((await screen.findAllByRole("button", { name: "Archive" }))[0]);
    const dialog = await findConfirmDialog('Archive "Oats"?');
    expect(dialog).toHaveTextContent("Meal plans that already use it don't change.");
    expect(archive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive food" }));
    await waitFor(() => expect(archive).toHaveBeenCalledWith("f1"));
    expect(toast.success).toHaveBeenCalledWith('Archived "Oats".');
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("archives from the food's own page only after the dialog, then goes back to the library", async () => {
    vi.spyOn(nutritionService, "getFood").mockResolvedValue({ success: true, data: oats } as never);
    const archive = vi.spyOn(nutritionService, "archiveFood").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    render(
      <Suspense fallback={null}>
        <FoodDetailPage params={resolvedParams({ foodId: "f1" })} />
      </Suspense>,
    );
    await user.click(await screen.findByRole("button", { name: "Archive" }));
    const dialog = await findConfirmDialog('Archive "Oats"?');
    expect(archive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive food" }));
    await waitFor(() => expect(archive).toHaveBeenCalledWith("f1"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/dietitian/foods"));
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});

describe("protocols: archive without converting", () => {
  it("archives only after the dialog, and reports a refusal", async () => {
    vi.spyOn(nutritionService, "listProtocols").mockResolvedValue({ success: true, data: { items: [gutReset], total: 1 } } as never);
    const archive = vi
      .spyOn(nutritionService, "archiveProtocol")
      .mockResolvedValue({ success: false, message: "Protocol not found" } as never);
    const user = userEvent.setup();
    render(<DietitianProtocolsPage />);
    await user.click(await screen.findByRole("button", { name: "Archive: Gut reset" }));
    const dialog = await findConfirmDialog('Archive "Gut reset" without converting it?');
    expect(dialog).toHaveTextContent("its steps won't carry over to Programs");
    expect(archive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive protocol" }));
    await waitFor(() => expect(archive).toHaveBeenCalledWith("pr1"));
    expect(toast.error).toHaveBeenCalledWith("Protocol not found");
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});
