import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberDashboardShell, resetHoldsCache } from "@/components/ds/MemberDashboardShell";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipSubscriptionStatus } from "@/lib/types";

/** Runtime flag member_shell_v2: off keeps the old bar exactly, on shows tab bar A. */
const state = vi.hoisted(() => ({ on: false, path: "/dashboard/member" }));

vi.mock("@/hooks/useIsSoloMember", () => ({ useIsSoloMember: () => ({ solo: false, isLoading: false }) }));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    isEnabled: () => false,
    data: { flags: { member_shell_v2: state.on }, organizations: [] },
    isLoading: false,
  }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({ organizations: [], currentOrg: null, setCurrentOrg: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => state.path,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/hooks/useCommandBar", () => ({ openCommandBar: vi.fn() }));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemberDashboardShell activeLabel="Home">x</MemberDashboardShell>
    </QueryClientProvider>,
  );
}

const barLabels = () =>
  within(screen.getAllByRole("navigation", { name: "Main navigation" })[0])
    .getAllByRole("link")
    .map((a) => a.textContent);

describe("member shell v2", () => {
  beforeEach(() => {
    state.on = false;
    state.path = "/dashboard/member";
    resetHoldsCache();
    vi.restoreAllMocks();
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockResolvedValue({ success: true, data: [] } as never);
  });

  it("flag off: the old bar, no centre action, no memberships read", () => {
    mount();
    expect(barLabels()).toContain("Marketplace");
    expect(barLabels()).toContain("Workouts");
    expect(screen.queryByTestId("member-centre-action")).toBeNull();
    expect(marketplaceService.getMyMembershipSubscriptions).not.toHaveBeenCalled();
  });

  it("flag on: Today, Train, Progress, Messages, Me and a Log action; Explore is off the bar", async () => {
    state.on = true;
    mount();
    expect(barLabels()).toEqual(["Today", "Train", "Progress", "Messages", "Me"]);
    expect((await screen.findAllByTestId("member-centre-action"))[0].textContent).toBe("Log");
  });

  it("flag on: the Train pages get their section links", () => {
    state.on = true;
    state.path = "/dashboard/bookings";
    mount();
    const train = screen.getByRole("navigation", { name: "Train" });
    expect(within(train).getAllByRole("link").map((a) => a.textContent)).toEqual(["Plan", "Starter", "Meal plans", "Sessions"]);
    expect(within(train).getByRole("link", { name: "Sessions" }).getAttribute("aria-current")).toBe("page");
  });

  it("flag on: a gym member sees Check in", async () => {
    state.on = true;
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockResolvedValue({
      success: true,
      data: [{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g", name: "Gym", account_type: "gym_owner" } }],
    } as never);
    mount();
    expect((await screen.findAllByText("Check in"))[0]).toBeTruthy();
  });
});
