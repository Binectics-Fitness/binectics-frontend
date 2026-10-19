import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ScheduleClient } from "@/app/dashboard/gym-owner/schedule/ScheduleClient";
import { classesService } from "@/lib/api/classes";
import { providerBillingApi } from "@/lib/api/providerBilling";

/**
 * The timetable shows deactivated classes to those who can change classes
 * (team:manage_organization), so a paused class can be reactivated from the
 * web as from the phone. Everyone else sees the active timetable only.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/schedule",
  useSearchParams: () => new URLSearchParams(),
}));
const authState = { user: { id: "owner1", role: "GYM_OWNER" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const org: Record<string, unknown> = { _id: "o1", name: "Iron Temple", owner_id: "owner1", currency: "NGN" };
const orgState = { currentOrg: org, organizations: [org], isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));
vi.mock("@/components/ds/GymDashboardShell", async () => {
  const { useGymViewer } = await import("@/hooks/useGymViewer");
  return {
    GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
      <div>
        {actions}
        {children}
      </div>
    ),
    useGymViewer,
  };
});
vi.mock("@/app/dashboard/gym-owner/schedule/TeamSessionsCard", () => ({ TeamSessionsCard: () => null }));

const cls = (over: Record<string, unknown>) => ({
  _id: "c1", organization_id: "o1", name: "Spin", day_of_week: 1, start_time: "07:00",
  duration_minutes: 45, capacity: 20, waitlist_enabled: true, is_active: true, created_at: "", updated_at: "",
  ...over,
});

function renderSchedule() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ScheduleClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  authState.user.id = "owner1";
  delete org.my_permissions;
  vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);
});

describe("Schedule: deactivated classes", () => {
  it("shows the owner deactivated classes, marked Inactive, to reactivate", async () => {
    const list = vi
      .spyOn(classesService, "listClasses")
      .mockResolvedValue({ success: true, data: [cls({}), cls({ _id: "c2", name: "Yoga", is_active: false })] } as never);
    renderSchedule();
    expect(await screen.findByText("Yoga")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith("o1", true);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Yoga").closest("a")).toHaveAttribute("href", "/dashboard/gym-owner/schedule/c2");
  });

  it("asks only for active classes for staff who can't change them", async () => {
    authState.user.id = "staff1";
    org.my_permissions = ["team:view_members"];
    const list = vi.spyOn(classesService, "listClasses").mockResolvedValue({ success: true, data: [cls({})] } as never);
    renderSchedule();
    expect(await screen.findByText("Spin")).toBeInTheDocument();
    await waitFor(() => expect(list).toHaveBeenCalledWith("o1", false));
    expect(screen.queryByText("Inactive")).toBeNull();
  });
});
