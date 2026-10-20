"use client";

import { useEffect, useState } from "react";
import { AsyncSpinner, DSCard, Eyebrow } from "@/components/ds";
import { toast } from "@/components/Toast";
import { UploadZone } from "@/app/onboarding/_components";
import { COUNTRY_NAME_TO_CODE } from "@/app/onboarding/_config";
import { credentialsService } from "@/lib/api/credentials";
import {
  DIETITIAN_POPULATIONS,
  DIETITIAN_SPECIALIZATIONS,
  MAX_LICENSES,
  MAX_PRONOUNS,
  MAX_SPECIALIZATIONS,
  emptyLicenseDraft,
  isBlankLicense,
  licenseDraftError,
  licenseDraftFrom,
  licenseInputFrom,
  toggleCode,
  type CredentialsView,
  type LicenseDraft,
} from "@/lib/credentials/dietitian";

const INPUT_CLS = "w-full h-9 px-3 rounded-(--r-2) border border-border-2 bg-bg text-[13.5px]";
const LABEL_CLS = "block font-mono text-[10.5px] uppercase tracking-[0.05em] mb-1.5";

function Chip({ label, on, onClick, disabled }: { label: string; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full text-[13px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: on ? "var(--ink)" : "var(--bg)",
        color: on ? "var(--bg)" : "var(--fg-2)",
        border: on ? "1px solid var(--ink)" : "1px solid var(--border-2)",
      }}
    >
      {label}
    </button>
  );
}

/**
 * The dietitian's credentials, edited in place: pronouns, specializations,
 * populations (what members filter on) and licences. Licence numbers and
 * documents are private to the dietitian and Binectics; the listing shows
 * that they are licensed, who issued each licence and where.
 */
export function CredentialsTab() {
  const [loaded, setLoaded] = useState<CredentialsView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pronouns, setPronouns] = useState("");
  const [specs, setSpecs] = useState<string[]>([]);
  const [pops, setPops] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<LicenseDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);

  const apply = (view: CredentialsView) => {
    setLoaded(view);
    setPronouns(view.pronouns ?? "");
    setSpecs(view.specializations);
    setPops(view.populations);
    setLicenses(view.licenses.map(licenseDraftFrom));
  };

  useEffect(() => {
    let cancelled = false;
    credentialsService
      .getMine()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) apply(res.data);
        else setLoadError(res.message || "We couldn't load your credentials.");
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn't load your credentials.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLicense = (i: number, patch: Partial<LicenseDraft>) =>
    setLicenses((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const save = async () => {
    const kept = licenses.filter((l) => !isBlankLicense(l) || l._id);
    for (const [i, l] of kept.entries()) {
      const error = licenseDraftError(l);
      if (error) {
        toast.error(`Licence ${i + 1}: ${error}`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await credentialsService.updateMine({
        pronouns: pronouns.trim(),
        specializations: specs,
        populations: pops,
        licenses: kept.map(licenseInputFrom),
      });
      if (!res.success || !res.data) {
        toast.error(res.message || "We couldn't save your credentials.");
        return;
      }
      apply(res.data);
      toast.success("Credentials saved");
    } catch {
      toast.error("We couldn't save your credentials. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
        {loadError}
      </div>
    );
  }
  if (!loaded) return <AsyncSpinner size="page" label="Loading credentials" />;

  const countryOptions = Object.entries(COUNTRY_NAME_TO_CODE);

  return (
    <div className="flex flex-col gap-4 max-w-[760px]">
      <DSCard>
        <div className="p-5 flex flex-col gap-5">
          <div>
            <label htmlFor="cred-pronouns" className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Pronouns (optional)</label>
            <input id="cred-pronouns" className={INPUT_CLS} style={{ color: "var(--ink)" }} value={pronouns} maxLength={MAX_PRONOUNS} placeholder="she/her" onChange={(e) => setPronouns(e.target.value)} />
          </div>
          <div>
            <Eyebrow>Specializations · up to {MAX_SPECIALIZATIONS}</Eyebrow>
            <p className="text-[12.5px] mt-1 mb-2.5" style={{ color: "var(--fg-3)" }}>Members filter the marketplace on these.</p>
            <div role="group" aria-label="Specializations" className="flex flex-wrap gap-2">
              {DIETITIAN_SPECIALIZATIONS.map((o) => {
                const on = specs.includes(o.code);
                return <Chip key={o.code} label={o.label} on={on} disabled={!on && specs.length >= MAX_SPECIALIZATIONS} onClick={() => setSpecs((s) => toggleCode(s, o.code, MAX_SPECIALIZATIONS))} />;
              })}
            </div>
          </div>
          <div>
            <Eyebrow>Populations</Eyebrow>
            <div role="group" aria-label="Populations" className="flex flex-wrap gap-2 mt-2.5">
              {DIETITIAN_POPULATIONS.map((o) => (
                <Chip key={o.code} label={o.label} on={pops.includes(o.code)} onClick={() => setPops((p) => toggleCode(p, o.code))} />
              ))}
            </div>
          </div>
        </div>
      </DSCard>

      <DSCard>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <Eyebrow>Licences</Eyebrow>
            <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
              Your profile shows that you&rsquo;re licensed, who issued each licence and where. The number and the document are private to you and the Binectics team. A licence past its expiry date stops showing.
            </p>
          </div>
          {licenses.length === 0 && (
            <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>No licence on file yet.</p>
          )}
          {licenses.map((l, i) => {
            const loadedLicense = loaded.licenses.find((v) => v._id && v._id === l._id);
            return (
              <fieldset key={l._id ?? `new-${i}`} className="border border-border rounded-(--r-2) p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <legend className="px-1 text-[12px] font-mono uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                  Licence {i + 1}
                  {loadedLicense && !loadedLicense.is_current ? " · expired" : ""}
                </legend>
                <div>
                  <label htmlFor={`cred-lic-name-${i}`} className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Licence</label>
                  <input id={`cred-lic-name-${i}`} className={INPUT_CLS} style={{ color: "var(--ink)" }} maxLength={120} value={l.name} placeholder="Registered Dietitian" onChange={(e) => setLicense(i, { name: e.target.value })} />
                </div>
                <div>
                  <label htmlFor={`cred-lic-body-${i}`} className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Issued by</label>
                  <input id={`cred-lic-body-${i}`} className={INPUT_CLS} style={{ color: "var(--ink)" }} maxLength={120} value={l.issuingBody} placeholder="DAN · HPCSA · CDR" onChange={(e) => setLicense(i, { issuingBody: e.target.value })} />
                </div>
                <div>
                  <label htmlFor={`cred-lic-number-${i}`} className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Registration number (private)</label>
                  <input id={`cred-lic-number-${i}`} className={INPUT_CLS} style={{ color: "var(--ink)" }} maxLength={60} value={l.number} onChange={(e) => setLicense(i, { number: e.target.value })} />
                </div>
                <div>
                  <label htmlFor={`cred-lic-country-${i}`} className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Country</label>
                  <select id={`cred-lic-country-${i}`} className={INPUT_CLS} style={{ color: "var(--ink)" }} value={l.countryCode} onChange={(e) => setLicense(i, { countryCode: e.target.value })}>
                    <option value="">Choose…</option>
                    {countryOptions.map(([name, code]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                    {l.countryCode && !countryOptions.some(([, code]) => code === l.countryCode) && (
                      <option value={l.countryCode}>{l.countryCode}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor={`cred-lic-expiry-${i}`} className={LABEL_CLS} style={{ color: "var(--fg-3)" }}>Expires</label>
                  <input id={`cred-lic-expiry-${i}`} type="date" className={INPUT_CLS} style={{ color: "var(--ink)" }} value={l.expiresAt} onChange={(e) => setLicense(i, { expiresAt: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  {l.hasDocument && !l.removeDocument && !l.newDocumentUrl ? (
                    <div className="flex items-center gap-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
                      <span>Document on file.</span>
                      {loadedLicense?.document_url && (
                        <a href={loadedLicense.document_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: "var(--ink)" }}>Open</a>
                      )}
                      <button type="button" className="btn-ghost-v2 sm" onClick={() => setLicense(i, { removeDocument: true })}>Remove document</button>
                    </div>
                  ) : (
                    <UploadZone
                      title="Licence document (optional)"
                      hint="PDF or photo. Private to you and the Binectics team."
                      folder="teams/documents"
                      value={l.newDocumentUrl}
                      onUpload={(r) => setLicense(i, { newDocumentUrl: r.url, removeDocument: false })}
                      onUploadStart={() => setUploads((n) => n + 1)}
                      onUploadEnd={() => setUploads((n) => Math.max(0, n - 1))}
                    />
                  )}
                  <div>
                    <button type="button" className="btn-ghost-v2 sm" onClick={() => setLicenses((prev) => prev.filter((_, j) => j !== i))}>Remove licence</button>
                  </div>
                </div>
              </fieldset>
            );
          })}
          {licenses.length < MAX_LICENSES && (
            <div>
              <button type="button" className="btn-ghost-v2 sm" onClick={() => setLicenses((prev) => [...prev, emptyLicenseDraft()])}>Add a licence</button>
            </div>
          )}
        </div>
      </DSCard>

      <div>
        <button type="button" className="btn-primary-v2" disabled={saving || uploads > 0} onClick={() => void save()}>
          {saving ? "Saving…" : uploads > 0 ? "Uploading…" : "Save credentials"}
        </button>
      </div>
    </div>
  );
}
