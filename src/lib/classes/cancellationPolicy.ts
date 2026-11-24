/**
 * A gym's class late-cancellation policy, as the API hands it to members
 * (binectics-api feat/class-cancellation-policy).
 *
 * It is a policy, not a charge (owner ruling, Oct 18 2026): a confirmed
 * booking cancelled inside the window has the fee recorded on it, and
 * Binectics never charges it. Copy says "may incur", never "will be charged".
 */
export interface ClassCancellationPolicy {
  /** The gym's trading name. */
  provider_name: string;
  /**
   * Hours before the class by which the gym asks members to cancel; 0 =
   * none. With a fee it is also where the fee applies; without one it is
   * only the gym's request.
   */
  window_hours: number;
  /** 0–100; 0 = no fee. */
  fee_percent: number;
  /** The gym's own words, or null. */
  note: string | null;
}

/** Longest note a gym can write (the API's limit). */
export const CANCELLATION_NOTE_MAX = 500;

/**
 * The policy from an API value, or null when there is none to show. An API
 * before the policy sends nothing, which reads as none. The window counts
 * without a fee (a gym asking for 12 hours' notice and charging nothing);
 * a fee without a window is no fee.
 */
export function readCancellationPolicy(raw: unknown): ClassCancellationPolicy | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const fee = Number(r.fee_percent ?? 0);
  const hours = Number(r.window_hours ?? 0);
  const hasFee = Number.isFinite(fee) && Number.isFinite(hours) && fee > 0 && hours > 0;
  const note = typeof r.note === "string" && r.note.trim() ? r.note.trim() : null;
  const window = Number.isFinite(hours) && hours > 0 ? hours : 0;
  if (!hasFee && !note && window === 0) return null;
  return {
    provider_name: typeof r.provider_name === "string" ? r.provider_name : "",
    window_hours: window,
    fee_percent: hasFee ? fee : 0,
    note,
  };
}

/** The fee and the window only mean something together. */
export function policyHasFee(p: ClassCancellationPolicy | null | undefined): p is ClassCancellationPolicy {
  return !!p && p.fee_percent > 0 && p.window_hours > 0;
}

function hoursLabel(hours: number): string {
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function gymPossessive(name: string): string {
  const n = name.trim();
  if (!n) return "the gym’s";
  return /s$/i.test(n) ? `${n}’` : `${n}’s`;
}

/**
 * "Cancelling within 24 hours of the class may incur a 50% late-cancellation
 * fee under Iron Temple's policy." Null when the policy has no fee: then no
 * fee is mentioned at all.
 */
export function lateCancelSentence(p: ClassCancellationPolicy | null | undefined): string | null {
  if (!policyHasFee(p)) return null;
  return `Cancelling within ${hoursLabel(p.window_hours)} of the class may incur a ${p.fee_percent}% late-cancellation fee under ${gymPossessive(p.provider_name)} policy.`;
}

/**
 * The policy a gym's booking rules make, the way members will be shown it.
 * The settings preview uses it, so the provider sees exactly what the API
 * will send.
 */
export function policyFromRules(
  providerName: string,
  rules: { cancellation_fee_percent?: number; cancellation_window_hours?: number; cancellation_policy_note?: string } | null | undefined,
): ClassCancellationPolicy | null {
  return readCancellationPolicy({
    provider_name: providerName,
    fee_percent: rules?.cancellation_fee_percent ?? 0,
    window_hours: rules?.cancellation_window_hours ?? 0,
    note: rules?.cancellation_policy_note ?? null,
  });
}

/**
 * The gym's window in one sentence: the fee sentence when it has a fee,
 * else "Please cancel at least 12 hours before the class." with no fee
 * wording. Null when it set no window.
 */
export function cancelWindowSentence(p: ClassCancellationPolicy | null | undefined): string | null {
  const fee = lateCancelSentence(p);
  if (fee) return fee;
  if (!p || p.window_hours <= 0) return null;
  return `Please cancel at least ${hoursLabel(p.window_hours)} before the class.`;
}

/**
 * What cancelling a confirmed booking does. The gym's fee sentence only when
 * it has a fee (a policy it sets; Binectics never charges it), its note when
 * it wrote one, and no fee wording at all otherwise.
 */
export function confirmedCancelCopy(policy: ClassCancellationPolicy | null | undefined): string {
  const fee = cancelWindowSentence(policy);
  const note = policy?.note ? `${policy.provider_name || "The gym"}: “${policy.note}”` : null;
  return [
    "If anyone is waiting, your spot goes to them.",
    fee,
    note,
    "To come back, book again.",
  ]
    .filter(Boolean)
    .join(" ");
}
