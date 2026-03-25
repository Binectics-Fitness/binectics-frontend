import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerDetailPage from "./page";
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
vi.mock("@/hooks/useConfirmationModal", () => ({
  useConfirmationModal: () => ({
    requestConfirmation: vi.fn((config) => {
      config.onConfirm?.();
    }),
    confirmationModal: null,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    trainerId: "member-1",
  }),
  usePathname: () => "/dashboard/gym-owner/staff/member-1",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Trainer Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load and display member details", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          code: "TRAINER",
          permissions: ["view_members", "manage_schedule"],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("should display member status badge", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          permissions: [],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  it("should display role permissions", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          permissions: ["manage_clients", "view_reports"],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/manage_clients/i)).toBeInTheDocument();
      expect(screen.getByText(/view_reports/i)).toBeInTheDocument();
    });
  });

  it("should toggle member status from active to inactive", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          permissions: [],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    const updatedMember = {
      ...mockMembers[0],
      status: "INACTIVE",
    };

    vi.mocked(teamsService.teamsService.updateMember).mockResolvedValue({
      success: true,
      data: updatedMember,
      message: "Success",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole("button", { name: /pause/i });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(teamsService.teamsService.updateMember).toHaveBeenCalledWith(
        "org-123",
        "member-1",
        { status: "INACTIVE" }
      );
    });
  });

  it("should remove member with confirmation", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          permissions: [],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.removeMember).mockResolvedValue({
      success: true,
      message: "Member removed successfully",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const removeButton = screen.getByRole("button", { name: /remove member/i });
    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(teamsService.teamsService.removeMember).toHaveBeenCalledWith(
        "org-123",
        "member-1"
      );
    });
  });

  it("should display error when member not found", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/could not be found/i)
      ).toBeInTheDocument();
    });
  });

  it("should handle API errors during status update", async () => {
    const mockMembers = [
      {
        _id: "member-1",
        status: "ACTIVE",
        user_id: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
        team_role_id: {
          _id: "role-1",
          name: "Trainer",
          permissions: [],
        },
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.updateMember).mockResolvedValue({
      success: false,
      message: "Failed to update member",
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole("button", { name: /pause/i });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
    });
  });
});
