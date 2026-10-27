import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MealLogPage from "@/app/dashboard/member/meal-log/page";
import { progressService, MealType, type ClientProfile, type MealFeedback } from "@/lib/api/progress";

let mockSearch = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearch,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member/meal-log",
}));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

const profile = { _id: "p1", client_id: "u1" } as unknown as ClientProfile;
const meal = (id: string, description: string, reply?: string): MealFeedback =>
  ({
    _id: id,
    client_profile_id: "p1",
    client_id: "u1",
    meal_date: "2026-10-12T12:00:00.000Z",
    meal_type: MealType.LUNCH,
    description,
    logged_by: "u1",
    created_at: "2026-10-12T12:00:00.000Z",
    updated_at: "2026-10-12T12:00:00.000Z",
    ...(reply
      ? {
          reply: {
            text: reply,
            author_id: { _id: "d1", first_name: "Nadia", last_name: "Hassan" },
            created_at: "2026-10-12T13:00:00.000Z",
            updated_at: "2026-10-12T13:00:00.000Z",
          },
        }
      : {}),
  }) as MealFeedback;

describe("meal log opened from a reply notification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getMyOwnProfiles").mockResolvedValue({ success: true, data: [profile] } as never);
    vi.spyOn(progressService, "getMealFeedbacks").mockResolvedValue({
      success: true,
      data: [meal("m1", "Jollof rice", "Add some greens."), meal("m2", "Egusi soup", "Less oil.")],
    } as never);
  });

  it("opens the named meal, follows a new ?mealId while open, and stays closed once closed", async () => {
    mockSearch = new URLSearchParams("mealId=m1");
    const view = render(<MealLogPage />);
    expect(await screen.findByText("Add some greens.")).toBeInTheDocument();
    expect(screen.getByText("Reply from Nadia Hassan")).toBeInTheDocument();

    // Another reply notification tapped while the page is open.
    mockSearch = new URLSearchParams("mealId=m2");
    view.rerender(<MealLogPage />);
    expect(await screen.findByText("Less oil.")).toBeInTheDocument();

    // Closing it keeps it closed for the same link.
    await act(async () => {
      await userEvent.keyboard("{Escape}");
    });
    view.rerender(<MealLogPage />);
    expect(screen.queryByText("Less oil.")).not.toBeInTheDocument();
  });
});
