"use client";

import { useId } from "react";
import type { OfferedConsent } from "@/lib/api/memberBilling";

/**
 * The auto-renew opt-in: the API's consent text, word for word, as the label
 * of a checkbox that starts unticked. Nothing here is computed: the amount,
 * the provider, the dates and the terms are all inside `consent.text`, which
 * the API hashes, so the member agrees to exactly what they read.
 */
export function AutoRenewConsentBox({
  consent,
  checked,
  onChange,
  notice,
  disabled,
}: {
  consent: OfferedConsent;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown above the text, e.g. when the terms changed since the page loaded. */
  notice?: string | null;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div
      className="rounded-(--r-3) border border-border bg-bg-2 p-4"
      data-testid="auto-renew-consent"
    >
      {notice && (
        <p role="status" className="mb-3 rounded-(--r-2) border border-warn bg-warn-soft px-3 py-2 text-[13px] text-warn-ink">
          {notice}
        </p>
      )}
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ accentColor: "var(--ink)" }}
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-[13.5px] leading-relaxed text-fg-2 whitespace-pre-line"
        >
          {consent.text}
        </label>
      </div>
    </div>
  );
}
