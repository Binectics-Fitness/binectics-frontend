import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerateReportModal } from "@/components/progress-reports/GenerateReportModal";
import { ClientReportsCard } from "@/components/progress-reports/ClientReportsCard";
import MemberReportsPage from "@/app/dashboard/member/reports/page";
import { progressReportsService, type ProgressReportView } from "@/lib/api/progressReports";
import {
  formatPeriod,
  periodProblem,
  presetPeriod,
  reportHighlights,
} from "@/lib/progressReports/report";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member/reports",
}));

const NOW = new Date(2026, 9, 9, 12); // 9 Oct 2026, local

function report(over: Partial<ProgressReportView> = {}, snap: Record<string, unknown> = {}): ProgressReportView {
  return {
    id: "r1",
    client_profile_id: "p1",
    period_start: "2026-09-10",
    period_end: "2026-10-09",
    created_at: "2026-10-09T10:00:00.000Z",
    shared_at: null,
    snapshot: {
      version: 1,
      client_name: "Adaeze Okafor",
      coach_name: "Chidi Coach",
      generated_by_name: "Chidi Coach",
      brand_name: "Chidi Strength Studio",
      brand_logo_url: null,
      period_start: "2026-09-10",
      period_end: "2026-10-09",
      generated_at: "2026-10-09T10:00:00.000Z",
      programs: {
        items: [],
        totals: { due: 6, done: 3, done_late: 1, skipped: 1, missed: 1, open: 1 },
        adherence_pct: 60,
      },
      weight: { scope: "all", points: [], first_kg: 82.4, last_kg: 79.6, change_kg: -2.8, target_kg: null },
      attendance: { checkins: null, sessions: { completed: 0, no_show: 0, cancelled: 0 } },
      journal: { entries: [], total: 2 },
      coach_note: "Brilliant month.",
      ...snap,
    } as ProgressReportView["snapshot"],
    ...over,
  };
}

describe("report helpers", () => {
  it("builds preset periods ending today", () => {
    expect(presetPeriod("last-30", NOW)).toEqual({ start: "2026-09-10", end: "2026-10-09" });
    expect(presetPeriod("last-month", NOW)).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(presetPeriod("this-month", NOW)).toEqual({ start: "2026-10-01", end: "2026-10-09" });
  });

  it("rejects the periods the API would", () => {
    expect(periodProblem({ start: "2026-10-01", end: "2026-09-01" }, NOW)).toMatch(/before/);
    expect(periodProblem({ start: "2026-10-01", end: "2026-10-20" }, NOW)).toMatch(/future/);
    expect(periodProblem({ start: "2025-01-01", end: "2026-10-01" }, NOW)).toMatch(/year/);
    expect(periodProblem({ start: "", end: "2026-10-01" }, NOW)).toMatch(/Pick/);
    expect(periodProblem({ start: "2026-09-01", end: "2026-09-30" }, NOW)).toBeNull();
  });

  it("formats a period", () => {
    expect(formatPeriod("2026-09-01", "2026-09-30")).toBe("1 Sep to 30 Sep 2026");
    expect(formatPeriod("2025-12-15", "2026-01-14")).toBe("15 Dec 2025 to 14 Jan 2026");
  });

  it("shows only figures the report has", () => {
    expect(reportHighlights(report().snapshot)).toEqual([
      { label: "Adherence", value: "60%" },
      { label: "Tasks done", value: "3 of 6" },
      { label: "Weight change", value: "-2.8 kg" },
      { label: "Journal entries", value: "2" },
    ]);
    const empty = report(
      {},
      {
        programs: { items: [], totals: { due: 0, done: 0, done_late: 0, skipped: 0, missed: 0, open: 0 }, adherence_pct: null },
        weight: { scope: "all", points: [], first_kg: null, last_kg: null, change_kg: null, target_kg: null },
        journal: { entries: [], total: 0 },
      },
    );
    expect(reportHighlights(empty.snapshot)).toEqual([]);
  });
});

describe("GenerateReportModal", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a draft for the chosen period with the note, then shares it", async () => {
    const generate = vi
      .spyOn(progressReportsService, "generate")
      .mockResolvedValue({ success: true, data: report() });
    const share = vi
      .spyOn(progressReportsService, "share")
      .mockResolvedValue({ success: true, data: report({ shared_at: "2026-10-09T10:05:00.000Z" }) });
    const onCreated = vi.fn();
    const onShared = vi.fn();
    render(
      <GenerateReportModal
        open
        onClose={() => {}}
        clientProfileId="p1"
        clientFirstName="Adaeze"
        onCreated={onCreated}
        onShared={onShared}
        now={NOW}
      />,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Last month" }));
    await user.type(screen.getByPlaceholderText(/What went well/), "Brilliant month.");
    await user.click(screen.getByRole("button", { name: "Create report" }));

    expect(generate).toHaveBeenCalledWith("p1", {
      period_start: "2026-09-01",
      period_end: "2026-09-30",
      coach_note: "Brilliant month.",
    });
    expect(onCreated).toHaveBeenCalled();
    // The preview shows real figures only.
    expect(await screen.findByText("60%")).toBeInTheDocument();
    expect(screen.getByText("-2.8 kg")).toBeInTheDocument();
    expect(screen.queryByText("Gym visits")).not.toBeInTheDocument();
    expect(share).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Share with Adaeze" }));
    expect(share).toHaveBeenCalledWith("r1");
    expect(onShared).toHaveBeenCalled();
  });

  it("blocks a period in the future and shows the API's refusal", async () => {
    vi.spyOn(progressReportsService, "generate").mockResolvedValue({
      success: false,
      status: 403,
      message: "This client is no longer linked to you",
    });
    render(
      <GenerateReportModal
        open
        onClose={() => {}}
        clientProfileId="p1"
        clientFirstName="Adaeze"
        onCreated={() => {}}
        onShared={() => {}}
        now={NOW}
      />,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Custom" }));
    const to = screen.getByLabelText("To");
    await user.clear(to);
    await user.type(to, "2026-12-01");
    expect(screen.getByText("The period can't end in the future.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create report" })).toBeDisabled();

    await user.clear(to);
    await user.type(to, "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Create report" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This client is no longer linked to you");
  });
});

describe("ClientReportsCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lists drafts and shared reports; a draft can be shared", async () => {
    vi.spyOn(progressReportsService, "listForClient").mockResolvedValue({
      success: true,
      data: [report(), report({ id: "r0", shared_at: "2026-09-01T00:00:00.000Z", period_start: "2026-08-01", period_end: "2026-08-31" })],
    });
    const share = vi
      .spyOn(progressReportsService, "share")
      .mockResolvedValue({ success: true, data: report({ shared_at: "2026-10-09T10:05:00.000Z" }) });
    render(<ClientReportsCard clientProfileId="p1" clientFirstName="Adaeze" />);
    const draftRow = (await screen.findByText("10 Sep to 9 Oct 2026")).closest("li")!;
    expect(within(draftRow).getByText("Draft")).toBeInTheDocument();
    const sharedRow = screen.getByText("1 Aug to 31 Aug 2026").closest("li")!;
    expect(within(sharedRow).queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
    await userEvent.setup().click(within(draftRow).getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith("r1");
    expect(await within(draftRow).findByText("Shared")).toBeInTheDocument();
  });

  it("hides itself when the API refuses access", async () => {
    vi.spyOn(progressReportsService, "listForClient").mockResolvedValue({ success: false, status: 403 });
    const { container } = render(<ClientReportsCard clientProfileId="p1" clientFirstName="Adaeze" />);
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe("member Reports page", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lists shared reports and opens the PDF through a signed link", async () => {
    vi.spyOn(progressReportsService, "listMine").mockResolvedValue({
      success: true,
      data: [report({ shared_at: "2026-10-09T10:05:00.000Z" })],
    });
    const link = vi
      .spyOn(progressReportsService, "link")
      .mockResolvedValue({ success: true, data: { path: "/progress/reports/r1/file?token=abc", expires_at: "x" } });
    const tab = { opener: {}, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);

    render(<MemberReportsPage />);
    expect(await screen.findByText("Chidi Strength Studio")).toBeInTheDocument();
    expect(screen.getByText("Brilliant month.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Open PDF" }));
    expect(link).toHaveBeenCalledWith("r1");
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toMatch(/\/progress\/reports\/r1\/file\?token=abc$/);
  });

  it("says so when there are none", async () => {
    vi.spyOn(progressReportsService, "listMine").mockResolvedValue({ success: true, data: [] });
    render(<MemberReportsPage />);
    expect(await screen.findByText("No reports yet.")).toBeInTheDocument();
  });
});
