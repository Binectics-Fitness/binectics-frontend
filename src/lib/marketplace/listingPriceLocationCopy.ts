/**
 * Every on-screen string of the listing price card and the gym plan location
 * picker. Must match `C` in binectics-plans/design/listing-price-location/build.py
 * (the board the screens are built to).
 */
import type { ListingPriceCadence } from "@/lib/types";

export const LISTING_PRICE_COPY = {
  cardTitle: "Price on your listing",
  cardDesc: "The “from” price clients see on your card in Explore.",
  legend: "Price shown on your listing",
  autoTitle: "From your cheapest session",
  autoDescPriced: (price: string) =>
    `${price} / session. Changes when your session prices change.`,
  autoDescNone:
    "You have no priced session yet, so your card shows no price. Add one under Availability.",
  customTitle: "Set my own",
  customDesc: "Type the price and what it buys.",
  customPriceLabel: "Price",
  customPerLabel: "Per",
  customPriceError: "Enter the price your card should show.",
} as const;

/** "Per" options for a typed price, in the order the board draws them. */
export const LISTING_PRICE_CADENCE_OPTIONS: { value: ListingPriceCadence; label: string }[] = [
  { value: "session", label: "Session" },
  { value: "recurring", label: "Recurring membership" },
  { value: "one_off", label: "One-off" },
];

export const PLAN_LOCATION_COPY = {
  label: "Location",
  placeholder: "Select location…",
  hint: "The listing that sells this plan.",
  required: "Choose which location sells this plan.",
  rowLocation: (name: string) => `At ${name}`,
} as const;

/** A location option: "headline · city", or just the headline. */
export function locationOptionLabel(l: { headline?: string; city?: string }): string {
  return [l.headline?.trim() || "Untitled listing", l.city?.trim()].filter(Boolean).join(" · ");
}
