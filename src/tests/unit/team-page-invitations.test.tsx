import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamWorkspacePage from "@/app/dashboard/team/page";
import { teamsService } from "@/lib/api/teams";

/**
 * The Team page reads a gym's pending invitations only for a viewer who
 * may read them (team:view_invitations, or the owner). The API refuses the
 * read otherwise; the page used to make it anyway and only hide the list.
 */

vi.mock("@/components/ds/GymDashboardShell", async () => {
  const { useGymViewer } = await import("@/hooks/useGymViewer");
  return {
    GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useGymViewer,
  };
});
vi.mock("@/components/ds/OrganizationContextBanner", () => ({ OrganizationContextBanner: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/team",
  useSearchParams: () => new URLSearchParams(),
}));
const auth = { user: { id: "owner1" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
const OWNED = { _id: "o1", name: "Iron Temple", owner_id: "owner1" };
const orgState: { currentOrg: Record<string, unknown> } = { currentOrg: OWNED };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({
    organizations: [orgState.currentOrg],
    currentOrg: orgState.currentOrg,
    setCurrentOrg: vi.fn(),
    isLoading: false,
  }),
  useOptionalOrganization: () => orgState,
}));

const getInvitations = vi.spyOn(teamsService, "getInvitations");
const pending = {
  _id: "inv-1",
  email: "new.coach@example.com",
  status: "pending",
  team_role_id: { _id: "r1", name: "Manager" },
  expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { id: "owner1" };
  orgState.currentOrg = OWNED;
  vi.spyOn(teamsService, "getOrganization").mockResolvedValue({ success: true, data: OWNED } as never);
  vi.spyOn(teamsService, "getMembers").mockResolvedValue({ success: true, data: [] });
  vi.spyOn(teamsService, "getRoles").mockResolvedValue({ success: true, data: [] });
  getInvitations.mockResolvedValue({ success: true, data: [pending] } as never);
});

const asStaff = (permissions: string[]) => {
  auth.user = { id: "staff1" };
  orgState.currentOrg = { ...OWNED, is_owner: false, my_permissions: permissions };
};

describe("Team page: pending invitations", () => {
  it("are read and listed for the owner", async () => {
    render(<TeamWorkspacePage />);
    expect(await screen.findByText("new.coach@example.com")).toBeInTheDocument();
    expect(getInvitations).toHaveBeenCalledWith("o1");
  });

  it("are read and listed for staff holding team:view_invitations", async () => {
    asStaff(["team:view_members", "team:view_invitations"]);
    render(<TeamWorkspacePage />);
    expect(await screen.findByText("new.coach@example.com")).toBeInTheDocument();
    expect(getInvitations).toHaveBeenCalledWith("o1");
  });

  it("are not asked for when the viewer can't read them", async () => {
    asStaff(["team:view_members"]);
    render(<TeamWorkspacePage />);
    await vi.waitFor(() => expect(teamsService.getMembers).toHaveBeenCalledWith("o1"));
    expect(getInvitations).not.toHaveBeenCalled();
    expect(screen.queryByText("Pending invitations")).toBeNull();
    expect(screen.queryByText("new.coach@example.com")).toBeNull();
  });
});
