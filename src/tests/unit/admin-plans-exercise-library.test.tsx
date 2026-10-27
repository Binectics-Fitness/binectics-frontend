import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPlansPage from "@/app/admin/plans/page";

/** Step 4 of the feature-plan pattern: the admin editor can switch the exercise library per plan. */

const listPlans = vi.fn();
const updatePlan = vi.fn();

vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/api/admin", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/admin")>()),
  adminService: {
    listPlans: (...a: unknown[]) => listPlans(...a),
    listPlanPrices: async () => ({ success: true, data: [] }),
    listCurrencies: async () => ({ success: true, data: [] }),
    updatePlan: (...a: unknown[]) => updatePlan(...a),
  },
}));

const pro = {
  _id: "p1", code: "pro", name: "Pro", description: "", sort_order: 1, is_active: true,
  max_active_members: 50, max_membership_plans: 10, max_staff_members: 3, max_listings: 1,
  exercise_library_enabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  listPlans.mockResolvedValue({ success: true, data: [pro] });
  updatePlan.mockImplementation(async (_id: string, body: Record<string, unknown>) => ({ success: true, data: { ...pro, ...body } }));
});

describe("admin plans editor: exercise library flag", () => {
  it("shows the flag and saves it when switched off", async () => {
    render(<AdminPlansPage />);
    const box = await screen.findByLabelText(/Exercise library/);
    expect((box as HTMLInputElement).checked).toBe(true);
    fireEvent.click(box);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updatePlan).toHaveBeenCalled());
    expect(updatePlan.mock.calls[0][1]).toMatchObject({ exercise_library_enabled: false });
  });
});
