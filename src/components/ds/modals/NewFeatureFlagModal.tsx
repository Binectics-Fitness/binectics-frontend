"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface NewFeatureFlagModalProps {
  open: boolean;
  onClose: () => void;
}

const ENVIRONMENTS = ["development", "staging", "production"];

export function NewFeatureFlagModal({ open, onClose }: NewFeatureFlagModalProps) {
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [envs, setEnvs] = useState<string[]>(["development"]);

  const toggleEnv = (env: string) => {
    setEnvs((prev) => (prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]));
  };

  const handleCreate = () => {
    toast.success(`Flag "${key}" created`);
    setKey("");
    setDescription("");
    setEnvs(["development"]);
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="New feature flag"
      description="Create a new feature flag. It will be disabled by default in all environments."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">Cancel</button>
          <button type="button" onClick={handleCreate} disabled={!key.trim()} className="btn-signal-v2 disabled:opacity-40">Create flag</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Flag key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))}
            placeholder="e.g. enable_new_checkout"
            className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this flag control..." rows={2} className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Enabled environments</label>
          <div className="flex gap-2">
            {ENVIRONMENTS.map((env) => (
              <button key={env} type="button" onClick={() => toggleEnv(env)} className={`rounded-(--r-full) px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${envs.includes(env) ? "bg-ink text-bg" : "bg-bg-2 text-fg-3 hover:bg-bg-3 hover:text-fg"}`} style={{ transitionDuration: "var(--motion-fast)" }}>
                {env}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ActionModal>
  );
}
