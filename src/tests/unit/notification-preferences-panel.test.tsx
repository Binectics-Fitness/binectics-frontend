import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NotificationPreferencesPanel from "@/app/dashboard/settings/NotificationPreferencesPanel";

const mockUseNotificationPreferences = vi.fn();
const mockUseUpdateNotificationPreferences = vi.fn();

vi.mock("@/lib/queries/notifications", () => ({
  useNotificationPreferences: () => mockUseNotificationPreferences(),
  useUpdateNotificationPreferences: () => mockUseUpdateNotificationPreferences(),
}));

const basePreferences = {
  emailSubscriptionUpdates: true,
  emailPaymentReceipts: true,
  emailBookingConfirmations: true,
  emailCancellations: true,
  emailReminders: true,
  emailNewsletter: false,
  emailPromotions: false,
  inAppBookings: true,
  inAppPayments: false,
  inAppMessages: true,
  inAppReminders: true,
  inAppPromotions: false,
};

describe("NotificationPreferencesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    mockUseNotificationPreferences.mockReturnValue({
      data: null,
      isLoading: true,
      refetch: vi.fn(),
    });
    mockUseUpdateNotificationPreferences.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<NotificationPreferencesPanel />);

    expect(
      screen.getByText("Loading notification preferences..."),
    ).toBeInTheDocument();
  });

  it("shows sms controls as disabled placeholders", () => {
    mockUseNotificationPreferences.mockReturnValue({
      data: basePreferences,
      isLoading: false,
      refetch: vi.fn(),
    });
    mockUseUpdateNotificationPreferences.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
    });

    render(<NotificationPreferencesPanel />);

    expect(
      screen.getByText(/SMS is visible for planning but not yet active/i),
    ).toBeInTheDocument();

    const smsButton = screen.getByRole("button", {
      name: /Booking confirmations sms/i,
    });
    expect(smsButton).toBeDisabled();
  });

  it("updates email preference on click", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true, data: {} });
    const refetch = vi.fn().mockResolvedValue(undefined);

    mockUseNotificationPreferences.mockReturnValue({
      data: basePreferences,
      isLoading: false,
      refetch,
    });
    mockUseUpdateNotificationPreferences.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    });

    render(<NotificationPreferencesPanel />);

    fireEvent.click(
      screen.getByRole("button", { name: /Booking confirmations email/i }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        emailBookingConfirmations: false,
      });
    });
    expect(refetch).toHaveBeenCalled();
  });

  it("updates push (in-app) preference on click", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true, data: {} });
    const refetch = vi.fn().mockResolvedValue(undefined);

    mockUseNotificationPreferences.mockReturnValue({
      data: basePreferences,
      isLoading: false,
      refetch,
    });
    mockUseUpdateNotificationPreferences.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    });

    render(<NotificationPreferencesPanel />);

    fireEvent.click(
      screen.getByRole("button", { name: /Payment receipts push/i }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        inAppPayments: true,
      });
    });
    expect(refetch).toHaveBeenCalled();
  });
});
