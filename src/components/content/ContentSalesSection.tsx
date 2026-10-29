"use client";

import { useEffect, useState } from "react";
import { DSCard, DSCardHead, EmptySlate, AsyncSpinner, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatMinor } from "@/lib/currencies/helpers";
import { paidContentErrorOf, paidContentService, type ContentSale } from "@/lib/api/paidContent";
import { kindLabel, paidContentCopy, paidContentOn, refundConfirmCopy, shortDate } from "@/lib/paidContent/helpers";

const PAGE = 25;

/**
 * The provider's sales of programs and meal plans (GET /content/sales). Refund
 * is the provider's own decision, in full; nothing is refunded automatically
 * and the buyer cannot ask for one. Money collected on the platform account is
 * refunded by Binectics once asked, so the answer can be "requested" rather
 * than "sent". Shown only while `paid_content` is on.
 */
export function ContentSalesSection() {
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();
  const on = paidContentOn(flags);
  const [rows, setRows] = useState<ContentSale[] | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  useEffect(() => {
    if (!on) return;
    let active = true;
    void (async () => {
      const res = await paidContentService.sales(PAGE, 0);
      if (!active) return;
      if (res.success && res.data) {
        setRows(res.data);
        setMore(res.data.length === PAGE);
        setError(null);
      } else {
        const e = paidContentErrorOf(res);
        setError(e ? paidContentCopy(e) : res.message || "Check your connection and try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [on, attempt]);

  if (flagsLoading || !on) return null;

  const showMore = async () => {
    if (!rows || loadingMore) return;
    setLoadingMore(true);
    const res = await paidContentService.sales(PAGE, rows.length);
    setLoadingMore(false);
    if (!res.success || !res.data) return toast.error(res.message || "Couldn't load more. Try again.");
    setRows([...rows, ...res.data]);
    setMore(res.data.length === PAGE);
  };

  const refund = async (sale: ContentSale) => {
    setBusy(sale.id);
    const res = await paidContentService.refund(sale.id);
    setBusy(null);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      toast.error(e ? paidContentCopy(e) : res.message || "Couldn't refund this sale. Try again.");
      return;
    }
    toast.success(res.data === "requested" ? "Refund requested" : "Refund sent");
    setAttempt((n) => n + 1);
  };

  const askRefund = (sale: ContentSale) =>
    requestConfirmation({
      title: "Refund this sale?",
      description: refundConfirmCopy(sale.buyerName, formatMinor(sale.currency, sale.amountMinor), sale.paymentRail),
      confirmLabel: "Refund",
      cancelLabel: "Keep the sale",
      confirmVariant: "danger",
      onConfirm: () => refund(sale),
    });

  return (
    <DSCard>
      <DSCardHead title="Program and meal plan sales" subtitle="What people bought from you on its own price." />
      <div className="px-4.5 pb-4.5">
        {error && rows === null ? (
          <EmptySlate
            message="We couldn't load your sales."
            hint={error}
            action={
              <button type="button" className="btn-ghost-v2" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            }
          />
        ) : rows === null ? (
          <AsyncSpinner />
        ) : rows.length === 0 ? (
          <EmptySlate
            message="No sales yet."
            hint="When someone buys a program or meal plan from you, it shows up here."
          />
        ) : (
          <>
            <ul className="flex flex-col">
              {rows.map((s) => {
                const refunded = s.status === "refunded";
                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>
                        {s.itemName || kindLabel(s.itemKind)}
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                        {[s.buyerName || "A buyer", kindLabel(s.itemKind), shortDate(s.paidAt)].filter(Boolean).join(" · ")}
                        {s.paymentRail === "platform" ? " · Held by Binectics" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {formatMinor(s.currency, s.amountMinor)}
                      </span>
                      {refunded ? (
                        <StatusPill label="Refunded" tone="neutral" />
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost-v2"
                          disabled={!!busy}
                          aria-label={`Refund ${s.buyerName || "this buyer"}, ${formatMinor(s.currency, s.amountMinor)}`}
                          onClick={() => askRefund(s)}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {more && (
              <button type="button" className="btn-ghost-v2 mt-3" disabled={loadingMore} onClick={() => void showMore()}>
                {loadingMore ? "Loading..." : "Show more"}
              </button>
            )}
            <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
              Refunds are your decision. Nothing is refunded automatically, and a refund returns the full amount.
            </p>
          </>
        )}
      </div>
      {confirmationModal}
    </DSCard>
  );
}
