import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkoutLogPage from "@/app/dashboard/member/workout-log/page";
import { activityRowText } from "@/app/dashboard/member/_lib/logFormat";
import { originLabel, trackerImport } from "@/lib/progress/importSource";
import { ActivityType, progressService, type ActivityReport, type ClientProfile } from "@/lib/api/progress";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1", first_name: "Ngozi", last_name: "Eze" } }) }));

const profile = { _id: "p1", client_id: "u1" } as unknown as ClientProfile;
const base = {
  client_profile_id: "p1",
  client_id: "u1",
  logged_by: "u1",
  created_at: "2026-10-11T08:00:00.000Z",
  updated_at: "2026-10-11T08:00:00.000Z",
};
const walk: ActivityReport = {
  ...base,
  _id: "a1",
  activity_type: ActivityType.WALKING,
  title: "Walking",
  duration_minutes: 21,
  performed_at: "2026-10-11T07:00:00.000Z",
  source: "health_connect",
  origin_app: "com.sec.android.app.shealth",
  recording_method: "automatic",
};
const typedInApp: ActivityReport = {
  ...base,
  _id: "a2",
  activity_type: ActivityType.RUNNING,
  title: "Running",
  duration_minutes: 30,
  performed_at: "2026-10-10T07:00:00.000Z",
  source: "health_connect",
  origin_app: "com.google.android.apps.fitness",
  recording_method: "manual",
};
const legDay: ActivityReport = {
  ...base,
  _id: "a3",
  activity_type: ActivityType.STRENGTH,
  title: "Leg day · heavy",
  duration_minutes: 45,
  performed_at: "2026-10-09T07:00:00.000Z",
  source: "manual",
};

describe("imported workouts on the web workout log", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getMyOwnProfiles").mockResolvedValue({ success: true, data: [profile] } as never);
    vi.spyOn(progressService, "getActivityReports").mockResolvedValue({
      success: true,
      data: [walk, typedInApp, legDay],
    } as never);
  });

  it("shows the activity as the title and the app as a source badge, like mobile", async () => {
    render(<WorkoutLogPage />);
    const row = (await screen.findByText("Walking")).closest("button")!;
    expect(within(row).getByText("Samsung Health")).toBeInTheDocument();
    expect(within(row).queryByText(/Walking · Samsung Health/)).not.toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "From Samsung Health" })).toBeInTheDocument();
    // The type is the title, so the meta doesn't say it again.
    expect(within(row).getByText(/21 min/i).textContent).not.toMatch(/walking/i);
  });

  it("marks an entry typed in by hand in the app as Manual", async () => {
    render(<WorkoutLogPage />);
    const row = (await screen.findByText("Running")).closest("button")!;
    expect(within(row).getByText("Google Fit")).toBeInTheDocument();
    expect(within(row).getByText("Manual")).toBeInTheDocument();
    expect(within(row).getByRole("img", { name: "From Google Fit, typed in by hand" })).toBeInTheDocument();
  });

  it("a workout logged in Binectics has no badge and keeps its own title, ' · ' and all", async () => {
    render(<WorkoutLogPage />);
    const row = (await screen.findByText("Leg day · heavy")).closest("button")!;
    expect(within(row).queryByRole("img")).not.toBeInTheDocument();
    expect(within(row).getByText(/Strength · 45 min/i)).toBeInTheDocument();
  });

  it("the detail drawer names the source", async () => {
    render(<WorkoutLogPage />);
    await userEvent.click((await screen.findByText("Walking")).closest("button")!);
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText("Source")).toBeInTheDocument();
    expect(within(drawer).getByText("Samsung Health")).toBeInTheDocument();
  });
});

describe("import source helpers", () => {
  it("labels known apps and falls back to Health Connect", () => {
    expect(originLabel("com.sec.android.app.shealth")).toBe("Samsung Health");
    expect(originLabel("com.samsung.android.wear.shealth")).toBe("Galaxy Watch");
    expect(originLabel("com.example.unknown")).toBe("Health Connect");
    expect(originLabel(undefined)).toBe("Health Connect");
  });

  it("only imports get a badge", () => {
    expect(trackerImport({ source: "manual" })).toBeNull();
    expect(trackerImport({})).toBeNull();
    expect(trackerImport({ source: "health_connect", origin_app: "com.google.android.apps.fitness" })).toEqual({
      label: "Google Fit",
      manual: false,
    });
  });

  it("activityRowText: falls back to the type and says it once", () => {
    const row = activityRowText({ ...walk, title: "" }, null);
    expect(row.title).toBe("Walking");
    expect(row.meta).not.toMatch(/Walking/);
    expect(activityRowText(legDay, null).meta).toMatch(/Strength · 45 min/);
  });
});
