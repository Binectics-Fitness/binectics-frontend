import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import GymMembersClient from "@/app/dashboard/gym-owner/members/MembersClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { providerBillingApi } from "@/lib/api/providerBilling";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus as S,
  type MembershipSubscription,
} from "@/lib/types";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/members",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/dashboard/gym-owner/members/PendingOffers", () => ({ PendingOffers: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/ConnectedClients", () => ({ ConnectedClients: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/_actions", () => ({
  AddMemberButton: () => null,
  ImportMembersButton: ({ variant }: { variant?: string }) => (
    <button type="button" data-variant={variant ?? "ghost"}>
      Import members
    </button>
  ),
}));
vi.mock("@/app/dashboard/gym-owner/members/import/RecentImports", () => ({ RecentImports: () => null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner1" }, isLoading: false }) }));
const orgState = { currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "owner1" }, isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const sub = (): MembershipSubscription => ({
  _id: "s1",
  organization_id: "o1",
  plan_id: { _id: "p1", name: "Monthly", plan_type: MembershipPlanType.SUBSCRIPTION, duration_days: 30, price_minor: 2_500_000, currency: "NGN", features: [] },
  member_user_id: { _id: "u1", first_name: "Ngozi", last_name: "Okafor", email: "n@example.com" },
  status: S.ACTIVE,
  start_date: "2026-10-01T00:00:00Z",
  end_date: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  amount_paid_minor: 2_500_000,
  currency: "NGN",
  auto_renew: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "",
});

const list = vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions");
vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

/** Outside the table and its overflow-x wrapper, so nothing lays it out 780px wide. */
function expectOutsideTable(el: HTMLElement) {
  expect(el.closest("table")).toBeNull();
  expect(el.closest(".overflow-x-auto")).toBeNull();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("gym members list: empty and error states at phone width", () => {
  it("a gym with no members gets the import prompt outside the table, and no table", async () => {
    list.mockResolvedValue({ success: true, data: [] });
    wrap(<GymMembersClient />);
    const empty = await screen.findByTestId("members-empty");
    expect(empty).toHaveTextContent("No members yet.");
    expect(empty).toHaveTextContent("Moving from another system? Import your member list.");
    expectOutsideTable(empty);
    expect(screen.queryByRole("table")).toBeNull();
    // The prompt's own primary import button (the header keeps its ghost one).
    expect(screen.getAllByRole("button", { name: "Import members" }).some((b) => b.dataset.variant === "primary")).toBe(true);
  });

  it("a search that matches no one says so, outside the table", async () => {
    list.mockResolvedValue({ success: true, data: [sub()] });
    wrap(<GymMembersClient />);
    await screen.findByText("Ngozi Okafor");
    await userEvent.type(screen.getByPlaceholderText("Search by name, email, or plan…"), "zzz");
    const empty = await screen.findByTestId("members-empty");
    expect(empty).toHaveTextContent("No members match your filters.");
    expectOutsideTable(empty);
  });

  it("a failed load says so with Retry, outside the table, and never claims an empty gym", async () => {
    list.mockResolvedValueOnce({ success: false, message: "Server error" } as never);
    wrap(<GymMembersClient />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load members, Server error");
    expectOutsideTable(alert);
    expect(screen.queryByText("No members yet.")).toBeNull();
    list.mockResolvedValueOnce({ success: true, data: [sub()] });
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Ngozi Okafor")).toBeInTheDocument();
  });

  it("members still render in the table, inside its scroll wrapper", async () => {
    list.mockResolvedValue({ success: true, data: [sub()] });
    wrap(<GymMembersClient />);
    const cell = await screen.findByText("Ngozi Okafor");
    expect(cell.closest("table")).not.toBeNull();
    expect(cell.closest(".overflow-x-auto")).not.toBeNull();
    expect(screen.queryByTestId("members-empty")).toBeNull();
  });
});
