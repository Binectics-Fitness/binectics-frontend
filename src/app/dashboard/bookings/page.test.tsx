import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { contrast, tokenOf } from "@/test/contrast";
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
const cancelBooking = vi.fn();
const rescheduleBooking = vi.fn();
const getProviderSlots = vi.fn();
vi.mock("@/lib/api/consultations", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/consultations")>()),
  consultationsService: {
    getMyBookings: () => getMyBookings(),
    cancelBooking: (...a: unknown[]) => cancelBooking(...a),
    rescheduleBooking: (...a: unknown[]) => rescheduleBooking(...a),
    getProviderSlots: (...a: unknown[]) => getProviderSlots(...a),
  },
}));
const booking = (status: string, id = "b-00000001") => ({
  id, clientUserId: "u-1", providerId: "p", consultationTypeId: "t",
  consultationTypeName: "Strength", startsAt: "2026-10-07T08:00:00.000Z", endsAt: "2026-10-07T09:00:00.000Z",
  providerTimezone: "Africa/Lagos", clientTimezone: "Africa/Lagos", status,
});
const listResponse = (status = "CONFIRMED") => ({ success: true, data: [booking(status)] });

/** The phone placement: the actions under the selected row, hidden from lg up. */
const phoneActions = () => screen.queryByTestId("booking-actions-phone");

describe("My bookings", () => {
  beforeEach(() => {
    getMyBookings.mockReset();
    getMyBookings.mockImplementation(async () => listResponse());
    cancelBooking.mockReset();
    rescheduleBooking.mockReset();
    getProviderSlots.mockReset();
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

  it("mounts once in a provider shell", async () => {
    role = "TRAINER";
    renderWithProviders(<MyBookingsPage />);
    await screen.findByText(/Strength · 60 min/);
    expect(getMyBookings).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // One cancel dialog, so its unsaved-changes guard is the one being typed in.
    await userEvent.click(screen.getAllByRole("button", { name: "Cancel booking" })[0]);
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

  describe("on phones, where there is no detail column", () => {
    it.each(["PENDING", "CONFIRMED"])("offers Reschedule and Cancel under a selected %s booking, as the column does", async (status) => {
      role = "USER";
      getMyBookings.mockImplementation(async () => listResponse(status));
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      const phone = phoneActions();
      expect(phone).not.toBeNull();
      expect(phone!.className).toMatch(/\blg:hidden\b/);
      expect(within(phone!).getByRole("button", { name: "Reschedule" })).toBeTruthy();
      expect(within(phone!).getByRole("button", { name: "Cancel booking" })).toBeTruthy();
      // The column offers the same pair: one per placement.
      expect(screen.getAllByRole("button", { name: "Cancel booking" })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "Reschedule" })).toHaveLength(2);
    });

    it.each(["CANCELLED", "COMPLETED", "NO_SHOW"])("offers neither for a %s booking, as the column does", async (status) => {
      role = "USER";
      getMyBookings.mockImplementation(async () => listResponse(status));
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      expect(phoneActions()).toBeNull();
      expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Reschedule" })).toBeNull();
    });

    it("shows the actions only under the selected row", async () => {
      role = "USER";
      getMyBookings.mockImplementation(async () => ({
        success: true,
        data: [booking("CONFIRMED", "b-00000001"), { ...booking("CONFIRMED", "b-00000002"), consultationTypeName: "Mobility" }],
      }));
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      expect(screen.getAllByTestId("booking-actions-phone")).toHaveLength(1);
      await userEvent.click(screen.getByRole("button", { name: /Mobility · 60 min/ }));
      expect(screen.getAllByTestId("booking-actions-phone")).toHaveLength(1);
      // The dialog it opens is for the row now selected.
      await userEvent.click(within(phoneActions()!).getByRole("button", { name: "Cancel booking" }));
      await screen.findByRole("dialog");
      cancelBooking.mockResolvedValue({ success: true, data: booking("CANCELLED", "b-00000002") });
      await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel booking" }));
      expect(cancelBooking).toHaveBeenCalledWith("b-00000002", { reason: undefined });
    });

    it("Cancel opens the page's one cancel dialog and sends the reason", async () => {
      role = "TRAINER";
      cancelBooking.mockResolvedValue({ success: true, data: booking("CANCELLED") });
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      await userEvent.click(within(phoneActions()!).getByRole("button", { name: "Cancel booking" }));
      const dialogs = await screen.findAllByRole("dialog");
      expect(dialogs).toHaveLength(1);
      await userEvent.type(within(dialogs[0]).getByRole("textbox"), "Travelling");
      await userEvent.click(within(dialogs[0]).getByRole("button", { name: "Cancel booking" }));
      expect(cancelBooking).toHaveBeenCalledWith("b-00000001", { reason: "Travelling" });
    });

    it("Reschedule opens the page's one reschedule dialog", async () => {
      role = "USER";
      getProviderSlots.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      await userEvent.click(within(phoneActions()!).getByRole("button", { name: "Reschedule" }));
      const dialogs = await screen.findAllByRole("dialog");
      expect(dialogs).toHaveLength(1);
      expect(within(dialogs[0]).getByText("Reschedule booking")).toBeTruthy();
      expect(getProviderSlots).toHaveBeenCalledWith("p", expect.objectContaining({ consultationTypeId: "t" }));
    });

    it("keeps the unsaved-changes guard: a typed reason asks before the dialog is dismissed", async () => {
      role = "USER";
      renderWithProviders(<MyBookingsPage />);
      await screen.findAllByText(/Strength · 60 min/);
      await userEvent.click(within(phoneActions()!).getByRole("button", { name: "Cancel booking" }));
      const dialog = await screen.findByRole("dialog");
      await userEvent.type(within(dialog).getByRole("textbox"), "Changed my mind");
      await userEvent.keyboard("{Escape}");
      expect(await screen.findByText("Discard changes?")).toBeTruthy();
      expect(cancelBooking).not.toHaveBeenCalled();
    });
  });

  it("keeps Cancel readable on either page surface (AA)", async () => {
    role = "USER";
    renderWithProviders(<MyBookingsPage />);
    await screen.findAllByText(/Strength · 60 min/);
    const cancel = within(phoneActions()!).getByRole("button", { name: "Cancel booking" });
    const fg = tokenOf(cancel.style.color);
    for (const bg of ["bg", "bg-2"]) expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
