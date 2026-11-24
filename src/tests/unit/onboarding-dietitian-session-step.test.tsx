import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DietStep1, DietStep4 } from "@/app/onboarding/_dietitian";
import { dietitianSessionPatch } from "@/app/onboarding/_config";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";

// The steps start from the account's name and country; this account has neither.
const auth = vi.hoisted(() => ({ user: null as null | Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));

// Step 1 lists every country the API knows (/utility/countries).
vi.mock("@/lib/queries/utility", () => ({
  useCountries: () => ({
    data: [
      { code: "NG", name: "Nigeria", dialCode: "+234", cities: [] },
      { code: "ZA", name: "South Africa", dialCode: "+27", cities: [] },
      { code: "KE", name: "Kenya", dialCode: "+254", cities: [] },
      { code: "US", name: "United States", dialCode: "+1", cities: [] },
      { code: "FR", name: "France", dialCode: "+33", cities: [] },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: SEEDED_CURRENCIES, all: SEEDED_CURRENCIES, isError: false }),
}));

/** What the page's step data holds, written from setField like the page does. */
const latest: Record<string, unknown> = {};

function Harness({ initial = { currency: "NGN" }, Step = DietStep4 }: { initial?: Record<string, unknown>; Step?: typeof DietStep4 }) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const setField = (k: string, v: unknown) => {
    latest[k] = v;
    setData((d) => ({ ...d, [k]: v }));
  };
  return <Step data={data} setField={setField} />;
}

beforeEach(() => {
  auth.user = null;
  for (const k of Object.keys(latest)) delete latest[k];
  // What step 1 chose, as the page's data carries it into step 4.
  latest.currency = "NGN";
});

describe("dietitian consultation step", () => {
  it("prices in the currency chosen on step 1 and says what a price saves", async () => {
    latest.country = "South Africa";
    latest.currency = "ZAR";
    render(<Harness initial={{ country: "South Africa", currency: "ZAR" }} />);
    await userEvent.type(screen.getByLabelText("Price per session (ZAR)"), "450");
    expect(latest.sessionPriceMinor).toBe(45000);
    expect(screen.getByText(/Clients pay .*450 for a 60 min consultation\./)).toBeInTheDocument();
    expect(dietitianSessionPatch(latest)).toMatchObject({ priceMinor: 45000, currency: "ZAR" });
  });

  it("leaves nothing to save when untouched, and asks for a price or Free", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Price per session (NGN)")).toBeEnabled();
    expect(screen.getByText("Enter a price, or choose Free.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(dietitianSessionPatch(latest)).toBeNull();
  });

  it("says what is missing, as an alert, when Continue was pressed without an answer", () => {
    render(<Harness initial={{ currency: "NGN", sessionMissing: true }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a price, choose Free, or choose Set up later.");
    expect(screen.getByLabelText("Price per session (NGN)")).toHaveAccessibleDescription("Enter a price, choose Free, or choose Set up later.");
  });

  it("makes Free an explicit choice that disables the price and saves 0", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("switch", { name: "Free consultation" }));
    expect(screen.getByLabelText("Price per session (NGN)")).toBeDisabled();
    expect(screen.getByText("Clients book a 60 min consultation with you for free.")).toBeInTheDocument();
    expect(dietitianSessionPatch(latest)).toMatchObject({ priceMinor: 0, currency: "NGN" });
  });

  it("makes Set up later an explicit choice that excludes Free and saves nothing", async () => {
    render(<Harness initial={{ currency: "NGN", sessionMissing: true }} />);
    await userEvent.click(screen.getByRole("switch", { name: "Free consultation" }));
    await userEvent.click(screen.getByRole("switch", { name: "Set up later" }));
    expect(screen.getByRole("switch", { name: "Free consultation" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Set up later" })).toBeChecked();
    expect(screen.getByLabelText("Price per session (NGN)")).toBeDisabled();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(/Members can't book you until you set a price\./)).toBeInTheDocument();
    expect(latest.sessionMissing).toBe(false);
    expect(dietitianSessionPatch(latest)).toBeNull();
  });
});

describe("dietitian basics step", () => {
  it("labels its fields, so City and the rest have names", () => {
    render(<Harness Step={DietStep1} initial={{}} />);
    for (const name of ["Full name (with title)", "Pronouns", "City", "Currency you charge in", "Practice name (optional)"]) {
      expect(screen.getByLabelText(name)).toBeInTheDocument();
    }
  });

  it("uses the country's currency as a suggestion when it can be charged", () => {
    // The account is in Nigeria, and NGN is selectable.
    auth.user = { country_code: "NG" };
    render(<Harness Step={DietStep1} initial={{}} />);
    expect(latest.currency).toBe("NGN");
    expect(screen.getByText(/Suggested for Nigeria/)).toBeInTheDocument();
  });

  it("asks for a choice, with no USD fallback, when the country's currency can't be charged", () => {
    delete latest.currency;
    render(<Harness Step={DietStep1} initial={{ country: "Ghana" }} />);
    expect(latest.currency).toBeFalsy();
    expect(screen.getByText("We can't take payments in Ghana's currency yet. Choose one we can.")).toBeInTheDocument();
    expect(dietitianSessionPatch({ ...latest, country: "Ghana", sessionFree: true })).toBeNull();
  });

  it("clears a price typed in the old currency when the suggestion changes", () => {
    // NGN was suggested for Nigeria; the country is now Ghana, which has none.
    render(<Harness Step={DietStep1} initial={{ country: "Ghana", currency: "NGN", sessionPrice: "₦15,000", sessionPriceMinor: 1_500_000 }} />);
    expect(latest.currency).toBe("");
    expect(latest.sessionPriceMinor).toBeNull();
    expect(latest.sessionPrice).toBe("");
  });

  it("shows the missing-currency prompt as an alert after Continue", () => {
    render(<Harness Step={DietStep1} initial={{ country: "Ghana", currencyMissing: true }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the currency you charge in to continue.");
  });

  it("starts on no country, not Nigeria, when the account and the visit name none", () => {
    render(<Harness Step={DietStep1} initial={{}} />);
    expect(latest.country).toBeUndefined();
    expect(screen.getByText("Choose country")).toBeInTheDocument();
  });

  it("starts on the account's own country from the full list", () => {
    auth.user = { country_code: "fr" };
    render(<Harness Step={DietStep1} initial={{}} />);
    expect(latest.countryCode).toBe("FR");
    expect(latest.country).toBe("France");
  });
});
