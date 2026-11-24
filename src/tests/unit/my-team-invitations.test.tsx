import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

const refreshUser = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", role: "USER" }, refreshUser }),
}));
const refreshOrganizations = vi.fn();
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({
    currentOrg: null,
    organizations: [],
    refreshOrganizations,
    setCurrentOrg: vi.fn(),
  }),
}));
vi.mock("@/components/Toast", () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast };
});

import { MyTeamInvitations } from "@/components/teams/MyTeamInvitations";
import { teamsService } from "@/lib/api/teams";
import { teamInviteFailure } from "@/lib/teamInvites";
import { resolveNotificationTarget } from "@/utils/resolveNotificationLink";
import { UserRole } from "@/lib/types";

const invitation = (over: Record<string, unknown> = {}) => ({
  id: "inv-1",
  organization_id: "org-1",
  organization_name: "Iron Gym",
  role_code: "consultant",
  role_name: null,
  invited_by_name: "Kemi",
  expires_at: "2026-12-01T00:00:00.000Z",
  created_at: "2026-11-20T00:00:00.000Z",
  ...over,
});

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  refreshUser.mockReset().mockResolvedValue({ id: "u-1", role: "TRAINER" });
  refreshOrganizations.mockReset().mockResolvedValue(undefined);
});

describe("teamsService invitation calls", () => {
  it("reads mine and answers by id", async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });
    mockPost.mockResolvedValue({ success: true, data: {} });
    await teamsService.getMyInvitations();
    await teamsService.acceptInvitationById("inv/1");
    await teamsService.declineInvitationById("inv-2");
    expect(mockGet).toHaveBeenCalledWith("/teams/invitations/mine");
    expect(mockPost).toHaveBeenCalledWith("/teams/invitations/inv%2F1/accept");
    expect(mockPost).toHaveBeenCalledWith("/teams/invitations/inv-2/decline");
  });
});

describe("MyTeamInvitations", () => {
  it("shows nothing when there are none", async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });
    const { container } = render(<MyTeamInvitations />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("treats an API without the route (404) as none", async () => {
    mockGet.mockResolvedValue({ success: false, status: 404, message: "Cannot GET" });
    const { container } = render(<MyTeamInvitations />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("says when the list can't load and tries again", async () => {
    mockGet.mockResolvedValueOnce({ success: false, status: 500, message: "boom" });
    mockGet.mockResolvedValueOnce({ success: true, data: [invitation()] });
    render(<MyTeamInvitations />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Couldn't load your team invitations.");
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Iron Gym")).toBeTruthy();
  });

  it("lists an invitation with its role and accepts it by id", async () => {
    mockGet.mockResolvedValue({ success: true, data: [invitation()] });
    mockPost.mockResolvedValue({ success: true, data: { organization_id: "org-1" } });
    render(<MyTeamInvitations />);
    expect(await screen.findByText("Iron Gym")).toBeTruthy();
    expect(screen.getByText(/Trainer/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Accept Iron Gym's invitation" }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/teams/invitations/inv-1/accept"));
    // The fresh role and workspaces are read, then where to go is offered.
    expect(await screen.findByRole("link", { name: "Go to your trainer dashboard" })).toBeTruthy();
    expect(refreshUser).toHaveBeenCalled();
    expect(refreshOrganizations).toHaveBeenCalled();
    expect(screen.queryByText("Iron Gym")).toBeNull();
  });

  it("keeps the invitation and explains a full gym", async () => {
    mockGet.mockResolvedValue({ success: true, data: [invitation()] });
    mockPost.mockResolvedValue({
      success: false,
      status: 403,
      code: "BILLING_LIMIT_REACHED",
      message: "Upgrade your plan to add team members.",
    });
    render(<MyTeamInvitations />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept Iron Gym's invitation" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "Iron Gym has no staff seats left. Ask them to free one or upgrade their plan, then try again.",
    );
    expect(screen.getByText("Iron Gym")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept Iron Gym's invitation" })).toBeTruthy();
  });

  it("drops an invitation that is no longer open and says so", async () => {
    mockGet.mockResolvedValue({ success: true, data: [invitation()] });
    mockPost.mockResolvedValue({ success: false, status: 410, message: "This invitation has expired." });
    render(<MyTeamInvitations />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept Iron Gym's invitation" }));
    expect(await screen.findByText("This invitation has expired.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept Iron Gym's invitation" })).toBeNull();
  });

  it("declines after a confirm", async () => {
    mockGet.mockResolvedValue({ success: true, data: [invitation()] });
    mockPost.mockResolvedValue({ success: true, data: { id: "inv-1", status: "declined" } });
    render(<MyTeamInvitations />);
    fireEvent.click(await screen.findByRole("button", { name: "Decline Iron Gym's invitation" }));
    expect(mockPost).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/teams/invitations/inv-1/decline"));
    await waitFor(() => expect(screen.queryByText("Iron Gym")).toBeNull());
  });

  it("shows a failed decline on the invitation", async () => {
    mockGet.mockResolvedValue({ success: true, data: [invitation()] });
    mockPost.mockResolvedValue({ success: false, status: 500, message: "" });
    render(<MyTeamInvitations />);
    fireEvent.click(await screen.findByRole("button", { name: "Decline Iron Gym's invitation" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Decline" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Couldn't decline the invitation. Try again.");
    expect(screen.getByText("Iron Gym")).toBeTruthy();
  });
});

describe("MyTeamInvitations on the invitations page", () => {
  it("says when there are none", async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });
    render(<MyTeamInvitations showEmpty />);
    expect(await screen.findByText("No pending team invitations.")).toBeTruthy();
  });
});

describe("team invitation notifications", () => {
  it("open the invitations page for any role", () => {
    for (const role of [UserRole.TRAINER, UserRole.USER, UserRole.GYM_OWNER]) {
      expect(resolveNotificationTarget({ type: "TEAM_INVITATION", actionUrl: "/dashboard/team?teamId=t1" }, role)).toBe(
        "/teams/invitations",
      );
    }
  });
});

describe("teamInviteFailure", () => {
  it("never shows the invitee the owner's upgrade wording", () => {
    expect(teamInviteFailure({ success: false, status: 403, message: "Your plan's limit of 3 staff" }, "Iron Gym", "x").kind).toBe("full");
  });
  it("reads an unverified email, a stranger's invitation and an existing member", () => {
    expect(teamInviteFailure({ success: false, status: 403, code: "AUTH_EMAIL_NOT_VERIFIED" }, "G", "x").message).toBe(
      "Verify your email address first, then try again.",
    );
    expect(teamInviteFailure({ success: false, status: 404 }, "G", "x").kind).toBe("not-found");
    expect(teamInviteFailure({ success: false, status: 409 }, "G", "x").message).toBe("You're already on G's team.");
  });
});
