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
 */
interface TaxValues {
  label: string;
  rate: string;
  inclusive: boolean;
}

export function TaxSettingsCard() {
  const { currentOrg } = useOrganization();
  const { data: org } = useOrganizationDetails(currentOrg?._id);
  if (!currentOrg || !org) return null;
  const initial: TaxValues = {
    label: org.tax_label ?? "",
    rate: org.tax_rate != null ? String(org.tax_rate) : "",
    inclusive: taxIsInclusive(org),
  };
  // Re-keyed on the saved values so the form restarts from what was saved.
  return <TaxSettingsForm key={JSON.stringify(initial)} orgId={currentOrg._id} initial={initial} />;
}

function TaxSettingsForm({ orgId, initial }: { orgId: string; initial: TaxValues }) {
  const { refreshOrganizations } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [label, setLabel] = useState(initial.label);
  const [rate, setRate] = useState(initial.rate);
  const [inclusive, setInclusive] = useState(initial.inclusive);

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

  const save = async () => {
    if (rateInvalid || parsed === null) return;
    const res = await updateOrg.mutateAsync({
      orgId,
      data: { tax_rate: parsed, tax_inclusive: inclusive, tax_label: label.trim() || undefined },
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
          Used only for the estimate on your Tax page. Enter the rate that applies to you. Until you save one, no estimate is shown. Choose "No tax rate" to remove a saved rate and its estimate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="tax-label">Tax name</Eyebrow>
            <input id="tax-label" value={label} maxLength={32} placeholder="VAT" onChange={(e) => setLabel(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="tax-rate">Tax rate %</Eyebrow>
            <input id="tax-rate" type="number" inputMode="decimal" min={0} max={100} step="any" value={rate} onChange={(e) => setRate(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} aria-invalid={rateInvalid} />
            {rateInvalid && <span className="text-[12px]" style={{ color: "var(--danger)" }}>Enter a rate from 0 to 100.</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="tax-inclusive">Amounts include tax</Eyebrow>
            <div className="flex items-center gap-2.5 py-2.75">
              <button
                id="tax-inclusive"
                type="button"
                role="switch"
                aria-checked={inclusive}
                onClick={() => setInclusive((v) => !v)}
                className="w-[30px] h-[18px] rounded-full relative cursor-pointer shrink-0"
                style={{ background: inclusive ? "var(--ink)" : "var(--border-2)", border: "none", padding: 0 }}
              >
                <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: inclusive ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
              </button>
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                {inclusive ? "Amounts already include tax" : "Tax is added on top of amounts"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost-v2 sm mt-4"
          onClick={() => void save()}
          disabled={updateOrg.isPending || rateInvalid || parsed === null || unchanged}
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
