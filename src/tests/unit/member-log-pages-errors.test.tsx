import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkoutLogPage from "@/app/dashboard/member/workout-log/page";
import MealLogPage from "@/app/dashboard/member/meal-log/page";
import WeightLogPage from "@/app/dashboard/member/weight-log/page";
import { HealthMetricsClient } from "@/app/dashboard/member/health-metrics/HealthMetricsClient";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const withQuery = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })}>
    {ui}
  </QueryClientProvider>
);

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1", first_name: "Ngozi", last_name: "Eze" } }) }));

const fail = { success: false, message: "Internal server error" };
const profile = { _id: "p1", client_id: "u1" } as unknown as ClientProfile;

describe("member log pages on a failed load", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getMyOwnProfiles").mockResolvedValue({ success: true, data: [profile] } as never);
  });

  it("workout log shows the error, not zero sessions or an empty list", async () => {
    vi.spyOn(progressService, "getActivityReports").mockResolvedValue(fail as never);
    render(<WorkoutLogPage />);
    expect(await screen.findByText("Internal server error")).toBeInTheDocument();
    expect(screen.queryByText("Sessions · this week")).not.toBeInTheDocument();
    expect(screen.queryByText("Last 30 days")).not.toBeInTheDocument();
    expect(screen.queryByText("No workouts logged yet.")).not.toBeInTheDocument();
  });

  it("meal log shows the error, not zero meals today", async () => {
    vi.spyOn(progressService, "getMealFeedbacks").mockResolvedValue(fail as never);
    render(<MealLogPage />);
    expect(await screen.findByText("Internal server error")).toBeInTheDocument();
    expect(screen.queryByText("Meals · today")).not.toBeInTheDocument();
    expect(screen.queryByText("No meals logged yet.")).not.toBeInTheDocument();
  });

  it("weight log shows the error, not empty tiles", async () => {
    vi.spyOn(progressService, "getWeightLogs").mockResolvedValue(fail as never);
    render(withQuery(<WeightLogPage />));
    expect(await screen.findByText("Internal server error")).toBeInTheDocument();
    expect(screen.queryByText("Current")).not.toBeInTheDocument();
    expect(screen.queryByText("No weight logs yet.")).not.toBeInTheDocument();
  });

  it("a failed profile read is an error too (no get-or-create on a 500)", async () => {
    vi.spyOn(progressService, "getMyOwnProfiles").mockResolvedValue(fail as never);
    const create = vi.spyOn(progressService, "getOrCreateMyProfile");
    render(<WorkoutLogPage />);
    expect(await screen.findByText("Internal server error")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("health metrics shows the error, not 'No entries yet'", async () => {
    vi.spyOn(progressService, "getWeightLogs").mockResolvedValue(fail as never);
    render(withQuery(<HealthMetricsClient />));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your weight entries/);
    expect(screen.queryByText("No entries yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Latest weight")).not.toBeInTheDocument();
  });

  it("health metrics' 30-day change matches the weight log's (latest minus earliest in the 30 days to today)", async () => {
    const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
    const logs = [
      { _id: "a", weight_kg: 73.4, recorded_at: day(1) },
      { _id: "b", weight_kg: 75.2, recorded_at: day(29) },
      { _id: "c", weight_kg: 82.2, recorded_at: day(45) }, // outside the window
    ];
    vi.spyOn(progressService, "getWeightLogs").mockResolvedValue({ success: true, data: logs } as never);
    render(withQuery(<HealthMetricsClient />));
    expect(await screen.findByText("−1.8")).toBeInTheDocument();
  });

  it("a saved weight invalidates the cached weight queries (health metrics)", async () => {
    vi.spyOn(progressService, "getWeightLogs").mockResolvedValue({ success: true, data: [] } as never);
    vi.spyOn(progressService, "createWeightLog").mockResolvedValue({
      success: true,
      data: { _id: "w1", weight_kg: 72.5, recorded_at: new Date().toISOString(), logged_by: "u1" },
    } as never);
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    render(<QueryClientProvider client={client}><WeightLogPage /></QueryClientProvider>);
    await userEvent.click(await screen.findByRole("button", { name: "+ Log today" }));
    await userEvent.type(screen.getByRole("spinbutton", { name: "Weight in kg" }), "72.5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("72.5 kg", { selector: "span" })).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["progress", "weightLogs"] });
  });
});
