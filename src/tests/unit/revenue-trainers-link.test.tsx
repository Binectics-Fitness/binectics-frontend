import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RevenueClient from "@/app/dashboard/gym-owner/revenue/RevenueClient";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";

// "Revenue by trainer" is the gym owner's report (the API answers 404 to
// anyone else), so the link is the owner's alone. It is not behind paid_content.
const viewer = vi.hoisted(() => ({ isOwner: true }));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useGymViewer: () => ({ isOwner: viewer.isOwner, staff: !viewer.isOwner, orgId: "org1", orgName: "Gym", roleCode: null, permissions: [] }),
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
vi.mock("@/lib/gymStaffNav", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gymStaffNav")>()),
  allows: () => true,
}));

describe("Revenue page: Revenue by trainer link", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(checkinsService, "getOrgDashboardStats").mockResolvedValue({ success: true, data: {} } as never);
    vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue({ success: true, data: null } as never);
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] } as never);
  });

  it("is there for the owner", async () => {
    viewer.isOwner = true;
    render(<RevenueClient />);
    expect(await screen.findByRole("link", { name: "Revenue by trainer" })).toHaveAttribute(
      "href",
      "/dashboard/gym-owner/revenue/trainers",
    );
  });

  it("is not there for a manager or other staff", async () => {
    viewer.isOwner = false;
    render(<RevenueClient />);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("link", { name: "Revenue by trainer" })).not.toBeInTheDocument();
    // The page's other action is untouched.
    expect(screen.getByRole("link", { name: "Refunds and disputes" })).toBeInTheDocument();
  });
});
