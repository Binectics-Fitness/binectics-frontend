"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { teamsService, type OrganizationLocation } from "@/lib/api/teams";

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string | null;
  /** Called with the created location so the caller can refresh its list. */
  onCreated?: (location: OrganizationLocation) => void;
}

export function AddLocationModal({ open, onClose, organizationId, onCreated }: AddLocationModalProps) {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setStreet("");
    setCity("");
    setPostalCode("");
    setCountry("");
    setIsPrimary(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!organizationId || saving) return;
    setSaving(true);
    try {
      const res = await teamsService.createLocation(organizationId, {
        name: name.trim(),
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || undefined,
        is_primary: isPrimary || undefined,
      });
      if (res.success && res.data) {
        toast.success(`Location "${res.data.name}" added`);
        onCreated?.(res.data);
        handleClose();
      } else {
        toast.error(res.message || "Couldn't add the location");
      }
    } catch {
      toast.error("Couldn't add the location");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none";
  const labelClass = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3";

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title="Add location"
      description="A new branch for this organization."
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-ghost-v2">Cancel</button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || saving || !organizationId}
            className="btn-signal-v2 disabled:opacity-40"
          >
            {saving ? "Adding…" : "Add location"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Location name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown branch" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Street address</label>
          <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Fitness Street" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cape Town" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Postal code</label>
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="8005" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="South Africa" className={inputClass} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          <span className="text-[13px] text-fg-2">Make this the primary location</span>
        </label>
      </div>
    </ActionModal>
  );
}
