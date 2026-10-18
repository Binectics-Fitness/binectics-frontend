import { lateCancelSentence, type ClassCancellationPolicy } from "@/lib/classes/cancellationPolicy";

/**
 * A gym's class cancellation policy as members see it: the fee sentence
 * (when there is a fee) and the gym's own note. Renders nothing when the gym
 * has no policy, so no fee is ever mentioned then.
 */
export function ClassCancellationPolicyNotice({
  policy,
  className = "",
}: {
  policy: ClassCancellationPolicy | null | undefined;
  className?: string;
}) {
  if (!policy) return null;
  const sentence = lateCancelSentence(policy);
  return (
    <div
      data-testid="class-cancellation-policy"
      className={`rounded-(--r-2) px-3.5 py-3 ${className}`}
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
        Cancellation policy
      </div>
      {sentence && (
        <p className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {sentence}
        </p>
      )}
      {policy.note && (
        <p className="text-[12.5px] mt-0.5 leading-relaxed whitespace-pre-line" style={{ color: "var(--fg-2)" }}>
          {policy.note}
        </p>
      )}
    </div>
  );
}
