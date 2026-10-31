import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RevenueClient from "@/app/dashboard/gym-owner/revenue/RevenueClient";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";

// "Revenue by trainer" is for the gym owner and staff holding
// marketplace:manage_listing (Admin, Manager); the API answers 404 to anyone
// else. It is not behind paid_content.
const viewer = vi.hoisted(() => ({ isOwner: true, permissions: [] as string[] }));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useGymViewer: () => ({ isOwner: viewer.isOwner, staff: !viewer.isOwner, orgId: "org1", orgName: "Gym", roleCode: null, permissions: new Set(viewer.permissions) }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org1", currency: "NGN" }, isLoading: false }),
}));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtNumber: (n: number) => String(n), fmtMoney: (n: number) => String(n) }),
}));
vi.mock("@/components/ds/PlanGate", () => ({
  PlanGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFeatureGateState: () => ({ gate: null, ready: true }),
}));
vi.mock("@/components/content/OrgContentSalesSection", () => ({
  OrgContentSalesSection: () => <div data-testid="content-sales" />,
}));

describe("Revenue page: Revenue by trainer link", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(checkinsService, "getOrgDashboardStats").mockResolvedValue({ success: true, data: {} } as never);
    vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue({ success: true, data: null } as never);
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] } as never);
  });

  const MANAGE = ["marketplace:manage_listing"];
  const refundsAndDisputes = () => screen.queryByRole("link", { name: "Refunds and disputes" });

  it("is there for the owner", async () => {
    Object.assign(viewer, { isOwner: true, permissions: [] });
    render(<RevenueClient />);
    expect(await screen.findByRole("link", { name: "Revenue by trainer" })).toHaveAttribute(
      "href",
      "/dashboard/gym-owner/revenue/trainers",
    );
    expect(await screen.findByTestId("content-sales")).toBeInTheDocument();
  });

  it("is there for an admin or manager (they hold manage_listing)", async () => {
    Object.assign(viewer, { isOwner: false, permissions: MANAGE });
    render(<RevenueClient />);
    expect(await screen.findByRole("link", { name: "Revenue by trainer" })).toBeInTheDocument();
    expect(await screen.findByTestId("content-sales")).toBeInTheDocument();
  });

  it("is not there for a trainer, consultant or other staff without manage_listing", async () => {
    Object.assign(viewer, { isOwner: false, permissions: ["team:view_members", "progress:view"] });
    render(<RevenueClient />);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("link", { name: "Revenue by trainer" })).not.toBeInTheDocument();
    await waitFor(() => expect(checkinsService.getOrgDashboardStats).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText("Loading revenue")).not.toBeInTheDocument());
    expect(screen.queryByTestId("content-sales")).not.toBeInTheDocument();
    expect(refundsAndDisputes()).toBeNull();
  });
});
