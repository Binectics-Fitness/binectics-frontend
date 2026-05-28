"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
}

const AMENITIES = ["Parking", "Showers", "Lockers", "Wi-Fi", "Sauna", "Pool", "Towels", "Cafe"];

export function AddLocationModal({ open, onClose }: AddLocationModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const handleCreate = () => {
    toast.success(`Location "${name}" added`);
    setStep(1);
    setName("");
    setAddress("");
    setCity("");
    setCountry("");
    setSelectedAmenities([]);
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Add location"
      size="xl"
      footer={
        <>
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost-v2 mr-auto">
              Back
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost-v2">Cancel</button>
          {step < 2 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!name.trim() || !address.trim()} className="btn-primary-v2 disabled:opacity-40">
              Next
            </button>
          ) : (
            <button type="button" onClick={handleCreate} className="btn-signal-v2">
              Add location
            </button>
          )}
        </>
      }
    >
      <div className="mb-4 flex gap-1">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-(--r-full) ${s <= step ? "bg-ink" : "bg-bg-3"}`} />
        ))}
      </div>
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Location name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown branch" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Street address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Fitness Street" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="South Africa" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cape Town" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`rounded-(--r-full) px-3 py-1.5 text-[12.5px] font-medium transition-colors ${selectedAmenities.includes(a) ? "bg-ink text-bg" : "bg-bg-2 text-fg-2 hover:bg-bg-3 hover:text-ink"}`} style={{ transitionDuration: "var(--motion-fast)" }}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </ActionModal>
  );
}
