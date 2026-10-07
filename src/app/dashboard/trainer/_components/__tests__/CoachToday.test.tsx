import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ConsultationBookingStatus as S, type ConsultationBooking } from "@/lib/api/consultations";
import { contrast } from "@/test/contrast";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { CoachToday } from "../CoachToday";
import { ScheduleRow } from "@/components/ds/ScheduleRow";
import type { CoachTodayData } from "../useCoachTodayData";
import TrainerTodayClient from "../../TrainerTodayClient";

const getProviderBookings = vi.fn();
const getMyClientProfiles = vi.fn();
const getOrgSummary = vi.fn();
const org = { _id: "org-1", owner_id: "u-1", currency: "NGN", time_zone: "Africa/Lagos", name: "Tunde Training" };

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
  useAuth: () => ({ user: { id: "u-1", role: "TRAINER", first_name: "Tunde Ade" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: org, organizations: [org], isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: org, organizations: [org], isLoading: false }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useRoleGuard: () => ({ user: { id: "u-1", role: "TRAINER" }, isAuthorized: true, isLoading: false }),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({
  useTrainerAccess: () => ({ isAuthorized: true, isLoading: false }),
  useProviderAccess: () => ({ isAuthorized: true, isLoading: false }),
  useCoachingGym: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/OnboardingBanner", () => ({ default: () => null }));

// Lagos wall clock (UTC+1) on 6 Oct 2026.
const lagos = (h: number, dayOffset = 0) => new Date(Date.UTC(2026, 9, 6 + dayOffset, h - 1));

function booking(id: string, h: number, status = S.CONFIRMED, name = "Wei Chen", dayOffset = 0, extra = {}): ConsultationBooking {
  const start = lagos(h, dayOffset);
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
    ...extra,
  } as ConsultationBooking;
}

const bookings = [
  booking("b1", 9),
  booking("b2", 13, S.CANCELLED, "Pier Botha"),
  booking("b3", 15, S.PENDING, "Thandi Nkosi"),
  booking("b5", 17, S.PENDING, "Old Hold", 0, { payment: { reference: "r", expiresAt: lagos(7).toISOString() } }),
  booking("b4", 9, S.CONFIRMED, "Mike Khumalo", 1),
];

const data = (over: Partial<CoachTodayData> = {}): CoachTodayData => ({
  clients: [],
  bookings,
  loadedAt: lagos(8).getTime(),
  loading: false,
  error: null,
  settled: "₦50,000",
  ...over,
});

const props = {
  noun: "session" as const,
  sessionHref: (id: string) => `/dashboard/trainer/sessions/${id}`,
  calendarHref: "/dashboard/trainer/sessions",
  clientsHref: "/dashboard/trainer/clients",
  clientHref: (id: string) => `/dashboard/trainer/clients/${id}`,
};

describe("CoachToday", () => {
  it("has one serif word, the coach's first name, in the title", () => {
    render(<CoachToday {...props} data={data()} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Today, Tunde");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
    expect(h1.querySelector("em")?.textContent).toBe("Tunde");
  });

  it("lists today's sessions in a time-gutter schedule, cancelled and expired ones muted", () => {
    render(<CoachToday {...props} data={data()} />);
    const today = screen.getByRole("list", { name: "Today's sessions" });
    const rows = within(today).getAllByRole("listitem").filter((li) => li.hasAttribute("data-schedule-row"));
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining("Wei Chen"),
      expect.stringContaining("Pier Botha"),
      expect.stringContaining("Thandi Nkosi"),
      expect.stringContaining("Old Hold"),
    ]);
    expect(rows[1].hasAttribute("data-muted")).toBe(true);
    expect(rows[3].hasAttribute("data-muted")).toBe(true);
    expect(within(rows[3]).getByText("Hold expired")).toBeTruthy();
    // 10:00–15:00 is free once the 13:00 cancellation is ignored.
    expect(within(today).getByText(/300 min/)).toBeTruthy();
    expect(within(rows[0]).getByRole("link").getAttribute("href")).toBe("/dashboard/trainer/sessions/b1");
    expect(screen.getByRole("list", { name: "Upcoming sessions" }).textContent).toContain("Mike Khumalo");
  });

  it("shows real KPIs only: settled earnings, relative next session, no utilisation", () => {
    render(<CoachToday {...props} data={data()} />);
    expect(screen.getByText("Earnings · this month")).toBeTruthy();
    expect(screen.getByText("Settled")).toBeTruthy();
    expect(screen.getByText("2 still to come")).toBeTruthy(); // b1, b3; not the expired hold
    expect(screen.getByText(/^Today 09:00|^Today 9:00/)).toBeTruthy();
    expect(screen.queryByText(/utili[sz]ation|slots/i)).toBeNull();
    expect(screen.queryByText(/forecast|rating/i)).toBeNull();
  });

  it("says Tomorrow for a next session on the org's next day", () => {
    render(<CoachToday {...props} data={data({ bookings: [booking("t", 9, S.CONFIRMED, "Mike", 1)] })} />);
    expect(screen.getByText(/^Tomorrow /)).toBeTruthy();
  });

  it("leaves earnings out when the page has none to show", () => {
    render(<CoachToday {...props} data={data({ settled: null })} />);
    expect(screen.queryByText("Earnings · this month")).toBeNull();
  });
});

describe("Trainer Today page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(lagos(8));
    getMyClientProfiles.mockResolvedValue({ success: true, data: [] });
    getProviderBookings.mockResolvedValue({ success: true, data: bookings });
    getOrgSummary.mockResolvedValue({
      success: true,
      data: { windows: { today: {}, week: {}, month: { NGN: 5_000_000 } }, all_time: { by_currency: {} } },
    });
  });
  afterEach(() => vi.useRealTimers());

  it("loads once and renders one copy inside the shell", async () => {
    renderWithProviders(<TrainerTodayClient />);
    await screen.findByRole("list", { name: "Today's sessions" });
    await waitFor(() => expect(getOrgSummary).toHaveBeenCalled());
    expect(getProviderBookings).toHaveBeenCalledTimes(1);
    expect(getMyClientProfiles).toHaveBeenCalledTimes(1);
    expect(getOrgSummary).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("list", { name: "Today's sessions" })).toHaveLength(1);
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
