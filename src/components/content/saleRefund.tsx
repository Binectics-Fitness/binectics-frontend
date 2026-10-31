"use client";

import { useState } from "react";
import { StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { formatMinor } from "@/lib/currencies/helpers";
import { paidContentErrorOf, paidContentService, type ContentSale } from "@/lib/api/paidContent";
import { paidContentCopy, refundConfirmCopy } from "@/lib/paidContent/helpers";

/** A sale plus what the screen knows locally: a refund asked for but not yet processed. */
export type SaleRow<T extends ContentSale = ContentSale> = T & { refundRequested?: boolean };

/**
 * Refunding a sale, shared by the provider's own sales list and the gym
 * owner's gym-wide list: confirm first, call the one refund endpoint, then
 * tell the screen how that one row changed. The provider's decision, never
 * automatic; money held by Binectics is "requested", not "sent".
 */
export function useSaleRefund<T extends ContentSale>(setRows: (update: (cur: SaleRow<T>[] | null) => SaleRow<T>[]) => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const refund = async (sale: ContentSale) => {
    setBusy(sale.id);
    const res = await paidContentService.refund(sale.id);
    setBusy(null);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      toast.error(e ? paidContentCopy(e) : res.message || "Couldn't refund this sale. Try again.");
      return;
    }
    const requested = res.data === "requested";
    toast.success(requested ? "Refund requested" : "Refund sent");
    // Update just this row. Re-fetching the first page would drop the pages
    // already loaded; a "requested" refund isn't processed yet, so the row
    // says so locally and its button goes away (it can't be clicked twice).
    setRows((cur) =>
      (cur ?? []).map((r) =>
        r.id === sale.id
          ? requested
            ? { ...r, refundRequested: true }
            : { ...r, status: "refunded" as const, refundedAt: new Date().toISOString() }
          : r,
      ),
    );
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

  return { busy, askRefund, confirmationModal };
}

/** The right-hand state of a sale row: Refunded, Refund requested, a Refund button, or nothing. */
export function SaleRefundState({
  sale,
  canRefund,
  busy,
  onAsk,
}: {
  sale: SaleRow;
  canRefund: boolean;
  busy: string | null;
  onAsk: (sale: ContentSale) => void;
}) {
  if (sale.status === "refunded") return <StatusPill label="Refunded" tone="neutral" />;
  if (sale.refundRequested) return <StatusPill label="Refund requested" tone="warn" />;
  if (!canRefund) return null;
  return (
    <button
      type="button"
      className="btn-ghost-v2"
      disabled={!!busy}
      aria-label={`Refund ${sale.buyerName || "this buyer"}, ${formatMinor(sale.currency, sale.amountMinor)}`}
      onClick={() => onAsk(sale)}
    >
      Refund
    </button>
  );
}
