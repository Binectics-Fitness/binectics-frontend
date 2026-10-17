import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcceptInvitationPage from "@/app/teams/invite/accept/page";

/**
 * The invite-accept page with the REAL useTeamInviteAccept: a live auth mock
 * whose refreshUser swaps the user object, and only the API call mocked.
 * Accepts and refreshes once per link, and a slower answer for an earlier
 * link never lands as the latest link's (its success would show before the
 * latest link had answered, which may well refuse).
 */
const gym = {
  _id: "gym",
  name: "Iron Temple",
  owner_id: "boss",
  account_type: "gym_owner",
  is_active: true,
  is_owner: false,
  my_role_code: "manager",
  my_permissions: ["team:view_members", "marketplace:manage_listing"],
};
let mockSearch = "token=abc";
const acceptInvitation = vi.fn();
const refreshOrganizations = vi.fn(async () => undefined);
const refreshCalls = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/teams/invite/accept",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
vi.mock("@/contexts/AuthContext", async () => {
  const { useState } = await import("react");
  return {
    useAuth: () => {
      const [user, setUser] = useState({ id: "u1", role: "USER" });
      return {
        user,
        isLoading: false,
        refreshUser: async () => {
          refreshCalls();
          const fresh = { ...user };
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
    organizations: [gym],
    currentOrg: null,
    isLoading: false,
    setCurrentOrg: vi.fn(),
    refreshOrganizations,
  });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/lib/api/teams", () => ({
  teamsService: { acceptInvitation: (...a: unknown[]) => acceptInvitation(...a) },
}));

beforeEach(() => {
  mockSearch = "token=abc";
  acceptInvitation.mockReset();
  refreshCalls.mockReset();
});

describe("the invite-accept page with the real hook", () => {
  it("accepts once and refreshes once while refreshUser swaps the user", async () => {
    acceptInvitation.mockResolvedValue({ success: true, data: { organization_id: "gym" } });
    const { rerender } = render(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
    rerender(<AcceptInvitationPage />);
    await new Promise((r) => setTimeout(r, 50));
    expect(acceptInvitation).toHaveBeenCalledTimes(1);
    expect(refreshCalls).toHaveBeenCalledTimes(1);
  });

  it("a second link: accepted once, refreshed once", async () => {
    acceptInvitation.mockResolvedValue({ success: true, data: { organization_id: "gym" } });
    const { rerender } = render(<AcceptInvitationPage />);
    await screen.findByRole("link", { name: "Open Iron Temple's dashboard" });
    mockSearch = "token=def";
    rerender(<AcceptInvitationPage />);
    await waitFor(() => expect(acceptInvitation).toHaveBeenCalledTimes(2));
    await screen.findByRole("link", { name: "Open Iron Temple's dashboard" });
    await new Promise((r) => setTimeout(r, 50));
    expect(acceptInvitation).toHaveBeenCalledTimes(2);
    expect(refreshCalls).toHaveBeenCalledTimes(2);
  });

  it("a first link's late success is not shown as the second's, which then refuses", async () => {
    let resolveA!: (v: unknown) => void;
    let resolveB!: (v: unknown) => void;
    acceptInvitation
      .mockImplementationOnce(() => new Promise((r) => (resolveA = r)))
      .mockImplementationOnce(() => new Promise((r) => (resolveB = r)));
    const { rerender } = render(<AcceptInvitationPage />);
    await waitFor(() => expect(acceptInvitation).toHaveBeenCalledTimes(1));
    mockSearch = "token=def";
    rerender(<AcceptInvitationPage />);
    await waitFor(() => expect(acceptInvitation).toHaveBeenCalledTimes(2));
    await act(async () => resolveA({ success: true, data: { organization_id: "gym" } }));
    await new Promise((r) => setTimeout(r, 50));
    // B has not answered: no success is claimed for it, and nothing refreshed.
    expect(screen.queryByRole("link", { name: "Open Iron Temple's dashboard" })).toBeNull();
    expect(refreshCalls).not.toHaveBeenCalled();
    await act(async () => resolveB({ success: false, message: "Invitation expired" }));
    expect(await screen.findByText("Invitation expired")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Iron Temple's dashboard" })).toBeNull();
    expect(refreshCalls).not.toHaveBeenCalled();
  });

  it("a first link's late refusal doesn't undo the second's success", async () => {
    let resolveA!: (v: unknown) => void;
    acceptInvitation
      .mockImplementationOnce(() => new Promise((r) => (resolveA = r)))
      .mockResolvedValueOnce({ success: true, data: { organization_id: "gym" } });
    const { rerender } = render(<AcceptInvitationPage />);
    await waitFor(() => expect(acceptInvitation).toHaveBeenCalledTimes(1));
    mockSearch = "token=def";
    rerender(<AcceptInvitationPage />);
    expect(await screen.findByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
    await act(async () => resolveA({ success: false, message: "Invitation expired" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Invitation expired")).toBeNull();
    expect(screen.getByRole("link", { name: "Open Iron Temple's dashboard" })).toBeInTheDocument();
  });
});
