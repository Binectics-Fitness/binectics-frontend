"use client";

import { RadioCards } from "@/app/onboarding/_components";
import { MoneyInput } from "@/components/ds/MoneyInput";
import SearchableSelect from "@/components/SearchableSelect";
import { formatMinor } from "@/lib/currencies/helpers";
import {
  DEFAULT_RECURRING_DAYS,
  LISTING_PRICE_CADENCE_OPTIONS,
  LISTING_PRICE_COPY as COPY,
  LISTING_PRICE_COVERS_NONE,
  LISTING_PRICE_COVERS_OPTIONS,
  LISTING_PRICE_EVERY_OPTIONS,
} from "@/lib/marketplace/listingPriceLocationCopy";
import type { SessionPrice } from "@/lib/api/marketplace";
import type { ListingPriceCadence, ListingPriceDisplay } from "@/lib/types";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-10 rounded-(--r-2) px-3.5 text-[14px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

export interface ListingPriceValue {
  display: ListingPriceDisplay;
  /** The typed price as the field shows it ("₦15,000"). */
  priceText: string;
  /** The typed price in MINOR units; null when the field holds no number. */
  priceMinor: number | null;
  cadence: ListingPriceCadence;
  /**
   * Recurring: how often it repeats (required). One-off: how long it covers
   * (optional). Session: none. Days: 7, 30, 90 or 365.
   */
  periodDays: number | null;
}

/** The period a cadence keeps when the provider switches to it. */
function periodFor(cadence: ListingPriceCadence, current: number | null): number | null {
  if (cadence === "session") return null;
  if (cadence === "recurring") return current ?? DEFAULT_RECURRING_DAYS;
  return current;
}

/**
 * Where a solo listing's "from" price comes from (board P1-P4,
 * binectics-plans/design/listing-price-location): the provider's cheapest
 * priced session, kept in step by the API, or a price they type. The parent
 * saves it with the rest of the profile.
 */
export function ListingPriceFields({
  value,
  onChange,
  sessionPrice,
  currency,
  error,
  disabled,
}: {
  value: ListingPriceValue;
  onChange: (next: ListingPriceValue) => void;
  /** What "auto" would show; null when the provider sells no priced session. */
  sessionPrice: SessionPrice | null;
  /** The listing's currency, for the typed price. */
  currency: string;
  error?: string | null;
  disabled?: boolean;
}) {
  const autoDesc = sessionPrice
    ? COPY.autoDescPriced(formatMinor(sessionPrice.currency, sessionPrice.price_minor))
    : COPY.autoDescNone;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{COPY.legend}</span>
        <RadioCards
          label={COPY.legend}
          options={[
            { id: "auto", title: COPY.autoTitle, desc: autoDesc },
            { id: "custom", title: COPY.customTitle, desc: COPY.customDesc },
          ]}
          selected={value.display}
          onSelect={(id) => !disabled && onChange({ ...value, display: id as ListingPriceDisplay })}
        />
      </div>
      {value.display === "custom" && (
        <div className={`grid grid-cols-1 gap-3.5 ${value.cadence === "session" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{COPY.customPriceLabel}</span>
            <MoneyInput
              value={value.priceText}
              currency={currency}
              aria-label={COPY.customPriceLabel}
              placeholder={currency ? formatMinor(currency, 0) : "0"}
              disabled={disabled}
              onChange={(display, minor) => onChange({ ...value, priceText: display, priceMinor: minor })}
              className={INPUT_CLASS}
              style={{ ...INPUT_STYLE, fontVariantNumeric: "tabular-nums" }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{COPY.customPerLabel}</span>
            <SearchableSelect
              value={value.cadence}
              onChange={(v) => {
                const cadence = v as ListingPriceCadence;
                onChange({ ...value, cadence, periodDays: periodFor(cadence, value.periodDays) });
              }}
              options={LISTING_PRICE_CADENCE_OPTIONS}
            />
          </label>
          {value.cadence === "recurring" && (
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{COPY.customEveryLabel}</span>
              <SearchableSelect
                value={String(value.periodDays ?? DEFAULT_RECURRING_DAYS)}
                onChange={(v) => onChange({ ...value, periodDays: Number(v) })}
                options={LISTING_PRICE_EVERY_OPTIONS.map((o) => ({ value: String(o.days), label: o.label }))}
              />
            </label>
          )}
          {value.cadence === "one_off" && (
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{COPY.customCoversLabel}</span>
              <SearchableSelect
                value={value.periodDays ? String(value.periodDays) : "none"}
                onChange={(v) => onChange({ ...value, periodDays: v === "none" ? null : Number(v) })}
                options={[
                  { value: "none", label: LISTING_PRICE_COVERS_NONE },
                  ...LISTING_PRICE_COVERS_OPTIONS.map((o) => ({ value: String(o.days), label: o.label })),
                ]}
              />
            </label>
          )}
        </div>
      )}
      {error && <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>{error}</p>}
    </>
  );
}
