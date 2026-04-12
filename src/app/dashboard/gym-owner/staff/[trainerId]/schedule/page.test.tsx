import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScheduleSubpage from "./page";
import * as teamsService from "@/lib/api/teams";
import * as consultationsService from "@/lib/api/consultations";
import type { OrganizationMember } from "@/lib/api/teams";
import {
  AvailabilityExceptionType,
  type AvailabilityRule,
  type AvailabilityException,
} from "@/lib/api/consultations";

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
  const baseMember: OrganizationMember = {
    _id: "member-1",
    organization_id: "org-123",
    status: "active" as OrganizationMember["status"],
    user_id: {
      _id: "user-1",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    team_role_id: {
      _id: "role-1",
      organization_id: "org-123",
      name: "Trainer",
      code: "trainer",
      permissions: [],
      is_default: false,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    invited_by: null,
    joined_at: new Date().toISOString(),
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load and display availability rules", async () => {
    const mockRules: AvailabilityRule[] = [
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
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
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
    const mockRules: AvailabilityRule[] = [
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
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
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
    const mockExceptions: AvailabilityException[] = [
      {
        id: "exc-1",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: AvailabilityExceptionType.UNAVAILABLE,
        reason: "Holiday",
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
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
    const mockRules: AvailabilityRule[] = [
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

    const mockExceptions: AvailabilityException[] = [
      {
        id: "exc-1",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: AvailabilityExceptionType.UNAVAILABLE,
      },
    ];

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: mockRules,
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
      success: true,
      data: mockExceptions,
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      // Should show 2 active rules and 1 exception in the stats grid
      const statValues = screen.getAllByText(
        (_, el) =>
          el?.tagName === "P" && el?.classList.contains("text-3xl") === true,
      );
      const texts = statValues.map((el) => el.textContent);
      expect(texts).toContain("2"); // active rules
      expect(texts).toContain("1"); // exceptions
    });
  });

  it("should have link to consultations manager", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: /manage consultation availability/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "/dashboard/gym-owner/consultations",
      );
    });
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: false,
      message: "Failed to load member",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: false,
      message: "Failed to load rules",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
      success: false,
      message: "Failed to load exceptions",
    });

    render(<ScheduleSubpage />);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it("should display day of week selector", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyAvailability,
    ).mockResolvedValue({
      success: true,
      data: [],
      message: "Success",
    });

    vi.mocked(
      consultationsService.consultationsService.getMyExceptions,
    ).mockResolvedValue({
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
