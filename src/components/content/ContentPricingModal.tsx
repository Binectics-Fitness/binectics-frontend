"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useOrgPriceCurrencies } from "@/lib/queries/currencies";
import { orgPriceOptions } from "@/lib/currencies/helpers";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import {
  normalizeAccess,
  paidContentErrorOf,
  paidContentService,
  type ContentAccess,
  type ContentGrant,
  type ContentItemKind,
} from "@/lib/api/paidContent";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import {
  MAX_PRICES,
  buildAccessInput,
  draftFromAccess,
  draftFingerprint,
  paidContentCopy,
  type PricingDraft,
} from "@/lib/paidContent/helpers";

function clientUserId(c: ClientProfile): string {
  return typeof c.client_id === "object" && c.client_id ? c.client_id._id : String(c.client_id);
}
function clientLabel(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id) {
    return `${c.client_id.first_name ?? ""} ${c.client_id.last_name ?? ""}`.trim() || c.client_id.email || "Client";
  }
  return "Client";
}
/** A grant whose client isn't in the list: tell them apart by the id's tail. */
function unknownClientLabel(userId: string): string {
  return userId ? `Client ending ${userId.slice(-4)}` : "Client";
}

/**
 * Pricing for one program or library meal plan: Free / Paid, a price in each
 * currency the workspace sells in, the plans that include it, whether it shows
 * on the listing, and who has it for free. Same controls as the mobile
 * ContentPricingScreen. The API decides everything: a staff trainer in a gym
 * is refused (D10), FEATURE_DISABLED quietly hides the controls.
 */
export function ContentPricingModal({
  open,
  onClose,
  kind,
  itemId,
  title,
  rawAccess,
  needsPublish = false,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  kind: ContentItemKind;
  itemId: string;
  title: string;
  /** The item's `access` as the list returned it. */
  rawAccess: unknown;
  /** A program must be published before it can be charged for. */
  needsPublish?: boolean;
  /** The saved block, so the card can show the new price. */
  onSaved: (access: ContentAccess | null) => void;
}) {
  const orgs = useOptionalOrganization();
  const orgId = orgs?.currentOrg?._id ?? null;
  const { data: currencies, providerHint } = useOrgPriceCurrencies(orgId);
  const options = useMemo(() => orgPriceOptions(currencies, undefined, providerHint), [currencies, providerHint]);

  const saved = useMemo(() => normalizeAccess(rawAccess), [rawAccess]);
  const [draft, setDraft] = useState<PricingDraft>(() => draftFromAccess(saved));
  const [baseline, setBaseline] = useState(() => draftFingerprint(draftFromAccess(saved)));
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [grants, setGrants] = useState<ContentGrant[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [pickClient, setPickClient] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [peopleAttempt, setPeopleAttempt] = useState(0);
  // The fingerprint of what our own save returned. The list then hands the
  // saved block back as `rawAccess`; that must not reset the draft or wipe the
  // warnings the save just produced.
  const ownSave = useRef<string | null>(null);

  // Each open starts from what the list says now.
  useEffect(() => {
    if (!open) {
      ownSave.current = null;
      return;
    }
    const d = draftFromAccess(saved);
    if (ownSave.current !== null && ownSave.current === draftFingerprint(d)) {
      ownSave.current = null;
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setDraft(d);
    setBaseline(draftFingerprint(d));
    setError(null);
    setWarnings([]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, saved]);

  const isPaid = draft.mode === "paid";
  const savedPaid = saved?.mode === "paid";

  useEffect(() => {
    if (!open || !orgId) return;
    let active = true;
    void (async () => {
      const res = await marketplaceService.getOrgMembershipPlans(orgId);
      if (active && res.success && res.data) setPlans(res.data.filter((p) => p.is_active));
    })();
    return () => {
      active = false;
    };
  }, [open, orgId]);

  useEffect(() => {
    if (!open || !savedPaid) return;
    let active = true;
    void (async () => {
      const [g, c] = await Promise.all([
        paidContentService.listGrants(kind, itemId),
        progressService.getMyClientProfiles(),
      ]);
      if (!active) return;
      // A failed read is not "nobody": say so, and let them retry.
      if (!g.success || !g.data || !c.success || !c.data) {
        const e = paidContentErrorOf(g);
        setPeopleError(e ? paidContentCopy(e) : g.message || c.message || "Check your connection and try again.");
        return;
      }
      setPeopleError(null);
      setGrants(g.data);
      setClients(c.data);
    })();
    return () => {
      active = false;
    };
  }, [open, savedPaid, kind, itemId, peopleAttempt]);

  const dirty = draftFingerprint(draft) !== baseline;
  const used = new Set(draft.prices.map((p) => p.currency));
  const addable = options.filter((o) => !used.has(o.value));

  const patch = (p: Partial<PricingDraft>) => setDraft((d) => ({ ...d, ...p }));
  const nameOf = (userId: string) => {
    const c = clients.find((x) => clientUserId(x) === userId);
    return c ? clientLabel(c) : unknownClientLabel(userId);
  };

  const save = async () => {
    const built = buildAccessInput(draft);
    if ("error" in built) return setError(built.error);
    setSaving(true);
    setError(null);
    setWarnings([]);
    const res = await paidContentService.setAccess(kind, itemId, built.input);
    setSaving(false);
    if (!res.success || !res.data) {
      const e = paidContentErrorOf(res);
      if (e?.code === "FEATURE_DISABLED") setDisabled(true);
      else setError(e ? paidContentCopy(e) : res.message || "Couldn't save the pricing. Try again.");
      return;
    }
    const next = draftFromAccess(res.data.access);
    setDraft(next);
    setBaseline(draftFingerprint(next));
    setWarnings(res.data.warnings);
    ownSave.current = draftFingerprint(next);
    onSaved(res.data.access);
    toast.success(built.input.mode === "paid" ? "Pricing saved" : "Now free");
  };

  const give = async () => {
    if (!pickClient) return;
    const res = await paidContentService.grant(kind, itemId, pickClient);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      return toast.error(e ? paidContentCopy(e) : res.message || "Couldn't give it. Try again.");
    }
    const g = await paidContentService.listGrants(kind, itemId);
    if (g.success && g.data) setGrants(g.data);
    setPickClient("");
    toast.success("Given for free");
  };

  const withdraw = async (grant: ContentGrant) => {
    const res = await paidContentService.revokeGrant(grant.id);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      return toast.error(e ? paidContentCopy(e) : res.message || "Couldn't withdraw it. Try again.");
    }
    setGrants((list) => list.filter((x) => x.id !== grant.id));
    toast.success("Free access withdrawn");
  };

  const quiet = disabled && !savedPaid;

  // Unsaved edits: the Modal's own guard only sees typing, not the Free/Paid
  // switch or ticks, so this modal runs the guard itself from the draft's
  // fingerprint and turns the Modal's off (one prompt, from here).
  const { requestClose, markDirty, reset, confirmationModal } = useUnsavedChangesGuard(onClose);
  useEffect(() => {
    if (dirty) markDirty();
    else reset();
  }, [dirty, markDirty, reset]);

  return (
    <>
    <Modal
      open={open}
      onClose={requestClose}
      disableCloseGuard
      title={`Pricing: ${title}`}
      size="lg"
      footer={
        quiet ? undefined : (
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2" onClick={requestClose}>
              Close
            </button>
            <button type="button" className="btn-primary-v2" disabled={saving || !dirty} onClick={() => void save()}>
              {saving ? "Saving..." : "Save pricing"}
            </button>
          </div>
        )
      }
    >
      {quiet ? (
        <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          Selling programs and meal plans is not available yet.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
              Who can get it
            </legend>
            <div role="radiogroup" className="flex gap-2">
              {(["free", "paid"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={draft.mode === m}
                  onClick={() => patch({ mode: m })}
                  className="px-3.5 py-1.5 rounded-full text-[13.5px]"
                  style={{
                    border: "1px solid var(--border-2)",
                    background: draft.mode === m ? "var(--ink)" : "transparent",
                    color: draft.mode === m ? "var(--bg)" : "var(--fg-2)",
                  }}
                >
                  {m === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>
            {!isPaid && savedPaid && (
              <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                Clients who already have it keep it. It stops being sold, and nothing new needs payment.
              </p>
            )}
          </fieldset>

          {isPaid && needsPublish && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              Publish the program before charging for it.
            </p>
          )}

          {isPaid && (
            <>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
                  Price to buy it on its own
                </div>
                <div className="flex flex-col gap-2">
                  {draft.prices.map((row) => (
                    <div key={row.currency} className="flex items-center gap-2">
                      <span className="font-mono text-[12px] w-10" style={{ color: "var(--fg-2)" }}>
                        {row.currency}
                      </span>
                      <MoneyInput
                        currency={row.currency}
                        value={row.display}
                        aria-label={`Price in ${row.currency}`}
                        placeholder="0"
                        onChange={(display, minor) =>
                          patch({
                            prices: draft.prices.map((p) =>
                              p.currency === row.currency ? { ...p, display, minor } : p,
                            ),
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-(--r-2) text-[14px]"
                        style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)" }}
                      />
                      <button
                        type="button"
                        className="btn-ghost-v2"
                        aria-label={`Remove ${row.currency} price`}
                        onClick={() => patch({ prices: draft.prices.filter((p) => p.currency !== row.currency) })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {draft.prices.length < MAX_PRICES && addable.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {addable.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className="btn-ghost-v2"
                        onClick={() => patch({ prices: [...draft.prices, { currency: o.value, display: "", minor: null }] })}
                      >
                        Add {o.value}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                  Leave it empty to sell it only through a plan.
                </p>
              </div>

              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
                  Included in these plans
                </div>
                {plans.length === 0 ? (
                  <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                    You have no active plans yet. Add one under Plans to include this in it.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {plans.map((p) => {
                      const on = draft.planIds.includes(p._id);
                      return (
                        <li key={p._id}>
                          <label className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                patch({
                                  planIds: on ? draft.planIds.filter((id) => id !== p._id) : [...draft.planIds, p._id],
                                })
                              }
                            />
                            {p.name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <label className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={draft.showOnListing}
                  onChange={(e) => patch({ showOnListing: e.target.checked })}
                />
                Show it on my listing
              </label>
            </>
          )}

          {savedPaid && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
                Given for free
              </div>
              {peopleError ? (
                <div className="mb-2">
                  <p role="alert" className="text-[12.5px]" style={{ color: "var(--danger-ink)" }}>
                    We couldn&apos;t load who has it. {peopleError}
                  </p>
                  <button type="button" className="btn-ghost-v2 mt-1" onClick={() => setPeopleAttempt((n) => n + 1)}>
                    Try again
                  </button>
                </div>
              ) : grants.length === 0 ? (
                <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Nobody has it for free yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 mb-2">
                  {grants.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2 text-[13.5px]" style={{ color: "var(--ink)" }}>
                      {nameOf(g.clientId)}
                      <button type="button" className="btn-ghost-v2" onClick={() => void withdraw(g)}>
                        Withdraw
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <select
                  aria-label="Give it to a client"
                  value={pickClient}
                  onChange={(e) => setPickClient(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-(--r-2) text-[13.5px]"
                  style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)" }}
                >
                  <option value="">Choose a client</option>
                  {clients
                    .filter((c) => !grants.some((g) => g.clientId === clientUserId(c)))
                    .map((c) => (
                      // The API takes a client PROFILE id here; a grant lists the client's user id.
                      <option key={c._id} value={c._id}>
                        {clientLabel(c)}
                      </option>
                    ))}
                </select>
                <button type="button" className="btn-ghost-v2" disabled={!pickClient} onClick={() => void give()}>
                  Give for free
                </button>
              </div>
            </div>
          )}

          {warnings.map((w) => (
            <p key={w} className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
              {w}
            </p>
          ))}
          {error && (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
    {confirmationModal}
    </>
  );
}
