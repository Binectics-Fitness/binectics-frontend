"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import {
  isCompleteAccountNumber,
  isValidAccountNumber,
  payoutAccountErrorMessage,
  type PayoutAccountStatus,
  type ResolvedPayoutAccount,
} from "@/lib/api/payoutAccount";
import { usePayoutBanks, useResolvePayoutAccount, useSavePayoutAccount } from "@/lib/queries/payoutAccount";

interface AddBankAccountModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string | null;
  /** An account is already saved: saving this one replaces it. */
  replacing?: boolean;
  onSaved?: (status: PayoutAccountStatus) => void;
}

/** One lookup's answer, for the (bank, number) pair it was asked about. */
type Lookup = { pair: string; result?: ResolvedPayoutAccount; error?: string; retry?: boolean };

const LABEL = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3";
// After the user stops typing a complete number, before asking Paystack.
const RESOLVE_DEBOUNCE_MS = 400;

/**
 * The workspace's payout bank account (owner ruling, Oct 20 2026). The owner
 * picks a bank from Paystack's list and types the number; Paystack resolves
 * it and the account name shown is Paystack's, never typed. Save is offered
 * only once the current (bank, number) pair has resolved, and the full
 * number is dropped from the form as soon as it is saved or the form closes.
 *
 * Resolve is throttled (10 a minute), so it runs once per pair: on its own
 * for a complete 10-digit NUBAN, otherwise on blur or "Check account".
 */
export function AddBankAccountModal({ open, onClose, organizationId, replacing = false, onSaved }: AddBankAccountModalProps) {
  const orgId = organizationId ?? undefined;
  const banks = usePayoutBanks(orgId, open);
  const { mutateAsync: resolveAccount } = useResolvePayoutAccount(orgId);
  const save = useSavePayoutAccount(orgId);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [checking, setChecking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Pairs Paystack already answered (found, or no such account): never asked twice.
  const answered = useRef(new Map<string, Omit<Lookup, "pair">>());
  const asking = useRef<string | null>(null);
  const saving = useRef(false);

  const currency = banks.data?.currency;
  const pair = `${bankCode}:${accountNumber}`;
  // Only an answer about what is in the form now counts.
  const current = lookup?.pair === pair ? lookup : null;
  const resolved = current?.result ?? null;
  // NGN numbers are always 10 digits, so a shorter one isn't worth a lookup.
  const lookupReady =
    currency === "NGN" ? isCompleteAccountNumber(accountNumber, currency) : isValidAccountNumber(accountNumber);

  const check = useCallback(async () => {
    if (!orgId || !bankCode || !lookupReady) return;
    const key = `${bankCode}:${accountNumber}`;
    const known = answered.current.get(key);
    if (known) {
      setLookup({ pair: key, ...known });
      return;
    }
    if (asking.current === key) return;
    asking.current = key;
    setChecking(true);
    const res = await resolveAccount({
      bank_code: bankCode,
      account_number: accountNumber,
      ...(currency ? { currency } : {}),
    });
    asking.current = null;
    setChecking(false);
    // Paystack's answer (found, no such account, unknown bank) is final for
    // this pair; a lookup that couldn't reach it (502, 429) may be retried.
    const final = res.success || res.code === "PAYOUT_ACCOUNT_NOT_RESOLVED" || res.code === "PAYOUT_BANK_UNKNOWN";
    const entry: Omit<Lookup, "pair"> =
      res.success && res.data ? { result: res.data } : { error: payoutAccountErrorMessage(res), retry: !final };
    if (final) answered.current.set(key, entry);
    setLookup({ pair: key, ...entry });
  }, [orgId, bankCode, accountNumber, currency, lookupReady, resolveAccount]);

  // A complete NUBAN is looked up on its own, once the typing stops.
  useEffect(() => {
    if (!open || !bankCode || !isCompleteAccountNumber(accountNumber, currency)) return;
    const timer = setTimeout(() => void check(), RESOLVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, bankCode, accountNumber, currency, check]);

  const reset = () => {
    setBankCode("");
    setAccountNumber("");
    setLookup(null);
    setSaveError(null);
    answered.current.clear();
  };

  const close = () => {
    reset();
    onClose();
  };

  const onSave = async () => {
    if (!resolved || saving.current) return;
    saving.current = true;
    setSaveError(null);
    // Never an account name: the server resolves again and keeps Paystack's.
    const res = await save.mutateAsync({
      bank_code: bankCode,
      account_number: accountNumber,
      ...(currency ? { currency } : {}),
    });
    saving.current = false;
    if (!res.success || !res.data) {
      setSaveError(payoutAccountErrorMessage(res));
      return;
    }
    toast.success(replacing ? "Bank account replaced." : "Bank account saved.");
    onSaved?.(res.data);
    // The full number goes with the form.
    close();
  };

  // Other currencies' numbers vary in length: the owner says when it's
  // complete. Any lookup that couldn't reach Paystack can be tried again.
  const showCheckButton =
    !!bankCode && lookupReady && !resolved && !checking && (current ? !!current.retry : currency !== "NGN");

  return (
    <ActionModal
      open={open}
      onClose={close}
      title={replacing ? "Replace bank account" : "Add bank account"}
      description="Where your payouts go once your business is verified. We check the account with your bank through Paystack before saving it, and show only its last four digits afterwards."
      footer={
        <>
          <button type="button" onClick={close} className="btn-ghost-v2">Cancel</button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!resolved || save.isPending}
            aria-busy={save.isPending}
            className="btn-primary-v2 disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : replacing ? "Replace account" : "Save account"}
          </button>
        </>
      }
    >
      {banks.isLoading ? (
        <AsyncSpinner label="Loading banks" />
      ) : banks.isError || !banks.data ? (
        <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
          {banks.error instanceof Error ? banks.error.message : "Couldn't load the list of banks."}
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <span id="payout-bank-label" className={LABEL}>Bank</span>
            <SearchableSelect
              id="payout-bank"
              value={bankCode}
              onChange={(v) => {
                setBankCode(v);
                setSaveError(null);
              }}
              options={banks.data.banks.map((b) => ({ label: b.name, value: b.code }))}
              placeholder="Choose your bank"
            />
          </div>
          <div>
            <label htmlFor="payout-account-number" className={LABEL}>Account number</label>
            <input
              id="payout-account-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ""));
                setSaveError(null);
              }}
              onBlur={() => void check()}
              className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
            <p className="mt-1.5 text-[12px] text-fg-3">
              {currency === "NGN"
                ? "Your 10-digit account number. We check it with your bank when it's complete."
                : "Digits only. We check it with your bank before you can save it."}
            </p>
          </div>

          {showCheckButton ? (
            <button type="button" className="btn-ghost-v2 sm" onClick={() => void check()}>
              {current?.retry ? "Try again" : "Check account"}
            </button>
          ) : null}

          {checking ? (
            <p role="status" className="text-[13px] text-fg-3">Checking with your bank…</p>
          ) : resolved ? (
            <div
              role="status"
              aria-label="Account found"
              className="rounded-(--r-2) p-3.5"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{resolved.account_name}</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                {resolved.bank_name} · <span className="font-mono">{resolved.account_number_masked}</span>
              </div>
              <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-2)" }}>
                This is the name your bank has for the account. Save it if it&apos;s yours.
              </p>
            </div>
          ) : current?.error ? (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{current.error}</p>
          ) : null}

          {saveError ? (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{saveError}</p>
          ) : null}
        </div>
      )}
    </ActionModal>
  );
}
