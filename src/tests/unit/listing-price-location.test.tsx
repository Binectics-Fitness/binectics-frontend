import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingPriceFields, type ListingPriceValue } from "@/components/provider/ListingPriceFields";
import { PlanForm } from "@/app/dashboard/gym-owner/plans/GymPlansClient";
import {
  LISTING_PRICE_COVERS_NONE,
  LISTING_PRICE_COVERS_OPTIONS,
  LISTING_PRICE_EVERY_OPTIONS,
  LISTING_PRICE_CADENCE_OPTIONS,
  LISTING_PRICE_COPY,
  PLAN_LOCATION_COPY,
  locationOptionLabel,
} from "@/lib/marketplace/listingPriceLocationCopy";
import { formatMinor } from "@/lib/currencies/helpers";
import type { CreateOrgMembershipPlanRequest } from "@/lib/api/marketplace";

/**
 * Board binectics-plans/design/listing-price-location: the solo listing's
 * price card (P1-P4) and the gym plan form's location picker (L1-L3). Every
 * string comes from the copy constants the board was drawn with.
 */

vi.mock("@/components/SearchableSelect", () => ({
  default: ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
  }) => (
    <select aria-label={placeholder ?? "select"} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder ?? "Choose"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

function PriceHarness({ initial, sessionPrice }: { initial: ListingPriceValue; sessionPrice: { price_minor: number; currency: string } | null }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <ListingPriceFields value={value} onChange={setValue} sessionPrice={sessionPrice} currency="NGN" />
      <output data-testid="state">{JSON.stringify(value)}</output>
    </>
  );
}

const AUTO: ListingPriceValue = { display: "auto", priceText: "", priceMinor: null, cadence: "session", periodDays: null };

describe("ListingPriceFields (P1-P3)", () => {
  it("P1: auto selected, the cheapest session's price in the option", () => {
    render(<PriceHarness initial={AUTO} sessionPrice={{ price_minor: 1_200_000, currency: "NGN" }} />);
    expect(screen.getByText(LISTING_PRICE_COPY.legend)).toBeInTheDocument();
    const auto = screen.getByRole("radio", { name: new RegExp(LISTING_PRICE_COPY.autoTitle) });
    expect(auto).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(LISTING_PRICE_COPY.autoDescPriced(formatMinor("NGN", 1_200_000)))).toBeInTheDocument();
    expect(screen.getByText(LISTING_PRICE_COPY.customDesc)).toBeInTheDocument();
    // No typed-price fields while auto.
    expect(screen.queryByLabelText(LISTING_PRICE_COPY.customPriceLabel)).toBeNull();
  });

  it("P2: Set my own shows the price and what it buys", async () => {
    const user = userEvent.setup();
    render(<PriceHarness initial={AUTO} sessionPrice={{ price_minor: 1_200_000, currency: "NGN" }} />);
    await user.click(screen.getByRole("radio", { name: new RegExp(LISTING_PRICE_COPY.customTitle) }));
    const price = screen.getByLabelText(LISTING_PRICE_COPY.customPriceLabel);
    await user.type(price, "15000");
    expect(screen.getByText(LISTING_PRICE_COPY.customPerLabel)).toBeInTheDocument();
    for (const o of LISTING_PRICE_CADENCE_OPTIONS) {
      expect(screen.getByRole("option", { name: o.label })).toBeInTheDocument();
    }
    const state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state).toMatchObject({ display: "custom", priceMinor: 1_500_000, cadence: "session" });
  });

  it("P5: a recurring price asks how often, starting on Monthly; switching to Session drops it", async () => {
    const user = userEvent.setup();
    render(
      <PriceHarness
        initial={{ display: "custom", priceText: "₦15,000", priceMinor: 1_500_000, cadence: "session", periodDays: null }}
        sessionPrice={null}
      />,
    );
    expect(screen.queryByText(LISTING_PRICE_COPY.customEveryLabel)).toBeNull();
    const [per] = screen.getAllByRole("combobox");
    await user.selectOptions(per, "recurring");
    expect(screen.getByText(LISTING_PRICE_COPY.customEveryLabel)).toBeInTheDocument();
    for (const o of LISTING_PRICE_EVERY_OPTIONS) {
      expect(screen.getByRole("option", { name: o.label })).toBeInTheDocument();
    }
    let state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state).toMatchObject({ cadence: "recurring", periodDays: 30 });

    await user.selectOptions(screen.getAllByRole("combobox")[1], "90");
    state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state.periodDays).toBe(90);

    await user.selectOptions(screen.getAllByRole("combobox")[0], "session");
    state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state).toMatchObject({ cadence: "session", periodDays: null });
    expect(screen.queryByText(LISTING_PRICE_COPY.customEveryLabel)).toBeNull();
  });

  it("P6: a one-off may say how long it covers, none by default", async () => {
    const user = userEvent.setup();
    render(
      <PriceHarness
        initial={{ display: "custom", priceText: "₦15,000", priceMinor: 1_500_000, cadence: "session", periodDays: null }}
        sessionPrice={null}
      />,
    );
    await user.selectOptions(screen.getAllByRole("combobox")[0], "one_off");
    expect(screen.getByText(LISTING_PRICE_COPY.customCoversLabel)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: LISTING_PRICE_COVERS_NONE })).toBeInTheDocument();
    for (const o of LISTING_PRICE_COVERS_OPTIONS) {
      expect(screen.getByRole("option", { name: o.label })).toBeInTheDocument();
    }
    let state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state).toMatchObject({ cadence: "one_off", periodDays: null });
    await user.selectOptions(screen.getAllByRole("combobox")[1], "90");
    state = JSON.parse(screen.getByTestId("state").textContent ?? "{}");
    expect(state.periodDays).toBe(90);
  });

  it("P3: no priced session says so", () => {
    render(<PriceHarness initial={AUTO} sessionPrice={null} />);
    expect(screen.getByText(LISTING_PRICE_COPY.autoDescNone)).toBeInTheDocument();
  });
});

describe("PlanForm location (L1-L3)", () => {
  const LOCATIONS = [
    { _id: "l1", headline: "Ikeja Branch", city: "Lagos" },
    { _id: "l2", headline: "Lekki Branch", city: "Lagos" },
  ];

  function renderForm(locations: typeof LOCATIONS, onSubmit = vi.fn()) {
    render(
      <PlanForm
        plans={[]}
        locations={locations}
        saving={false}
        defaultCurrency="NGN"
        onSubmit={onSubmit}
        onCancel={() => undefined}
        submitLabel="Create plan"
      />,
    );
    return onSubmit;
  }

  async function fillBasics() {
    const user = userEvent.setup();
    await user.type(screen.getAllByRole("textbox")[0], "Monthly unlimited");
    await user.type(screen.getByLabelText("Price (NGN)"), "25000");
    return user;
  }

  it("L1/L3: a 2-location gym must pick; the error is the copy", async () => {
    const onSubmit = renderForm(LOCATIONS);
    expect(screen.getByText(PLAN_LOCATION_COPY.label)).toBeInTheDocument();
    expect(screen.getByText(PLAN_LOCATION_COPY.hint)).toBeInTheDocument();
    for (const l of LOCATIONS) {
      expect(screen.getByRole("option", { name: locationOptionLabel(l) })).toBeInTheDocument();
    }
    const user = await fillBasics();
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    expect(screen.getByText(PLAN_LOCATION_COPY.required)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("L2: the picked location is sent as listing_id", async () => {
    const onSubmit = renderForm(LOCATIONS);
    const user = await fillBasics();
    await user.selectOptions(screen.getByLabelText(PLAN_LOCATION_COPY.placeholder), "l2");
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const sent = onSubmit.mock.calls[0][0] as CreateOrgMembershipPlanRequest;
    expect(sent.listing_id).toBe("l2");
    expect(sent.price_minor).toBe(2_500_000);
  });

  it("one listing (or none): no picker, no listing_id", async () => {
    const onSubmit = renderForm([]);
    expect(screen.queryByText(PLAN_LOCATION_COPY.label)).toBeNull();
    const user = await fillBasics();
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    expect((onSubmit.mock.calls[0][0] as CreateOrgMembershipPlanRequest).listing_id).toBeUndefined();
  });
});
