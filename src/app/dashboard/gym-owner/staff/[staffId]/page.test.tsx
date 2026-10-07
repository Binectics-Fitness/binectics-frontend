import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/setup/test-utils";

// The gym shell renders the page in a desktop and a mobile layout, both in
// jsdom's tree, so presence checks use getAll* and absence checks queryAll*.
import StaffDetailPage from "./page";
import * as teams from "@/lib/api/teams";
import * as marketplace from "@/lib/api/marketplace";

const push = vi.fn();
const orgState = { currentOrg: { _id: "org-1", is_owner: true } as Record<string, unknown>, isLoading: false };

vi.mock("@/lib/api/teams", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/teams")>();
  return {
    ...actual,
    teamsService: {
      getMembers: vi.fn(),
      getRoles: vi.fn(),
      updateMember: vi.fn(),
      removeMember: vi.fn(),
    },
  };
});
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getOrgMembershipSubscriptions: vi.fn() },
}));
vi.mock("@/components/Toast", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/components/messaging/StartConversationButton", () => ({
  StartConversationButton: () => <button type="button">Message</button>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => ({ ...orgState, organizations: [] }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner-1", role: "GYM_OWNER", first_name: "Owner" } }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useRoleGuard: () => ({
    user: { id: "owner-1", role: "GYM_OWNER", first_name: "Owner" },
    isAuthorized: true,
    isLoading: false,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/staff/m-1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/GymOwnerSidebar", () => ({ default: () => null }));

const svc = vi.mocked(teams.teamsService);
const subsApi = vi.mocked(marketplace.marketplaceService.getOrgMembershipSubscriptions);

const TRAINER_ROLE = { _id: "role-consultant", name: "Trainer", code: "consultant" };
const FRONT_DESK_ROLE = { _id: "role-desk", name: "Front desk", code: "front_desk" };

function member(overrides: Record<string, unknown> = {}) {
  return {
    _id: "m-1",
    organization_id: "org-1",
    status: "active",
    user_id: { _id: "u-1", first_name: "Thandi", last_name: "Nkosi", email: "thandi@example.com" },
    team_role_id: TRAINER_ROLE,
    joined_at: "2026-03-04T10:00:00.000Z",
    created_at: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

function sub(id: string, first: string, assigned: string | null, status = "active") {
  return {
    _id: id,
    status,
    member_user_id: { _id: `user-${id}`, first_name: first, last_name: "Member", email: `${id}@example.com` },
    plan_id: { _id: "p-1", name: "Monthly unlimited" },
    assigned_staff_user_id: assigned,
  };
}

/** A params promise React.use() can read synchronously (already marked fulfilled). */
function resolvedParams(staffId: string): Promise<{ staffId: string }> {
  const value = { staffId };
  return Object.assign(Promise.resolve(value), { status: "fulfilled", value });
}

function renderPage(staffId = "m-1") {
  return renderWithProviders(
    <Suspense fallback={null}>
      <StaffDetailPage params={resolvedParams(staffId)} />
    </Suspense>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  orgState.currentOrg = { _id: "org-1", is_owner: true };
  svc.getMembers.mockResolvedValue({ success: true, data: [member()] } as never);
  svc.getRoles.mockResolvedValue({ success: true, data: [TRAINER_ROLE, FRONT_DESK_ROLE] } as never);
  subsApi.mockResolvedValue({ success: true, data: [] } as never);
});

describe("Gym staff detail page", () => {
  it("shows the staff member's real details", async () => {
    renderPage();
    expect((await screen.findAllByRole("heading", { name: "Thandi Nkosi" })).length).toBeGreaterThan(0);
    expect(screen.getAllByText("thandi@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(svc.getMembers).toHaveBeenCalledWith("org-1");
    // Nothing invented: no certifications, ratings or payroll.
    // (The shell's own nav is in the tree too, so match the old fake labels.)
    expect(screen.queryAllByText(/Certifications/)).toHaveLength(0);
    expect(screen.queryAllByText(/Member rating/)).toHaveLength(0);
    expect(screen.queryAllByText(/Payroll|Payout · MTD/)).toHaveLength(0);
  });

  it("lists only the gym members assigned to a trainer", async () => {
    subsApi.mockResolvedValue({
      success: true,
      data: [sub("s-1", "Ada", "u-1"), sub("s-2", "Bola", "u-other"), sub("s-3", "Chidi", null)],
    } as never);
    renderPage();

    expect((await screen.findAllByText("Ada Member")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Bola Member")).toHaveLength(0);
    expect(screen.queryAllByText("Chidi Member")).toHaveLength(0);
    expect(screen.getAllByText("Assigned members · 1").length).toBeGreaterThan(0);
    const link = screen.getByRole("link", { name: /Ada Member/ });
    expect(link).toHaveAttribute("href", "/dashboard/gym-owner/members/s-1");
  });

  it("leaves out members whose membership has ended", async () => {
    subsApi.mockResolvedValue({
      success: true,
      data: [
        sub("s-1", "Ada", "u-1"),
        sub("s-2", "Bola", "u-1", "past_due"),
        sub("s-3", "Chidi", "u-1", "cancelled"),
        sub("s-4", "Dayo", "u-1", "expired"),
      ],
    } as never);
    renderPage();

    expect((await screen.findAllByText("Ada Member")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bola Member").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Chidi Member")).toHaveLength(0);
    expect(screen.queryAllByText("Dayo Member")).toHaveLength(0);
    expect(screen.getAllByText("Assigned members · 2").length).toBeGreaterThan(0);
  });

  it("says so when a trainer has nobody assigned", async () => {
    renderPage();
    expect((await screen.findAllByText("No members assigned yet.")).length).toBeGreaterThan(0);
  });

  it("does not look up assignments for staff who aren't trainers", async () => {
    svc.getMembers.mockResolvedValue({ success: true, data: [member({ team_role_id: FRONT_DESK_ROLE })] } as never);
    renderPage();
    expect((await screen.findAllByRole("heading", { name: "Thandi Nkosi" })).length).toBeGreaterThan(0);
    expect(subsApi).not.toHaveBeenCalled();
    expect(screen.queryAllByText(/Assigned members/)).toHaveLength(0);
  });

  it("shows not found for an id that isn't on the team", async () => {
    renderPage("nobody");
    expect((await screen.findAllByText("Staff member not found")).length).toBeGreaterThan(0);
  });

  it("shows the load error", async () => {
    svc.getMembers.mockResolvedValue({ success: false, message: "Forbidden" } as never);
    renderPage();
    expect((await screen.findAllByText("Forbidden")).length).toBeGreaterThan(0);
  });

  it("removes the member after confirmation and returns to the list", async () => {
    svc.removeMember.mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    renderPage();

    await user.click((await screen.findByRole("button", { name: "Remove from team" })));
    expect(svc.removeMember).not.toHaveBeenCalled();
    expect(screen.getAllByText("Remove Thandi Nkosi from your team?").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(svc.removeMember).toHaveBeenCalledWith("org-1", "m-1"));
    expect(push).toHaveBeenCalledWith("/dashboard/gym-owner/staff");
  });

  it("changes the role with the team update call", async () => {
    svc.updateMember.mockResolvedValue({ success: true, data: member({ team_role_id: FRONT_DESK_ROLE }) } as never);
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("heading", { name: "Thandi Nkosi" });
    // SearchableSelect: open the picker, then choose an option.
    await user.click(screen.getByRole("button", { name: /Trainer/ }));
    await user.click((await screen.findByText("Front desk")));

    await waitFor(() =>
      expect(svc.updateMember).toHaveBeenCalledWith("org-1", "m-1", { team_role_id: "role-desk" }),
    );
  });

  it("hides role and remove controls from staff without manage rights", async () => {
    orgState.currentOrg = { _id: "org-1", is_owner: false, can_manage_organization: false };
    renderPage();
    await screen.findAllByRole("heading", { name: "Thandi Nkosi" });
    expect(screen.queryAllByRole("button", { name: "Remove from team" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /Trainer/ })).toHaveLength(0);
  });
});
