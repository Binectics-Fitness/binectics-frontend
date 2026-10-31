import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberDashboardShell, resetHoldsCache } from "@/components/ds/MemberDashboardShell";
import { paidContentService } from "@/lib/api/paidContent";

/**
 * The member nav's "Purchases" link follows the paid_content flag for the
 * current workspace (global with none), and also shows once the member holds
 * any program or meal plan, so turning the flag off never hides what they own.
 */
const state = vi.hoisted(() => ({ flag: false, orgId: null as string | null, seenOrg: undefined as unknown, loading: false }));

vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    isEnabled: (_key: string, orgId?: string | null) => {
      state.seenOrg = orgId;
      return state.flag;
    },
    data: undefined,
    isLoading: state.loading,
  }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({
    organizations: [],
    currentOrg: state.orgId ? { _id: state.orgId } : null,
    setCurrentOrg: vi.fn(),
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/hooks/useCommandBar", () => ({ openCommandBar: vi.fn() }));

const purchasesLinks = () => screen.queryAllByRole("link", { name: "Purchases" });

describe("member nav: Purchases link", () => {
  beforeEach(() => {
    state.flag = false;
    state.orgId = null;
    state.seenOrg = undefined;
    state.loading = false;
    resetHoldsCache();
    vi.restoreAllMocks();
  });

  it("shows while the flag is on, and does not ask for entitlements", () => {
    state.flag = true;
    const read = vi.spyOn(paidContentService, "myEntitlements");
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    expect(purchasesLinks().length).toBeGreaterThan(0);
    expect(read).not.toHaveBeenCalled();
  });

  it("is hidden when the flag is off and the member has nothing", async () => {
    const read = vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({ success: true, data: { items: [], nextCursor: null } });
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    await waitFor(() => expect(read).toHaveBeenCalledWith(1));
    expect(purchasesLinks()).toHaveLength(0);
  });

  it("stays visible with the flag off once the member holds something", async () => {
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({
      success: true,
      data: { items: [{ id: "e1" }] as never, nextCursor: null },
    });
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    await waitFor(() => expect(purchasesLinks().length).toBeGreaterThan(0));
  });

  it("stays hidden when the entitlement read fails", async () => {
    const read = vi.spyOn(paidContentService, "myEntitlements").mockRejectedValue(new Error("offline"));
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(purchasesLinks()).toHaveLength(0);
  });

  it("asks the flag about the current workspace", () => {
    state.orgId = "org-9";
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({ success: true, data: { items: [], nextCursor: null } });
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    expect(state.seenOrg).toBe("org-9");
  });

  it("does not ask while the flags are still loading", () => {
    state.loading = true;
    const read = vi.spyOn(paidContentService, "myEntitlements");
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    expect(read).not.toHaveBeenCalled();
  });

  it("asks once, then answers the next mount from the cache", async () => {
    const read = vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({ success: true, data: { items: [], nextCursor: null } });
    const first = render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    first.unmount();
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("remembers that the member holds content", async () => {
    const read = vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue({
      success: true,
      data: { items: [{ id: "e1" }] as never, nextCursor: null },
    });
    const first = render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    await waitFor(() => expect(purchasesLinks().length).toBeGreaterThan(0));
    first.unmount();
    render(<MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>);
    expect(purchasesLinks().length).toBeGreaterThan(0);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
