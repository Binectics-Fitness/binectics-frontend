import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcceptInvitationPage from "@/app/teams/invite/accept/page";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

/**
 * F1: how a gym's staff get into the gym's dashboard. The invite-accept
 * button lands them there (it used to send them to /dashboard/team, which
 * bounced them home), and their member home links to it.
 */
const managerGym = {
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  account_type: "gym_owner",
  is_active: true,
  is_owner: false,
  my_role_code: "manager",
  my_permissions: ["team:view_members", "bookings:manage", "messaging:answer_members", "marketplace:manage_listing"],
};
const trainerGym = { ...managerGym, my_role_code: "consultant", my_permissions: ["team:view_members"] };

let mockUser: { id: string; role: string; first_name?: string } = { id: "u1", role: "USER" };
let freshUser: { id: string; role: string } = { id: "u1", role: "USER" };
let mockOrgs: Record<string, unknown>[] = [];
let mockSignedIn = true;
let mockSearch = "token=abc";
let mockAccept: { status: string; error: string | null; token?: string | null } = { status: "success", error: null, token: "abc" };
const acceptInvite = vi.fn();
const setCurrentOrg = vi.fn();
const refreshOrganizations = vi.fn(async () => undefined);

vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({ isEnabled: () => false, data: undefined, isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/teams/invite/accept",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
// Like the real AuthContext: refreshUser is a new function each render, and
// it replaces the user object.
vi.mock("@/contexts/AuthContext", async () => {
  const { useState } = await import("react");
  return {
    useAuth: () => {
      const [user, setUser] = useState(mockUser);
      return {
        user: mockSignedIn ? user : null,
        isLoading: false,
        refreshUser: async () => {
          const fresh = { ...user, ...freshUser };
          setUser(fresh);
          return fresh;
        },
        logout: vi.fn(),
      };
    },
  };
});
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({
    organizations: mockOrgs,
    currentOrg: null,
    isLoading: false,
    setCurrentOrg,
    refreshOrganizations,
  });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/hooks/useTeams", () => ({
  useTeamInviteAccept: () => ({ ...mockAccept, organizationId: "gym", acceptInvite }),
}));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));

beforeEach(() => {
  mockUser = { id: "u1", role: "USER", first_name: "Tobi" };
  freshUser = { id: "u1", role: "USER" };
  mockOrgs = [managerGym];
  mockSignedIn = true;
  mockSearch = "token=abc";
  mockAccept = { status: "success", error: null, token: "abc" };
  acceptInvite.mockReset();
  setCurrentOrg.mockReset();
});

describe("the invite-accept button", () => {
  it("takes a new manager into the gym's dashboard, on that gym", async () => {
    render(<AcceptInvitationPage />);
    const go = await screen.findByRole("link", { name: "Open Iron Temple's dashboard" });
    expect(go).toHaveAttribute("href", "/dashboard/gym-owner");
    expect(screen.queryByRole("link", { name: /Team Dashboard/ })).not.toBeInTheDocument();
    fireEvent.click(go);
    expect(setCurrentOrg).toHaveBeenCalledWith(managerGym);
    expect(refreshOrganizations).toHaveBeenCalled();
  });

  it("still takes a new trainer to the trainer dashboard", async () => {
    freshUser = { id: "u1", role: "TRAINER" };
    mockOrgs = [trainerGym];
    render(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Go to your trainer dashboard" })).toHaveAttribute(
      "href",
      "/dashboard/trainer",
    );
  });

  it("sends someone whose role gives them nothing in the gym to their own home", async () => {
    mockOrgs = [{ ...managerGym, my_permissions: [] }];
    render(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/dashboard/member");
  });
});

describe("the invite-accept page accepts once", () => {
  it("doesn't accept again when refreshing the user replaces it, and shows where to go", async () => {
    render(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
    expect(acceptInvite).toHaveBeenCalledTimes(1);
    expect(acceptInvite).toHaveBeenCalledWith("abc");
  });

  it("refreshes once per accepted link, and a first link's success never stands in for a second", async () => {
    refreshOrganizations.mockClear();
    const { rerender } = render(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
    expect(refreshOrganizations).toHaveBeenCalledTimes(1);

    // A second invitation link in the same page: the hook still reports the
    // first link's success while the second is being accepted.
    mockSearch = "token=def";
    rerender(<AcceptInvitationPage />);
    expect(acceptInvite).toHaveBeenLastCalledWith("def");
    expect(screen.queryByRole("link", { name: "Open Iron Temple's dashboard" })).not.toBeInTheDocument();
    expect(refreshOrganizations).toHaveBeenCalledTimes(1);

    // The second succeeds: refreshed for it, once.
    mockAccept = { status: "success", error: null, token: "def" };
    rerender(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
    expect(refreshOrganizations).toHaveBeenCalledTimes(2);
    rerender(<AcceptInvitationPage />);
    expect(refreshOrganizations).toHaveBeenCalledTimes(2);
    expect(acceptInvite).toHaveBeenCalledTimes(2);
  });
});

describe("the invite-accept page before it succeeds", () => {
  it("says the link is broken when there is no token, and accepts nothing", () => {
    mockSearch = "";
    mockAccept = { status: "idle", error: null };
    render(<AcceptInvitationPage />);
    expect(screen.getByText("No invitation token found. Please use the link from your email.")).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("asks someone signed out to sign in, and accepts nothing yet", () => {
    mockSignedIn = false;
    mockAccept = { status: "idle", error: null };
    render(<AcceptInvitationPage />);
    expect(screen.getByRole("heading", { name: "Sign in to accept" })).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("accepts the token once signed in, and shows the API's refusal", () => {
    mockAccept = { status: "error", error: "This invitation has expired." };
    render(<AcceptInvitationPage />);
    expect(acceptInvite).toHaveBeenCalledWith("abc");
    expect(screen.getByText("This invitation has expired.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /dashboard/ })).not.toBeInTheDocument();
  });
});

describe("the member home's way into the gym workspace", () => {
  const openAccountMenu = () => act(() => screen.getByRole("button", { name: "Account menu" }).click());

  it("links a gym's staff to the gym's workspace and makes it current", async () => {
    render(<MemberDashboardShell activeLabel="Home"><p>home</p></MemberDashboardShell>);
    openAccountMenu();
    const link = screen.getByRole("menuitem", { name: "Iron Temple workspace" });
    expect(link).toHaveAttribute("href", "/dashboard/gym-owner");
    fireEvent.click(link);
    await waitFor(() => expect(setCurrentOrg).toHaveBeenCalledWith(managerGym));
  });

  it("offers nothing extra to a plain member or a gym's trainer", () => {
    for (const orgs of [[], [trainerGym]]) {
      mockOrgs = orgs;
      const { unmount } = render(<MemberDashboardShell activeLabel="Home"><p>home</p></MemberDashboardShell>);
      openAccountMenu();
      expect(screen.queryByRole("menuitem", { name: /workspace/ })).not.toBeInTheDocument();
      unmount();
    }
  });
});
