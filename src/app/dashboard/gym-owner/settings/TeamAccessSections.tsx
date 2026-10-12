"use client";

import Link from "next/link";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgRoles } from "@/lib/queries/teams";
import { DSCard, ListRow } from "@/components/ds";

/** Roles & scopes: read-only summary here; management lives at /dashboard/team. */
export function RolesSection() {
  const { currentOrg } = useOrganization();
  const { data: roles = [], isLoading } = useOrgRoles(currentOrg?._id);

  return (
    <section id="roles">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Roles & scopes</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        Who can do what across your organization. Create and edit roles from the Team page.
      </p>
      <DSCard className="flex flex-col gap-3 p-5.5">
        {isLoading && <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading roles…</span>}
        {!isLoading && roles.length === 0 && (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>No roles yet.</span>
        )}
        {roles.map((r) => (
          <ListRow
            key={r._id}
            title={r.name}
            meta={`${r.permissions.length} permission${r.permissions.length === 1 ? "" : "s"}`}
            trailing={
              r.is_default && (
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2, var(--bg))", border: "1px solid var(--border)" }}>Default</span>
              )
            }
          />
        ))}
        <Link href="/dashboard/team" className="btn-ghost-v2 sm self-start" style={{ textDecoration: "none" }}>
          Manage roles & team →
        </Link>
      </DSCard>
    </section>
  );
}
