"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { format } from "date-fns";

function getMemberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`.trim();
  }
  return "Unknown";
}

function getMemberEmail(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return sub.member_user_id.email;
  }
  return "—";
}

function getPlanName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
    return sub.plan_id.name;
  }
  return "—";
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

const STATUS_LABEL: Record<MembershipSubscriptionStatus, string> = {
  [MembershipSubscriptionStatus.ACTIVE]: "Active",
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: "Pending payment",
  [MembershipSubscriptionStatus.EXPIRED]: "Expired",
  [MembershipSubscriptionStatus.CANCELLED]: "Cancelled",
};

const STATUS_STYLE: Record<MembershipSubscriptionStatus, { color: string; bg: string }> = {
  [MembershipSubscriptionStatus.ACTIVE]:          { color: "var(--signal-ink)", bg: "var(--signal-soft)" },
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)" },
  [MembershipSubscriptionStatus.EXPIRED]:         { color: "var(--fg-3)", bg: "var(--bg-2)" },
  [MembershipSubscriptionStatus.CANCELLED]:       { color: "var(--danger)", bg: "var(--danger-soft)" },
};

export default function GymSingleMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = React.use(params);
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const res = await marketplaceService.getOrgMembershipSubscriptions(currentOrg._id);
      if (!mounted) return;
      if (res.success && res.data) {
        const found = res.data.find((s) => s._id === memberId);
        if (found) setSubscription(found);
        else setNotFound(true);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    void load();
    return () => { mounted = false; };
  }, [currentOrg, memberId]);

  if (loading) {
    return (
      <GymDashboardShell activeItem="Members" crumb="Loading…">
        <div className="space-y-4">
          <div className="flex gap-4.5 items-center">
            <div className="w-[72px] h-[72px] rounded-(--r-3) animate-pulse" style={{ background: "var(--bg-2)" }} />
            <div className="space-y-2.5">
              <div className="h-7 w-52 rounded animate-pulse" style={{ background: "var(--bg-2)" }} />
              <div className="h-4 w-72 rounded animate-pulse" style={{ background: "var(--bg-2)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-(--r-3) p-4 h-20 animate-pulse" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} />
            ))}
          </div>
        </div>
      </GymDashboardShell>
    );
  }

  if (notFound || !subscription) {
    return (
      <GymDashboardShell activeItem="Members" crumb="Not found">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Member not found</p>
          <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            This membership record may have been removed or the link is invalid.
          </p>
          <button type="button" onClick={() => router.back()} className="btn-ghost-v2 mt-2">
            Go back
          </button>
        </div>
      </GymDashboardShell>
    );
  }

  const name = getMemberName(subscription);
  const email = getMemberEmail(subscription);
  const planName = getPlanName(subscription);
  const statusStyle = STATUS_STYLE[subscription.status];
  const statusLabel = STATUS_LABEL[subscription.status];

  const kpis = [
    { label: "Plan", value: planName },
    {
      label: "Status",
      value: statusLabel,
      style: { color: statusStyle.color },
    },
    {
      label: "Amount paid",
      value: `${subscription.currency} ${subscription.amount_paid.toLocaleString()}`,
    },
    {
      label: "Expires",
      value: subscription.end_date
        ? format(new Date(subscription.end_date), "dd MMM yyyy")
        : "Open-ended",
    },
  ];

  const details: { label: string; value: string }[] = [
    { label: "Plan", value: planName },
    { label: "Status", value: statusLabel },
    {
      label: "Started",
      value: format(new Date(subscription.start_date), "dd MMM yyyy"),
    },
    {
      label: "Expires",
      value: subscription.end_date
        ? format(new Date(subscription.end_date), "dd MMM yyyy")
        : "Open-ended",
    },
    {
      label: "Amount paid",
      value: `${subscription.currency} ${subscription.amount_paid.toLocaleString()}`,
    },
    {
      label: "Payment reference",
      value: subscription.payment_reference ?? "—",
    },
    {
      label: "Enrolled",
      value: format(new Date(subscription.created_at), "dd MMM yyyy"),
    },
  ];

  return (
    <GymDashboardShell activeItem="Members" crumb={name}>
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div
          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-(--r-3) flex-shrink-0 flex items-center justify-center text-[22px] font-semibold"
          style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 80), oklch(0.72 0.06 60))", color: "white" }}
        >
          {getInitials(name)}
        </div>
        <div className="flex-1">
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>
            {name}
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {email}
            {" · joined "}
            {format(new Date(subscription.created_at), "dd MMM yyyy")}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2.5 py-1.5 rounded-full"
          style={{ color: statusStyle.color, background: statusStyle.bg }}
        >
          <span className="w-1.25 h-1.25 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-(--r-3) p-3.5 px-4"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.04em]"
              style={{ color: "var(--fg-3)" }}
            >
              {k.label}
            </div>
            <div
              className="text-[20px] font-medium tracking-[-0.02em] mt-1 truncate"
              style={k.style ?? { color: "var(--ink)" }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Subscription details + placeholders */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-3.5">
        {/* Subscription detail */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-4" style={{ color: "var(--ink)" }}>
            Subscription details
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {details.map((row) => (
              <div key={row.label}>
                <div
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] mb-0.5"
                  style={{ color: "var(--fg-3)" }}
                >
                  {row.label}
                </div>
                <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes — not yet available */}
        <div
          className="rounded-(--r-3) p-5.5 flex flex-col items-center justify-center gap-2 min-h-[160px]"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <p className="text-[14px] font-medium" style={{ color: "var(--fg-2)" }}>Notes</p>
          <p className="text-[13px] text-center" style={{ color: "var(--fg-3)" }}>
            No notes yet.
          </p>
        </div>
      </div>

      {/* Activity — not yet available */}
      <div
        className="rounded-(--r-3) p-5.5 flex flex-col items-center justify-center gap-2 min-h-[120px]"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <p className="text-[14px] font-medium" style={{ color: "var(--fg-2)" }}>Activity</p>
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Activity tracking coming soon.
        </p>
      </div>
    </GymDashboardShell>
  );
}
