"use client";

import { Bookmark, CreditCard, FileText, HelpCircle, Inbox, Receipt, Search, Settings, ShoppingBag } from "lucide-react";
import { Eyebrow, IconTile, PageHeader, ListRow } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { paidContentOn } from "@/lib/paidContent/helpers";
import { SoloPage } from "../_components/solo/SoloPage";

interface MeRow {
  href: string;
  title: string;
  meta: string;
  icon: typeof Search;
}

const FIND: MeRow = { href: "/marketplace", title: "Find a coach or gym", meta: "Explore", icon: Search };

const ACCOUNT: MeRow[] = [
  { href: "/dashboard/member/requests", title: "Requests", meta: "Coaching and gym requests", icon: Inbox },
  { href: "/dashboard/saved-providers", title: "Saved", meta: "Coaches and gyms you saved", icon: Bookmark },
  { href: "/dashboard/member/reports", title: "Reports", meta: "Shared with your coach", icon: FileText },
];

const MONEY: MeRow[] = [
  { href: "/dashboard/member/billing", title: "Billing", meta: "Memberships, cards, renewals", icon: CreditCard },
  { href: "/dashboard/member/payments", title: "Payments", meta: "What you owe and your receipts", icon: Receipt },
];

const PURCHASES: MeRow = { href: "/dashboard/member/purchases", title: "Purchases", meta: "Programs and meal plans you hold", icon: ShoppingBag };

const MORE: MeRow[] = [
  { href: "/dashboard/settings", title: "Settings", meta: "Profile, privacy, notifications", icon: Settings },
  { href: "/help", title: "Help", meta: "Answers and contact", icon: HelpCircle },
];

function Group({ id, title, rows }: { id: string; title: string; rows: MeRow[] }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <Eyebrow as="h2" id={id}>
        {title}
      </Eyebrow>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.href} style={{ listStyle: "none" }}>
            <ListRow href={r.href} title={r.title} meta={r.meta} leading={<IconTile icon={r.icon} />} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Me (flag `member_shell_v2`): one list of the pages that used to be separate
 * bar links, grouped as the mobile Me tab groups them. Nothing is stored here.
 */
export default function MemberMePage() {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const currentOrgId = useOptionalOrganization()?.currentOrg?._id ?? null;
  const purchases = paidContentOn(isEnabled, currentOrgId);
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  return (
    <SoloPage activeLabel="">
      <PageHeader title="Me" subtitle={name || undefined} />
      <div className="flex flex-col gap-6" style={{ maxWidth: 720 }}>
        <Group id="me-find" title="Providers" rows={[FIND]} />
        <Group id="me-account" title="Your account" rows={ACCOUNT} />
        <Group id="me-money" title="Money" rows={purchases ? [MONEY[0], PURCHASES, MONEY[1]] : MONEY} />
        <Group id="me-more" title="More" rows={MORE} />
      </div>
    </SoloPage>
  );
}
