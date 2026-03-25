import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffPage from "./page";
import * as teamsService from "@/lib/api/teams";

// Mock the services
vi.mock("@/lib/api/teams");
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({
    currentOrg: { _id: "org-123" },
    isLoading: false,
  }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
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
  });

  it("should load and display team members", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
      },
      {
        _id: "member-2",
        status: "ACTIVE",
        user_id: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
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

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
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
        status: "PENDING",
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getInvitations).mockResolvedValue({
      success: true,
      data: mockInvitations,
      message: "Success",
    });

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText("invited@example.com")).toBeInTheDocument();
    });
  });

  it("should filter members by status", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
      },
      {
        _id: "member-2",
        status: "INACTIVE",
        user_id: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
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

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Click inactive filter
    const inactiveButton = screen.getByRole("button", { name: /inactive/i });
    await userEvent.click(inactiveButton);

    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("should search members by name", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
      },
      {
        _id: "member-2",
        status: "ACTIVE",
        user_id: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
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

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Search for John
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, "John");

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
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

    render(<StaffPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load/i)
      ).toBeInTheDocument();
    });
  });

  it("should display correct status badge colors", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: { _id: "role-1", name: "Trainer" },
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

    const { container } = render(<StaffPage />);

    await waitFor(() => {
      const activeBadge = container.querySelector(".bg-primary-100");
      expect(activeBadge).toBeInTheDocument();
    });
  });
});
