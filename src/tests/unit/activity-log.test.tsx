import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ActivityLogPanel,
  ACTIVITY_PAGE_SIZE,
  WorkspaceActivityLog,
  canSeeActivityLog,
} from "@/components/activity/ActivityLogPanel";
import {
  OrgAuditCategory,
  OrgAuditPersonKind,
  orgAuditService,
  type OrgAuditEntry,
  type OrgAuditPage,
} from "@/lib/api/orgAudit";
import { describeActivity, relativeTime } from "@/lib/activity/describeActivity";

const orgState = vi.hoisted(() => ({
  currentOrg: null as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
}));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({
    id,
    value,
    onChange,
    options,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
  }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const ada = { kind: OrgAuditPersonKind.OWNER, name: "Ada Obi", user_id: "u-ada" };
const kemi = { kind: OrgAuditPersonKind.MEMBER, name: "Kemi Ola", user_id: "u-kemi" };
const former = { kind: OrgAuditPersonKind.FORMER_MEMBER, name: "Former team member" };
const admin = { kind: OrgAuditPersonKind.PLATFORM_ADMIN, name: "A Binectics admin" };
const system = { kind: OrgAuditPersonKind.SYSTEM, name: "Binectics" };

function entry(over: Partial<OrgAuditEntry> & Pick<OrgAuditEntry, "event">): OrgAuditEntry {
  return {
    id: Math.random().toString(36).slice(2),
    label: "Something happened",
    category: OrgAuditCategory.TEAM,
    occurred_at: "2026-10-09T10:00:00.000Z",
    actor: ada,
    subject: null,
    details: {},
    ...over,
  };
}

describe("describeActivity", () => {
  it("says who changed whose role, in plain language", () => {
    expect(
      describeActivity(
        entry({
          event: "TEAM_MEMBER_UPDATED",
          subject: kemi,
          details: { from_role_name: "Trainer", to_role_name: "Manager" },
        }),
      ),
    ).toBe("Ada Obi changed Kemi Ola's role from Trainer to Manager.");
  });

  it("covers status changes, alone and with a role change", () => {
    expect(
      describeActivity(
        entry({
          event: "TEAM_MEMBER_UPDATED",
          subject: kemi,
          details: { role_name: "Manager", from_status: "active", to_status: "inactive" },
        }),
      ),
    ).toBe("Ada Obi deactivated Kemi Ola.");
    expect(
      describeActivity(
        entry({
          event: "TEAM_MEMBER_UPDATED",
          subject: kemi,
          details: {
            from_role_name: "Manager",
            to_role_name: "Admin",
            from_status: "inactive",
            to_status: "active",
          },
        }),
      ),
    ).toBe("Ada Obi changed Kemi Ola's role from Manager to Admin and reactivated them.");
  });

  it("never names people the API did not name", () => {
    expect(
      describeActivity(
        entry({ event: "TEAM_MEMBER_REMOVED", subject: former, details: { role_name: "Admin" } }),
      ),
    ).toBe("Ada Obi removed a former team member from the team (Admin).");
    expect(
      describeActivity(
        entry({
          event: "PROVIDER_CURRENCY_VERIFIED",
          actor: admin,
          details: { gateway: "paystack", currency: "USD" },
        }),
      ),
    ).toBe("A Binectics admin added USD to the Paystack account's currencies.");
    expect(
      describeActivity(
        entry({
          event: "PROVIDER_CURRENCIES_RECHECKED",
          actor: system,
          details: { gateway: "paystack", currencies_removed: [], currencies_missing: ["GHS"] },
        }),
      ),
    ).toBe("Binectics re-checked the Paystack account's currencies: GHS no longer enabled on the account.");
  });

  it("describes role permission edits by what the role can now do", () => {
    expect(
      describeActivity(
        entry({
          event: "TEAM_ROLE_UPDATED",
          actor: former,
          details: {
            role_name: "Front desk",
            permissions_added: ["progress:edit", "team:invite_member"],
            permissions_removed: ["progress:view"],
          },
        }),
      ),
    ).toBe(
      "Former team member changed the Front desk role: it can now edit client progress and invite members; it can no longer view client progress.",
    );
  });

  it("describes payment, payout, invitation and loyalty changes", () => {
    const d = (e: Partial<OrgAuditEntry> & Pick<OrgAuditEntry, "event">) => describeActivity(entry(e));
    expect(d({ event: "ORG_PAYMENT_CONFIG_UPSERTED", details: { gateway: "paystack", created: true } })).toBe(
      "Ada Obi connected a Paystack payment account.",
    );
    expect(
      d({
        event: "ORG_PAYMENT_CONFIG_UPSERTED",
        details: { gateway: "paystack", created: false, public_key_changed: true, is_active: true },
      }),
    ).toBe("Ada Obi updated the Paystack payment account and changed its keys.");
    expect(d({ event: "ORG_PAYMENT_CONFIG_REMOVED", details: { gateway: "paystack" } })).toBe(
      "Ada Obi removed the Paystack payment account.",
    );
    expect(
      d({ event: "ORG_PAYOUT_SETTINGS_UPDATED", details: { fields: ["payout_schedule", "preferred_payout_gateway"] } }),
    ).toBe("Ada Obi changed the payout schedule and the preferred payout gateway.");
    expect(d({ event: "TEAM_INVITATION_CREATED", details: { role_name: "Manager" } })).toBe(
      "Ada Obi invited someone to join as Manager.",
    );
    expect(d({ event: "TEAM_INVITATION_ACCEPTED", actor: kemi, details: { role_name: "Manager" } })).toBe(
      "Kemi Ola accepted an invitation and joined as Manager.",
    );
    expect(d({ event: "TEAM_ROLE_DELETED", details: { role_name: null, permissions: [] } })).toBe(
      "Ada Obi deleted a custom role.",
    );
    expect(d({ event: "ORG_LOYALTY_SETTINGS_UPDATED", details: { enabled: false } })).toBe(
      "Ada Obi switched the loyalty programme off.",
    );
    expect(d({ event: "TEAM_STAFF_TRAINER_ACCOUNT_PROMOTED", actor: system, subject: kemi })).toBe(
      "Kemi Ola's account was set up as a trainer account.",
    );
  });

  it("falls back to the label for an event it does not know", () => {
    expect(describeActivity(entry({ event: "SOMETHING_NEW", label: "Something new" }))).toBe(
      "Ada Obi: Something new.",
    );
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-10-09T12:00:00.000Z");
  it("reads naturally", () => {
    expect(relativeTime("2026-10-09T11:59:40.000Z", now)).toBe("just now");
    expect(relativeTime("2026-10-09T11:55:00.000Z", now)).toBe("5 minutes ago");
    expect(relativeTime("2026-10-09T09:00:00.000Z", now)).toBe("3 hours ago");
    expect(relativeTime("2026-10-08T12:00:00.000Z", now)).toBe("yesterday");
    expect(relativeTime("2026-09-18T12:00:00.000Z", now)).toBe("3 weeks ago");
  });
});

describe("canSeeActivityLog", () => {
  it("shows the gym log to its owner and VIEW_AUDIT_LOG holders, and trainer/dietitian logs to owners only", () => {
    expect(canSeeActivityLog(null)).toBe(false);
    expect(canSeeActivityLog({ is_owner: true })).toBe(true);
    expect(canSeeActivityLog({ is_owner: false, can_view_audit_log: true })).toBe(true);
    expect(canSeeActivityLog({ is_owner: false, can_view_audit_log: false })).toBe(false);
    expect(canSeeActivityLog({ is_owner: false, can_view_audit_log: true }, true)).toBe(false);
    expect(canSeeActivityLog({ is_owner: true, can_view_audit_log: true }, true)).toBe(true);
  });
});

function page(items: OrgAuditEntry[], over: Partial<OrgAuditPage> = {}): OrgAuditPage {
  return { items, total: items.length, page: 1, limit: ACTIVITY_PAGE_SIZE, ...over };
}

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("ActivityLogPanel", () => {
  let list: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(orgAuditService, "filters").mockResolvedValue({
      success: true,
      data: {
        event_types: [
          { event: "TEAM_MEMBER_UPDATED", label: "Team member changed", category: OrgAuditCategory.TEAM },
          { event: "ORG_PAYMENT_CONFIG_UPSERTED", label: "Payment account updated", category: OrgAuditCategory.PAYMENTS },
        ],
        actors: [{ user_id: "u-ada", name: "Ada Obi" }],
      },
    } as never);
    list = vi.spyOn(orgAuditService, "list").mockResolvedValue({
      success: true,
      data: page(
        [
          entry({
            event: "TEAM_MEMBER_UPDATED",
            label: "Team member changed",
            subject: kemi,
            occurred_at: new Date(Date.now() - 5 * 60_000).toISOString(),
            details: { from_role_name: "Trainer", to_role_name: "Manager" },
          }),
        ],
        { total: 60 },
      ),
    } as never);
  });

  it("shows plain-language rows with relative and absolute times", async () => {
    renderWithQuery(<ActivityLogPanel organizationId="org-1" />);
    expect(await screen.findByText("Ada Obi changed Kemi Ola's role from Trainer to Manager.")).toBeInTheDocument();
    const table = screen.getByRole("table");
    const time = within(table).getByText("5 minutes ago");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime");
    expect(time.getAttribute("title")).toBeTruthy();
    expect(within(table).getByText(time.getAttribute("title")!)).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith("org-1", expect.objectContaining({ page: 1, limit: ACTIVITY_PAGE_SIZE }));
  });

  it("pages through results", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ActivityLogPanel organizationId="org-1" />);
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith("org-1", expect.objectContaining({ page: 2 })),
    );
  });

  it("filters by type, person and period, starting again from page 1", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ActivityLogPanel organizationId="org-1" />);
    await screen.findByRole("table");
    await screen.findByRole("option", { name: "Payment account updated" });

    await user.selectOptions(screen.getByLabelText("Type"), "ORG_PAYMENT_CONFIG_UPSERTED");
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        "org-1",
        expect.objectContaining({ event: "ORG_PAYMENT_CONFIG_UPSERTED", page: 1 }),
      ),
    );

    await user.selectOptions(screen.getByLabelText("Changed by"), "u-ada");
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith("org-1", expect.objectContaining({ actor_id: "u-ada" })),
    );

    const week = screen.getByRole("button", { name: "Last 7 days" });
    expect(week).toHaveAttribute("aria-pressed", "false");
    await user.click(week);
    expect(week).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      const from = (list.mock.lastCall?.[1] as { from?: string }).from;
      expect(from).toBeTruthy();
      const days = (Date.now() - Date.parse(from!)) / 86_400_000;
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
    });
  });

  it("says when nothing matches", async () => {
    list.mockResolvedValue({ success: true, data: page([]) } as never);
    renderWithQuery(<ActivityLogPanel organizationId="org-1" />);
    expect(await screen.findByText("No activity yet.")).toBeInTheDocument();
  });

  it("shows an error with a retry when the API refuses", async () => {
    list.mockResolvedValue({ success: false, message: "You don't have permission." } as never);
    renderWithQuery(<ActivityLogPanel organizationId="org-1" />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("You don't have permission.");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("WorkspaceActivityLog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(orgAuditService, "filters").mockResolvedValue({ success: true, data: { event_types: [], actors: [] } } as never);
    vi.spyOn(orgAuditService, "list").mockResolvedValue({ success: true, data: page([]) } as never);
  });

  it("loads the log for someone allowed to see it", async () => {
    orgState.currentOrg = { _id: "gym-1", is_owner: false, can_view_audit_log: true };
    renderWithQuery(<WorkspaceActivityLog settingsHref="/dashboard/gym-owner/settings" />);
    expect(await screen.findByText("No activity yet.")).toBeInTheDocument();
    expect(orgAuditService.list).toHaveBeenCalledWith("gym-1", expect.anything());
  });

  it("never asks the API for people who may not see it", async () => {
    orgState.currentOrg = { _id: "gym-1", is_owner: false, can_view_audit_log: false };
    renderWithQuery(<WorkspaceActivityLog settingsHref="/dashboard/gym-owner/settings" />);
    expect(screen.getByText(/Only the workspace owner/)).toBeInTheDocument();
    expect(orgAuditService.list).not.toHaveBeenCalled();
  });

  it("keeps trainer and dietitian logs to the workspace owner", () => {
    orgState.currentOrg = { _id: "gym-1", is_owner: false, can_view_audit_log: true };
    renderWithQuery(<WorkspaceActivityLog settingsHref="/dashboard/trainer/settings" ownerOnly />);
    expect(screen.getByText(/Only the workspace owner/)).toBeInTheDocument();
    expect(orgAuditService.list).not.toHaveBeenCalled();
  });
});
