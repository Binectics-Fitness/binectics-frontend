"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface PairDeviceModalProps {
  open: boolean;
  onClose: () => void;
}

export function PairDeviceModal({ open, onClose }: PairDeviceModalProps) {
  const [step, setStep] = useState<"select" | "pairing" | "done">("select");
  const [deviceName, setDeviceName] = useState("");

  const handlePair = () => {
    setStep("pairing");
    setTimeout(() => setStep("done"), 2000);
  };

  const handleClose = () => {
    setStep("select");
    setDeviceName("");
    onClose();
  };

  const handleDone = () => {
    toast.success(`"${deviceName}" paired`);
    handleClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title="Pair new device"
      footer={
        step === "select" ? (
          <>
            <button type="button" onClick={handleClose} className="btn-ghost-v2">Cancel</button>
            <button type="button" onClick={handlePair} disabled={!deviceName.trim()} className="btn-signal-v2 disabled:opacity-40">Start pairing</button>
          </>
        ) : step === "done" ? (
          <button type="button" onClick={handleDone} className="btn-signal-v2">Done</button>
        ) : undefined
      }
    >
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-[13.5px] text-fg-2">
            Name this kiosk device so you can identify it in your dashboard.
          </p>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Device name</label>
            <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="e.g. Front entrance kiosk" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
          </div>
        </div>
      )}
      {step === "pairing" && (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 h-40 w-40 rounded-(--r-3) border-2 border-dashed border-border-2 bg-bg-2" />
          <p className="text-[13.5px] font-medium text-ink">Scan this QR code on the device</p>
          <p className="mt-1 text-[12.5px] text-fg-3">Waiting for connection...</p>
          <div className="mt-4 live-dot">Pairing</div>
        </div>
      )}
      {step === "done" && (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-signal-soft">
            <svg className="h-7 w-7 text-signal-ink" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-ink">{deviceName} paired</p>
          <p className="mt-1 text-[13px] text-fg-3">The device is ready for check-ins</p>
        </div>
      )}
    </ActionModal>
  );
}
