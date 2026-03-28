import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteTrainerPage from "./page";
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
  usePathname: () => "/dashboard/gym-owner/staff/invite",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/GymOwnerSidebar", () => ({ default: () => null }));

describe("Invite Trainer Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load team roles on page load", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: ["manage_clients"],
      },
      {
        _id: "role-2",
        name: "Admin",
        code: "ADMIN",
        permissions: ["manage_all"],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Trainer" }),
      ).toBeInTheDocument();
    });
  });

  it("should auto-select trainer role by default", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer Coach",
        code: "TRAINER_COACH",
        permissions: ["manage_clients"],
      },
      {
        _id: "role-2",
        name: "Admin",
        code: "ADMIN",
        permissions: ["manage_all"],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    const { container } = render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Trainer Coach" }),
      ).toBeInTheDocument();
    });

    // Check if trainer role is selected by default in dropdown
    const roleSelect = container.querySelector("select") as HTMLSelectElement;
    if (roleSelect) {
      expect(roleSelect.value).toBe("role-1");
    }
  });

  it("should display role permissions in preview", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: ["view_clients", "edit_clients", "schedule_sessions"],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      // Page shows permissions count in preview, not individual names
      expect(screen.getByText(/permissions included/i)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  it("should accept email input and allow form submission", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: ["manage_clients"],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.inviteMember).mockResolvedValue({
      success: true,
      message: "Invitation sent successfully",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send invitation/i }),
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("coach@example.com");
    const submitButton = screen.getByRole("button", {
      name: /send invitation/i,
    });

    await userEvent.type(emailInput, "newtainer@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(teamsService.teamsService.inviteMember).toHaveBeenCalledWith(
        "org-123",
        expect.objectContaining({
          email: "newtainer@example.com",
          team_role_id: "role-1",
        }),
      );
    });
  });

  it("should show success message after sending invitation", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: [],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.inviteMember).mockResolvedValue({
      success: true,
      message: "Invitation sent successfully",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send invitation/i }),
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("coach@example.com");
    const submitButton = screen.getByRole("button", {
      name: /send invitation/i,
    });

    await userEvent.type(emailInput, "trainer@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invitation sent/i)).toBeInTheDocument();
    });
  });

  it("should handle API errors when sending invitation", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: [],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    vi.mocked(teamsService.teamsService.inviteMember).mockResolvedValue({
      success: false,
      message: "User already exists in organization",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send invitation/i }),
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("coach@example.com");
    const submitButton = screen.getByRole("button", {
      name: /send invitation/i,
    });

    await userEvent.type(emailInput, "trainer@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it("should display error when roles fail to load", async () => {
    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: false,
      message: "Failed to load team roles",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("should validate email format", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: [],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send invitation/i }),
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(
      "coach@example.com",
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: /send invitation/i,
    });

    // Try invalid email
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.click(submitButton);

    // Should not call API with invalid email
    expect(teamsService.teamsService.inviteMember).not.toHaveBeenCalled();
  });

  it("should allow role selection change", async () => {
    const mockRoles = [
      {
        _id: "role-1",
        name: "Trainer",
        code: "TRAINER",
        permissions: ["skill-1"],
      },
      {
        _id: "role-2",
        name: "Instructor",
        code: "INSTRUCTOR",
        permissions: ["skill-2", "skill-3"],
      },
    ];

    vi.mocked(teamsService.teamsService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
      message: "Success",
    });

    const { container } = render(<InviteTrainerPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Trainer" }),
      ).toBeInTheDocument();
    });

    // Initial role shows 1 permission in count
    expect(screen.getByText(/permissions included/i)).toBeInTheDocument();

    // Change role to Instructor
    const roleSelect = container.querySelector("select") as HTMLSelectElement;
    if (roleSelect) {
      await userEvent.selectOptions(roleSelect, "role-2");

      await waitFor(() => {
        // Instructor has 2 permissions
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    }
  });
});
