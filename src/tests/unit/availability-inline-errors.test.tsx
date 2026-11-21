import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AVAILABILITY_ISSUE_COPY as COPY, availabilityFixToast } from "@/lib/constants/availabilityCopy";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { consultationsService } from "@/lib/api/consultations";
import { currency } from "../setup/currencyFixtures";

/**
 * Availability errors are said next to the field that is wrong: the message
 * under the range or setting, the field outlined, the first problem scrolled
 * into view, and the toast only counting them. Only errors that are not about
 * one field (a network failure) stay in the banner.
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

const toastError = vi.hoisted(() => vi.fn());
vi.mock("@/components/Toast", () => ({
  toast: { error: toastError, success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const svc = vi.mocked(consultationsService);

beforeEach(() => {
  vi.clearAllMocks();
  svc.getMyExceptions.mockResolvedValue({ success: true, data: [] } as never);
  svc.getTypes.mockResolvedValue({ success: true, data: [] } as never);
  svc.getOwnTypes.mockResolvedValue({ success: true, data: [] } as never);
  svc.getMyAvailability.mockResolvedValue({
    success: true,
    data: [rule("r1", 1, "09:00", "17:00"), rule("r3", 3, "09:00", "17:00")],
  } as never);
  svc.setMyAvailability.mockResolvedValue({ success: true, data: [] } as never);
  svc.createException.mockResolvedValue({ success: true, data: { id: "e1", date: "2026-12-10", type: "UNAVAILABLE" } } as never);
});

const rule = (id: string, dayOfWeek: number, startTime: string, endTime: string) => ({
  id,
  dayOfWeek,
  startTime,
  endTime,
  timezone: "Africa/Lagos",
  isActive: true,
});

const renderPanel = async () => {
  await act(async () => {
    render(<ConsultationAvailabilityManager description="Set your hours." />);
  });
  await screen.findAllByLabelText("Monday start");
};

const saveHours = () =>
  fireEvent.click(within(document.getElementById("hours")!).getByRole("button", { name: "Save" }));
const saveSession = () =>
  fireEvent.click(within(document.getElementById("session")!).getByRole("button", { name: "Save" }));
const setTime = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
/** The page banner above the tabs: only for errors that aren't about one field. */
const banner = () => document.querySelector(".mb-6.rounded-\\(--r-2\\)");


describe("weekly hours: errors by the range", () => {
  it("says an end before the start under that range, outlines the end, and saves nothing", async () => {
    await renderPanel();
    setTime("Wednesday end", "08:00");
    saveHours();

    expect(await screen.findByText(COPY.endBeforeStart)).toBeInTheDocument();
    expect(screen.getByLabelText("Wednesday end")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Wednesday start")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Wednesday end")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("hours-issue-r3"),
    );
    expect(screen.getByLabelText("Wednesday end").closest("[data-hours-issue]")).not.toBeNull();
    expect(toastError).toHaveBeenCalledWith(availabilityFixToast(1, "time"));
    expect(banner()).toBeNull();
    expect(svc.setMyAvailability).not.toHaveBeenCalled();
  });

  it("marks every problem at once and counts them in the toast", async () => {
    await renderPanel();
    setTime("Monday end", "08:00");
    setTime("Wednesday end", "");
    saveHours();

    expect(await screen.findByText(COPY.endBeforeStart)).toBeInTheDocument();
    expect(screen.getByText(COPY.endMissing)).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith(availabilityFixToast(2, "time"));
  });

  it("says a cleared start time instead of sending it", async () => {
    await renderPanel();
    setTime("Monday start", "");
    saveHours();
    expect(await screen.findByText(COPY.startMissing)).toBeInTheDocument();
    expect(screen.getByLabelText("Monday start")).toHaveAttribute("aria-invalid", "true");
    expect(svc.setMyAvailability).not.toHaveBeenCalled();
  });

  it("catches two ranges on the same day that overlap, on the later one", async () => {
    svc.getMyAvailability.mockResolvedValue({
      success: true,
      data: [rule("a", 1, "09:00", "17:00"), rule("b", 1, "12:00", "14:00")],
    } as never);
    await renderPanel();
    saveHours();

    expect(await screen.findByText(COPY.overlap("09:00", "17:00"))).toBeInTheDocument();
    const [first, second] = screen.getAllByLabelText("Monday start");
    expect(first).not.toHaveAttribute("aria-invalid");
    expect(second).toHaveAttribute("aria-invalid", "true");
    expect(svc.setMyAvailability).not.toHaveBeenCalled();
  });

  it("lets back-to-back ranges save", async () => {
    svc.getMyAvailability.mockResolvedValue({
      success: true,
      data: [rule("a", 1, "09:00", "12:00"), rule("b", 1, "12:00", "14:00")],
    } as never);
    await renderPanel();
    saveHours();
    await waitFor(() => expect(svc.setMyAvailability).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the message as soon as the range is fixed", async () => {
    await renderPanel();
    setTime("Wednesday end", "08:00");
    saveHours();
    expect(await screen.findByText(COPY.endBeforeStart)).toBeInTheDocument();
    setTime("Wednesday end", "18:00");
    expect(screen.queryByText(COPY.endBeforeStart)).toBeNull();
    expect(screen.getByLabelText("Wednesday end")).not.toHaveAttribute("aria-invalid");
  });

  it("puts a refusal the API names by position under that range", async () => {
    svc.setMyAvailability.mockResolvedValue({
      success: false,
      message: ["rules.1.startTime must match /^([01]\\d|2[0-3]):([0-5]\\d)$/ regular expression"],
    } as never);
    await renderPanel();
    saveHours();
    expect(await screen.findByText(COPY.badTime)).toBeInTheDocument();
    // Payload index 1 is Wednesday's range (Monday is index 0).
    expect(screen.getByLabelText("Wednesday start")).toHaveAttribute("aria-invalid", "true");
    expect(banner()).toBeNull();
  });

  it("keeps an error that isn't about one range in the banner", async () => {
    svc.setMyAvailability.mockResolvedValue({ success: false, message: "Network error" } as never);
    await renderPanel();
    saveHours();
    await waitFor(() => expect(banner()).toHaveTextContent("Network error"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("session settings: errors by the field", () => {
  it("says a session length out of range under the length field", async () => {
    await renderPanel();
    const length = screen.getByLabelText("Session length");
    fireEvent.change(length, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("switch", { name: "Free" }));
    saveSession();
    expect(await screen.findByText(COPY.sessionLength)).toBeInTheDocument();
    expect(length).toHaveAttribute("aria-invalid", "true");
    expect(length).toHaveAttribute("aria-describedby", "session-issue-duration");
    expect(toastError).toHaveBeenCalledWith(availabilityFixToast(1, "setting"));
    expect(svc.createOwnType).not.toHaveBeenCalled();
  });

  it("says every bad setting at once", async () => {
    await renderPanel();
    fireEvent.change(screen.getByLabelText("Buffer between sessions"), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText("Minimum advance notice"), { target: { value: "200" } });
    saveSession();
    expect(await screen.findByText(COPY.buffer)).toBeInTheDocument();
    expect(screen.getByText(COPY.advanceNotice)).toBeInTheDocument();
    expect(screen.getByText(COPY.priceMissing)).toBeInTheDocument();
    expect(screen.getByLabelText("Session price")).toHaveAttribute("aria-invalid", "true");
    expect(toastError).toHaveBeenCalledWith(availabilityFixToast(3, "setting"));
  });
});

describe("blocked dates: errors by the field", () => {
  const openBlocked = () => fireEvent.click(screen.getByRole("button", { name: "Blocked Dates" }));
  const dates = () => document.querySelectorAll<HTMLInputElement>('input[type="date"]');

  it("says an end date before the start under the To field", async () => {
    await renderPanel();
    openBlocked();
    fireEvent.click(screen.getByRole("button", { name: "Date range" }));
    fireEvent.change(dates()[0], { target: { value: "2026-12-10" } });
    fireEvent.change(dates()[1], { target: { value: "2026-12-05" } });
    fireEvent.click(screen.getByRole("button", { name: /Block range/ }));

    expect(await screen.findByText(COPY.endDateBeforeStart)).toBeInTheDocument();
    expect(dates()[1]).toHaveAttribute("aria-invalid", "true");
    expect(dates()[0]).not.toHaveAttribute("aria-invalid");
    expect(toastError).toHaveBeenCalledWith(availabilityFixToast(1, "field", "blocking"));
    expect(banner()).toBeNull();
    expect(svc.createException).not.toHaveBeenCalled();
  });

  it("says a range over 31 days under the To field", async () => {
    await renderPanel();
    openBlocked();
    fireEvent.click(screen.getByRole("button", { name: "Date range" }));
    fireEvent.change(dates()[0], { target: { value: "2026-12-01" } });
    fireEvent.change(dates()[1], { target: { value: "2027-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: /Block range/ }));
    expect(await screen.findByText(COPY.rangeTooLong)).toBeInTheDocument();
  });

  it("checks custom hours before the API does, under the End field", async () => {
    const user = userEvent.setup();
    await renderPanel();
    openBlocked();
    fireEvent.change(dates()[0], { target: { value: "2026-12-10" } });
    await user.click(screen.getByRole("button", { name: "Custom hours" }));
    const times = document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    fireEvent.change(times[0], { target: { value: "14:00" } });
    fireEvent.change(times[1], { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: /Block date/ }));

    expect(await screen.findByText(COPY.endBeforeStart)).toBeInTheDocument();
    expect(times[1]).toHaveAttribute("aria-invalid", "true");
    expect(svc.createException).not.toHaveBeenCalled();
  });

  it("keeps a failed add (not about one field) in the banner", async () => {
    svc.createException.mockResolvedValue({ success: false, message: "Network error" } as never);
    await renderPanel();
    openBlocked();
    fireEvent.change(dates()[0], { target: { value: "2026-12-10" } });
    fireEvent.click(screen.getByRole("button", { name: /Block date/ }));
    await waitFor(() => expect(banner()).toHaveTextContent("Network error"));
  });
});
