"use client";

import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { teamsService } from "@/lib/api/teams";
import { SUPPORTED_CURRENCIES } from "@/lib/constants/regions";

/**
 * The one live control on the (otherwise static) settings page: the org's
 * default currency. Reads from the current organization and saves on change.
 */
export function OrgCurrencyField() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const value = picked ?? currentOrg?.currency ?? "USD";

  const onChange = async (code: string) => {
    setPicked(code);
    if (!currentOrg?._id) return;
    setStatus("saving");
    try {
      const res = await teamsService.updateOrganization(currentOrg._id, { currency: code });
      setStatus(res.success ? "saved" : "error");
      if (res.success) void refreshOrganizations();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="org-default-currency"
        className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
        style={{ color: "var(--fg-3)" }}
      >
        Default currency
      </label>
      <select
        id="org-default-currency"
        value={value}
        onChange={(e) => void onChange(e.target.value)}
        disabled={!currentOrg}
        className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]"
        style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.currencyCode} value={c.currencyCode}>
            {c.currencyCode} · {c.symbol} — {c.regionName}
          </option>
        ))}
      </select>
      <span className="text-[11px]" style={{ color: status === "error" ? "var(--danger, #b00020)" : "var(--fg-3)" }}>
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved — new plans and listings will use this currency."}
        {status === "error" && "Couldn't save. Try again."}
        {status === "idle" && "Used for new membership plans, listings, and revenue display."}
      </span>
    </div>
  );
}
