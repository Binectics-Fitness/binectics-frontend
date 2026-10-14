import Link from "next/link";
import { DSCard } from "@/components/ds";

/** Where a provider sets how much a cancelling member gets back. */
export const CANCELLATION_POLICY_HREF = "/dashboard/refunds?tab=policy";

/**
 * A settings row pointing at the cancellation policy, which lives with
 * refunds (it decides the automatic refund a cancelling member gets). One
 * sentence, one link.
 */
export function CancellationPolicyCard() {
  return (
    <DSCard className="p-5.5">
      <section aria-labelledby="cancellation-policy-heading">
        <h2 id="cancellation-policy-heading" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          Cancellation policy
        </h2>
        <p className="text-[13px] mt-1 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>
          How much a member gets back when they cancel a paid session. Until you set one, cancelling 24 hours or more
          ahead refunds in full.
        </p>
        <Link
          href={CANCELLATION_POLICY_HREF}
          className="inline-block mt-3 text-[13.5px] font-medium underline"
          style={{ color: "var(--ink)" }}
        >
          Set your cancellation policy
        </Link>
      </section>
    </DSCard>
  );
}
