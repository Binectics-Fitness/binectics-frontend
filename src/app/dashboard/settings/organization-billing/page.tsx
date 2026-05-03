"use client";

import { useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/Toast";
import {
  providerBillingApi,
  ProviderPlanTier,
  ProviderSubscriptionStatus,
  ProviderInvoiceStatus,
  formatMinorAmount,
  type ProviderBillingStatus,
  type ProviderInvoice,
  type ProviderPlanOption,
  type BillingInterval,
} from "@/lib/api/providerBilling";

const STATUS_LABEL: Record<ProviderSubscriptionStatus, string> = {
  [ProviderSubscriptionStatus.ACTIVE]: "Active",
  [ProviderSubscriptionStatus.TRIALING]: "Trial",
  [ProviderSubscriptionStatus.PAST_DUE]: "Past due",
  [ProviderSubscriptionStatus.CANCELLED]: "Cancelled",
  [ProviderSubscriptionStatus.EXPIRED]: "Expired",
  [ProviderSubscriptionStatus.PENDING_PAYMENT]: "Awaiting payment",
};

const STATUS_TONE: Record<ProviderSubscriptionStatus, string> = {
  [ProviderSubscriptionStatus.ACTIVE]: "bg-primary-500/15 text-primary-700",
  [ProviderSubscriptionStatus.TRIALING]: "bg-accent-blue-500/15 text-accent-blue-700",
  [ProviderSubscriptionStatus.PAST_DUE]: "bg-amber-100 text-amber-700",
  [ProviderSubscriptionStatus.CANCELLED]: "bg-neutral-200 text-foreground/70",
  [ProviderSubscriptionStatus.EXPIRED]: "bg-red-100 text-red-700",
  [ProviderSubscriptionStatus.PENDING_PAYMENT]: "bg-amber-100 text-amber-700",
};

const FEATURE_LABELS: Array<{
  key: keyof ProviderBillingStatus["features"];
  label: string;
}> = [
  { key: "qr_checkin_enabled", label: "QR check-in" },
  { key: "journals_enabled", label: "Client journals" },
  { key: "consultations_enabled", label: "Consultations" },
  { key: "analytics_enabled", label: "Analytics" },
  { key: "white_label_enabled", label: "White-label branding" },
  { key: "custom_domain_enabled", label: "Custom domain" },
  { key: "branded_email_enabled", label: "Branded email" },
];

const QUOTA_FIELDS: Array<{
  usageKey: keyof ProviderBillingStatus["usage"];
  limitKey: keyof ProviderBillingStatus["limits"];
  label: string;
}> = [
  { usageKey: "active_members", limitKey: "max_active_members", label: "Active members" },
  { usageKey: "membership_plans", limitKey: "max_membership_plans", label: "Membership plans" },
  { usageKey: "staff_members", limitKey: "max_staff_members", label: "Staff seats" },
  { usageKey: "listings", limitKey: "max_listings", label: "Listings" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function OrganizationBillingPage() {
  const { currentOrg, isLoading: isOrgLoading } = useOrganization();
  const [status, setStatus] = useState<ProviderBillingStatus | null>(null);
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const orgId = currentOrg?._id ?? null;

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    void Promise.all([
      providerBillingApi.getStatus(orgId),
      providerBillingApi.listInvoices(orgId, { limit: 20 }),
    ]).then(([statusRes, invoicesRes]) => {
      if (!active) return;
      if (statusRes.success && statusRes.data) {
        setStatus(statusRes.data);
      } else {
        toast.error(statusRes.message || "Failed to load billing status");
      }
      if (invoicesRes.success && invoicesRes.data) {
        setInvoices(invoicesRes.data.invoices);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  if (isOrgLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] text-center text-sm text-foreground/70">
        Select or create an organization to view its billing.
      </div>
    );
  }

  if (!currentOrg.is_owner) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] text-sm text-foreground/70">
        Only the organization owner can manage billing for{" "}
        <strong>{currentOrg.name}</strong>.
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanStatusCard
        status={status}
        orgName={currentOrg.name}
        onUpgrade={() => setShowUpgrade(true)}
      />
      <UsageCard status={status} />
      <FeaturesCard status={status} />
      <InvoicesCard invoices={invoices} />

      {showUpgrade && (
        <UpgradeModal
          orgId={currentOrg._id}
          marketCode={status.market_code}
          currentTier={status.plan_tier}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}

// ─── Plan / status card ────────────────────────────────────────────────────

function PlanStatusCard({
  status,
  orgName,
  onUpgrade,
}: {
  status: ProviderBillingStatus;
  orgName: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/50">
            {orgName}
          </p>
          <h2 className="mt-1 text-2xl font-black text-foreground capitalize">
            {status.plan_tier} plan
          </h2>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_TONE[status.subscription_status] ??
              "bg-neutral-200 text-foreground/70"
            }`}
          >
            {STATUS_LABEL[status.subscription_status] ??
              status.subscription_status}
          </span>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          className="self-start rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600"
        >
          {status.plan_tier === ProviderPlanTier.ENTERPRISE
            ? "Manage plan"
            : "Upgrade plan"}
        </button>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fact
          label="Renews"
          value={formatDate(status.subscription_current_period_end)}
        />
        <Fact label="Trial ends" value={formatDate(status.subscription_trial_end)} />
        <Fact label="Market" value={status.market_code} />
      </dl>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-foreground/50">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

// ─── Usage bars ────────────────────────────────────────────────────────────

function UsageCard({ status }: { status: ProviderBillingStatus }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-bold text-foreground">Usage</h3>
      <p className="mt-1 text-sm text-foreground/60">
        How much of your plan you’re currently using.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {QUOTA_FIELDS.map((q) => {
          const used = status.usage[q.usageKey];
          const limit = status.limits[q.limitKey];
          return <UsageBar key={q.usageKey} label={q.label} used={used} limit={limit} />;
        })}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const isUnlimited = limit === null;
  const percent = isUnlimited ? 0 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  const tone =
    percent >= 100
      ? "bg-red-500"
      : percent >= 80
        ? "bg-amber-500"
        : "bg-primary-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-foreground/60">
          {used}
          {isUnlimited ? " / unlimited" : ` / ${limit}`}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        {!isUnlimited && (
          <div className={`h-full ${tone}`} style={{ width: `${percent}%` }} />
        )}
      </div>
    </div>
  );
}

// ─── Features grid ─────────────────────────────────────────────────────────

function FeaturesCard({ status }: { status: ProviderBillingStatus }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-bold text-foreground">Features included</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {FEATURE_LABELS.map((f) => {
          const enabled = status.features[f.key];
          return (
            <li
              key={f.key}
              className="flex items-center gap-2 text-sm text-foreground/80"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  enabled
                    ? "bg-primary-500 text-foreground"
                    : "bg-neutral-200 text-foreground/40"
                }`}
                aria-hidden
              >
                {enabled ? "✓" : "—"}
              </span>
              <span className={enabled ? "" : "text-foreground/40"}>
                {f.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Invoices ──────────────────────────────────────────────────────────────

function InvoicesCard({ invoices }: { invoices: ProviderInvoice[] }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-bold text-foreground">Invoices</h3>
      {invoices.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">
          No invoices yet. Once you upgrade, your billing history will appear
          here.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Gateway</th>
                <th className="py-2 pr-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="text-foreground/80">
                  <td className="py-3 pr-4">
                    {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-foreground">
                    {formatMinorAmount(inv.amount_due, inv.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3 pr-4 capitalize">{inv.gateway}</td>
                  <td className="py-3 pr-4 text-right">
                    {inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent-blue-500 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: ProviderInvoiceStatus }) {
  const tone: Record<ProviderInvoiceStatus, string> = {
    [ProviderInvoiceStatus.PAID]: "bg-primary-500/15 text-primary-700",
    [ProviderInvoiceStatus.OPEN]: "bg-amber-100 text-amber-700",
    [ProviderInvoiceStatus.DRAFT]: "bg-neutral-200 text-foreground/70",
    [ProviderInvoiceStatus.UNCOLLECTIBLE]: "bg-red-100 text-red-700",
    [ProviderInvoiceStatus.VOID]: "bg-neutral-200 text-foreground/50 line-through",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone[status] ?? "bg-neutral-200 text-foreground/70"}`}
    >
      {status}
    </span>
  );
}

// ─── Upgrade modal ─────────────────────────────────────────────────────────

function UpgradeModal({
  orgId,
  marketCode,
  currentTier,
  onClose,
}: {
  orgId: string;
  marketCode: string;
  currentTier: ProviderPlanTier;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<ProviderPlanOption[]>([]);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [isLoading, setIsLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<ProviderPlanTier | null>(null);

  useEffect(() => {
    let active = true;
    void providerBillingApi.listPlans(marketCode).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setPlans(res.data);
      } else {
        toast.error(res.message || "Failed to load plans");
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [marketCode]);

  async function handleSelect(tier: ProviderPlanTier) {
    if (tier === ProviderPlanTier.FREE) {
      toast.info("You can't checkout the Free tier.");
      return;
    }
    setBusyTier(tier);
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/settings/organization-billing`
        : "/dashboard/settings/organization-billing";
    const res = await providerBillingApi.createCheckout(orgId, {
      plan_tier: tier,
      interval,
      success_url: `${baseUrl}?checkout=success`,
      cancel_url: `${baseUrl}?checkout=cancelled`,
    });
    setBusyTier(null);

    if (res.success && res.data?.checkout_url) {
      window.location.assign(res.data.checkout_url);
      return;
    }
    toast.error(res.message || "Failed to start checkout");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground">
              Choose a plan
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Pricing shown for market <strong>{marketCode}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-foreground/50 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 inline-flex rounded-full bg-neutral-100 p-1 text-sm">
          {(["month", "year"] as BillingInterval[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setInterval(opt)}
              className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                interval === opt
                  ? "bg-white text-foreground shadow"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {opt === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => {
                const price = plan.prices[interval];
                const isCurrent = plan.code === currentTier;
                return (
                  <div
                    key={plan.code}
                    className={`flex flex-col rounded-xl border p-5 ${
                      isCurrent
                        ? "border-primary-500 bg-primary-500/5"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <h3 className="text-lg font-bold capitalize text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/60">
                      {plan.description}
                    </p>
                    <p className="mt-4 text-2xl font-black text-foreground">
                      {price
                        ? formatMinorAmount(price.amount_minor, price.currency)
                        : "—"}
                      <span className="ml-1 text-xs font-medium text-foreground/60">
                        /{interval}
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={
                        isCurrent ||
                        plan.code === ProviderPlanTier.FREE ||
                        busyTier !== null ||
                        !price
                      }
                      onClick={() => handleSelect(plan.code)}
                      className="mt-4 w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-foreground/50"
                    >
                      {isCurrent
                        ? "Current plan"
                        : busyTier === plan.code
                          ? "Redirecting…"
                          : !price
                            ? "Unavailable"
                            : `Choose ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
