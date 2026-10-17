import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/tests/setup/test-utils";

import userEvent from "@testing-library/user-event";
import StaffPage from "./page";
import * as teamsService from "@/lib/api/teams";

// Mock the services
vi.mock("@/lib/api/teams");
const OWNED = { _id: "org-123", owner_id: "owner-1", is_owner: true };
const org = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({
    currentOrg: org.current,
    isLoading: false,
  }),
  // The shared shell reads the optional variant of the same context.
  useOptionalOrganization: () => ({
    currentOrg: org.current,
    organizations: [],
    isLoading: false,
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "owner-1", role: "GYM_OWNER", first_name: "Owner" },
  }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
  }),
  // The shared ProviderShell wraps every dashboard page in a role guard.
  useRoleGuard: () => ({
    user: { id: "owner-1", role: "GYM_OWNER", first_name: "Owner" },
    isAuthorized: true,
    isLoading: false,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/dashboard/gym-owner/staff",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Staff List Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    org.current = OWNED;
  });

  describe("pending invitations are read only by who may read them", () => {
    const john = {
      _id: "member-1",
      status: "active",
      user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
      team_role_id: { _id: "role-1", name: "Trainer" },
      created_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    };
    const pending = {
      _id: "inv-1",
      email: "invited@example.com",
      status: "pending",
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    };
    beforeEach(() => {
      vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({ success: true, data: [john] } as never);
      vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({ success: true, data: [pending] } as never);
    });

    it("staff without team:view_invitations: the staff list, and no invitations asked for", async () => {
      org.current = { ...OWNED, is_owner: false, my_permissions: ["team:view_members"] };
      renderWithProviders(<StaffPage />);
      expect((await screen.findAllByText("John Doe")).length).toBeGreaterThan(0);
      expect(teamsService.teamsService.getInvitations).not.toHaveBeenCalled();
      expect(screen.queryByText(/Pending invitations/)).toBeNull();
    });

    it("staff with team:view_invitations see them", async () => {
      org.current = { ...OWNED, is_owner: false, my_permissions: ["team:view_members", "team:view_invitations"] };
      renderWithProviders(<StaffPage />);
      expect((await screen.findAllByText("invited@example.com")).length).toBeGreaterThan(0);
      expect(teamsService.teamsService.getInvitations).toHaveBeenCalledWith("org-123");
    });

    it("the owner sees them", async () => {
      renderWithProviders(<StaffPage />);
      expect((await screen.findAllByText("invited@example.com")).length).toBeGreaterThan(0);
      expect(teamsService.teamsService.getInvitations).toHaveBeenCalledWith("org-123");
    });
  });

  it("should load and display team members", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "active",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
      {
        _id: "member-2",
        status: "active",
        user_id: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
    });
  });

  it("links each member to their detail page", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    renderWithProviders(<StaffPage />);

    const link = (await screen.findByRole("link", { name: "John Doe" }));
    expect(link).toHaveAttribute("href", "/dashboard/gym-owner/staff/member-1");
  });

  it("should display pending invitations in sidebar", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    const mockInvitations = [
      {
        _id: "inv-1",
        email: "invited@example.com",
        status: "pending",
        sent_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: mockInvitations,
      message: "Success",
    });

    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("invited@example.com").length).toBeGreaterThan(0);
    });
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: false,
      message: "Failed to load members",
    });

    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: false,
      message: "Failed to load invitations",
    });

    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/failed to load/i).length).toBeGreaterThan(0);
    });
  });

  it("filters members by status", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        {
          _id: "member-2",
          status: "inactive",
          user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    const user = userEvent.setup();
    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
    });

    // Both layouts render the chip row; click the first "Inactive" chip.
    await user.click(screen.getByRole("button", { name: /^Inactive/ }));

    await waitFor(() => {
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
      expect(screen.queryAllByText("John Doe")).toHaveLength(0);
    });
  });

  it("searches members by name", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        {
          _id: "member-2",
          status: "active",
          user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    const user = userEvent.setup();
    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    });

    await user.type(screen.getByLabelText("Search staff"), "jane");

    await waitFor(() => {
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
      expect(screen.queryAllByText("John Doe")).toHaveLength(0);
    });
  });

  it("shows a distinct empty state when filters match nothing", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    const user = userEvent.setup();
    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    });

    await user.type(screen.getByLabelText("Search staff"), "nobody");

    await waitFor(() => {
      // Not the "No staff yet" slate — the roster isn't empty, the filter is.
      expect(screen.getAllByText(/No staff match your filters/).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/No staff yet/)).toHaveLength(0);
    });
  });

  it("labels each member with their status", async () => {
    // The redesign replaced Tailwind status classes (.bg-primary-100) with
    // CSS custom properties, so assert the rendered STATUS_STYLE label —
    // the actual user-visible contract — not a class name.
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        {
          _id: "member-2",
          status: "inactive",
          user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
    });
  });

  it("summarises the roster count and active total", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "member-1",
          status: "active",
          user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        {
          _id: "member-2",
          status: "inactive",
          user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
          team_role_id: { _id: "role-1", name: "Trainer" },
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
      ],
      message: "Success",
    });
    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/2 team members · 1 active/).length).toBeGreaterThan(0);
    });
  });
});
