"use client";

import React, { useEffect, useState } from "react";
import { StatusPill } from "@/components/ds/StatusPill";
import { DSCard, Eyebrow } from "@/components/ds";
import { useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { membershipStatusMeta } from "@/lib/constants/membershipStatus";
import { minorToMajor } from "@/lib/money/minorMoney";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { TrainerCard } from "./TrainerCard";

function getMemberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`.trim();
  }
  return "Unknown";
}

/** The member's user id, only when the reference is populated. */
function getMemberUserId(sub: MembershipSubscription): string | null {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return sub.member_user_id._id;
  }
  return null;
}

function getMemberEmail(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return sub.member_user_id.email;
  }
  return "-";
}

function getPlanName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
    return sub.plan_id.name;
  }
  return "-";
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

export default function GymSingleMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = React.use(params);
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { fmtDate, fmtMoney } = useOrgFormat();
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const res = await marketplaceService.getOrgMembershipSubscriptionById(currentOrg._id, memberId);
      if (!mounted) return;
      if (res.success && res.data) {
        setSubscription(res.data);
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
  const statusMeta = membershipStatusMeta(subscription.status);
  const statusLabel = statusMeta.label;
  const memberUserId = getMemberUserId(subscription);
  // Direct messaging is relationship-gated server-side to ACTIVE members
  // exactly — messaging.service.ts matches `status: ACTIVE`, not the door
  // check — so this stays ACTIVE-only even though `past_due` still has access.
  const canMessage =
    subscription.status === MembershipSubscriptionStatus.ACTIVE && !!memberUserId;

  const kpis = [
    { label: "Plan", value: planName },
    {
      label: "Status",
      value: statusLabel,
      style: { color: statusMeta.color },
    },
    {
      label: "Amount paid",
      value: fmtMoney(minorToMajor(subscription.amount_paid_minor, subscription.currency), subscription.currency),
    },
    {
      label: "Expires",
      value: subscription.end_date ? fmtDate(subscription.end_date) : "Open-ended",
    },
  ];

  const details: { label: string; value: string }[] = [
    { label: "Plan", value: planName },
    // The hint spells out what the state means for access and for the bill —
    // "Suspended" alone does not tell an operator that paid time keeps running.
    { label: "Status", value: `${statusLabel}, ${statusMeta.hint}` },
    {
      label: "Started",
      value: fmtDate(subscription.start_date),
    },
    {
      label: "Expires",
      value: subscription.end_date ? fmtDate(subscription.end_date) : "Open-ended",
    },
    {
      label: "Amount paid",
      value: fmtMoney(minorToMajor(subscription.amount_paid_minor, subscription.currency), subscription.currency),
    },
    {
      label: "Payment reference",
      value: subscription.payment_reference ?? "-",
    },
    {
      label: "Enrolled",
      value: fmtDate(subscription.created_at),
    },
  ];

  return (
    <GymDashboardShell activeItem="Members" crumb={name}>
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div
          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-(--r-3) flex-shrink-0 flex items-center justify-center text-[22px] font-semibold"
          style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
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
            {fmtDate(subscription.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canMessage && (
            <StartConversationButton
              recipientUserId={memberUserId!}
              messagesHref="/dashboard/gym-owner/messages"
              label="Message"
            />
          )}
          <StatusPill tone={statusMeta.tone} label={statusLabel} title={statusMeta.hint} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpis.map((k) => (
          // Not DSStatCard: these values are words (plan, status) that must
          // truncate at 20px, which the stat card's number slot doesn't do.
          <DSCard key={k.label} className="p-3.5 px-4">
            <Eyebrow>{k.label}</Eyebrow>
            <div
              className="text-[20px] font-medium tracking-[-0.02em] mt-1 truncate"
              style={k.style ?? { color: "var(--ink)" }}
            >
              {k.value}
            </div>
          </DSCard>
        ))}
      </div>

      {/* Subscription details + trainer */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-3.5">
        {/* Subscription detail */}
        <DSCard className="p-5.5">
          <h3 className="text-[15px] font-medium mb-4" style={{ color: "var(--ink)" }}>
            Subscription details
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {details.map((row) => (
              <div key={row.label}>
                <Eyebrow className="mb-0.5">{row.label}</Eyebrow>
                <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </DSCard>

        {/* Who coaches this member */}
        <TrainerCard
          organizationId={currentOrg!._id}
          subscriptionId={subscription._id}
          assignedUserId={subscription.assigned_staff_user_id ?? null}
          canAssign={
            subscription.status !== MembershipSubscriptionStatus.CANCELLED &&
            subscription.status !== MembershipSubscriptionStatus.EXPIRED
          }
          onAssigned={(userId) => setSubscription((s) => (s ? { ...s, assigned_staff_user_id: userId } : s))}
        />
      </div>

      {/* Activity — not yet available */}
      <DSCard className="p-5.5 flex flex-col items-center justify-center gap-2 min-h-[120px]">
        <p className="text-[14px] font-medium" style={{ color: "var(--fg-2)" }}>Activity</p>
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Activity tracking coming soon.
        </p>
      </DSCard>
    </GymDashboardShell>
  );
}
