"use client";

import { RadioCards, type StepProps } from "./_components";
import { usePaymentGateways } from "@/lib/queries/currencies";
import type { PublicPaymentGateway } from "@/lib/api/paymentGateways";

export const SKIP_PAYOUT = "skip";

/**
 * The payout choices for onboarding: the gateways a provider may connect
 * their own account for (GET /payment-gateways, provider_keys_supported),
 * each with the currencies it can charge today, then "skip". Exported for
 * tests.
 */
export function payoutOptions(
  gateways: readonly PublicPaymentGateway[] | undefined,
): { id: string; title: string; desc: string }[] {
  const connectable = (gateways ?? []).filter((g) => g.provider_keys_supported);
  return [
    ...connectable.map((g) => ({
      id: g.gateway,
      title: g.label,
      desc:
        g.currencies.length > 0
          ? `Takes payments in ${g.currencies.join(", ")}. Connect your account in settings.`
          : "Connect your account in settings.",
    })),
    {
      id: SKIP_PAYOUT,
      title: "Skip for now",
      desc: "You can publish, but can't take payments until you connect one.",
    },
  ];
}

/**
 * Payout step body shared by the gym, trainer and dietitian tracks. Nothing
 * is preselected: the org's preferred gateway is saved only when the
 * provider picks one, so a gateway we can't run is never recorded for them.
 */
export function PayoutChoice({ data, setField }: Pick<StepProps, "data" | "setField">) {
  const { data: gateways, isPending, isError } = usePaymentGateways();
  const options = payoutOptions(gateways);
  const chosen = typeof data.payout === "string" ? data.payout : "";
  const selected = options.some((o) => o.id === chosen) ? chosen : "";

  return (
    <>
      {isPending && (
        <p className="text-[13px] mb-2" style={{ color: "var(--fg-3)" }}>Loading payment providers</p>
      )}
      {isError && (
        <p className="text-[13px] mb-2" style={{ color: "var(--fg-3)" }}>
          We couldn&rsquo;t load payment providers. You can connect one later in settings.
        </p>
      )}
      <RadioCards
        label="Payout provider"
        selected={selected}
        onSelect={(v) => setField("payout", v)}
        options={options}
      />
    </>
  );
}
