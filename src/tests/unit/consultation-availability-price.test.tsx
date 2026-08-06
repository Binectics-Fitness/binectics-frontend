import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { consultationsService } from "@/lib/api/consultations";
import { utilityService } from "@/lib/api/utility";

/**
 * The money round-trip on the one surface where a saved price actually
 * changes value. The formatted display string is LOSSY for a whole-unit
 * currency (199 kobo reads "₦2"), so anything that re-parses the field on
 * save silently rewrites a price nobody touched. These tests assert on the
 * exact `priceMinor` handed to createType.
 */

vi.mock("@/lib/api/consultations", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/consultations")>();
  return {
    ...actual,
    consultationsService: {
      getMyAvailability: vi.fn(),
      setMyAvailability: vi.fn(),
      getTypes: vi.fn(),
      createType: vi.fn(),
      deleteType: vi.fn(),
      getMyExceptions: vi.fn(),
      createException: vi.fn(),
      deleteException: vi.fn(),
    },
  };
});

vi.mock("@/lib/api/utility", () => ({
  utilityService: { getPlatformConfig: vi.fn() },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "d-1", role: "DIETITIAN" } }),
}));

// The timezone picker is irrelevant here and mounts a listbox over the panel.
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value }: { value: string }) => (
    <input aria-label="Timezone" value={value} readOnly />
  ),
}));

const svc = vi.mocked(consultationsService);

/** An existing active type for this provider, as the API returns it. */
const savedType = (over: Partial<{ priceMinor: number; currency: string }>) => ({
  id: "type-1",
  name: "Standard consultation",
  providerRole: "DIETITIAN",
  defaultDurationMinutes: 30,
  bufferMinutes: 0,
  minAdvanceNoticeMinutes: 0,
  isActive: true,
  priceMinor: null as number | null,
  currency: null as string | null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  svc.getMyAvailability.mockResolvedValue({ success: true, data: [] } as never);
  svc.getMyExceptions.mockResolvedValue({ success: true, data: [] } as never);
  svc.getTypes.mockResolvedValue({ success: true, data: [] } as never);
  svc.deleteType.mockResolvedValue({ success: true, data: {} } as never);
  svc.createType.mockResolvedValue({
    success: true,
    data: { id: "type-2" },
  } as never);
  vi.mocked(utilityService).getPlatformConfig.mockResolvedValue({
    success: true,
    data: { currencies: [{ code: "NGN", is_active: true }, { code: "USD", is_active: true }] },
  } as never);
});

const priceField = () =>
  screen.getByLabelText("Session price") as HTMLInputElement;

/** Session Settings has its own Save; the Weekly Schedule one comes first. */
const saveSession = async (user: ReturnType<typeof userEvent.setup>) => {
  const saves = screen.getAllByRole("button", { name: "Save" });
  await user.click(saves[saves.length - 1]);
};

const renderPanel = async (price?: { priceMinor: number; currency: string }) => {
  if (price) {
    svc.getTypes.mockResolvedValue({
      success: true,
      data: [savedType(price)],
    } as never);
  }
  // act-wrapped so the three mount fetches settle before any assertion.
  await act(async () => {
    render(<ConsultationAvailabilityManager description="Set your hours." />);
  });
  if (price) await waitFor(() => expect(priceField().value).not.toBe(""));
  return userEvent.setup();
};

const savedPrice = () => {
  expect(svc.createType).toHaveBeenCalledTimes(1);
  return svc.createType.mock.calls[0][0] as {
    priceMinor?: number;
    currency?: string;
  };
};

describe("ConsultationAvailabilityManager, session price round-trip", () => {
  it("saves an untouched prefilled price back EXACTLY as it was loaded", async () => {
    // 199 kobo displays as "₦2". Re-parsing that string on save turned the
    // price into 200 — a silent 0.5% raise every time the provider pressed
    // Save on an unrelated setting.
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    expect(priceField().value).toBe("₦2");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBe(199);
  });

  it("does not round a large prefilled price on the way back out", async () => {
    // ₦120,000.50 displays as "₦120,001" and used to save as 12,000,100.
    const user = await renderPanel({ priceMinor: 12_000_050, currency: "NGN" });
    expect(priceField().value).toBe("₦120,001");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBe(12_000_050);
  });

  it("keeps the cents of a prefilled price across a currency round-trip", async () => {
    const user = await renderPanel({ priceMinor: 1234, currency: "USD" });
    expect(priceField().value).toBe("$12.34");

    const currency = screen.getByLabelText("Price currency");
    // A whole-unit currency cannot render the cents…
    await user.selectOptions(currency, "NGN");
    expect(priceField().value).toBe("₦12");
    // …but they are not gone: switching back brings them straight back. This
    // used to settle on "$12.00", the cents dropped on the way through NGN.
    await user.selectOptions(currency, "USD");
    expect(priceField().value).toBe("$12.34");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    expect(savedPrice()).toMatchObject({ priceMinor: 1234, currency: "USD" });
  });

  it("sends the new amount once the user actually edits the field", async () => {
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    await user.clear(priceField());
    await user.type(priceField(), "25000");
    expect(priceField().value).toBe("₦25,000");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBe(2_500_000);
  });

  it("un-sets the price when the field is cleared", async () => {
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    await user.clear(priceField());
    expect(priceField().value).toBe("");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    // The call replaces the archived type rather than patching it, so omitting
    // the price is what removes it.
    expect(savedPrice().priceMinor).toBeUndefined();
    expect(savedPrice().currency).toBeUndefined();
  });

  it("rejects a price of exactly 0 out loud instead of dropping it", async () => {
    // A typed 0 passed the "must be a positive amount" check and was then
    // omitted from the payload: nothing saved, no error, no explanation.
    const user = await renderPanel();
    await user.type(priceField(), "0");
    expect(priceField().value).toBe("₦0");

    await saveSession(user);
    await waitFor(() =>
      expect(
        screen.getByText(/Session price must be a positive amount/),
      ).toBeInTheDocument(),
    );
    expect(svc.createType).not.toHaveBeenCalled();
  });

  it("saves the rest of the settings when no price is set at all", async () => {
    const user = await renderPanel();
    expect(priceField().value).toBe("");

    await saveSession(user);
    await waitFor(() => expect(svc.createType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBeUndefined();
    expect(
      screen.getByText("Session settings saved."),
    ).toBeInTheDocument();
  });
});
