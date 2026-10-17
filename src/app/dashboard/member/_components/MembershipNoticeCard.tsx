import Link from "next/link";
import type { MembershipNotice } from "../memberHome";

/**
 * Home's one status card for a membership that needs the member (F8): an
 * overdue payment (danger) or a term ending this week that nothing renews
 * (warn). An inline banner with one primary action (K14): Renew when paying
 * is the fix, and Billing, opened at the membership, either way.
 */
export function MembershipNoticeCard({ notice }: { notice: MembershipNotice }) {
  const overdue = notice.kind === "past_due";
  return (
    <section
      aria-labelledby="membership-notice-title"
      data-testid="membership-notice"
      className="flex flex-col gap-3 rounded-(--r-3) px-5 py-4 sm:flex-row sm:items-center"
      style={{
        background: overdue ? "var(--danger-soft)" : "var(--warn-soft)",
        border: `1px solid ${overdue ? "var(--danger)" : "var(--warn)"}`,
      }}
    >
      <div className="min-w-0 flex-1 text-[13.5px]" style={{ color: "var(--ink)" }}>
        <h2 id="membership-notice-title" className="text-[13.5px] font-medium">
          {notice.title}
        </h2>
        <p className="mt-0.5" style={{ color: "var(--fg-2)" }}>
          {notice.body}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          href={notice.billingHref}
          className={notice.renewHref ? "btn-ghost-v2 sm" : "btn-primary-v2 sm"}
          style={{ whiteSpace: "nowrap" }}
        >
          Billing
        </Link>
        {notice.renewHref && (
          <Link href={notice.renewHref} className="btn-primary-v2 sm" style={{ whiteSpace: "nowrap" }}>
            Renew
          </Link>
        )}
      </div>
    </section>
  );
}
