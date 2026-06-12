"use client";

import SearchableSelect from "@/components/SearchableSelect";
import type { Organization } from "@/lib/api/teams";

function formatAccountType(accountType: Organization["account_type"]): string {
  return accountType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function OrganizationContextBanner({
  organizations,
  currentOrg,
  onChange,
  label = "Organization",
  helperText,
}: {
  organizations: Organization[];
  currentOrg: Organization | null;
  onChange: (org: Organization | null) => void;
  label?: string;
  helperText?: string;
}) {
  const options = organizations.map((org) => ({ label: org.name, value: org._id }));

  return (
    <div
      className="rounded-(--r-3) p-3.5 sm:p-4"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{ background: "var(--gym)", color: "oklch(0.98 0 0)" }}
          >
            {initials(currentOrg?.name ?? label)}
          </span>
          <div className="min-w-0">
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              {label}
            </div>
            <div
              className="mt-0.5 text-[14px] font-medium truncate"
              style={{ color: "var(--ink)" }}
            >
              {currentOrg?.name ?? "No organization selected"}
            </div>
            <div
              className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]"
              style={{ color: "var(--fg-3)" }}
            >
              <span>
                {currentOrg
                  ? `${formatAccountType(currentOrg.account_type)} · ${organizations.length} available`
                  : `${organizations.length} available`}
              </span>
              {currentOrg?.is_owner && (
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}
                >
                  Owner
                </span>
              )}
              {currentOrg?.can_manage_organization && !currentOrg?.is_owner && (
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}
                >
                  Manager
                </span>
              )}
            </div>
            {helperText && (
              <div className="mt-1 text-[12px]" style={{ color: "var(--fg-4)" }}>
                {helperText}
              </div>
            )}
          </div>
        </div>

        {organizations.length > 1 ? (
          <div className="w-full sm:w-[260px]">
            <SearchableSelect
              value={currentOrg?._id ?? ""}
              onChange={(nextOrgId) => {
                const selectedOrg = organizations.find((org) => org._id === nextOrgId) ?? null;
                onChange(selectedOrg);
              }}
              options={options}
              placeholder="Switch organization"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}