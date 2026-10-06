import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ConsultationBookingStatus as S, type ConsultationBooking } from "@/lib/api/consultations";
import { contrast } from "@/test/contrast";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import { CoachToday } from "../CoachToday";
import { ScheduleRow } from "../ScheduleRow";

const getProviderBookings = vi.fn();
const getMyClientProfiles = vi.fn();
const getOrgSummary = vi.fn();
let org: { _id: string; owner_id: string; currency: string } | null = { _id: "org-1", owner_id: "u-1", currency: "NGN" };

vi.mock("@/lib/api/consultations", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/consultations")>()),
  consultationsService: { getProviderBookings: () => getProviderBookings() },
}));
vi.mock("@/lib/api/progress", () => ({
  progressService: { getMyClientProfiles: () => getMyClientProfiles() },
}));
vi.mock("@/lib/api/earnings", () => ({
  earningsService: { getOrgSummary: (id: string) => getOrgSummary(id) },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", first_name: "Tunde Ade" } }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: org, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: org, organizations: [], isLoading: false }),
}));
vi.mock("@/components/OnboardingBanner", () => ({ default: () => null }));

function booking(id: string, h: number, status = S.CONFIRMED, name = "Wei Chen", dayOffset = 0): ConsultationBooking {
  const start = new Date(2026, 9, 6 + dayOffset, h);
  return {
    id,
    clientUserId: "c",
    clientFirstName: name,
    providerId: "p",
    consultationTypeId: "t",
    consultationTypeName: "Strength",
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status,
  } as ConsultationBooking;
}

const props = {
  noun: "session" as const,
  sessionHref: (id: string) => `/dashboard/trainer/sessions/${id}`,
  calendarHref: "/dashboard/trainer/sessions",
  clientsHref: "/dashboard/trainer/clients",
  clientHref: (id: string) => `/dashboard/trainer/clients/${id}`,
};

describe("CoachToday", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 8, 0));
    resetClientNowForTests();
    vi.clearAllMocks();
    org = { _id: "org-1", owner_id: "u-1", currency: "NGN" };
    getMyClientProfiles.mockResolvedValue({ success: true, data: [] });
    getProviderBookings.mockResolvedValue({
      success: true,
      data: [
        booking("b1", 9),
        booking("b2", 13, S.CANCELLED, "Pier Botha"),
        booking("b3", 15, S.PENDING, "Thandi Nkosi"),
        booking("b4", 9, S.CONFIRMED, "Mike Khumalo", 2),
      ],
    });
    getOrgSummary.mockResolvedValue({
      success: true,
      data: { windows: { today: {}, week: {}, month: { NGN: 5_000_000 } }, all_time: { by_currency: {} } },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("has one serif word, the coach's first name, in the title", async () => {
    render(<CoachToday {...props} />);
    const h1 = await screen.findByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Today, Tunde");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
    expect(h1.querySelector("em")?.textContent).toBe("Tunde");
  });

  it("lists today's sessions in a time-gutter schedule, cancelled ones muted", async () => {
    render(<CoachToday {...props} />);
    const today = await screen.findByRole("list", { name: "Today's sessions" });
    const rows = within(today).getAllByRole("listitem").filter((li) => li.hasAttribute("data-schedule-row"));
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining("Wei Chen"),
      expect.stringContaining("Pier Botha"),
      expect.stringContaining("Thandi Nkosi"),
    ]);
    expect(rows[1].hasAttribute("data-muted")).toBe(true);
    // 10:00–15:00 is free once the 13:00 cancellation is ignored.
    expect(within(today).getByText(/300 min/)).toBeTruthy();
    expect(within(rows[0]).getByRole("link").getAttribute("href")).toBe("/dashboard/trainer/sessions/b1");
    // Later days go to "Coming up", not today's schedule.
    expect(screen.getByRole("list", { name: "Upcoming sessions" }).textContent).toContain("Mike Khumalo");
  });

  it("shows real KPIs only: settled earnings this month, no utilisation", async () => {
    render(<CoachToday {...props} />);
    await screen.findByText("Earnings · this month");
    expect(screen.getByText("Settled")).toBeTruthy();
    expect(getOrgSummary).toHaveBeenCalledWith("org-1");
    expect(screen.getByText("2 still to come")).toBeTruthy();
    expect(screen.queryByText(/utili[sz]ation|slots/i)).toBeNull();
    expect(screen.queryByText(/forecast|rating/i)).toBeNull();
  });

  it("leaves earnings out for a coach who doesn't own the workspace", async () => {
    org = { _id: "gym-1", owner_id: "someone-else", currency: "NGN" };
    render(<CoachToday {...props} />);
    await screen.findByText("Active clients");
    await waitFor(() => expect(screen.getByRole("list", { name: "Today's sessions" })).toBeTruthy());
    expect(screen.queryByText("Earnings · this month")).toBeNull();
    expect(getOrgSummary).not.toHaveBeenCalled();
  });
});

describe("ScheduleRow contrast", () => {
  it("keeps a muted row's text at AA on its surface", () => {
    render(
      <ol>
        <ScheduleRow time="13:00" title="Pier Botha" meta="60 min" muted />
      </ol>,
    );
    // Title, meta and gutter are all --fg-3 on the card's --bg surface.
    expect(screen.getByText("Pier Botha").getAttribute("style")).toContain("var(--fg-3)");
    expect(contrast("fg-3", "bg")).toBeGreaterThanOrEqual(4.5);
  });
});
