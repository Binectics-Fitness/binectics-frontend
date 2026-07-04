"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner } from "@/components/ds";
import { toast } from "@/components/Toast";
import { teamsService, type OrganizationLocation } from "@/lib/api/teams";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function LocationDetailClient() {
  const params = useParams<{ locationId: string }>();
  const router = useRouter();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [location, setLocation] = useState<OrganizationLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const orgId = currentOrg?._id;
  useEffect(() => {
    if (orgLoading || !orgId || !params.locationId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        // No single-location endpoint yet — fetch the org's list and pick.
        const res = await teamsService.getLocations(orgId);
        if (!active) return;
        if (res.success && res.data) {
          const found = res.data.find((l) => l._id === params.locationId) ?? null;
          setLocation(found);
          if (found) {
            setName(found.name);
            setStreet(found.street ?? "");
            setCity(found.city ?? "");
            setPostalCode(found.postal_code ?? "");
            setCountry(found.country ?? "");
            setError(null);
          } else {
            setError("Location not found in this organization.");
          }
        } else {
          setError(res.message || "We couldn't load this location.");
        }
      } catch {
        if (active) setError("We couldn't load this location. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [orgId, orgLoading, params.locationId]);

  async function handleSave() {
    if (!currentOrg || !location || saving || !name.trim()) return;
    setSaving(true);
    try {
      const res = await teamsService.updateLocation(currentOrg._id, location._id, {
        name: name.trim(),
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || undefined,
      });
      if (res.success && res.data) {
        setLocation(res.data);
        toast.success("Location saved");
      } else {
        toast.error(res.message || "Couldn't save the location");
      }
    } catch {
      toast.error("Couldn't save the location");
    } finally {
      setSaving(false);
    }
  }

  async function handleMakePrimary() {
    if (!currentOrg || !location || saving) return;
    setSaving(true);
    try {
      const res = await teamsService.updateLocation(currentOrg._id, location._id, { is_primary: true });
      if (res.success && res.data) {
        setLocation(res.data);
        toast.success(`${res.data.name} is now the primary location`);
      } else {
        toast.error(res.message || "Couldn't update the location");
      }
    } catch {
      toast.error("Couldn't update the location");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!currentOrg || !location || saving) return;
    if (!confirm(`Deactivate "${location.name}"? It will no longer appear in your locations.`)) return;
    setSaving(true);
    try {
      const res = await teamsService.deleteLocation(currentOrg._id, location._id);
      if (res.success) {
        toast.success("Location deactivated");
        router.push("/dashboard/gym-owner/locations");
      } else {
        toast.error(res.message || "Couldn't deactivate the location");
        setSaving(false);
      }
    } catch {
      toast.error("Couldn't deactivate the location");
      setSaving(false);
    }
  }

  const inputClass = "h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none";
  const labelClass = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3";

  return (
    <GymDashboardShell activeItem="Locations" crumb="Locations">
      <div>
        <Link href="/dashboard/gym-owner/locations" className="text-[13px]" style={{ color: "var(--fg-3)", textDecoration: "none" }}>
          &larr; All locations
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {location?.name ?? "Location"}
          </h1>
          {location?.is_primary && (
            <span className="font-mono text-[10.5px] uppercase tracking-wider rounded-(--r-1) px-2 py-0.5" style={{ background: "var(--signal-soft)", color: "var(--signal-ink, var(--signal))", border: "1px solid var(--signal)" }}>
              Primary
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <AsyncSpinner size="page" label="Loading location" />
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load this location</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : location ? (
        <>
          <section className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h2 className="text-[16px] font-medium mb-4" style={{ color: "var(--ink)" }}>Details</h2>
            <div className="flex flex-col gap-4 max-w-[520px]">
              <div>
                <label className={labelClass}>Location name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Street address</label>
                <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Postal code</label>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
              </div>
              <div>
                <button type="button" onClick={() => void handleSave()} disabled={saving || !name.trim()} className="btn-primary-v2 sm disabled:opacity-40">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h2 className="text-[16px] font-medium mb-1" style={{ color: "var(--ink)" }}>Manage</h2>
            <p className="text-[12.5px] mb-4" style={{ color: "var(--fg-3)" }}>
              The primary location is shown first across your workspace.
            </p>
            <div className="flex gap-2">
              {!location.is_primary && (
                <button type="button" onClick={() => void handleMakePrimary()} disabled={saving} className="btn-ghost-v2 sm disabled:opacity-40">
                  Make primary
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleDeactivate()}
                disabled={saving}
                className="rounded-(--r-2) border px-3 py-1.5 text-[12.5px] disabled:opacity-40"
                style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent", cursor: "pointer" }}
              >
                Deactivate location
              </button>
            </div>
          </section>
        </>
      ) : null}
    </GymDashboardShell>
  );
}
