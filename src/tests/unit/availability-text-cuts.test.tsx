import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { consultationsService } from "@/lib/api/consultations";
import { currency } from "../setup/currencyFixtures";

/**
 * Phase 5 text cuts (W3) on the availability manager: the copy-Monday buttons
 * stay disabled, with the reason beside them, until Monday has hours, and the
 * section headers no longer explain their own controls.
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
// The org's MEMBERSHIP list would add GHS on its own Paystack account; a
// session price must never read it (bookings charge the platform account).
const orgPriceCurrencies = vi.hoisted(() => vi.fn());
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: CURRENCIES, all: CURRENCIES, isLoading: false }),
  useOrgPriceCurrencies: orgPriceCurrencies,
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

beforeEach(() => {
  vi.clearAllMocks();
  svc.getMyExceptions.mockResolvedValue({ success: true, data: [] } as never);
  svc.getTypes.mockResolvedValue({ success: true, data: [] } as never);
  svc.getOwnTypes.mockResolvedValue({ success: true, data: [] } as never);
});

const renderPanel = async () => {
  await act(async () => {
    render(<ConsultationAvailabilityManager description="Set your hours." />);
  });
};

describe("availability manager text cuts", () => {
  it("disables the copy-Monday buttons and says why while Monday has no hours", async () => {
    svc.getMyAvailability.mockResolvedValue({ success: true, data: [] } as never);
    await renderPanel();
    expect(screen.getByRole("button", { name: "Copy Mon to Tue–Fri" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy Mon to weekend" })).toBeDisabled();
    expect(screen.getByText("Set Monday first.")).toBeInTheDocument();
    expect(screen.getByText("Not available any day")).toBeInTheDocument();
    expect(screen.queryByText(/Toggle days/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Length, buffer time/)).not.toBeInTheDocument();
  });

  it("enables them once Monday has hours", async () => {
    svc.getMyAvailability.mockResolvedValue({
      success: true,
      data: [{ id: "a1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", timezone: "Africa/Lagos", isActive: true }],
    } as never);
    await renderPanel();
    await waitFor(() => expect(screen.getByRole("button", { name: "Copy Mon to Tue–Fri" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Copy Mon to weekend" })).toBeEnabled();
    expect(screen.queryByText("Set Monday first.")).not.toBeInTheDocument();
  });
});
