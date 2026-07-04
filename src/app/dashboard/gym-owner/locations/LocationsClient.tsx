"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { AddLocationModal } from "@/components/ds/modals/AddLocationModal";
import { teamsService, type OrganizationLocation } from "@/lib/api/teams";
import { useOrganization } from "@/contexts/OrganizationContext";

function addressLine(loc: OrganizationLocation): string {
  const parts = [loc.street, loc.city, loc.postal_code, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No address on file";
}

export default function LocationsClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await teamsService.getLocations(currentOrg._id);
        if (!active) return;
        if (res.success && res.data) {
          setLocations(res.data);
          setError(null);
        } else {
          setError(res.message || "We couldn't load your locations.");
        }
      } catch {
        if (active) setError("We couldn't load your locations. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading, reloadKey]);

  const activeLocations = locations.filter((l) => l.is_active);

  return (
    <GymDashboardShell
      activeItem="Locations"
      crumb="Locations"
      actions={
        <button className="btn-primary-v2 sm" onClick={() => setAddOpen(true)}>+ Add location</button>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Locations</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {activeLocations.length > 0
            ? `${activeLocations.length} active location${activeLocations.length === 1 ? "" : "s"}`
            : "Your branches and where members can train"}
        </div>
      </div>

      {!currentOrg && !orgLoading ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its locations.
        </div>
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load locations</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && locations.length === 0 ? (
        <AsyncSpinner size="page" label="Loading locations" />
      ) : activeLocations.length === 0 && !error && currentOrg ? (
        <div className="rounded-(--r-3) px-4.5 py-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <EmptySlate message="No locations yet." hint="Add your first branch to get started." mt="mt-0" />
        </div>
      ) : activeLocations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeLocations.map((loc) => (
            <Link
              key={loc._id}
              href={`/dashboard/gym-owner/locations/${loc._id}`}
              className="rounded-(--r-3) p-4.5 flex flex-col gap-2 hover:bg-bg-2"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none", transition: "background 60ms" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{loc.name}</div>
                {loc.is_primary && (
                  <span className="font-mono text-[10.5px] uppercase tracking-wider rounded-(--r-1) px-2 py-0.5" style={{ background: "var(--signal-soft)", color: "var(--signal-ink, var(--signal))", border: "1px solid var(--signal)" }}>
                    Primary
                  </span>
                )}
              </div>
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{addressLine(loc)}</div>
            </Link>
          ))}
        </div>
      ) : null}

      <AddLocationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        organizationId={currentOrg?._id ?? null}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
    </GymDashboardShell>
  );
}
