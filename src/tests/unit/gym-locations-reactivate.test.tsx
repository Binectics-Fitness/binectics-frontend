import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationsClient from "@/app/dashboard/gym-owner/locations/LocationsClient";
import { teamsService } from "@/lib/api/teams";
import { toast } from "@/components/Toast";
import { locationErrorMessage } from "@/lib/locationErrors";
import type { GymViewer } from "@/lib/gymStaffNav";

/**
 * Deactivated locations sit in a section the owner opens, each with a
 * Reactivate button behind team:manage_organization (api #268).
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/locations",
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
vi.mock("@/components/ds/modals/AddLocationModal", () => ({ AddLocationModal: () => null }));

const main = {
  _id: "l1", organization_id: "o1", name: "Ikoyi main", is_primary: true, is_active: true, created_at: "", updated_at: "",
};
const annex = {
  _id: "l2", organization_id: "o1", name: "Lekki annex", city: "Lagos", is_primary: false, is_active: false, created_at: "", updated_at: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  viewer.current = { isOwner: true, permissions: new Set<string>() } as unknown as GymViewer;
  vi.spyOn(teamsService, "getLocations").mockResolvedValue({ success: true, data: [main, annex] } as never);
});

async function openDeactivated() {
  const user = userEvent.setup();
  render(<LocationsClient />);
  const toggle = await screen.findByRole("button", { name: /Deactivated locations \(1\)/ });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("Lekki annex")).toBeNull();
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  return user;
}

describe("locations list: deactivated locations", () => {
  it("asks the API for deactivated locations too", async () => {
    render(<LocationsClient />);
    await waitFor(() => expect(teamsService.getLocations).toHaveBeenCalledWith("o1", { includeInactive: true }));
  });

  it("has no section when every location is active", async () => {
    vi.spyOn(teamsService, "getLocations").mockResolvedValue({ success: true, data: [main] } as never);
    render(<LocationsClient />);
    expect(await screen.findByText("Ikoyi main")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Deactivated locations/ })).toBeNull();
  });

  it("reactivates a location and moves it back to the active list", async () => {
    const reactivate = vi
      .spyOn(teamsService, "reactivateLocation")
      .mockResolvedValue({ success: true, data: { ...annex, is_active: true } } as never);
    const user = await openDeactivated();
    await user.click(screen.getByRole("button", { name: "Reactivate Lekki annex" }));
    await waitFor(() => expect(reactivate).toHaveBeenCalledWith("o1", "l2"));
    expect(toast.success).toHaveBeenCalledWith("Lekki annex is active again");
    expect(screen.queryByRole("button", { name: /Deactivated locations/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Lekki annex/ })).toBeInTheDocument();
  });

  it("says when it came back as the primary location", async () => {
    vi.spyOn(teamsService, "reactivateLocation").mockResolvedValue({
      success: true,
      data: { ...annex, is_active: true, is_primary: true },
    } as never);
    const user = await openDeactivated();
    await user.click(screen.getByRole("button", { name: "Reactivate Lekki annex" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Lekki annex is active again, as your primary location"),
    );
  });

  it("explains a name already in use", async () => {
    vi.spyOn(teamsService, "reactivateLocation").mockResolvedValue({
      success: false, status: 409, code: "LOCATION_NAME_IN_USE", message: "raw",
    } as never);
    const user = await openDeactivated();
    await user.click(screen.getByRole("button", { name: "Reactivate Lekki annex" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Another active location is already called "Lekki annex". Rename that one, then reactivate this.',
      ),
    );
    const list = document.getElementById("deactivated-locations") as HTMLElement;
    expect(within(list).getByText("Lekki annex")).toBeInTheDocument();
  });

  it("shows deactivated locations without Reactivate to staff who can't manage the gym", async () => {
    viewer.current = { isOwner: false, permissions: new Set<string>() } as unknown as GymViewer;
    await openDeactivated();
    expect(screen.getByText("Lekki annex")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reactivate/ })).toBeNull();
  });
});

describe("locationErrorMessage", () => {
  it("words each 409 code and falls back to the API message", () => {
    expect(locationErrorMessage({ code: "LOCATION_PRIMARY" }, "deactivate", "Ikoyi", "x")).toBe(
      '"Ikoyi" is your primary location. Make another location primary before you deactivate it.',
    );
    expect(locationErrorMessage({ code: "LOCATION_LAST_ACTIVE" }, "deactivate", "Ikoyi", "x")).toMatch(
      /only active location/,
    );
    expect(locationErrorMessage({ code: "LOCATION_NAME_IN_USE" }, "save", "Ikoyi", "x")).toBe(
      'Another active location is already called "Ikoyi". Choose a different name.',
    );
    expect(locationErrorMessage({ code: "OTHER", message: "From the API" }, "save", "Ikoyi", "x")).toBe("From the API");
    expect(locationErrorMessage({}, "save", "Ikoyi", "Fallback")).toBe("Fallback");
  });
});
