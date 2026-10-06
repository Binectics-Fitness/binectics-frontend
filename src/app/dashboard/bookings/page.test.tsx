import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/setup/test-utils";
import MyBookingsPage from "./page";

let role = "USER";
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", role, first_name: "Yemi" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: null, organizations: [], isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: null, organizations: [], isLoading: false }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useRoleGuard: () => ({ user: { id: "u-1", role }, isAuthorized: true, isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/bookings",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/classes/MyClassBookingsCard", () => ({ MyClassBookingsCard: () => null }));
const getMyBookings = vi.fn();
vi.mock("@/lib/api/consultations", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/consultations")>()),
  consultationsService: {
    getMyBookings: () => getMyBookings(),
  },
}));
const listResponse = () => ({
  success: true,
  data: [
    {
      id: "b-00000001", clientUserId: "u-1", providerId: "p", consultationTypeId: "t",
      consultationTypeName: "Strength", startsAt: "2026-10-07T08:00:00.000Z", endsAt: "2026-10-07T09:00:00.000Z",
      providerTimezone: "Africa/Lagos", clientTimezone: "Africa/Lagos", status: "CONFIRMED",
    },
  ],
});

describe("My bookings", () => {
  beforeEach(() => {
    getMyBookings.mockReset();
    getMyBookings.mockImplementation(async () => listResponse());
  });

  it("renders in the member's own shell, not a bespoke top nav", async () => {
    role = "USER";
    renderWithProviders(<MyBookingsPage />);
    const h1 = await screen.findByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Your bookings");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
    // The member shell's own nav, with Home and Activity, is back.
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Activity" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "My bookings" })).toBeNull();
    expect((await screen.findAllByText("Strength · 60 min")).length).toBeGreaterThan(0);
  });

  it("renders a provider's bookings inside their provider shell", async () => {
    role = "TRAINER";
    renderWithProviders(<MyBookingsPage />);
    expect((await screen.findAllByRole("link", { name: /Today/ })).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Activity" })).toBeNull();
  });

  it("mounts once in a provider shell, which renders its children twice", async () => {
    role = "TRAINER";
    renderWithProviders(<MyBookingsPage />);
    await screen.findByText(/Strength · 60 min/);
    expect(getMyBookings).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // One cancel dialog, so its unsaved-changes guard is the one being typed in.
    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    const dialogs = await screen.findAllByRole("dialog");
    expect(dialogs).toHaveLength(1);
    expect(within(dialogs[0]).getByText(/This will cancel your session/)).toBeTruthy();
  });

  it("names the date for screen readers, since the date block is decorative", async () => {
    role = "USER";
    renderWithProviders(<MyBookingsPage />);
    const row = (await screen.findAllByText(/Strength · 60 min/))[0];
    expect(row.textContent).toMatch(/2026/);
  });
});
