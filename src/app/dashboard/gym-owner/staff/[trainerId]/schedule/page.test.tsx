import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScheduleSubpage from "./page";
import * as teamsService from "@/lib/api/teams";
import * as consultationsService from "@/lib/api/consultations";

// Mock the services
vi.mock("@/lib/api/teams");
vi.mock("@/lib/api/consultations");
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
  useParams: () => ({
    trainerId: "member-1",
  }),
  usePathname: () => "/dashboard/gym-owner/staff/member-1/schedule",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/GymOwnerSidebar", () => ({ default: () => null }));

describe("Schedule Subpage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load and display availability rules", async () => {
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
    ];

    const mockRules = [
      {
        id: "rule-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
        isActive: true,
      },
      {
        id: "rule-2",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "18:00",
        timezone: "America/New_York",
        isActive: true,
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<ScheduleSubpage />);

    // Wait for page to load, then click Monday to see rule-1
    await waitFor(() => {
      expect(screen.getByText(/schedule operations/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /monday/i }));

    await waitFor(() => {
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
      expect(screen.getByText(/17:00/)).toBeInTheDocument();
    });
  });

  it("should filter rules by selected day", async () => {
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
    ];

    const mockRules = [
      {
        id: "rule-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
        isActive: true,
      },
      {
        id: "rule-2",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "18:00",
        timezone: "America/New_York",
        isActive: true,
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<ScheduleSubpage />);

    // Click Monday to see rule-1
    await waitFor(() => {
      expect(screen.getByText(/schedule operations/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /monday/i }));

    await waitFor(() => {
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
    });

    // Click Tuesday to see rule-2 instead
    await userEvent.click(screen.getByRole("button", { name: /tuesday/i }));

    await waitFor(() => {
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.queryByText(/09:00/)).not.toBeInTheDocument();
    });
  });

  it("should display upcoming exceptions", async () => {
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
    ];

    const mockRules: any[] = [];

    const mockExceptions = [
      {
        id: "exc-1",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: "UNAVAILABLE",
        reason: "Holiday",
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: mockExceptions,
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      // Page shows "Unavailable" for UNAVAILABLE type exceptions (reason is not rendered)
      expect(screen.getByText("Unavailable")).toBeInTheDocument();
    });
  });

  it("should display statistics", async () => {
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
    ];

    const mockRules = [
      {
        _id: "rule-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
      },
      {
        _id: "rule-2",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "18:00",
        timezone: "America/New_York",
      },
    ];

    const mockExceptions = [
      {
        _id: "exc-1",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "UNAVAILABLE",
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: mockExceptions,
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      // Should show 2 active rules
      expect(screen.getByText(/2/)).toBeInTheDocument();
      // Should show 1 exception
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });

  it("should have link to consultations manager", async () => {
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
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: /manage consultation availability/i,
      });
      expect(link).toHaveAttribute("href", "/dashboard/gym-owner/consultations");
    });
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: false,
      message: "Failed to load member",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: false,
      message: "Failed to load rules",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: false,
      message: "Failed to load exceptions",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it("should display day of week selector", async () => {
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
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: mockMembers,
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyAvailability).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    vi.mocked(consultationsService.consultationsService.getMyExceptions).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sun/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /mon/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /tue/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /wed/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /thu/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /fri/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sat/i })).toBeInTheDocument();
    });
  });
});
