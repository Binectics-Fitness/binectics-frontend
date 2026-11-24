"use client";

import { writeErrorMessage } from "@/lib/currencies/helpers";
import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgMembershipPlans,
  useOrgMembershipSubscriptions,
  useCreateOrgMembershipPlan,
  useUpdateOrgMembershipPlan,
  useSetOrgMembershipPlanActive,
  useDeleteOrgMembershipPlan,
  useOrgLocations,
} from "@/lib/queries/marketplace";
import { PLAN_LOCATION_COPY, locationOptionLabel } from "@/lib/marketplace/listingPriceLocationCopy";
import { countMembersByPlan } from "@/lib/constants/membershipStatus";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { formatMinorForInput } from "@/lib/money/moneyInput";
import { minorToMajor } from "@/lib/money/minorMoney";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  MembershipPlanType,
  type MarketplaceMembershipPlan,
} from "@/lib/types";
import type { CreateOrgMembershipPlanRequest, OrgLocationListing } from "@/lib/api/marketplace";
import { ChipEditor, DSCard, DSStatCard, Eyebrow, PageHeader } from "@/components/ds";
import { planPerLabel as perLabel } from "@/lib/marketplace/planDisplay";
import { PlanComparisonFields, comparisonFromPlan, comparisonPayload, ownerSavingLabel } from "@/components/plans/PlanComparisonFields";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { usePaidContentSeller } from "@/hooks/usePaidContentSeller";
import { PlanIncludesSection } from "@/components/plans/PlanIncludesSection";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-9 rounded-(--r-2) px-3 text-[13.5px]";


/**
 * Membership plans backed by the org plans CRUD. Replaces the static
 * "Studio · monthly / R 850" mockup with real plans, member counts, and
 * working create/edit/activate/delete.
 */
export function GymPlansClient() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: plans = [], isLoading } = useOrgMembershipPlans(orgId);
  /**
   * The roster, purely so per-plan member counts can be derived.
   * `MembershipPlan.active_members` was deleted with no successor, and
   * gym-plans.html:160-226 shows "562 active" on every plan row — so the number
   * is design-required, not optional. Counting the subscriptions the org
   * already exposes is the derivation; no new endpoint is invented.
   */
  const { data: subscriptions = [] } = useOrgMembershipSubscriptions(orgId);
  const membersByPlan = countMembersByPlan(subscriptions);
  const membersOf = (planId: string) => membersByPlan.get(planId) ?? 0;
  // The gym's listings: with two or more, each plan names the one that sells it.
  const { data: locations = [] } = useOrgLocations(orgId);
  const pickLocation = locations.length >= 2;
  const locationOf = (p: MarketplaceMembershipPlan) =>
    pickLocation ? locations.find((l) => l._id === String(p.listing_id ?? "")) : undefined;
  const create = useCreateOrgMembershipPlan(orgId);
  const setActive = useSetOrgMembershipPlanActive(orgId);
  const remove = useDeleteOrgMembershipPlan(orgId);
  const { fmtMoney, fmtNumber } = useOrgFormat();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.is_active);
  const totalMembers = plans.reduce((s, p) => s + membersOf(p._id), 0);
  const mostPicked = [...plans].sort((a, b) => membersOf(b._id) - membersOf(a._id))[0];

  const kpis = [
    { label: "Active subscribers", value: fmtNumber(totalMembers), delta: "across all plans" },
    { label: "Active plans", value: String(activePlans.length), delta: `${plans.length} total` },
    { label: "Most picked", value: mostPicked && membersOf(mostPicked._id) > 0 ? mostPicked.name : "-", small: true, delta: mostPicked && membersOf(mostPicked._id) > 0 ? `${fmtNumber(membersOf(mostPicked._id))} member${membersOf(mostPicked._id) === 1 ? "" : "s"}` : "no subscribers yet" },
  ];

  const onCreate = async (data: CreateOrgMembershipPlanRequest) => {
    setError(null);
    const res = await create.mutateAsync(data);
    if (res.success) setAdding(false);
    else setError(writeErrorMessage(res, "Couldn't create the plan."));
  };

  // Delete is only offered on a plan nobody is on (the button is disabled
  // otherwise); a plan with members is deactivated instead.
  const onDelete = (plan: MarketplaceMembershipPlan) => {
    requestConfirmation({
      title: `Delete "${plan.name}"?`,
      description:
        "The plan is deleted and comes off your listing, and any open offers for it are withdrawn. This can't be undone. To stop selling it but keep it, deactivate it instead.",
      confirmLabel: "Delete plan",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await remove.mutateAsync(plan._id);
        if (res.success) toast.success(`"${plan.name}" deleted`);
        else toast.error(res.message || "Couldn't delete the plan. Try again.");
      },
    });
  };

  return (
    <GymDashboardShell
      activeItem="Plans & pricing"
      crumb="Plans & pricing"
      actions={<button className="btn-primary-v2 sm" disabled={!orgId} onClick={() => { setAdding(true); setEditingId(null); }}>+ New plan</button>}
    >
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader
        className="mb-0!"
        title="Plans & pricing"
        subtitle={<span className="block max-w-[60ch]">Deactivated plans stay valid for existing members.</span>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <DSStatCard
            key={k.label}
            size="sm"
            label={k.label}
            // A plan name, not a number: kept at the smaller size so it fits.
            value={k.small ? <span className="text-[17px]">{k.value}</span> : k.value}
            delta={k.delta}
          />
        ))}
      </div>

      {adding && (
        // overflow-visible: the form's selects open an in-flow dropdown.
        <DSCard className="p-5.5 overflow-visible!">
          <h2 className="text-[16px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>New plan</h2>
          <PlanForm plans={plans} locations={pickLocation ? locations : []} saving={create.isPending} error={error} defaultCurrency={currentOrg?.currency ?? ""} onSubmit={(d) => void onCreate(d)} onCancel={() => setAdding(false)} submitLabel="Create plan" />
        </DSCard>
      )}

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading plans…</p>}

      {!isLoading && plans.length === 0 && !adding && (
        <DSCard className="flex flex-col items-center text-center px-6 py-14">
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>No plans yet</h2>
          <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
            Create your first membership plan, it becomes purchasable on your marketplace listing.
          </p>
          <button className="btn-primary-v2 sm mt-5" disabled={!orgId} onClick={() => setAdding(true)}>+ New plan</button>
        </DSCard>
      )}

      {plans.length > 0 && (
        // overflow-visible: the inline edit form's selects open an in-flow
        // dropdown. The rows have no backgrounds, so the corners need no clip.
        <DSCard className="overflow-visible!">
          {plans.map((p, i) => (
            <div key={p._id} style={{ borderBottom: i < plans.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</span>
                    {!p.is_active && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>Inactive</span>
                    )}
                    {!p.is_public && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>Hidden</span>
                    )}
                  </div>
                  {(p.description || p.features.length > 0) && (
                    <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                      {p.description}
                      {p.description && p.features.length > 0 ? " · " : ""}
                      {p.features.join(" · ")}
                    </div>
                  )}
                  <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>
                    {fmtNumber(membersOf(p._id))} member{membersOf(p._id) === 1 ? "" : "s"}
                    {locationOf(p) && ` · ${PLAN_LOCATION_COPY.rowLocation(locationOf(p)?.headline?.trim() || locationOptionLabel(locationOf(p)!))}`}
                  </div>
                  {ownerSavingLabel(p, plans) && (
                    <div className="text-[12px] mt-1" style={{ color: "var(--fg-2)" }}>
                      Members see &ldquo;{ownerSavingLabel(p, plans)}&rdquo;
                    </div>
                  )}
                </div>
                <span className="font-mono text-[15px] shrink-0" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                  {fmtMoney(minorToMajor(p.price_minor, p.currency), p.currency)} <small className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>{perLabel(p)}</small>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="btn-ghost-v2 sm" onClick={() => { setEditingId(editingId === p._id ? null : p._id); setAdding(false); }}>
                    {editingId === p._id ? "Close" : "Edit"}
                  </button>
                  <button className="btn-ghost-v2 sm" disabled={setActive.isPending} onClick={() => void setActive.mutateAsync({ planId: p._id, active: !p.is_active })}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="btn-ghost-v2 sm disabled:opacity-40"
                    disabled={remove.isPending || membersOf(p._id) > 0}
                    title={membersOf(p._id) > 0 ? "Has members. Deactivate it instead." : undefined}
                    onClick={() => onDelete(p)}
                  >Delete</button>
                </div>
              </div>
              {editingId === p._id && (
                <div className="px-5.5 pb-4">
                  <EditPlanForm plan={p} plans={plans} locations={pickLocation ? locations : []} orgId={orgId} onDone={() => setEditingId(null)} />
                </div>
              )}
            </div>
          ))}
        </DSCard>
      )}
      {confirmationModal}
    </GymDashboardShell>
  );
}

function EditPlanForm({ plan, plans, locations, orgId, onDone }: { plan: MarketplaceMembershipPlan; plans: MarketplaceMembershipPlan[]; locations: OrgLocationListing[]; orgId: string | undefined; onDone: () => void }) {
  const update = useUpdateOrgMembershipPlan(orgId);
  const [error, setError] = useState<string | null>(null);
  const onSave = async (data: CreateOrgMembershipPlanRequest) => {
    setError(null);
    const res = await update.mutateAsync({ planId: plan._id, data });
    if (res.success) onDone();
    else setError(writeErrorMessage(res, "Couldn't save the plan."));
  };
  // What the plan includes: shown while selling is on, to whoever may price (D10).
  const { on: sellingOn, canPrice } = usePaidContentSeller();
  return (
    <div className="flex flex-col gap-5">
      <PlanForm initial={plan} plans={plans} locations={locations} saving={update.isPending} error={error} defaultCurrency={plan.currency} onSubmit={(d) => void onSave(d)} onCancel={onDone} />
      {sellingOn && canPrice && (
        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <PlanIncludesSection orgId={orgId} planId={plan._id} planName={plan.name} />
        </div>
      )}
    </div>
  );
}

export function PlanForm({ initial, plans, locations = [], saving, error, defaultCurrency, onSubmit, onCancel, submitLabel = "Save plan" }: {
  initial?: MarketplaceMembershipPlan;
  /** The gym's plans, for "Show a saving" against another of them. */
  plans: MarketplaceMembershipPlan[];
  /**
   * The gym's listings when it has two or more: the plan names the one that
   * sells it (board L1-L3). Empty hides the picker; the API then defaults.
   */
  locations?: OrgLocationListing[];
  saving: boolean;
  error?: string | null;
  defaultCurrency: string;
  onSubmit: (data: CreateOrgMembershipPlanRequest) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const PERIODS = [
    { value: "7", label: "Weekly", days: 7 },
    { value: "30", label: "Monthly", days: 30 },
    { value: "90", label: "Quarterly", days: 90 },
    { value: "365", label: "Annual", days: 365 },
    { value: "custom", label: "Custom…", days: 0 },
  ];
  const initialPeriod = initial
    ? (PERIODS.find((pp) => pp.days === initial.duration_days)?.value ?? "custom")
    : "30";

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [planType, setPlanType] = useState<MembershipPlanType>(initial?.plan_type ?? MembershipPlanType.SUBSCRIPTION);
  const [period, setPeriod] = useState(initialPeriod);
  const [customDays, setCustomDays] = useState(initial?.duration_days ?? 30);
  /**
   * The price as the field shows it plus its value in MINOR units. The minor
   * value is what gets sent; `priceMinor` starts as the plan's saved value
   * verbatim, because `formatMinorForInput` is lossy for a whole-unit currency
   * (199 kobo renders "₦2") and re-parsing the prefill would quietly round a
   * saved price on a save that only changed the plan's name.
   */
  const [price, setPrice] = useState(() =>
    initial ? formatMinorForInput(initial.price_minor, { currency: initial.currency }) : "",
  );
  const [priceMinor, setPriceMinor] = useState<number | null>(initial?.price_minor ?? null);
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [comparison, setComparison] = useState(() => comparisonFromPlan(initial));
  const [listingId, setListingId] = useState(() => (initial?.listing_id ? String(initial.listing_id) : ""));
  const [localError, setLocalError] = useState<string | null>(null);
  const pickLocation = locations.length > 0;

  const oneTime = planType === MembershipPlanType.ONE_TIME;
  const durationDays = period === "custom" ? customDays : Number(period);

  const submit = () => {
    if (pickLocation && !listingId) return setLocalError(PLAN_LOCATION_COPY.required);
    if (!name.trim()) return setLocalError("Give the plan a name.");
    // Plans price in the org's default currency; there is no guessed one.
    if (!defaultCurrency) return setLocalError("Choose your default currency in Settings before adding a plan.");
    // A non-empty field that parses to null is a price the wire cannot carry
    // exactly, not a zero — refuse it rather than saving a rounded amount.
    if (price === "" || priceMinor === null || priceMinor < 0) return setLocalError("Enter a valid price.");
    if (!Number.isInteger(durationDays) || durationDays < 1) return setLocalError("Duration must be at least 1 day.");
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      plan_type: planType,
      duration_days: durationDays,
      // MINOR units, straight from <MoneyInput> — nothing here re-parses the
      // formatted string, so ₦5,000 leaves as 500000 and not as 5000.
      price_minor: priceMinor,
      currency: defaultCurrency,
      features,
      is_public: isPublic,
      ...comparisonPayload(comparison),
      ...(pickLocation && listingId ? { listing_id: listingId } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      {pickLocation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <Eyebrow as="span">{PLAN_LOCATION_COPY.label}</Eyebrow>
            <SearchableSelect
              value={listingId}
              onChange={(v) => { setListingId(v); setLocalError(null); }}
              options={locations.map((l) => ({ label: locationOptionLabel(l), value: l._id }))}
              placeholder={PLAN_LOCATION_COPY.placeholder}
            />
            <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>{PLAN_LOCATION_COPY.hint}</span>
          </label>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Plan name</Eyebrow>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Description</Eyebrow>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="optional" className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Type</Eyebrow>
          <SearchableSelect
            value={planType}
            onChange={(v) => setPlanType(v as MembershipPlanType)}
            options={[
              { label: "Subscription", value: MembershipPlanType.SUBSCRIPTION },
              { label: "One-time", value: MembershipPlanType.ONE_TIME },
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">
            {oneTime ? "Access window" : "Billing period"}
          </Eyebrow>
          <SearchableSelect
            value={period}
            onChange={(v) => setPeriod(v)}
            options={PERIODS.map((pp) => ({
              label: pp.value === "custom" ? pp.label : oneTime ? `${pp.days} days` : pp.label,
              value: pp.value,
            }))}
          />
        </label>
        {period === "custom" && (
          <label className="flex flex-col gap-1.5">
            <Eyebrow as="span">Days</Eyebrow>
            <input type="number" min={1} value={customDays} onChange={(e) => setCustomDays(Math.max(1, Math.round(Number(e.target.value) || 1)))} className={INPUT_CLASS} style={INPUT_STYLE} />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Price</Eyebrow>
          {/* MoneyInput renders the currency symbol itself (₦5,000), exactly as
              formatCurrency will render the saved value, so the standalone
              currency-code prefix is gone rather than duplicated. */}
          <MoneyInput
            value={price}
            currency={defaultCurrency}
            aria-label={defaultCurrency ? `Price (${defaultCurrency})` : "Price"}
            placeholder="0"
            onChange={(display, minor) => { setPrice(display); setPriceMinor(minor); }}
            className={INPUT_CLASS}
            style={{ ...INPUT_STYLE, fontVariantNumeric: "tabular-nums" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Visible on listing</Eyebrow>
          <div className="flex items-center h-9">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          </div>
        </label>
      </div>
      <ChipEditor label="Features" values={features} onChange={setFeatures} placeholder="e.g. 24/7 access" />
      <PlanComparisonFields plans={plans} planId={initial?._id} currency={defaultCurrency} value={comparison} onChange={setComparison} />
      {(localError || error) && <p className="text-[12.5px]" style={{ color: "var(--danger, #b00020)" }}>{localError || error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary-v2 sm" disabled={saving} onClick={submit}>{saving ? "Saving…" : submitLabel}</button>
        <button className="btn-ghost-v2 sm" disabled={saving} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
