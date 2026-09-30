"use client";

import { useCallback, useEffect } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { useCurrencies } from "@/lib/queries/currencies";
import { currencyOptions, isSelectable, suggestCurrency } from "@/lib/currencies/helpers";
import { Field } from "./_components";
import { CURRENCY_MISSING } from "./_config";

/**
 * The currency a provider prices in, on step 1 of each provider track.
 *
 * The country only SUGGESTS it: the org's saved currency when prices can be
 * set in it, else the country's currency when the platform can take payment
 * in it. When neither applies the field starts empty and Continue asks for a
 * choice; there is no silent USD. Only currencies selectable for pricing are
 * offered.
 *
 * Until the person picks one themselves the suggestion follows the country.
 * Whenever the currency changes, prices typed later in the track are cleared:
 * relabelling "15,000" from naira to shillings would publish another price.
 */
export function OnboardingCurrencyField({
  data,
  setField,
  countryCode,
  countryName,
  orgCurrency,
  priceKeys,
  id,
}: {
  data: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
  /** ISO 3166 alpha-2 of the chosen country, if known. */
  countryCode: string | undefined;
  countryName: string;
  /** The workspace's saved currency, preferred when still selectable. */
  orgCurrency?: string | null;
  /** Display keys of prices in this currency; `${key}Minor` is cleared too. */
  priceKeys: readonly string[];
  id: string;
}) {
  const { all: list, isError } = useCurrencies();
  const current = typeof data.currency === "string" ? data.currency : "";
  const picked = data.currencyPicked === true;
  const missing = data[CURRENCY_MISSING] === true;

  const suggested = list
    ? isSelectable(orgCurrency, list, "price")
      ? orgCurrency!.toUpperCase()
      : suggestCurrency(countryCode, list)
    : undefined;

  const apply = useCallback(
    (next: string) => {
      if (current && next !== current) {
        for (const key of priceKeys) {
          setField(key, "");
          setField(`${key}Minor`, null);
        }
      }
      setField("currency", next);
    },
    [current, priceKeys, setField],
  );

  // Follow the suggestion until the person chooses for themselves.
  useEffect(() => {
    if (suggested === undefined || picked) return;
    const next = suggested ?? "";
    if (next !== current) apply(next);
  }, [suggested, picked, current, apply]);

  const options = currencyOptions(list, "price");
  const hint = !list
    ? isError
      ? "We couldn't load currencies. Check your connection and try again."
      : "Loading currencies..."
    : options.length === 0
      ? "No currency can be used for payments yet. Contact support to finish setting up."
      : suggested && current === suggested && !picked
        ? `Suggested for ${countryName}. Members pay in this currency. You can change it later in Settings.`
        : suggested === null && !current
          ? `We can't take payments in ${countryName}'s currency yet. Choose one we can.`
          : "Members pay in this currency. You can change it later in Settings.";

  return (
    <Field label="Currency you charge in" htmlFor={id} full>
      <SearchableSelect
        id={id}
        value={current}
        onChange={(v) => {
          setField("currencyPicked", true);
          setField(CURRENCY_MISSING, false);
          apply(v);
        }}
        options={options}
        placeholder={list ? "Choose currency" : "Loading..."}
        loading={!list && !isError}
      />
      <span
        role={missing ? "alert" : undefined}
        style={{ fontSize: 12, color: missing ? "var(--danger)" : "var(--fg-3)" }}
      >
        {missing ? "Choose the currency you charge in to continue." : hint}
      </span>
    </Field>
  );
}
