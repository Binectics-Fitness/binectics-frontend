"use client";

import { useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationDetails, useUpdateOrganization } from "@/lib/queries/teams";
import { writeErrorMessage } from "@/lib/currencies/helpers";
import { taxIsInclusive } from "@/lib/tax/taxInclusive";

const INPUT_STYLE = { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink)" } as const;
const INPUT_CLASS = "rounded-(--r-2) px-3.5 py-2.75 text-[14px] w-full";

/** Parse the rate box: empty is "unset" (null); otherwise a number 0-100, else NaN. */
export function parseTaxRate(text: string): number | null {
  const t = text.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : Number.NaN;
}

/**
 * The tax settings a trainer or dietitian saves on their own workspace: the
 * same three fields (tax_rate as a percent from 0 to 100, tax_inclusive,
 * tax_label up to 32 characters) the gym owner edits in Settings, saved the
 * same way (PATCH of the organization, which the API allows only to people
 * who manage it). They drive the estimate on the Tax page and nothing else.
 * An empty rate means "not set": no estimate is made and none is assumed.
 * Whether amounts already include tax is an explicit choice: nothing is
 * pre-selected until it has been saved once, and saving a rate requires it.
 */
interface TaxValues {
  label: string;
  rate: string;
  /** null = never answered. */
  inclusive: boolean | null;
}

export function TaxSettingsCard() {
  const { currentOrg } = useOrganization();
  const { data: org } = useOrganizationDetails(currentOrg?._id);
  if (!currentOrg || !org) return null;
  const initial: TaxValues = {
    label: org.tax_label ?? "",
    rate: org.tax_rate != null ? String(org.tax_rate) : "",
    inclusive: taxIsInclusive(org) ?? null,
  };
  // Re-keyed on the saved values so the form restarts from what was saved.
  return <TaxSettingsForm key={JSON.stringify(initial)} orgId={currentOrg._id} initial={initial} />;
}

function TaxSettingsForm({ orgId, initial }: { orgId: string; initial: TaxValues }) {
  const { refreshOrganizations } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [label, setLabel] = useState(initial.label);
  const [rate, setRate] = useState(initial.rate);
  const [inclusive, setInclusive] = useState<boolean | null>(initial.inclusive);

  const parsed = parseTaxRate(rate);
  const rateInvalid = Number.isNaN(parsed);
  const unchanged = label === initial.label && rate === initial.rate && inclusive === initial.inclusive;

  const clear = async () => {
    const res = await updateOrg.mutateAsync({ orgId, data: { tax_rate: null } });
    if (res.success) {
      toast.success("Tax rate removed");
      void refreshOrganizations();
    } else {
      toast.error(writeErrorMessage(res, "We couldn't remove your tax rate. Try again."));
    }
  };

  // An empty name is sent as "" (not left out) so it clears a saved name; the
  // API shows "Tax" when the name is blank.
  const save = async () => {
    if (rateInvalid || parsed === null || inclusive === null) return;
    const res = await updateOrg.mutateAsync({
      orgId,
      data: { tax_rate: parsed, tax_inclusive: inclusive, tax_label: label.trim() },
    });
    if (res.success) {
      toast.success("Tax settings saved");
      void refreshOrganizations();
    } else {
      toast.error(writeErrorMessage(res, "We couldn't save your tax settings. Try again."));
    }
  };

  return (
    <DSCard className="p-5.5">
      <section id="tax" aria-labelledby="tax-settings-heading">
        <h2 id="tax-settings-heading" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Tax</h2>
        <p className="text-[13px] mt-1 max-w-[62ch]" style={{ color: "var(--fg-3)" }}>
          Used only for the estimate on your Tax page. Enter the rate that applies to you. Until you save one, no estimate is shown. Choose &ldquo;No tax rate&rdquo; to remove a saved rate and its estimate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="tax-label">Tax name</Eyebrow>
            <input id="tax-label" value={label} maxLength={32} placeholder="Tax" onChange={(e) => setLabel(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="tax-rate">Tax rate %</Eyebrow>
            <input id="tax-rate" type="number" inputMode="decimal" min={0} max={100} step="any" value={rate} onChange={(e) => setRate(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} aria-invalid={rateInvalid} />
            {rateInvalid && <span className="text-[12px]" style={{ color: "var(--danger)" }}>Enter a rate from 0 to 100.</span>}
          </div>
          <fieldset className="flex flex-col gap-1.5 min-w-0" style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className="mb-1.5"><Eyebrow>Do your prices already include tax?</Eyebrow></legend>
            <div role="radiogroup" aria-label="Do your prices already include tax?" className="flex flex-col gap-2 py-1">
              {([
                [true, "Yes, prices include tax"],
                [false, "No, tax is added on top"],
              ] as const).map(([value, text]) => (
                <label key={String(value)} className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "var(--ink)" }}>
                  <input type="radio" name="tax-inclusive" checked={inclusive === value} onChange={() => setInclusive(value)} />
                  {text}
                </label>
              ))}
            </div>
            {inclusive === null && (
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>Choose one to save your tax settings.</span>
            )}
          </fieldset>
        </div>
        <button
          type="button"
          className="btn-ghost-v2 sm mt-4"
          onClick={() => void save()}
          disabled={updateOrg.isPending || rateInvalid || parsed === null || inclusive === null || unchanged}
        >
          {updateOrg.isPending ? "Saving…" : "Save tax settings"}
        </button>
        {initial.rate !== "" && (
          <button type="button" className="btn-ghost-v2 sm mt-4 ml-2" onClick={() => void clear()} disabled={updateOrg.isPending}>
            No tax rate
          </button>
        )}
      </section>
    </DSCard>
  );
}
