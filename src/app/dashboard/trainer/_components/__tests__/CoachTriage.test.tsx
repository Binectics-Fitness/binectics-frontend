import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ConsultationBookingStatus as S, type ConsultationBooking } from "@/lib/api/consultations";
import {
  attentionHref,
  attentionLine,
  normalizeAttentionItem,
  type AttentionItem,
} from "@/lib/api/coachAttention";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { CoachToday } from "../CoachToday";
import { canCloseOut, closeOutSessions } from "../coachSchedule";
import type { CoachTodayData } from "../useCoachTodayData";
import DietitianTodayClient from "../../../dietitian/DietitianTodayClient";

const getProviderBookings = vi.fn();
const completeBooking = vi.fn();
const markNoShow = vi.fn();
const getMyClientProfiles = vi.fn();
const getDashboardStats = vi.fn();
const getAttention = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const org = { _id: "org-1", owner_id: "u-1", currency: "NGN", time_zone: "Africa/Lagos", name: "Ada Nutrition" };

vi.mock("@/lib/api/consultations", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/consultations")>()),
  consultationsService: {
    getProviderBookings: () => getProviderBookings(),
    completeBooking: (id: string) => completeBooking(id),
    markNoShow: (id: string) => markNoShow(id),
  },
}));
vi.mock("@/lib/api/coachAttention", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/coachAttention")>()),
  coachAttentionService: { getAttention: (days: number) => getAttention(days) },
}));
vi.mock("@/lib/api/progress", () => ({
  progressService: {
    getMyClientProfiles: () => getMyClientProfiles(),
    getDashboardStats: () => getDashboardStats(),
  },
}));
vi.mock("@/lib/api/earnings", () => ({
  earningsService: { getOrgSummary: () => Promise.resolve({ success: false }) },
}));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", role: "DIETITIAN", first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: org, organizations: [org], isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: org, organizations: [org], isLoading: false }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useRoleGuard: () => ({ user: { id: "u-1", role: "DIETITIAN" }, isAuthorized: true, isLoading: false }),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({
  useTrainerAccess: () => ({ isAuthorized: true, isLoading: false }),
  useProviderAccess: () => ({ isAuthorized: true, isLoading: false }),
  useCoachingGym: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/dietitian",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/OnboardingBanner", () => ({ default: () => null }));
vi.mock("@/components/provider/SetupChecklist", () => ({ SetupChecklist: () => null }));

// Lagos wall clock (UTC+1) on 6 Oct 2026.
const lagos = (h: number, dayOffset = 0, min = 0) => new Date(Date.UTC(2026, 9, 6 + dayOffset, h - 1, min));
const NOW = lagos(11, 0, 30).getTime();

function booking(
  id: string,
  h: number,
  status = S.CONFIRMED,
  name = "Wei Chen",
  extra: Partial<ConsultationBooking> & { dayOffset?: number } = {},
): ConsultationBooking {
  const { dayOffset = 0, ...rest } = extra;
  const start = lagos(h, dayOffset);
  return {
    id,
    clientUserId: `user-${id}`,
    clientFirstName: name,
    providerId: "p",
    consultationTypeId: "t",
    consultationTypeName: "Strength",
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status,
    ...rest,
  } as ConsultationBooking;
}

const hold = { payment: { reference: "r", amountMinor: 500000, currency: "NGN", expiresAt: lagos(23).toISOString() } };
const bookings = [
  booking("late-night", 23, S.CONFIRMED, "Mike Khumalo", { dayOffset: -1 }),
  booking("am", 9, S.CONFIRMED, "Wei Chen"),
  booking("now", 11, S.CONFIRMED, "Thandi Nkosi"),
  booking("unpaid", 10, S.PENDING, "Pier Botha", hold),
  booking("done", 8, S.COMPLETED, "Done Person"),
  booking("noshow", 7, S.NO_SHOW, "Gone Person"),
  booking("cancelled", 10, S.CANCELLED, "Cancelled Person"),
  booking("expired", 9, S.PENDING, "Old Hold", { payment: { reference: "x", expiresAt: lagos(8).toISOString() } }),
  booking("later", 15, S.CONFIRMED, "Later Person"),
];

const form = (over: Partial<Extract<AttentionItem, { kind: "form_submitted" }>> = {}): AttentionItem => ({
  kind: "form_submitted",
  at: lagos(10).toISOString(),
  client: { profileId: "prof-1", name: "Wei Chen" },
  title: "Weekly check-in",
  late: false,
  formId: "form-1",
  responseId: "resp-1",
  ...over,
});
const missed = (over: Partial<Extract<AttentionItem, { kind: "tasks_missed" }>> = {}): AttentionItem => ({
  kind: "tasks_missed",
  at: lagos(6).toISOString(),
  client: { profileId: "prof-2", name: "Pier Botha" },
  day: "2026-10-05",
  count: 3,
  titles: ["Walk", "Water", "Stretch"],
  ...over,
});

describe("Needs you copy and targets", () => {
  it("reads like mobile's attentionLine", () => {
    expect(attentionLine(form(), "2026-10-06")).toBe('Submitted "Weekly check-in"');
    expect(attentionLine(form({ late: true }), "2026-10-06")).toBe('Submitted "Weekly check-in" late');
    expect(attentionLine(missed(), "2026-10-06")).toBe("Missed 3 tasks yesterday");
    expect(attentionLine(missed({ day: "2026-10-06" }), "2026-10-06")).toBe("Missed 3 tasks today");
    expect(attentionLine(missed({ count: 1, titles: ["Walk"] }), "2026-10-06")).toBe('Missed "Walk" yesterday');
    expect(attentionLine(missed({ count: 1, titles: [] }), "2026-10-06")).toBe('Missed "a task" yesterday');
    expect(attentionLine(missed({ day: "2026-10-03" }), "2026-10-06")).toBe("Missed 3 tasks on Sat 3 Oct");
  });

  it("opens a form's answers on the client's response, anything else the client", () => {
    const client = (id: string) => `/dashboard/trainer/clients/${id}`;
    expect(attentionHref(form(), client)).toBe("/dashboard/forms/form-1/responses?response=resp-1");
    expect(attentionHref(form({ responseId: undefined }), client)).toBe("/dashboard/forms/form-1/responses");
    expect(attentionHref(form({ formId: undefined }), client)).toBe("/dashboard/trainer/clients/prof-1");
    expect(attentionHref(missed(), client)).toBe("/dashboard/trainer/clients/prof-2");
  });

  it("normalises the API's snake_case and drops kinds it doesn't know", () => {
    expect(
      normalizeAttentionItem({
        kind: "form_submitted",
        at: "2026-10-06T09:00:00.000Z",
        client: { profile_id: "p1", name: "Wei" },
        title: "Intake",
        late: true,
        form_id: "f1",
        form_response_id: null,
        instance_id: "i1",
      }),
    ).toEqual({
      kind: "form_submitted",
      at: "2026-10-06T09:00:00.000Z",
      client: { profileId: "p1", name: "Wei" },
      title: "Intake",
      late: true,
      formId: "f1",
    });
    expect(normalizeAttentionItem({ kind: "something_new", at: "x", client: null })).toBeNull();
  });
});

describe("To close out: grouping and order", () => {
  it("keeps sessions that started and are still open, oldest first", () => {
    const ids = closeOutSessions(bookings, NOW).map((b) => b.id);
    // Not completed, no-show, cancelled, an expired hold or anything still to come.
    expect(ids).toEqual(["late-night", "am", "unpaid", "now"]);
  });

  it("can't close out an unpaid hold", () => {
    const byId = new Map(bookings.map((b) => [b.id, b]));
    expect(canCloseOut(byId.get("am")!, NOW)).toBe(true);
    expect(canCloseOut(byId.get("unpaid")!, NOW)).toBe(false);
    expect(canCloseOut(byId.get("later")!, NOW)).toBe(false);
  });
});

const data = (over: Partial<CoachTodayData> = {}): CoachTodayData => ({
  clients: [],
  bookings,
  loadedAt: NOW,
  loading: false,
  error: null,
  settled: null,
  attention: [],
  ...over,
});

const trainerProps = {
  noun: "session" as const,
  sessionHref: (id: string) => `/dashboard/trainer/sessions/${id}`,
  calendarHref: "/dashboard/trainer/sessions",
  clientsHref: "/dashboard/trainer/clients",
  clientHref: (id: string) => `/dashboard/trainer/clients/${id}`,
  setupKind: "trainer" as const,
};

describe("CoachToday triage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows neither list when nothing needs closing or attention", () => {
    render(<CoachToday {...trainerProps} data={data({ bookings: [booking("later", 15)], attention: [] })} />);
    expect(screen.queryByText("To close out")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Needs you" })).toBeNull();
    // The rest of Today is unchanged.
    expect(screen.getByRole("list", { name: "Today's sessions" })).toBeTruthy();
  });

  it("lists the sessions to close out, an earlier day labelled, an unpaid hold awaiting payment", () => {
    render(<CoachToday {...trainerProps} data={data()} />);
    const list = screen.getByRole("list", { name: "Sessions to close out" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows.map((r) => within(r).getAllByRole("link")[0]?.textContent ?? r.textContent)).toEqual([
      "Mike Khumalo",
      "Wei Chen",
      "Pier Botha",
      "Thandi Nkosi",
    ]);
    expect(rows[0].textContent).toContain("Mon 5 Oct");
    expect(rows[1].textContent).not.toContain("Oct");
    // The trainer's rows open the session.
    expect(within(rows[1]).getByRole("link", { name: "Wei Chen" }).getAttribute("href")).toBe(
      "/dashboard/trainer/sessions/am",
    );
    expect(within(rows[2]).getByText("Awaiting payment")).toBeTruthy();
    expect(within(rows[2]).queryByRole("button")).toBeNull();
    expect(within(rows[1]).getByRole("button", { name: "Mark done" })).toBeTruthy();
    expect(within(rows[1]).getByRole("button", { name: "No-show" })).toBeTruthy();
  });

  it("marks a session done, then reloads the page", async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    completeBooking.mockResolvedValue({ success: true, data: {} });
    render(<CoachToday {...trainerProps} data={data({ reload })} />);
    const row = screen.getByRole("group", { name: "Close out Wei Chen's session" });
    fireEvent.click(within(row).getByRole("button", { name: "Mark done" }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(completeBooking).toHaveBeenCalledWith("am");
    expect(markNoShow).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Session with Wei Chen marked done");
  });

  it("marks a no-show", async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    markNoShow.mockResolvedValue({ success: true, data: {} });
    render(<CoachToday {...trainerProps} data={data({ reload })} />);
    const row = screen.getByRole("group", { name: "Close out Mike Khumalo's session" });
    fireEvent.click(within(row).getByRole("button", { name: "No-show" }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(markNoShow).toHaveBeenCalledWith("late-night");
    expect(toastSuccess).toHaveBeenCalledWith("Mike Khumalo marked as a no-show");
  });

  it("says so and keeps the row when the API refuses", async () => {
    const reload = vi.fn();
    completeBooking.mockResolvedValue({ success: false, message: "Booking is not active" });
    render(<CoachToday {...trainerProps} data={data({ reload })} />);
    const row = screen.getByRole("group", { name: "Close out Wei Chen's session" });
    fireEvent.click(within(row).getByRole("button", { name: "Mark done" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Booking is not active"));
    expect(reload).not.toHaveBeenCalled();
    expect(within(row).getByRole("button", { name: "Mark done" })).toHaveProperty("disabled", false);
  });

  it("lists who needs you, newest first as the API sends them, six at most, toned by kind", () => {
    const items = [
      form(),
      missed(),
      ...Array.from({ length: 5 }, (_, i) =>
        missed({ client: { profileId: `p-${i}`, name: `Client ${i}` }, at: lagos(5 - i).toISOString() }),
      ),
    ];
    render(<CoachToday {...trainerProps} data={data({ attention: items })} />);
    const section = screen.getByRole("heading", { name: "Needs you" }).closest("section")!;
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links[0].getAttribute("href")).toBe("/dashboard/forms/form-1/responses?response=resp-1");
    expect(links[0].textContent).toContain('Submitted "Weekly check-in"');
    expect(links[0].querySelector("[data-tone]")?.getAttribute("data-tone")).toBe("success");
    expect(links[1].getAttribute("href")).toBe("/dashboard/trainer/clients/prof-2");
    expect(links[1].textContent).toContain("Missed 3 tasks yesterday");
    expect(links[1].querySelector("[data-tone]")?.getAttribute("data-tone")).toBe("warn");
  });
});

describe("Dietitian Today reuses both lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    getMyClientProfiles.mockResolvedValue({
      success: true,
      data: [
        {
          _id: "prof-am",
          client_id: { _id: "user-am", first_name: "Wei", last_name: "Chen", email: "w@x.test" },
          is_active: true,
          created_at: "2026-09-01T00:00:00.000Z",
        },
      ],
    });
    getProviderBookings.mockResolvedValue({ success: true, data: bookings });
    getDashboardStats.mockResolvedValue({ success: false });
    getAttention.mockResolvedValue([missed()]);
  });
  afterEach(() => vi.useRealTimers());

  it("reads the last two days of attention and links a consult to the client's page", async () => {
    renderWithProviders(<DietitianTodayClient />);
    const list = await screen.findByRole("list", { name: "Consults to close out" });
    expect(getAttention).toHaveBeenCalledWith(2);
    // No consult page for dietitians: the name opens the client when known.
    expect(within(list).getByRole("link", { name: "Wei Chen" }).getAttribute("href")).toBe(
      "/dashboard/dietitian/clients/prof-am",
    );
    expect(within(list).queryByRole("link", { name: "Mike Khumalo" })).toBeNull();
    expect(screen.getByRole("group", { name: "Close out Wei Chen's consult" })).toBeTruthy();
    const section = screen.getByRole("heading", { name: "Needs you" }).closest("section")!;
    expect(within(section).getByRole("link").getAttribute("href")).toBe("/dashboard/dietitian/clients/prof-2");
  });

  it("still renders Today when the attention read fails", async () => {
    getAttention.mockRejectedValue(new Error("boom"));
    renderWithProviders(<DietitianTodayClient />);
    await screen.findByRole("list", { name: "Consults to close out" });
    expect(screen.queryByRole("heading", { name: "Needs you" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
