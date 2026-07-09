"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgRoles,
  useOrgApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from "@/lib/queries/teams";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { TeamPermission } from "@/lib/api/teams";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "rounded-(--r-2) px-3.5 py-2.75 text-[14px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

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
      <div className="flex flex-col gap-3 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {isLoading && <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading roles…</span>}
        {!isLoading && roles.length === 0 && (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>No roles yet.</span>
        )}
        {roles.map((r) => (
          <div key={r._id} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{r.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>
                {r.permissions.length} permission{r.permissions.length === 1 ? "" : "s"}
              </div>
            </div>
            {r.is_default && (
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2, var(--bg))", border: "1px solid var(--border)" }}>Default</span>
            )}
          </div>
        ))}
        <Link href="/dashboard/team" className="btn-ghost-v2 sm self-start" style={{ textDecoration: "none" }}>
          Manage roles & team →
        </Link>
      </div>
    </section>
  );
}

/**
 * API access: issue, list, and revoke org API keys. The full secret appears
 * exactly once after creation — copy it or lose it.
 */
export function ApiKeysSection() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: keys = [], isLoading } = useOrgApiKeys(orgId);
  const create = useCreateApiKey(orgId);
  const revoke = useRevokeApiKey(orgId);
  const { fmtDate } = useOrgFormat();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<TeamPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleScope = (s: TeamPermission) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const onCreate = async () => {
    if (!name.trim()) return setError("Give the key a name.");
    if (scopes.length === 0) return setError("Pick at least one scope.");
    setError(null);
    const res = await create.mutateAsync({ name: name.trim(), scopes });
    if (res.success && res.data) {
      setRevealed(res.data.api_key);
      setCopied(false);
      setAdding(false);
      setName("");
      setScopes([]);
    } else {
      setError(res.message || "Couldn't create the key.");
    }
  };

  const copyKey = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const active = keys.filter((k) => !k.revoked_at);
  const revoked = keys.filter((k) => k.revoked_at);

  return (
    <section id="api">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>API access</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        Keys for integrations and scripts. Scoped to this organization; the secret is shown once at creation and never again.
      </p>
      <div className="flex flex-col gap-3 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {revealed && (
          <div className="flex flex-col gap-2 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--signal, var(--border-2))", background: "var(--signal-soft, var(--bg))" }}>
            <span className="text-[12.5px] font-medium" style={{ color: "var(--signal-ink, var(--ink))" }}>
              Copy this key now — it will never be shown again.
            </span>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate font-mono text-[12px] px-2.5 py-2 rounded-(--r-1)" style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}>{revealed}</code>
              <button className="btn-primary-v2 sm" onClick={() => void copyKey()}>{copied ? "Copied ✓" : "Copy"}</button>
              <button className="btn-ghost-v2 sm" onClick={() => setRevealed(null)}>Done</button>
            </div>
          </div>
        )}

        {isLoading && <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading keys…</span>}
        {!isLoading && keys.length === 0 && !adding && (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>No API keys yet.</span>
        )}

        {active.map((k) => (
          <div key={k._id} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{k.name}</div>
              <div className="font-mono text-[11px] tracking-[0.02em] mt-0.5" style={{ color: "var(--fg-3)" }}>
                {k.key_prefix}…&ensp;·&ensp;{k.scopes.length} scope{k.scopes.length === 1 ? "" : "s"}
                &ensp;·&ensp;created {fmtDate(k.created_at)}
                {k.last_used_at ? <>&ensp;·&ensp;last used {fmtDate(k.last_used_at)}</> : <>&ensp;·&ensp;never used</>}
                {k.expires_at && <>&ensp;·&ensp;expires {fmtDate(k.expires_at)}</>}
              </div>
            </div>
            <button
              className="btn-ghost-v2 sm"
              disabled={revoke.isPending}
              onClick={() => {
                if (window.confirm(`Revoke "${k.name}"? Integrations using it stop working immediately.`)) {
                  void revoke.mutateAsync(k._id);
                }
              }}
            >
              Revoke
            </button>
          </div>
        ))}

        {revoked.length > 0 && (
          <details>
            <summary className="text-[12px] cursor-pointer" style={{ color: "var(--fg-3)" }}>{revoked.length} revoked key{revoked.length === 1 ? "" : "s"}</summary>
            <div className="flex flex-col gap-2 mt-2">
              {revoked.map((k) => (
                <div key={k._id} className="flex items-center gap-3 p-3 rounded-(--r-2) opacity-60" style={{ border: "1px dashed var(--border)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ color: "var(--fg-3)" }}>{k.name}</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>{k.key_prefix}… · revoked {fmtDate(k.revoked_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {adding ? (
          <div className="flex flex-col gap-3.5 p-3.5 rounded-(--r-2)" style={{ border: "1px dashed var(--border-2)" }}>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Key name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zapier integration" className={INPUT_CLASS} style={INPUT_STYLE} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Scopes</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(TeamPermission).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-[12.5px] cursor-pointer" style={{ color: "var(--ink)" }}>
                    <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} />
                    <span className="font-mono text-[11.5px]">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <span className="text-[12px]" style={{ color: "var(--danger, #b00020)" }}>{error}</span>}
            <div className="flex gap-2">
              <button className="btn-primary-v2 sm" disabled={create.isPending} onClick={() => void onCreate()}>
                {create.isPending ? "Creating…" : "Create key"}
              </button>
              <button className="btn-ghost-v2 sm" disabled={create.isPending} onClick={() => { setAdding(false); setError(null); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn-ghost-v2 sm self-start" disabled={!orgId} onClick={() => setAdding(true)}>+ Create API key</button>
        )}
      </div>
    </section>
  );
}
