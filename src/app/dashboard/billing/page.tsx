"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizationContextBanner } from "@/components/ds/OrganizationContextBanner";
import { AsyncSpinner } from "@/components/ds";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  providerBillingApi,
  ProviderInvoiceStatus,
  ProviderPlanTier,
  ProviderSubscriptionStatus,
  formatMinorAmount,
  type ProviderBillingStatus,
  type ProviderInvoice,
  type ProviderPlanOption,
} from "@/lib/api/providerBilling";

function subscriptionStatusColor(status: ProviderSubscriptionStatus): React.CSSProperties {
  switch (status) {
    case ProviderSubscriptionStatus.ACTIVE:
    case ProviderSubscriptionStatus.TRIALING:
      return { background: "var(--signal-soft)", color: "var(--signal)" };
    case ProviderSubscriptionStatus.PAST_DUE:
      return { background: "var(--bg-2)", color: "var(--warn)" };
    case ProviderSubscriptionStatus.CANCELLED:
    case ProviderSubscriptionStatus.EXPIRED:
      return { background: "var(--danger-soft)", color: "var(--danger)" };
    default:
      return { background: "var(--bg-2)", color: "var(--fg-3)" };
  }
}

function invoiceStatusColor(status: ProviderInvoiceStatus): React.CSSProperties {
  switch (status) {
    case ProviderInvoiceStatus.PAID:
      return { background: "var(--signal-soft)", color: "var(--signal)" };
    case ProviderInvoiceStatus.OPEN:
      return { background: "var(--bg-2)", color: "var(--fg-2)" };
    case ProviderInvoiceStatus.VOID:
    case ProviderInvoiceStatus.UNCOLLECTIBLE:
      return { background: "var(--danger-soft)", color: "var(--danger)" };
    default:
      return { background: "var(--bg-2)", color: "var(--fg-3)" };
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const TIER_LABELS: Record<ProviderPlanTier, string> = {
  [ProviderPlanTier.FREE]: "Free",
  [ProviderPlanTier.PRO]: "Pro",
  [ProviderPlanTier.ENTERPRISE]: "Enterprise",
};

export default function ProviderBillingPage() {
  const router = useRouter();
  const { organizations, currentOrg, setCurrentOrg } = useOrganization();
  const orgId = currentOrg?._id;

  const [billingStatus, setBillingStatus] = useState<ProviderBillingStatus | null>(null);
  const [plans, setPlans] = useState<ProviderPlanOption[]>([]);
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "invoices">("overview");

  const [interval, setInterval] = useState<"month" | "year">("month");

  useEffect(() => {
    const load = async () => {
      if (!orgId) return;
      setIsLoading(true);
      setError(null);

      try {
        const [statusRes, plansRes, invoicesRes] = await Promise.all([
          providerBillingApi.getStatus(orgId),
          providerBillingApi.listPlans(),
          providerBillingApi.listInvoices(orgId, { limit: 10 }),
        ]);

        if (statusRes.success && statusRes.data) {
          setBillingStatus(statusRes.data);
        }
        if (plansRes.success && Array.isArray(plansRes.data)) {
          setPlans(plansRes.data.sort((a, b) => a.sort_order - b.sort_order));
        }
        if (invoicesRes.success && invoicesRes.data?.invoices) {
          setInvoices(invoicesRes.data.invoices);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing data");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [orgId]);

  async function handleCheckout(tier: ProviderPlanTier) {
    if (!orgId) return;

    setCheckoutLoading(tier);
    setError(null);

    try {
      const res = await providerBillingApi.createCheckout(orgId, {
        plan_tier: tier,
        interval,
        success_url: `${window.location.origin}/dashboard/billing?success=1`,
        cancel_url: `${window.location.origin}/dashboard/billing`,
      });

      if (res.success && res.data?.checkout_url) {
        router.push(res.data.checkout_url);
      } else {
        setError("Could not create checkout session. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  }

  function renderLimitValue(val: number | null): string {
    return val === null ? "Unlimited" : val.toLocaleString();
  }

  const currentTier = billingStatus?.plan_tier ?? ProviderPlanTier.FREE;

  return (
    <GymDashboardShell activeItem="Billing" crumb="Billing">
      <div className="flex flex-col gap-5">
        <div>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Organization
          </div>
          <h1
            className="text-[30px] font-medium mt-1"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Billing
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            Manage your plan, view usage, and access invoices.
          </p>
        </div>

        <OrganizationContextBanner
          label="Billing organization"
          helperText="Switch organizations before reviewing plan usage or invoices."
          organizations={organizations}
          currentOrg={currentOrg}
          onChange={setCurrentOrg}
        />

        {error && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        {!currentOrg ? (
          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>
              Select an organization to view billing details.
            </p>
          </div>
        ) : isLoading ? (
          <AsyncSpinner label="Loading billing data" />
        ) : (
          <>
            {billingStatus && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className="rounded-(--r-3) p-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Plan
                  </div>
                  <div className="text-[26px] font-medium mt-2" style={{ color: "var(--ink)" }}>
                    {TIER_LABELS[billingStatus.plan_tier]}
                  </div>
                  <div className="mt-1">
                    <span
                      className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded-(--r-2)"
                      style={subscriptionStatusColor(billingStatus.subscription_status)}
                    >
                      {billingStatus.subscription_status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-(--r-3) p-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Period end
                  </div>
                  <div className="text-[20px] font-medium mt-2" style={{ color: "var(--ink)" }}>
                    {formatDate(billingStatus.subscription_current_period_end)}
                  </div>
                  {billingStatus.subscription_trial_end && (
                    <div className="text-xs mt-1" style={{ color: "var(--warn)" }}>
                      Trial ends {formatDate(billingStatus.subscription_trial_end)}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-(--r-3) p-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Members
                  </div>
                  <div className="text-[26px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)" }}>
                    {billingStatus.usage.active_members}
                    <span className="text-base ml-1" style={{ color: "var(--fg-3)" }}>
                      / {renderLimitValue(billingStatus.limits.max_active_members)}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-(--r-3) p-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Staff
                  </div>
                  <div className="text-[26px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)" }}>
                    {billingStatus.usage.staff_members}
                    <span className="text-base ml-1" style={{ color: "var(--fg-3)" }}>
                      / {renderLimitValue(billingStatus.limits.max_staff_members)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div
              className="rounded-(--r-3) overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div
                className="flex gap-1 p-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                {(["overview", "plans", "invoices"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium capitalize"
                    style={{
                      background: activeTab === tab ? "var(--ink)" : "transparent",
                      color: activeTab === tab ? "var(--bg)" : "var(--fg-2)",
                      cursor: "pointer",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "overview" && billingStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--ink)" }}>
                        Usage
                      </h3>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "Members", used: billingStatus.usage.active_members, max: billingStatus.limits.max_active_members },
                          { label: "Plans", used: billingStatus.usage.membership_plans, max: billingStatus.limits.max_membership_plans },
                          { label: "Staff", used: billingStatus.usage.staff_members, max: billingStatus.limits.max_staff_members },
                          { label: "Listings", used: billingStatus.usage.listings, max: billingStatus.limits.max_listings },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span style={{ color: "var(--fg-2)" }}>{item.label}</span>
                              <span className="font-mono tabular-nums" style={{ color: "var(--fg-3)" }}>
                                {item.used} / {renderLimitValue(item.max)}
                              </span>
                            </div>
                            {item.max !== null && (
                              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-3)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    background: item.used / item.max > 0.9
                                      ? "var(--danger)"
                                      : item.used / item.max > 0.7
                                        ? "var(--warn)"
                                        : "var(--signal)",
                                    width: `${Math.min(100, (item.used / item.max) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--ink)" }}>
                        Features
                      </h3>
                      <div className="flex flex-col gap-2">
                        {Object.entries(billingStatus.features).map(([key, enabled]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize" style={{ color: "var(--fg-2)" }}>
                              {key.replace(/_/g, " ").replace(" enabled", "")}
                            </span>
                            <span
                              className="font-mono text-xs uppercase px-2 py-0.5 rounded-(--r-1)"
                              style={{
                                background: enabled ? "var(--signal-soft)" : "var(--bg-2)",
                                color: enabled ? "var(--signal)" : "var(--fg-4)",
                              }}
                            >
                              {enabled ? "on" : "off"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "plans" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--fg-2)" }}>Billing interval:</span>
                      <div className="flex gap-1">
                        {(["month", "year"] as const).map((iv) => (
                          <button
                            key={iv}
                            type="button"
                            onClick={() => setInterval(iv)}
                            className="rounded-(--r-2) px-3 py-1 text-sm"
                            style={{
                              background: interval === iv ? "var(--ink)" : "transparent",
                              color: interval === iv ? "var(--bg)" : "var(--fg-2)",
                              border: `1px solid ${interval === iv ? "var(--ink)" : "var(--border)"}`,
                              cursor: "pointer",
                            }}
                          >
                            {iv === "month" ? "Monthly" : "Annual (save 20%)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans.map((plan) => {
                        const price = plan.prices[interval];
                        const isCurrent = plan.code === currentTier;

                        return (
                          <div
                            key={plan.code}
                            className="rounded-(--r-3) p-4 flex flex-col gap-3"
                            style={{
                              border: isCurrent
                                ? "2px solid var(--ink)"
                                : "1px solid var(--border)",
                              background: "var(--bg-2)",
                            }}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium" style={{ color: "var(--ink)" }}>
                                  {plan.name}
                                </span>
                                {isCurrent && (
                                  <span
                                    className="font-mono text-xs uppercase px-2 py-0.5 rounded-(--r-full)"
                                    style={{ background: "var(--ink)", color: "var(--bg)" }}
                                  >
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
                                {plan.description}
                              </div>
                            </div>

                            <div>
                              {price ? (
                                <div>
                                  <span className="text-[26px] font-medium" style={{ color: "var(--ink)" }}>
                                    {formatMinorAmount(price.amount_minor, price.currency)}
                                  </span>
                                  <span className="text-sm" style={{ color: "var(--fg-3)" }}>
                                    /{interval}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>
                                  Free
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 text-sm" style={{ color: "var(--fg-2)" }}>
                              <div>{renderLimitValue(plan.limits.max_active_members)} members</div>
                              <div>{renderLimitValue(plan.limits.max_staff_members)} staff</div>
                              <div>{renderLimitValue(plan.limits.max_membership_plans)} plans</div>
                              {plan.features.analytics_enabled && <div>Analytics</div>}
                              {plan.features.consultations_enabled && <div>Consultations</div>}
                              {plan.features.qr_checkin_enabled && <div>QR check-in</div>}
                              {plan.features.white_label_enabled && <div>White label</div>}
                            </div>

                            {!isCurrent && plan.code !== ProviderPlanTier.FREE && (
                              <button
                                type="button"
                                onClick={() => handleCheckout(plan.code)}
                                disabled={checkoutLoading === plan.code}
                                className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                                style={{
                                  background: "var(--ink)",
                                  color: "var(--bg)",
                                  cursor: checkoutLoading === plan.code ? "not-allowed" : "pointer",
                                  opacity: checkoutLoading === plan.code ? 0.7 : 1,
                                }}
                              >
                                {checkoutLoading === plan.code ? "Loading..." : `Upgrade to ${plan.name}`}
                              </button>
                            )}
                            {!isCurrent && plan.code === ProviderPlanTier.FREE && (
                              <div className="text-sm" style={{ color: "var(--fg-3)" }}>
                                Contact support to downgrade
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "invoices" && (
                  <>
                    {invoices.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                        No invoices yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Period</th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Amount</th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Status</th>
                              <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Download</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => (
                              <tr key={invoice._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                                  {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
                                </td>
                                <td className="py-3 pr-4 font-mono tabular-nums" style={{ color: "var(--ink)" }}>
                                  {formatMinorAmount(invoice.amount_due, invoice.currency)}
                                </td>
                                <td className="py-3 pr-4">
                                  <span
                                    className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded-(--r-2)"
                                    style={invoiceStatusColor(invoice.status)}
                                  >
                                    {invoice.status}
                                  </span>
                                </td>
                                <td className="py-3">
                                  {invoice.pdf_url ? (
                                    <a
                                      href={invoice.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm"
                                      style={{ color: "var(--ink)", textDecoration: "underline" }}
                                    >
                                      PDF
                                    </a>
                                  ) : invoice.hosted_invoice_url ? (
                                    <a
                                      href={invoice.hosted_invoice_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm"
                                      style={{ color: "var(--ink)", textDecoration: "underline" }}
                                    >
                                      View invoice
                                    </a>
                                  ) : (
                                    <span style={{ color: "var(--fg-4)" }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </GymDashboardShell>
  );
}
