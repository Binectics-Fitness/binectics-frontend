import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SettingsClient } from "@/app/dashboard/gym-owner/settings/SettingsClient";

/**
 * Settings → Membership rules → "Member pauses per year" (owner ruling,
 * Oct 20 2026): blank is no limit, a whole number 0–52 is the limit. Saved
 * through PATCH /teams/organizations/:id as membership_rules, so only those
 * who can manage the organization can change it.
 */

const h = vi.hoisted(() => ({
  org: {} as Record<string, unknown>,
  currentOrg: {} as Record<string, unknown>,
  mutateAsync: vi.fn(),
}));

vi.mock("@/components/ds/GymDashboardShell", async () => {
  const { useGymViewer } = await import("@/hooks/useGymViewer");
  return {
    useGymViewer,
    GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
      <div>
        <div data-testid="actions">{actions}</div>
        {children}
      </div>
    ),
  };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner1" } }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: h.currentOrg, refreshOrganizations: vi.fn() }),
}));
vi.mock("@/lib/queries/teams", () => ({
  useOrganizationDetails: () => ({ data: h.org, isLoading: false }),
  useUpdateOrganization: () => ({ mutateAsync: h.mutateAsync, isPending: false, isError: false }),
}));
vi.mock("@/lib/queries/utility", () => ({ useCountries: () => ({ data: [] }) }));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({ data: [], providerHint: null }),
}));
vi.mock("@/lib/api/utility", () => ({ utilityService: { resolveGeo: vi.fn(async () => ({ success: false })) } }));
vi.mock("@/components/SearchableSelect", () => ({ default: () => null }));
vi.mock("@/components/provider/GatewaysSection", () => ({ GatewaysSection: () => null }));
vi.mock("@/components/provider/SetupChecklist", () => ({ ShowSetupChecklist: () => null }));
vi.mock("@/app/dashboard/gym-owner/settings/NotificationsSection", () => ({ NotificationsSection: () => null }));
vi.mock("@/app/dashboard/gym-owner/settings/TeamAccessSections", () => ({ RolesSection: () => null }));
vi.mock("@/components/activity/ActivityLogPanel", () => ({
  ActivityLogSection: () => null,
  canSeeActivityLog: () => false,
}));

class NoopObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IntersectionObserver", NoopObserver);
  h.org = { _id: "o1", name: "Iron Temple", owner_id: "owner1", account_type: "gym_owner", currency: "NGN", country: "NG", is_active: true };
  h.currentOrg = { ...h.org, is_owner: true };
  h.mutateAsync.mockResolvedValue({ success: true });
});

const field = () => screen.getByLabelText("Member pauses per year") as HTMLInputElement;

describe("Settings: member pauses per year", () => {
  it("is blank (no limit) by default, and saves a limit as membership_rules", async () => {
    render(<SettingsClient />);
    expect(field().value).toBe("");
    await userEvent.type(field(), "3");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(h.mutateAsync).toHaveBeenCalledWith({
      orgId: "o1",
      data: { membership_rules: { max_member_pauses_per_year: 3 } },
    });
  });

  it("shows the saved limit, and clearing it saves no limit (null)", async () => {
    h.org = { ...h.org, membership_rules: { max_member_pauses_per_year: 2 } };
    render(<SettingsClient />);
    expect(field().value).toBe("2");
    await userEvent.clear(field());
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(h.mutateAsync).toHaveBeenCalledWith({
      orgId: "o1",
      data: { membership_rules: { max_member_pauses_per_year: null } },
    });
  });

  it("says why an out-of-range number isn't saved", async () => {
    render(<SettingsClient />);
    await userEvent.type(field(), "60");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a whole number from 0 to 52, or leave it blank for no limit.",
    );
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
  });

  it("is read-only for staff who can't manage the organization", () => {
    h.currentOrg = { ...h.org, owner_id: "someone-else", is_owner: false, my_permissions: ["team:view_members"] };
    render(<SettingsClient />);
    expect(field()).toBeDisabled();
    expect(screen.getByText("Only people who can manage the organization can change this.")).toBeInTheDocument();
  });
});
