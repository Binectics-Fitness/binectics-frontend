import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportMembersDrawer } from "@/app/dashboard/gym-owner/members/import/ImportMembersDrawer";
import {
  buildTemplateCsv,
  formatDay,
  inviteDays,
  problemsCsv,
  problemsText,
} from "@/app/dashboard/gym-owner/members/import/import-helpers";
import { PendingOffers } from "@/app/dashboard/gym-owner/members/PendingOffers";
import { memberImportsApi, type MemberImportPreview, type ImportPreviewRow } from "@/lib/api/memberImports";
import type { OrgEnrollmentOffer } from "@/lib/api/marketplace";
import { toast } from "@/components/Toast";

/**
 * Member import on the web: every step of the drawer (upload, map columns,
 * preview, invites, result), the unsaved-changes guard, and the imported
 * members waiting on the Members page. The API does every check; these
 * tests pin what the gym sees and what the drawer sends.
 */

vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({
    value,
    onChange,
    options,
    name,
    id,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    name?: string;
    id?: string;
    disabled?: boolean;
  }) => (
    <select id={id} aria-label={name} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={`${o.value}-${o.label}`} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const h = vi.hoisted(() => ({ offers: [] as unknown[] }));
vi.mock("@/lib/queries/marketplace", () => ({
  useOrgEnrollmentOffers: () => ({ data: h.offers, refetch: vi.fn() }),
  useCancelOrgEnrollmentOffer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const row = (over: Partial<ImportPreviewRow> = {}): ImportPreviewRow => ({
  row: 1,
  name: "Ada Obi",
  first_name: "Ada",
  last_name: "Obi",
  email: "ada@x.test",
  phone: null,
  plan_value: "Gold",
  plan_id: "plan-gold",
  branch_value: null,
  listing_id: null,
  notes: null,
  start_date: null,
  end_date: "2026-12-31",
  status: "ready",
  problems: [],
  ...over,
});

function makePreview(over: Partial<MemberImportPreview> = {}): MemberImportPreview {
  return {
    import_id: "imp-1",
    status: "draft",
    file_name: "members.csv",
    headers: ["Name", "Email", "Plan", "Expiry"],
    sample: [["Ada Obi", "ada@x.test", "Gold", "31/12/2026"]],
    mapping: { full_name: 0, email: 1, plan: 2, end_date: 3 },
    mapping_problems: [],
    date_format: { requested: "auto", applied: "dmy", day_first_only: 1, month_first_only: 0, ambiguous_rows: 0 },
    time_zone: "Africa/Lagos",
    plans: [
      { value: "Gold", rows: 2, plan_id: "plan-gold", plan_name: "Gold", matched: "name" },
      { value: "Platinum VIP", rows: 1, plan_id: null, plan_name: null, matched: null },
    ],
    branches: [],
    gym_plans: [
      { _id: "plan-gold", name: "Gold" },
      { _id: "plan-silver", name: "Silver" },
    ],
    gym_branches: [],
    default_branch: null,
    seats: {
      limit: 10,
      used: 2,
      reserved_by_imports: 0,
      available: 8,
      needed: 2,
      fits: 2,
      over_by: 0,
      limit_needed: 4,
      plan_tier: "free",
    },
    summary: { total: 3, ready: 2, errors: 1, skipped: 0, over_cap: 0, warnings: 0 },
    rows: [
      row(),
      row({ row: 2, name: "Bo", email: "bo@x.test" }),
      row({
        row: 3,
        name: "Cy",
        email: "cy@x.test",
        plan_value: "Platinum VIP",
        plan_id: null,
        status: "error",
        problems: [
          {
            code: "unknown_plan",
            severity: "error",
            field: "plan",
            message: '"Platinum VIP" doesn\'t match one of your plans. Choose which plan it is.',
          },
        ],
      }),
    ],
    limits: { max_rows: 5000, max_file_bytes: 2097152, invites_per_day: 200 },
    ...over,
  };
}

let client: QueryClient;
function renderDrawer(props: Partial<Parameters<typeof ImportMembersDrawer>[0]> = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const onClose = vi.fn();
  const onImported = vi.fn();
  render(<ImportMembersDrawer open orgId="org-1" onClose={onClose} onImported={onImported} {...props} />, { wrapper });
  return { onClose, onImported };
}

const csvFile = () => new File(["Name,Email,Plan,Expiry\nAda,ada@x.test,Gold,31/12/2026\n"], "members.csv", { type: "text/csv" });

async function uploadToColumns(user: ReturnType<typeof userEvent.setup>, preview = makePreview()) {
  vi.spyOn(memberImportsApi, "upload").mockResolvedValue({ success: true, data: preview });
  await user.upload(screen.getByTestId("member-import-file"), csvFile());
  await screen.findByRole("heading", { name: "Match your columns" });
}

describe("member import helpers", () => {
  it("ships a template with every column the import reads, dates day-first", () => {
    const [header, first] = buildTemplateCsv().split(/\r?\n/);
    expect(header).toBe("Full name,Email,Phone,Plan,End date,Start date,Branch,Notes");
    expect(first).toContain("31/12/2026");
  });

  it("spells the month out so a day/month swap shows, without any time zone shift", () => {
    expect(formatDay("2026-04-03")).toBe("3 Apr 2026");
    expect(formatDay("2026-12-31")).toBe("31 Dec 2026");
    expect(formatDay(null)).toBe("");
  });

  it("lists problems for the clipboard and as a CSV", () => {
    const rows = makePreview().rows.filter((r) => r.problems.length);
    expect(problemsText(rows)).toBe(
      'Row 3 (cy@x.test): "Platinum VIP" doesn\'t match one of your plans. Choose which plan it is.',
    );
    const csv = problemsCsv(rows).split(/\r?\n/);
    expect(csv[0]).toBe("Row,Name,Email,Outcome,Problem");
    expect(csv[1]).toContain("Not imported");
  });

  it("says how many days the daily invite limit spreads invites over", () => {
    expect(inviteDays(450, 200)).toBe(3);
    expect(inviteDays(0, 200)).toBe(0);
  });
});

describe("ImportMembersDrawer", () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe("upload", () => {
    it("offers the template and refuses an Excel file before uploading it", async () => {
      const user = userEvent.setup({ applyAccept: false });
      const upload = vi.spyOn(memberImportsApi, "upload");
      renderDrawer();
      expect(screen.getByRole("button", { name: "Download the CSV template" })).toBeInTheDocument();
      await user.upload(
        screen.getByTestId("member-import-file"),
        new File(["x"], "members.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent("Save the spreadsheet as CSV");
      expect(upload).not.toHaveBeenCalled();
    });

    it("shows the API's reason when the file can't be read", async () => {
      const user = userEvent.setup();
      vi.spyOn(memberImportsApi, "upload").mockResolvedValue({
        success: false,
        message: "The file has 6000 members; one import takes up to 5000. Split it into smaller files.",
      });
      renderDrawer();
      await user.upload(screen.getByTestId("member-import-file"), csvFile());
      expect(await screen.findByRole("alert")).toHaveTextContent("one import takes up to 5000");
    });
  });

  describe("map columns", () => {
    it("starts from the API's guesses and re-checks the file when a column changes", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(user);
      expect(screen.getByLabelText("Email")).toHaveValue("1");
      expect(screen.getByLabelText("Membership end date")).toHaveValue("3");
      expect(screen.getByText("e.g. ada@x.test")).toBeInTheDocument();

      const preview = vi
        .spyOn(memberImportsApi, "preview")
        .mockResolvedValue({ success: true, data: makePreview({ mapping: { full_name: 0, email: 1, plan: 2, end_date: 3, phone: 0 } }) });
      await user.selectOptions(screen.getByLabelText("Phone"), "0");
      expect(preview).toHaveBeenCalledWith(
        "org-1",
        "imp-1",
        expect.objectContaining({ mapping: { full_name: 0, email: 1, plan: 2, end_date: 3, phone: 0 } }),
      );
    });

    it("blocks the preview while a needed column is missing", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(
        user,
        makePreview({ mapping: { full_name: 0, plan: 2, end_date: 3 }, mapping_problems: ["Choose the column with the member’s email."] }),
      );
      expect(screen.getByRole("alert")).toHaveTextContent("Choose the column with the member’s email.");
      expect(screen.getByRole("button", { name: /Preview 3 rows/ })).toBeDisabled();
    });

    it("asks which plan an unmatched name is, and sends the gym's choice", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(user);
      expect(screen.getByText(/1 plan name didn't match your plans/)).toBeInTheDocument();
      const preview = vi.spyOn(memberImportsApi, "preview").mockResolvedValue({ success: true, data: makePreview() });
      await user.selectOptions(screen.getByLabelText("Plan for Platinum VIP"), "plan-silver");
      expect(preview).toHaveBeenCalledWith(
        "org-1",
        "imp-1",
        expect.objectContaining({ plan_map: [{ value: "Platinum VIP", plan_id: "plan-silver" }] }),
      );
    });

    it("maps branches when the gym has several, and names the default", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(
        user,
        makePreview({
          gym_branches: [
            { _id: "l-ikoyi", name: "Ikoyi" },
            { _id: "l-lekki", name: "Lekki" },
          ],
          default_branch: { _id: "l-lekki", name: "Lekki" },
          branches: [{ value: "Ajah", rows: 3, listing_id: null, listing_name: null, matched: null }],
        }),
      );
      expect(screen.getByLabelText("Default branch")).toHaveValue("l-lekki");
      const preview = vi.spyOn(memberImportsApi, "preview").mockResolvedValue({ success: true, data: makePreview() });
      await user.selectOptions(screen.getByLabelText("Branch for Ajah"), "l-ikoyi");
      expect(preview).toHaveBeenCalledWith(
        "org-1",
        "imp-1",
        expect.objectContaining({ branch_map: [{ value: "Ajah", listing_id: "l-ikoyi" }] }),
      );
    });

    it("says when dates could be read two ways, and lets the gym choose", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(
        user,
        makePreview({
          date_format: { requested: "auto", applied: "auto", day_first_only: 0, month_first_only: 0, ambiguous_rows: 4 },
        }),
      );
      expect(screen.getByText(/4 rows have dates like 03\/04 that could be either/)).toBeInTheDocument();
      const preview = vi.spyOn(memberImportsApi, "preview").mockResolvedValue({ success: true, data: makePreview() });
      await user.click(screen.getByRole("radio", { name: /Day first/ }));
      expect(preview).toHaveBeenCalledWith("org-1", "imp-1", expect.objectContaining({ date_format: "dmy" }));
    });
  });

  describe("preview", () => {
    it("counts rows, highlights the ones that need fixing and lets the gym copy the problems", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      renderDrawer();
      await uploadToColumns(user);
      await user.click(screen.getByRole("button", { name: /Preview 3 rows/ }));
      await screen.findByRole("heading", { name: "Check before importing" });

      expect(screen.getByText("Ready to import").nextSibling).toHaveTextContent("2");
      expect(screen.getByText("Need fixing").nextSibling).toHaveTextContent("1");
      // Problems first.
      const table = screen.getByRole("table");
      expect(within(table).getAllByRole("row")).toHaveLength(2);
      expect(within(table).getByText(/doesn't match one of your plans/)).toBeInTheDocument();
      expect(within(table).getByText("31 Dec 2026")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Copy problems" }));
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Row 3 (cy@x.test)"));
      await user.click(screen.getByRole("button", { name: /All \(3\)/ }));
      expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(4);
    });

    it("says plainly how many fit the seat limit and what upgrading changes", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(
        user,
        makePreview({
          seats: {
            limit: 10,
            used: 2,
            reserved_by_imports: 0,
            available: 8,
            needed: 500,
            fits: 8,
            over_by: 492,
            limit_needed: 502,
            plan_tier: "free",
          },
          summary: { total: 500, ready: 8, errors: 0, skipped: 0, over_cap: 492, warnings: 0 },
        }),
      );
      await user.click(screen.getByRole("button", { name: /Preview 500 rows/ }));
      const callout = await screen.findByRole("status");
      expect(callout).toHaveTextContent("8 of 500 ready members fit");
      expect(callout).toHaveTextContent("492 won't be imported");
      expect(callout).toHaveTextContent("A plan with at least 502 seats takes everyone");
      expect(within(callout).getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/billing");
      expect(screen.getByRole("button", { name: "Continue with 8 ready" })).toBeEnabled();
    });
  });

  describe("invites, confirm and result", () => {
    async function toInvites(user: ReturnType<typeof userEvent.setup>) {
      await uploadToColumns(user);
      await user.click(screen.getByRole("button", { name: /Preview 3 rows/ }));
      await user.click(await screen.findByRole("button", { name: "Continue with 2 ready" }));
      await screen.findByRole("heading", { name: "Tell your members?" });
    }

    it("adds members without emailing them unless the gym chooses to", async () => {
      const user = userEvent.setup();
      const { onImported } = renderDrawer();
      await toInvites(user);
      expect(screen.getByRole("radio", { name: /Add them now, invite them later/ })).toBeChecked();
      const confirm = vi.spyOn(memberImportsApi, "confirm").mockResolvedValue({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "later",
          processed: 3,
          total: 3,
          result: { imported: 2, errors: 1 },
          invites: { held: 2, queued: 0, sent: 0, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      vi.spyOn(memberImportsApi, "status").mockResolvedValue({ success: false });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      expect(confirm).toHaveBeenCalledWith("org-1", "imp-1", "later");
      await screen.findByRole("heading", { name: "Import finished" });
      expect(screen.getByText("Imported").nextSibling).toHaveTextContent("2");
      expect(screen.getByText("Not imported: need fixing").nextSibling).toHaveTextContent("1");

      const send = vi.spyOn(memberImportsApi, "sendInvites").mockResolvedValue({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "later",
          processed: 3,
          total: 3,
          result: { imported: 2 },
          invites: { held: 0, queued: 2, sent: 0, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      await user.click(screen.getByRole("button", { name: "Send invites now" }));
      expect(send).toHaveBeenCalledWith("org-1", "imp-1");
      expect(await screen.findByText(/2 on their way/)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(onImported).toHaveBeenCalled();
    });

    it("sends now when chosen, says how long the daily limit takes, and shows progress while it runs", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await uploadToColumns(user, makePreview({ summary: { total: 450, ready: 450, errors: 0, skipped: 0, over_cap: 0, warnings: 0 } }));
      await user.click(screen.getByRole("button", { name: /Preview 450 rows/ }));
      await user.click(await screen.findByRole("button", { name: "Continue with 450 ready" }));
      await user.click(screen.getByRole("radio", { name: /Email everyone an invite now/ }));
      expect(screen.getByText(/all 450 are sent within 3 days/)).toBeInTheDocument();

      let finish!: (v: unknown) => void;
      vi.spyOn(memberImportsApi, "confirm").mockReturnValue(new Promise((r) => (finish = r)) as never);
      await user.click(screen.getByRole("button", { name: "Import 450 members" }));
      expect(await screen.findByRole("heading", { name: "Importing…" })).toBeInTheDocument();
      expect(screen.getByRole("progressbar", { name: "Import progress" })).toBeInTheDocument();
      finish({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "now",
          processed: 450,
          total: 450,
          result: { imported: 450 },
          invites: { held: 0, queued: 450, sent: 0, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      expect(await screen.findByText(/450 on their way/)).toBeInTheDocument();
    });

    it("keeps the gym on the invites step with a retry message when confirm fails", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await toInvites(user);
      vi.spyOn(memberImportsApi, "confirm").mockResolvedValue({ success: false, message: "This import is already running." });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("This import is already running.");
      expect(screen.getByRole("heading", { name: "Tell your members?" })).toBeInTheDocument();
    });

    it("says another import is running (409) as a wait, not as a failure, and lets the gym retry", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await toInvites(user);
      const confirm = vi.spyOn(memberImportsApi, "confirm").mockResolvedValueOnce({
        success: false,
        status: 409,
        message: "Another member import for this gym is running. Try again when it finishes.",
      });
      vi.spyOn(memberImportsApi, "status").mockResolvedValue({ success: false });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      const notice = await screen.findByRole("alert");
      expect(notice).toHaveTextContent("Another member import for this gym is running. Try again when it finishes.");
      expect(notice).not.toHaveTextContent(/stopped part-way/);
      expect(notice.getAttribute("style")).toContain("var(--warn-soft)");
      expect(screen.getByRole("heading", { name: "Tell your members?" })).toBeInTheDocument();

      // The retry runs it.
      confirm.mockResolvedValueOnce({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "later",
          processed: 3,
          total: 3,
          result: { imported: 2 },
          invites: { held: 2, queued: 0, sent: 0, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      expect(await screen.findByRole("heading", { name: "Import finished" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("reads who didn't fit from the import's result, not the preview's estimate", async () => {
      const user = userEvent.setup();
      renderDrawer();
      // The preview said everyone fits (over_by 0)...
      await toInvites(user);
      vi.spyOn(memberImportsApi, "confirm").mockResolvedValue({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "later",
          processed: 3,
          total: 3,
          // ...but seats were taken while it ran.
          result: { imported: 1, over_cap: 1, errors: 1 },
          invites: { held: 1, queued: 0, sent: 0, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      vi.spyOn(memberImportsApi, "status").mockResolvedValue({ success: false });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      await screen.findByRole("heading", { name: "Import finished" });
      expect(screen.getByText("Imported").nextSibling).toHaveTextContent("1");
      expect(screen.getByText("Not imported: no seat left").nextSibling).toHaveTextContent("1");
      const note = screen.getByRole("status");
      expect(note).toHaveTextContent("1 member didn't fit your seat limit and wasn't imported.");
      expect(note).toHaveTextContent("Seats were taken while the import ran");
      expect(within(note).getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/billing");
    });

    it("shows no seat note when everyone fit", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await toInvites(user);
      vi.spyOn(memberImportsApi, "confirm").mockResolvedValue({
        success: true,
        data: {
          import_id: "imp-1",
          status: "done",
          invite_mode: "now",
          processed: 2,
          total: 2,
          result: { imported: 2 },
          invites: { held: 0, queued: 0, sent: 2, unconfirmed: 0 },
          invites_per_day: 200,
        },
      });
      vi.spyOn(memberImportsApi, "status").mockResolvedValue({ success: false });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      await screen.findByRole("heading", { name: "Import finished" });
      expect(screen.queryByText("Not imported: no seat left")).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.queryByText(/may not have arrived/)).toBeNull();
      expect(screen.getByText("2 invites sent.")).toBeInTheDocument();
    });

    it("says honestly how many invites may not have arrived, and sends them once more on request", async () => {
      const user = userEvent.setup();
      renderDrawer();
      await toInvites(user);
      const done = (invites: { held: number; queued: number; sent: number; unconfirmed: number }) => ({
        success: true as const,
        data: {
          import_id: "imp-1",
          status: "done" as const,
          invite_mode: "now" as const,
          processed: 2,
          total: 2,
          result: { imported: 2 },
          invites,
          invites_per_day: 200,
        },
      });
      vi.spyOn(memberImportsApi, "confirm").mockResolvedValue(done({ held: 0, queued: 0, sent: 0, unconfirmed: 2 }));
      vi.spyOn(memberImportsApi, "status").mockResolvedValue({ success: false });
      await user.click(screen.getByRole("button", { name: "Import 2 members" }));
      await screen.findByRole("heading", { name: "Import finished" });
      expect(screen.getByText(/2 invites may not have arrived/)).toBeInTheDocument();

      const resend = vi
        .spyOn(memberImportsApi, "resendUnconfirmed")
        .mockResolvedValue(done({ held: 0, queued: 2, sent: 0, unconfirmed: 0 }));
      await user.click(screen.getByRole("button", { name: "Send 2 again" }));
      expect(resend).toHaveBeenCalledWith("org-1", "imp-1");
      expect(await screen.findByText(/2 on their way/)).toBeInTheDocument();
      expect(screen.queryByText(/may not have arrived/)).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/may get the email twice/));
    });
  });

  it("asks before throwing away a mapped import, but closes at once before a file is chosen", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await uploadToColumns(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(await screen.findByText("Discard changes?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("PendingOffers with imported members", () => {
  const offer = (over: Partial<OrgEnrollmentOffer>): OrgEnrollmentOffer => ({
    _id: "o",
    email: "x@x.test",
    plan_id: { _id: "p", name: "Gold", price_minor: 100, currency: "NGN" },
    payment_mode: "manual",
    status: "pending",
    expires_at: "2026-12-31T22:59:59.999Z",
    created_at: "2026-10-14T00:00:00.000Z",
    ...over,
  });

  it("lists imported members apart, says whether they were invited, and folds a long list", async () => {
    const user = userEvent.setup();
    h.offers = [
      offer({ _id: "manual", email: "walk-in@x.test" }),
      ...Array.from({ length: 12 }, (_, i) =>
        offer({
          _id: `imp-${i}`,
          email: `m${i}@x.test`,
          source: "import",
          term_end: "2026-12-31T22:59:59.999Z",
          invite_status: i === 0 ? "held" : "sent",
          invite_sent_at: "2026-10-14T09:00:00.000Z",
        }),
      ),
    ];
    render(<PendingOffers orgId="org-1" />);
    expect(within(screen.getByRole("list", { name: "Membership offers" })).getAllByRole("listitem")).toHaveLength(1);
    const imported = screen.getByRole("list", { name: "Imported members waiting to claim" });
    expect(within(imported).getAllByRole("listitem")).toHaveLength(10);
    expect(within(imported).getByText(/not invited yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Imported, not claimed yet · 12/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all 12" }));
    expect(within(imported).getAllByRole("listitem")).toHaveLength(12);
  });
});
