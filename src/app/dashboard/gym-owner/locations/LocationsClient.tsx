"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GymDashboardShell, useGymViewer } from "@/components/ds/GymDashboardShell";
import { TeamPermission, holds } from "@/lib/gymStaffNav";
import { AsyncSpinner, DSCard, EmptySlate, PageHeader } from "@/components/ds";
import { AddLocationModal } from "@/components/ds/modals/AddLocationModal";
import { teamsService, type OrganizationLocation } from "@/lib/api/teams";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/Toast";
import { locationErrorMessage } from "@/lib/locationErrors";

function addressLine(loc: OrganizationLocation): string {
  const parts = [loc.street, loc.city, loc.postal_code, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No address on file";
}

/** The API's order: the primary first, then oldest first. */
function byPrimaryThenAge(list: OrganizationLocation[]): OrganizationLocation[] {
  return [...list].sort(
    (a, b) =>
      Number(!!b.is_primary) - Number(!!a.is_primary) ||
      (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0),
  );
}

export default function LocationsClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  // Adding, editing and closing locations is team:manage_organization.
  const canManage = holds(useGymViewer(), TeamPermission.MANAGE_ORGANIZATION);

  const orgId = currentOrg?._id;
  useEffect(() => {
    if (orgLoading || !orgId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await teamsService.getLocations(orgId, { includeInactive: true });
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
  }, [orgId, orgLoading, reloadKey]);

  const activeLocations = locations.filter((l) => l.is_active);
  // Deactivated is is_active === false, as the API has it.
  const inactiveLocations = locations.filter((l) => l.is_active === false);

  async function handleReactivate(loc: OrganizationLocation) {
    if (!orgId || reactivatingId) return;
    setReactivatingId(loc._id);
    try {
      const res = await teamsService.reactivateLocation(orgId, loc._id);
      if (res.success && res.data) {
        const back = res.data;
        setLocations((prev) => byPrimaryThenAge(prev.map((l) => (l._id === back._id ? back : l))));
        toast.success(
          back.is_primary
            ? `${back.name} is active again, as your primary location`
            : `${back.name} is active again`,
        );
      } else {
        toast.error(locationErrorMessage(res, "reactivate", loc.name, "Couldn't reactivate the location"));
      }
    } catch {
      toast.error("Couldn't reactivate the location");
    } finally {
      setReactivatingId(null);
    }
  }

  return (
    <GymDashboardShell
      activeItem="Locations"
      crumb="Locations"
      actions={
        canManage ? <button className="btn-primary-v2 sm" onClick={() => setAddOpen(true)}>+ Add location</button> : undefined
      }
    >
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader
        className="mb-0!"
        title="Locations"
        subtitle={
          activeLocations.length > 0
            ? `${activeLocations.length} active location${activeLocations.length === 1 ? "" : "s"}`
            : "Your branches and where members can train"
        }
      />

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
        <DSCard className="px-4.5 py-6">
          <EmptySlate message="No locations yet." hint="Add your first branch to get started." mt="mt-0" />
        </DSCard>
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

      {inactiveLocations.length > 0 && (
        <DSCard className="p-4.5">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            aria-expanded={showInactive}
            aria-controls="deactivated-locations"
            className="flex w-full items-center justify-between gap-2 text-left"
            style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
          >
            <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Deactivated locations ({inactiveLocations.length})
            </span>
            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              {showInactive ? "Hide" : "Show"}
            </span>
          </button>
          {showInactive && (
            <ul id="deactivated-locations" className="mt-3 flex flex-col">
              {inactiveLocations.map((loc) => (
                <li
                  key={loc._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{loc.name}</div>
                    <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{addressLine(loc)}</div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void handleReactivate(loc)}
                      disabled={reactivatingId !== null}
                      aria-label={`Reactivate ${loc.name}`}
                      className="btn-ghost-v2 sm disabled:opacity-40"
                    >
                      {reactivatingId === loc._id ? "Reactivating…" : "Reactivate"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DSCard>
      )}

      <AddLocationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        organizationId={currentOrg?._id ?? null}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
    </GymDashboardShell>
  );
}
