"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { AsyncSpinner } from "@/components/ds";
import { PayOutstandingPanel } from "@/components/payments/PayOutstandingPanel";
import { memberPaymentsService, type OwedCharge } from "@/lib/api/memberPayments";
import { formatMinor } from "@/lib/currencies/helpers";
import { PAYMENT_PATH, renewHrefFor } from "@/lib/memberPayments/helpers";
import { formatDate } from "@/utils/format";

type Load =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; charge: OwedCharge };

/**
 * /pay/membership/:chargeId: pay what a gym says the member owes. The id is
 * the membership's. Every state is the API's: a charge that is not the
 * signed-in member's reads as missing (the API answers 404 for someone
 * else's), a paid one says so, an ended one cannot be paid. The pay button
 * lives in PayOutstandingPanel, which never trusts the Paystack popup.
 */
export default function PayMembershipClient({ chargeId }: { chargeId: string }) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [justPaid, setJustPaid] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await memberPaymentsService.charge(chargeId);
      if (!active) return;
      if (res.success && res.data) return setLoad({ kind: "ready", charge: res.data });
      // 400 (not an id) and 404 (not yours / not there) read the same.
      if (res.status === 404 || res.status === 400) return setLoad({ kind: "missing" });
      setLoad({ kind: "error", message: res.message || "Check your connection and try again." });
    })();
    return () => {
      active = false;
    };
  }, [chargeId, attempt]);

  const onChanged = useCallback((charge: OwedCharge) => setLoad({ kind: "ready", charge }), []);
  const onPaid = useCallback((charge: OwedCharge) => {
    setJustPaid(true);
    setLoad({ kind: "ready", charge });
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-2)" }}>
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center h-14 px-5 sm:px-8">
          <Link href="/">
            <BinecticsLockup />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-start justify-center p-4 sm:pt-16">
        <div
          className="w-full max-w-md rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          aria-live="polite"
        >
          {load.kind === "loading" && <AsyncSpinner />}
          {load.kind === "missing" && (
            <Message
              title="We can't find that payment."
              body="It may belong to a different account, or the link may be wrong. Sign in with the account your gym added, or open Billing to see what you owe."
              href="/dashboard/member/billing"
              cta="Go to billing"
            />
          )}
          {load.kind === "error" && (
            <Message
              title="We couldn't load this payment."
              body={load.message}
              action={
                <button
                  type="button"
                  className="btn-ghost-v2 sm mt-5 inline-flex"
                  onClick={() => {
                    setLoad({ kind: "loading" });
                    setAttempt((n) => n + 1);
                  }}
                >
                  Try again
                </button>
              }
            />
          )}
          {load.kind === "ready" && (
            <Charge charge={load.charge} justPaid={justPaid} onPaid={onPaid} onChanged={onChanged} />
          )}
        </div>
      </main>
    </div>
  );
}

function Message({
  title,
  body,
  href,
  cta,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
        {title}
      </h1>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>
        {body}
      </p>
      {href && cta && (
        <Link href={href} className="btn-ghost-v2 sm mt-5 inline-flex">
          {cta}
        </Link>
      )}
      {action}
    </div>
  );
}

function Charge({
  charge,
  justPaid,
  onPaid,
  onChanged,
}: {
  charge: OwedCharge;
  justPaid: boolean;
  onPaid: (c: OwedCharge) => void;
  onChanged: (c: OwedCharge) => void;
}) {
  const amount = formatMinor(charge.currency, charge.amountMinor);
  const gym = charge.provider.name || "your gym";

  if (charge.state === "paid") {
    return (
      <Message
        title={justPaid ? "Payment received." : "This is already paid."}
        body={
          justPaid
            ? `${gym} has your ${amount} for ${charge.description}. Your membership is active.`
            : `${amount} for ${charge.description} at ${gym} was paid${
                charge.paidAt ? ` on ${formatDate(charge.paidAt)}` : ""
              }. Nothing more to do.`
        }
        href={PAYMENT_PATH}
        cta="See my payments"
      />
    );
  }

  if (charge.state === "closed") {
    return (
      <Message
        title="This can't be paid any more."
        body={`${gym} ended or changed this membership, so there is nothing to pay here. If you think that's wrong, ask ${gym}.`}
        href="/dashboard/member/billing"
        cta="Go to billing"
      />
    );
  }

  // A renewal is paid through the renew checkout, which already handles it.
  if (charge.payVia === "renewal_checkout") {
    const href = renewHrefFor(charge);
    return (
      <Message
        title="Renew your membership."
        body={`${amount} is due for ${charge.description} at ${gym}${
          charge.lapsesAt ? `. Access continues until ${formatDate(charge.lapsesAt)}` : ""
        }.`}
        href={href ?? "/dashboard/member/billing"}
        cta={href ? "Renew now" : "Go to billing"}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>
          {gym}
        </p>
        <h1 className="text-[20px] font-medium mt-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {charge.description}
        </h1>
      </div>
      <dl
        className="flex items-baseline justify-between py-4"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <dt className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Amount due
        </dt>
        <dd
          className="text-[24px] font-medium"
          style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}
        >
          {amount}
        </dd>
      </dl>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        {gym} added you as a member. Your membership starts the day you pay.
      </p>
      <PayOutstandingPanel charge={charge} onPaid={onPaid} onChanged={onChanged} />
    </div>
  );
}
