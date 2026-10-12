import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import FeatureFlagsClient from "@/app/admin/feature-flags/FeatureFlagsClient";
import FeatureFlagDetailClient from "@/app/admin/feature-flags/[key]/FeatureFlagDetailClient";
import {
  featureFlagsService,
  type AdminFeatureFlag,
  type AdminFeatureFlagChange,
  type AdminFeatureFlagDetail,
  type EffectiveFeatureFlags,
} from "@/lib/api/featureFlags";
import {
  confirmationSatisfied,
  describeChange,
  describeOverrides,
  effectiveFlag,
  matchesFilter,
  relativeTime,
} from "@/lib/featureFlags/helpers";
import { useFeatureFlag, useFeatureFlags } from "@/hooks/useFeatureFlags";

const params = vi.hoisted(() => ({ key: "member_recurring_billing" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/feature-flags",
  useParams: () => params,
}));
const auth = vi.hoisted(() => ({
  user: { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" } as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ORG_A = "6ac000000000000000000001";
const ORG_B = "6ac000000000000000000002";

function flag(over: Partial<AdminFeatureFlag> = {}): AdminFeatureFlag {
  return {
    key: "member_recurring_billing",
    description: "Recurring card billing for gym members.",
    risky: true,
    default: false,
    enabled: false,
    is_default: true,
    overrides_on: 0,
    overrides_off: 0,
    updated_at: null,
    updated_by: null,
    ...over,
  };
}

const quiet = flag({ key: "quiet_hours", risky: false, enabled: true, is_default: false, overrides_off: 1, updated_at: new Date().toISOString(), updated_by: { id: "a1", name: "Ada Admin" } });

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.restoreAllMocks();
  auth.user = { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" };
});

// ─── helpers ────────────────────────────────────────────────────────────────

describe("feature flag helpers", () => {
  const me: EffectiveFeatureFlags = {
    flags: { a: false, b: true },
    organizations: [{ organization_id: ORG_A, flags: { a: true, b: false } }],
  };

  it("effectiveFlag: the org's value for the caller's org, else the global, else off", () => {
    expect(effectiveFlag(me, "a")).toBe(false);
    expect(effectiveFlag(me, "a", ORG_A)).toBe(true);
    expect(effectiveFlag(me, "b", ORG_A)).toBe(false);
    // Not one of the caller's orgs: global value.
    expect(effectiveFlag(me, "a", ORG_B)).toBe(false);
    expect(effectiveFlag(me, "b", ORG_B)).toBe(true);
    expect(effectiveFlag(me, "unknown")).toBe(false);
    expect(effectiveFlag(me, "constructor")).toBe(false);
    expect(effectiveFlag(undefined, "b")).toBe(false);
  });

  it("filters by on, off and overrides", () => {
    expect(matchesFilter(quiet, "on")).toBe(true);
    expect(matchesFilter(quiet, "off")).toBe(false);
    expect(matchesFilter(quiet, "overrides")).toBe(true);
    expect(matchesFilter(flag(), "overrides")).toBe(false);
    expect(matchesFilter(flag(), "all")).toBe(true);
  });

  it("a risky flag needs its key typed exactly", () => {
    expect(confirmationSatisfied(false, "k", "")).toBe(true);
    expect(confirmationSatisfied(true, "k_1", "")).toBe(false);
    expect(confirmationSatisfied(true, "k_1", "k_")).toBe(false);
    expect(confirmationSatisfied(true, "k_1", " k_1 ")).toBe(true);
  });

  it("describes overrides and changes in words", () => {
    expect(describeOverrides({ overrides_on: 0, overrides_off: 0 })).toBeNull();
    expect(describeOverrides({ overrides_on: 1, overrides_off: 0 })).toBe("1 organisation overridden (1 on)");
    expect(describeOverrides({ overrides_on: 2, overrides_off: 1 })).toBe("3 organisations overridden (2 on, 1 off)");
    const base = { id: "1", key: "k", reason: null, actor: null, created_at: null };
    const org = { id: ORG_A, name: "Iron Lab", account_type: "gym" };
    expect(describeChange({ ...base, action: "global_set", organization: null, previous: false, value: true })).toBe(
      "Turned on everywhere (was off)",
    );
    expect(describeChange({ ...base, action: "override_set", organization: org, previous: null, value: false })).toBe(
      "Set off for Iron Lab",
    );
    expect(describeChange({ ...base, action: "override_set", organization: org, previous: false, value: true })).toBe(
      "Set on for Iron Lab (override was off)",
    );
    expect(
      describeChange({ ...base, action: "override_removed", organization: { ...org, name: null }, previous: true, value: null }),
    ).toBe("Removed the override for Deleted organisation (000001); it follows the global value again");
  });

  it("relative times", () => {
    const now = Date.parse("2026-10-10T12:00:00Z");
    expect(relativeTime("2026-10-10T11:59:30Z", now)).toBe("just now");
    expect(relativeTime("2026-10-10T11:55:00Z", now)).toBe("5 minutes ago");
    expect(relativeTime("2026-10-09T12:00:00Z", now)).toBe("yesterday");
    expect(relativeTime(null, now)).toBe("");
  });
});

// ─── hook ───────────────────────────────────────────────────────────────────

describe("useFeatureFlags", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );

  it("reads the caller's effective flags, org value first", async () => {
    vi.spyOn(featureFlagsService, "me").mockResolvedValue({
      success: true,
      data: { flags: { x: false }, organizations: [{ organization_id: ORG_A, flags: { x: true } }] },
    });
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled("x", ORG_A)).toBe(false); // off while loading
    await waitFor(() => expect(result.current.isEnabled("x", ORG_A)).toBe(true));
    expect(result.current.isEnabled("x")).toBe(false);
    const single = renderHook(() => useFeatureFlag("x", ORG_A), { wrapper });
    await waitFor(() => expect(single.result.current).toBe(true));
  });

  it("signed out: never calls the API, everything off", () => {
    auth.user = null;
    const me = vi.spyOn(featureFlagsService, "me");
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled("x")).toBe(false);
    expect(me).not.toHaveBeenCalled();
  });

  it("an API error reads as off", async () => {
    vi.spyOn(featureFlagsService, "me").mockResolvedValue({ success: false, message: "boom" });
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEnabled("x")).toBe(false);
  });
});

// ─── list page ──────────────────────────────────────────────────────────────

describe("admin feature flags list", () => {
  it("lists flags with their state, risk and overrides, and filters", async () => {
    vi.spyOn(featureFlagsService, "adminList").mockResolvedValue({ success: true, data: [flag(), quiet] });
    wrap(<FeatureFlagsClient />);
    const list = await screen.findByRole("list", { name: "Feature flags" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("member_recurring_billing")).toBeInTheDocument();
    expect(within(items[0]).getByText("Risky")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Never changed: the default \(off\) applies/)).toBeInTheDocument();
    expect(within(items[1]).getByText(/by Ada Admin/)).toBeInTheDocument();
    expect(within(items[1]).getByText(/1 organisation overridden \(1 off\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Off/ }));
    expect(within(screen.getByRole("list", { name: "Feature flags" })).getAllByRole("listitem")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: /With overrides/ }));
    expect(screen.getByText("quiet_hours")).toBeInTheDocument();
  });

  it("a risky global toggle is sent only after the key is typed", async () => {
    vi.spyOn(featureFlagsService, "adminList").mockResolvedValue({ success: true, data: [flag()] });
    const set = vi
      .spyOn(featureFlagsService, "setGlobal")
      .mockResolvedValue({ success: true, data: { changed: true, flag: flag({ enabled: true, is_default: false }) } });
    wrap(<FeatureFlagsClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Turn member_recurring_billing on everywhere" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Turn on everywhere" });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Reason/), "pilot done");
    await userEvent.type(within(dialog).getByLabelText("Type member_recurring_billing to confirm"), "member_recurring");
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText("Type member_recurring_billing to confirm"), "_billing");
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(set).toHaveBeenCalledWith("member_recurring_billing", true, "pilot done"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("a plain flag only needs the confirm click; a 403 explains the permission", async () => {
    vi.spyOn(featureFlagsService, "adminList").mockResolvedValue({ success: true, data: [quiet] });
    const set = vi.spyOn(featureFlagsService, "setGlobal").mockResolvedValue({ success: false, status: 403, message: "Missing" });
    wrap(<FeatureFlagsClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Turn quiet_hours off everywhere" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText(/Type quiet_hours/)).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("Every organisation without its own setting loses this feature within 15 seconds.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Turn off everywhere" }));
    await waitFor(() => expect(set).toHaveBeenCalledWith("quiet_hours", false, ""));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("platform:write");
  });

  it("shows a load error with retry", async () => {
    const list = vi.spyOn(featureFlagsService, "adminList").mockResolvedValue({ success: false, message: "Nope" });
    wrap(<FeatureFlagsClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
    list.mockResolvedValue({ success: true, data: [quiet] });
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("quiet_hours")).toBeInTheDocument();
  });
});

// ─── detail page ────────────────────────────────────────────────────────────

describe("admin feature flag detail", () => {
  const detail: AdminFeatureFlagDetail = {
    ...flag({ risky: false, enabled: true, is_default: false, overrides_off: 1 }),
    overrides: [
      {
        organization: { id: ORG_A, name: "Iron Lab", account_type: "gym" },
        enabled: false,
        reason: "not ready",
        updated_at: new Date().toISOString(),
        updated_by: { id: "a1", name: "Ada Admin" },
      },
    ],
  };
  const history: AdminFeatureFlagChange[] = [
    {
      id: "h2",
      key: detail.key,
      action: "override_set",
      organization: { id: ORG_A, name: "Iron Lab", account_type: "gym" },
      previous: null,
      value: false,
      reason: "not ready",
      actor: { id: "a1", name: "Ada Admin" },
      created_at: "2026-10-10T09:00:00Z",
    },
    {
      id: "h1",
      key: detail.key,
      action: "global_set",
      organization: null,
      previous: false,
      value: true,
      reason: null,
      actor: { id: "a2", name: "Bo Ops" },
      created_at: "2026-10-09T09:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.spyOn(featureFlagsService, "adminGet").mockResolvedValue({ success: true, data: detail });
    vi.spyOn(featureFlagsService, "adminHistory").mockResolvedValue({ success: true, data: history });
    vi.spyOn(featureFlagsService, "adminList").mockResolvedValue({ success: true, data: [detail] });
  });

  it("shows the overrides and the audit trail", async () => {
    wrap(<FeatureFlagDetailClient />);
    expect(await screen.findByRole("heading", { level: 1, name: "member_recurring_billing" })).toBeInTheDocument();
    const overrides = screen.getAllByRole("table")[0];
    expect(within(overrides).getByText("Iron Lab")).toBeInTheDocument();
    expect(within(overrides).getAllByText("not ready").length).toBeGreaterThan(0);
    const trail = await screen.findByRole("table", { name: /Changes to member_recurring_billing/ });
    const rows = within(trail).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Set off for Iron Lab");
    expect(rows[1]).toHaveTextContent("Ada Admin");
    expect(rows[2]).toHaveTextContent("Turned on everywhere (was off)");
    expect(rows[2]).toHaveTextContent("Bo Ops");
    expect(rows[2]).toHaveTextContent("None given");
  });

  it("adds an override for an organisation found by search", async () => {
    const search = vi
      .spyOn(featureFlagsService, "searchOrganizations")
      .mockResolvedValue({ success: true, data: [{ id: ORG_B, name: "Coach Ada", account_type: "personal_trainer" }] });
    const set = vi.spyOn(featureFlagsService, "setOverride").mockResolvedValue({
      success: true,
      data: { changed: true, override: { ...detail.overrides[0], organization: { id: ORG_B, name: "Coach Ada", account_type: null } } },
    });
    wrap(<FeatureFlagDetailClient />);
    await userEvent.type(await screen.findByLabelText("Search organisations"), "coach");
    await userEvent.click(await screen.findByRole("button", { name: /Coach Ada/ }));
    expect(search).toHaveBeenCalledWith("coach");
    await userEvent.click(screen.getByRole("radio", { name: "Off" }));
    await userEvent.click(screen.getByRole("button", { name: "Add override…" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Set member_recurring_billing off for Coach Ada?");
    await userEvent.type(within(dialog).getByLabelText(/Reason/), "trial");
    await userEvent.click(within(dialog).getByRole("button", { name: "Set off" }));
    await waitFor(() => expect(set).toHaveBeenCalledWith("member_recurring_billing", ORG_B, false, "trial"));
  });

  it("removes an override after confirming what happens next", async () => {
    const remove = vi.spyOn(featureFlagsService, "removeOverride").mockResolvedValue({ success: true, data: { removed: true } });
    wrap(<FeatureFlagDetailClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Remove the override for Iron Lab" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Iron Lab follows the global value again, which is on, so it gets this feature.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove override" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("member_recurring_billing", ORG_A, ""));
  });

  it("an unknown key says so", async () => {
    vi.spyOn(featureFlagsService, "adminGet").mockResolvedValue({ success: false, status: 404, message: "Unknown" });
    wrap(<FeatureFlagDetailClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent("There is no flag with this key.");
  });
});
