import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { consultationsService } from "@/lib/api/consultations";
import { currency } from "../setup/currencyFixtures";

/**
 * The money round-trip on the one surface where a saved price actually
 * changes value. The formatted display string is LOSSY for a whole-unit
 * currency (199 kobo reads "₦2"), so anything that re-parses the field on
 * save silently rewrites a price nobody touched. These tests assert on the
 * exact `priceMinor` handed to the save call.
 *
 * Session settings live on the provider's OWN session type. They used to be
 * saved by archiving the platform-wide type and recreating it, which
 * re-priced every provider of that role; the manager must now PATCH the
 * provider's own type, or POST one when they have none, and never touch
 * DELETE /consultations/types.
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
      getOwnTypes: vi.fn(),
      createOwnType: vi.fn(),
      updateOwnType: vi.fn(),
      createType: vi.fn(),
      deleteType: vi.fn(),
      getMyExceptions: vi.fn(),
      createException: vi.fn(),
      deleteException: vi.fn(),
    },
  };
});

// The platform list: NGN and USD can be priced in, GHS is enabled but not
// yet on our payment account.
const CURRENCIES = [
  currency("NGN"),
  currency("USD"),
  currency("GHS", { selectable: { price: false, charge_card: false } }),
];
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: CURRENCIES, all: CURRENCIES, isLoading: false }),
}));

const org = vi.hoisted(() => ({ currentOrg: { _id: "o1", currency: "NGN" } as { _id: string; currency?: string } | null }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => org,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "d-1", role: "DIETITIAN" } }),
}));

// A native stand-in so the currency picker can be driven with selectOptions;
// the `id` keeps the component's <label htmlFor> association intact.
vi.mock("@/components/SearchableSelect", () => ({
  default: ({
    value,
    onChange,
    options,
    id,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    id?: string;
  }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const svc = vi.mocked(consultationsService);

/** An existing active type for this provider, as the API returns it. */
const savedType = (
  over: Partial<{
    id: string;
    name: string;
    priceMinor: number;
    currency: string;
    providerId: string | null;
    isActive: boolean;
  }>,
) => ({
  id: "type-1",
  providerId: "d-1" as string | null,
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
  svc.getOwnTypes.mockResolvedValue({ success: true, data: [] } as never);
  svc.createOwnType.mockResolvedValue({
    success: true,
    data: { id: "type-2" },
  } as never);
  svc.updateOwnType.mockResolvedValue({
    success: true,
    data: { id: "type-1" },
  } as never);
  org.currentOrg = { _id: "o1", currency: "NGN" };
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
    svc.getOwnTypes.mockResolvedValue({
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

/** The payload of the single save: a PATCH of the provider's own type. */
const savedPrice = () => {
  expect(svc.updateOwnType).toHaveBeenCalledTimes(1);
  expect(svc.updateOwnType.mock.calls[0][0]).toBe("type-1");
  return svc.updateOwnType.mock.calls[0][1] as {
    priceMinor?: number | null;
    currency?: string | null;
  };
};

/** The payload of a first save, which creates the provider's own type. */
const createdPayload = () => {
  expect(svc.createOwnType).toHaveBeenCalledTimes(1);
  return svc.createOwnType.mock.calls[0][0] as Record<string, unknown>;
};

describe("ConsultationAvailabilityManager, session price round-trip", () => {
  it("saves an untouched prefilled price back EXACTLY as it was loaded", async () => {
    // 199 kobo displays as "₦2". Re-parsing that string on save turned the
    // price into 200 — a silent 0.5% raise every time the provider pressed
    // Save on an unrelated setting.
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    expect(priceField().value).toBe("₦2");

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBe(199);
  });

  it("does not round a large prefilled price on the way back out", async () => {
    // ₦120,000.50 displays as "₦120,001" and used to save as 12,000,100.
    const user = await renderPanel({ priceMinor: 12_000_050, currency: "NGN" });
    expect(priceField().value).toBe("₦120,001");

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
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
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(savedPrice()).toMatchObject({ priceMinor: 1234, currency: "USD" });
  });

  it("sends the new amount once the user actually edits the field", async () => {
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    await user.clear(priceField());
    await user.type(priceField(), "25000");
    expect(priceField().value).toBe("₦25,000");

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(savedPrice().priceMinor).toBe(2_500_000);
  });

  it("un-sets the price when the field is cleared", async () => {
    const user = await renderPanel({ priceMinor: 199, currency: "NGN" });
    await user.clear(priceField());
    expect(priceField().value).toBe("");

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    // A PATCH leaves omitted fields alone, so clearing sends null.
    expect(savedPrice().priceMinor).toBeNull();
    expect(savedPrice().currency).toBeNull();
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
    expect(svc.createOwnType).not.toHaveBeenCalled();
    expect(svc.updateOwnType).not.toHaveBeenCalled();
  });

  it("saves the rest of the settings when no price is set at all", async () => {
    const user = await renderPanel();
    expect(priceField().value).toBe("");

    await saveSession(user);
    await waitFor(() => expect(svc.createOwnType).toHaveBeenCalled());
    expect(createdPayload().priceMinor).toBeUndefined();
    expect(
      screen.getByText("Session settings saved."),
    ).toBeInTheDocument();
  });
});

describe("ConsultationAvailabilityManager, whose session is saved", () => {
  it("never archives a platform type, and patches the provider's own", async () => {
    const user = await renderPanel({ priceMinor: 500_000, currency: "NGN" });
    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(svc.deleteType).not.toHaveBeenCalled();
    expect(svc.createType).not.toHaveBeenCalled();
    expect(svc.createOwnType).not.toHaveBeenCalled();
    expect(svc.getTypes).not.toHaveBeenCalled();
  });

  it("ignores an archived own type and starts from the platform default", async () => {
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [savedType({ id: "old", isActive: false, priceMinor: 100 })],
    } as never);
    svc.getTypes.mockResolvedValue({
      success: true,
      data: [
        savedType({
          id: "platform-1",
          providerId: null,
          name: "Nutrition consult",
          priceMinor: 1_500_000,
          currency: "NGN",
        }),
      ],
    } as never);
    const user = await renderPanel();
    await waitFor(() => expect(priceField().value).toBe("₦15,000"));
    expect(svc.getTypes).toHaveBeenCalledWith({ providerId: "d-1" });

    await saveSession(user);
    await waitFor(() => expect(svc.createOwnType).toHaveBeenCalled());
    expect(createdPayload()).toMatchObject({
      name: "Nutrition consult",
      priceMinor: 1_500_000,
      currency: "NGN",
      isActive: true,
    });
    // The role comes from the account on this endpoint.
    expect(createdPayload()).not.toHaveProperty("providerRole");
    expect(svc.updateOwnType).not.toHaveBeenCalled();
    expect(svc.deleteType).not.toHaveBeenCalled();
  });

  it("names a first session 1:1 session when there is no default either", async () => {
    const user = await renderPanel();
    await saveSession(user);
    await waitFor(() => expect(svc.createOwnType).toHaveBeenCalled());
    expect(createdPayload().name).toBe("1:1 session");
  });

  it("patches the new session on the next save instead of creating another", async () => {
    const user = await renderPanel();
    await saveSession(user);
    await waitFor(() => expect(svc.createOwnType).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText("Session settings saved.")).toBeInTheDocument(),
    );

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(svc.updateOwnType.mock.calls[0][0]).toBe("type-2");
    expect(svc.createOwnType).toHaveBeenCalledTimes(1);
  });

  it("shows a 409 in the card and points the next save at the existing session", async () => {
    svc.createOwnType.mockResolvedValue({
      success: false,
      status: 409,
      message: 'You already have a session called "1:1 session"',
    } as never);
    const user = await renderPanel();
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [savedType({ id: "dup-1", name: "1:1 session" })],
    } as never);

    await saveSession(user);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /already have a session called "1:1 session"/,
      ),
    );

    await saveSession(user);
    await waitFor(() => expect(svc.updateOwnType).toHaveBeenCalled());
    expect(svc.updateOwnType.mock.calls[0][0]).toBe("dup-1");
  });

  it("blocks saving when the provider's own sessions could not be loaded", async () => {
    svc.getOwnTypes.mockResolvedValue({
      success: false,
      message: "Network error",
    } as never);
    const user = await renderPanel();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /couldn't load your session settings/,
      ),
    );
    await saveSession(user);
    expect(svc.createOwnType).not.toHaveBeenCalled();
    expect(svc.updateOwnType).not.toHaveBeenCalled();
  });
});

describe("ConsultationAvailabilityManager currency picker", () => {
  const options = () =>
    Array.from(
      (screen.getByLabelText("Price currency") as HTMLSelectElement).options,
    ).map((o) => o.value);

  it("offers only currencies prices can be set in", async () => {
    await renderPanel();
    expect(options()).toEqual(["NGN", "USD"]);
  });

  it("keeps a saved session's currency visible when it is no longer offered", async () => {
    await renderPanel({ priceMinor: 5_000, currency: "GHS" });
    expect(options()).toEqual(["NGN", "USD", "GHS"]);
  });

  it("starts from the org's default, not a guessed NGN", async () => {
    org.currentOrg = { _id: "o1", currency: "USD" };
    await renderPanel();
    expect((screen.getByLabelText("Price currency") as HTMLSelectElement).value).toBe("USD");
  });

  it("asks for a currency when the org's default can't be priced in", async () => {
    org.currentOrg = { _id: "o1", currency: "GHS" };
    const user = await renderPanel();
    await user.type(priceField(), "5000");
    await saveSession(user);
    expect(
      await screen.findByText("Choose the currency your session is priced in."),
    ).toBeInTheDocument();
    expect(svc.createOwnType).not.toHaveBeenCalled();
  });

  it("shows the server's reasons when the currency is refused", async () => {
    svc.createOwnType.mockResolvedValue({
      success: false,
      code: "CURRENCY_NOT_SELECTABLE",
      message: "Prices can't be set in NGN right now.",
      details: { reasons: [{ code: "platform_disabled", message: "Turned off on the platform" }] },
    } as never);
    const user = await renderPanel();
    await user.type(priceField(), "5000");
    await saveSession(user);
    expect(
      await screen.findByText("Prices can't be set in NGN right now. Turned off on the platform."),
    ).toBeInTheDocument();
  });
});
