import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevenueSubpage from "./page";
import * as teamsService from "@/lib/api/teams";
import * as checkinsService from "@/lib/api/checkins";
import type { OrganizationMember } from "@/lib/api/teams";
import type { OrgCheckInDashboardStats } from "@/lib/types";

// Mock the services
vi.mock("@/lib/api/teams");
vi.mock("@/lib/api/checkins");
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
  usePathname: () => "/dashboard/gym-owner/staff/member-1/revenue",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/GymOwnerSidebar", () => ({ default: () => null }));

describe("Revenue Subpage", () => {
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

  const baseOrgStats: OrgCheckInDashboardStats = {
    today_check_ins: 10,
    week_check_ins: 50,
    month_check_ins: 200,
    active_members: 45,
    average_rating: 4.5,
    review_count: 30,
    revenue_today: 250,
    revenue_week: 1500,
    revenue_month: 6000,
    recent_check_ins: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load and display organization revenue data", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      checkinsService.checkinsService.getOrgDashboardStats,
    ).mockResolvedValue({
      success: true,
      data: baseOrgStats,
      message: "Success",
    });

    render(<RevenueSubpage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument(); // revenue_today
      expect(screen.getByText(/1,500/)).toBeInTheDocument(); // revenue_week
      expect(screen.getByText(/6,000/)).toBeInTheDocument(); // revenue_month
    });
  });

  it("should display member context (name, role, joined date)", async () => {
    const member: OrganizationMember = {
      ...baseMember,
      joined_at: new Date(2024, 0, 15).toISOString(),
    };

    const orgStats: OrgCheckInDashboardStats = {
      ...baseOrgStats,
      revenue_today: 100,
      revenue_week: 800,
      revenue_month: 3500,
      active_members: 30,
    };

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [member],
      message: "Success",
    });

    vi.mocked(
      checkinsService.checkinsService.getOrgDashboardStats,
    ).mockResolvedValue({
      success: true,
      data: orgStats,
      message: "Success",
    });

    render(<RevenueSubpage />);

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Trainer/)).toBeInTheDocument();
    });
  });

  it("should have link to full revenue dashboard", async () => {
    const orgStats: OrgCheckInDashboardStats = {
      ...baseOrgStats,
      revenue_today: 100,
      revenue_week: 800,
      revenue_month: 3500,
      active_members: 30,
    };

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      checkinsService.checkinsService.getOrgDashboardStats,
    ).mockResolvedValue({
      success: true,
      data: orgStats,
      message: "Success",
    });

    render(<RevenueSubpage />);

    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /open revenue dashboard/i,
      });
      expect(button).toBeInTheDocument();
    });
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: false,
      message: "Failed to load member",
    });

    vi.mocked(
      checkinsService.checkinsService.getOrgDashboardStats,
    ).mockResolvedValue({
      success: false,
      message: "Failed to load stats",
    });

    render(<RevenueSubpage />);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it("should display scope explanation note", async () => {
    const orgStats: OrgCheckInDashboardStats = {
      ...baseOrgStats,
      revenue_today: 100,
      revenue_week: 800,
      revenue_month: 3500,
      active_members: 30,
    };

    vi.mocked(teamsService.teamsService.getMembers).mockResolvedValue({
      success: true,
      data: [baseMember],
      message: "Success",
    });

    vi.mocked(
      checkinsService.checkinsService.getOrgDashboardStats,
    ).mockResolvedValue({
      success: true,
      data: orgStats,
      message: "Success",
    });

    render(<RevenueSubpage />);

    await waitFor(() => {
      expect(
        screen.getByText(/organization-level earnings/i),
      ).toBeInTheDocument();
    });
  });
});
