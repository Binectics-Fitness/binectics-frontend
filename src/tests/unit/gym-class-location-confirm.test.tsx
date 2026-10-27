import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClassDetailClient } from "@/app/dashboard/gym-owner/schedule/[classId]/ClassDetailClient";
import LocationDetailClient from "@/app/dashboard/gym-owner/locations/[locationId]/LocationDetailClient";
import { classesService } from "@/lib/api/classes";
import { classBookingsService } from "@/lib/api/classBookings";
import { teamsService } from "@/lib/api/teams";
import type { GymViewer } from "@/lib/gymStaffNav";
import { findConfirmDialog } from "@/test/confirmDialog";
import { toast } from "@/components/Toast";

/**
 * Deleting a class and deactivating a location ask in the app's dialog,
 * never window.confirm, and stay behind team:manage_organization.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ classId: "c1", locationId: "l2" }),
  usePathname: () => "/dashboard/gym-owner",
}));
const viewer = vi.hoisted(() => ({ current: { isOwner: true, permissions: new Set<string>() } as unknown }));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
  useGymViewer: () => viewer.current,
}));
vi.mock("@/hooks/useGymViewer", () => ({ useGymViewer: () => viewer.current }));
const org = vi.hoisted(() => ({ currentOrg: { _id: "o1", name: "Iron Temple" }, isLoading: false }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => org, useOptionalOrganization: () => org }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const spin = {
  _id: "c1", organization_id: "o1", name: "Spin", day_of_week: 1, start_time: "07:00",
  duration_minutes: 45, capacity: 20, waitlist_enabled: true, is_active: true, created_at: "", updated_at: "",
};
const annex = {
  _id: "l2", organization_id: "o1", name: "Lekki annex", is_primary: false, is_active: true, created_at: "", updated_at: "",
};
const main = {
  _id: "l1", organization_id: "o1", name: "Ikoyi main", is_primary: true, is_active: true, created_at: "", updated_at: "",
};

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

let nativeConfirm: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  viewer.current = { isOwner: true, permissions: new Set<string>() } as unknown as GymViewer;
  nativeConfirm = vi.spyOn(window, "confirm");
  vi.spyOn(classesService, "getClass").mockResolvedValue({ success: true, data: spin } as never);
  vi.spyOn(classBookingsService, "getRoster").mockResolvedValue({ success: true, data: [] } as never);
  vi.spyOn(teamsService, "getLocations").mockResolvedValue({ success: true, data: [main, annex] } as never);
});

describe("class detail: loading", () => {
  it("never says the class is missing while the workspace is still loading", async () => {
    const previous = { ...org };
    org.currentOrg = undefined as never;
    org.isLoading = true;
    try {
      wrap(<ClassDetailClient />);
      expect(screen.getByText("Loading class…")).toBeInTheDocument();
      expect(screen.queryByText(/Class not found/)).toBeNull();
    } finally {
      org.currentOrg = previous.currentOrg;
      org.isLoading = previous.isLoading;
    }
  });
});

describe("class detail: delete", () => {
  it("deletes only after the dialog, which says upcoming bookings are cancelled and members told", async () => {
    const del = vi.spyOn(classesService, "deleteClass").mockResolvedValue({ success: true, data: { cancelled_bookings: 2 } } as never);
    const user = userEvent.setup();
    wrap(<ClassDetailClient />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete "Spin"?');
    expect(dialog).toHaveTextContent("Upcoming bookings and waitlist places are cancelled, and each member is told.");
    expect(dialog).not.toHaveTextContent("aren't told");
    expect(del).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete class" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("o1", "c1"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/gym-owner/schedule"));
    expect(toast.success).toHaveBeenCalledWith("Spin was deleted. 2 bookings were cancelled and the members told.");
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("does nothing on Cancel", async () => {
    const del = vi.spyOn(classesService, "deleteClass");
    const user = userEvent.setup();
    wrap(<ClassDetailClient />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete "Spin"?');
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(del).not.toHaveBeenCalled();
  });

  it("isn't offered to staff without manage_organization", async () => {
    viewer.current = { isOwner: false, permissions: new Set<string>() } as unknown as GymViewer;
    wrap(<ClassDetailClient />);
    expect(await screen.findByText("No bookings for this occurrence yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});

describe("location detail: deactivate", () => {
  it("deactivates only after the dialog, which says it can be brought back", async () => {
    const del = vi.spyOn(teamsService, "deleteLocation").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    wrap(<LocationDetailClient />);
    await user.click(await screen.findByRole("button", { name: "Deactivate location" }));
    const dialog = await findConfirmDialog('Deactivate "Lekki annex"?');
    expect(dialog).toHaveTextContent("you can reactivate it later");
    expect(del).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Deactivate location" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("o1", "l2"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/gym-owner/locations"));
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("does nothing on Cancel", async () => {
    const del = vi.spyOn(teamsService, "deleteLocation");
    const user = userEvent.setup();
    wrap(<LocationDetailClient />);
    await user.click(await screen.findByRole("button", { name: "Deactivate location" }));
    const dialog = await findConfirmDialog('Deactivate "Lekki annex"?');
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(del).not.toHaveBeenCalled();
  });

  it("isn't offered on the primary location", async () => {
    vi.spyOn(teamsService, "getLocations").mockResolvedValue({
      success: true,
      data: [{ ...main, is_primary: false }, { ...annex, is_primary: true }],
    } as never);
    wrap(<LocationDetailClient />);
    expect(await screen.findByText(/This is your primary location/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate location" })).toBeNull();
  });

  it("isn't offered on the only active location", async () => {
    vi.spyOn(teamsService, "getLocations").mockResolvedValue({
      success: true,
      data: [{ ...main, is_active: false }, annex],
    } as never);
    wrap(<LocationDetailClient />);
    expect(await screen.findByText(/only active location/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate location" })).toBeNull();
  });

  it("explains a 409 from the API in words", async () => {
    const { toast } = await import("@/components/Toast");
    vi.spyOn(teamsService, "deleteLocation").mockResolvedValue({
      success: false, status: 409, code: "LOCATION_LAST_ACTIVE", message: "raw",
    } as never);
    const user = userEvent.setup();
    wrap(<LocationDetailClient />);
    await user.click(await screen.findByRole("button", { name: "Deactivate location" }));
    const dialog = await findConfirmDialog('Deactivate "Lekki annex"?');
    await user.click(within(dialog).getByRole("button", { name: "Deactivate location" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        '"Lekki annex" is your only active location. Add or reactivate another one before you deactivate it.',
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
