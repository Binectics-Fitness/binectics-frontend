"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchableSelect from "@/components/SearchableSelect";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCurrencies } from "@/lib/queries/currencies";
import { currencyOptions, formatMinor, isSelectable, writeErrorMessage } from "@/lib/currencies/helpers";
import { formatMinorForInput } from "@/lib/money/moneyInput";
import { consultationsService, type ConsultationType } from "@/lib/api/consultations";

/** Fired by the Session settings card after it saves, so this list re-reads. */
export const SESSION_TYPES_CHANGED = "binectics:session-types-changed";

/**
 * The provider's main session: their OLDEST active one, the session Session
 * settings edits. The API lists own types by name, so "the first active one"
 * changed whenever a provider added a type that sorts earlier ("Check-in"
 * before "First consultation") and Session settings started editing it.
 */
export function mainSessionType<T extends Pick<ConsultationType, "isActive" | "createdAt">>(
  types: readonly T[] | null | undefined,
): T | undefined {
  return (types ?? [])
    .filter((t) => t.isActive)
    .reduce<T | undefined>((oldest, t) => (!oldest || t.createdAt < oldest.createdAt ? t : oldest), undefined);
}

const NAME_MAX = 120;
const DESCRIPTION_MAX = 1000;
/** The most people one slot can take (the API's limit). */
export const CAPACITY_MAX = 20;

interface Draft {
  name: string;
  description: string;
  duration: number;
  /** People per slot: 1 is a 1:1 session, more is a group session. */
  capacity: number;
  free: boolean;
  priceText: string;
  priceMinor: number | null;
  currency: string;
}

export type DraftIssues = Partial<Record<"name" | "duration" | "capacity" | "price" | "currency", string>>;

/** What stops a draft saving, by field. Empty when it can be saved. */
export function draftIssues(d: Draft): DraftIssues {
  const out: DraftIssues = {};
  if (!d.name.trim()) out.name = "Give the session a name.";
  else if (d.name.trim().length > NAME_MAX) out.name = `Keep the name under ${NAME_MAX} characters.`;
  if (!Number.isInteger(d.duration) || d.duration < 5 || d.duration > 240)
    out.duration = "Length must be 5 to 240 minutes.";
  if (!Number.isInteger(d.capacity) || d.capacity < 1 || d.capacity > CAPACITY_MAX)
    out.capacity = `People per slot must be 1 to ${CAPACITY_MAX}.`;
  if (!d.free && (d.priceMinor === null || d.priceMinor <= 0)) out.price = "Set a price, or mark it free.";
  if (!d.free && !d.currency) out.currency = "Pick a currency.";
  return out;
}

/** "Group of 4" for a group session; null for a 1:1. */
export function capacityLabel(t: Pick<ConsultationType, "capacity">): string | null {
  const capacity = t.capacity ?? 1;
  return capacity > 1 ? `Group of ${capacity}` : null;
}

function priceLabel(t: ConsultationType): string {
  if (t.priceMinor == null || t.priceMinor <= 0 || !t.currency) return "Free";
  return formatMinor(t.currency, t.priceMinor);
}

/**
 * Every session type a trainer or dietitian sells, and a way to add more: a
 * 1:1 hour, a 30-minute check-in, a small-group session. The first active one
 * is the main session, edited (length, buffer, notice, price) in Session
 * settings above; the rest are added, edited and archived here. Mobile's
 * per-provider session types (api #147), on the web.
 *
 * Every type shares the provider's weekly hours; a new type copies the main
 * one's buffer and notice.
 */
export function SessionTypesCard() {
  const { currentOrg } = useOrganization();
  const { all: currencies } = useCurrencies();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const ownTypes = useQuery<ConsultationType[]>({
    queryKey: ["consultations", "own-types"],
    queryFn: async () => {
      const res = await consultationsService.getOwnTypes();
      if (!res.success) throw new Error(res.message || "Couldn't load session types");
      return res.data ?? [];
    },
    retry: false,
  });
  const types = ownTypes.data ?? null;
  const loadError = ownTypes.isError;
  const { refetch } = ownTypes;
  const load = () => refetch();
  /** null = closed; "new" = adding; otherwise the id being edited. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onChanged = () => void refetch();
    window.addEventListener(SESSION_TYPES_CHANGED, onChanged);
    return () => window.removeEventListener(SESSION_TYPES_CHANGED, onChanged);
  }, [refetch]);

  const main = mainSessionType(types);
  // The rest by name, as the API lists them.
  const extras = (types ?? []).filter((t) => t.isActive && t !== main);

  const orgCurrency = currentOrg?.currency?.toUpperCase() ?? "";
  const defaultCurrency =
    main?.currency?.toUpperCase() ||
    (orgCurrency && isSelectable(orgCurrency, currencies, "price") ? orgCurrency : "");

  const openNew = () => {
    setEditing("new");
    setTried(false);
    setError(null);
    setNotice(null);
    setDraft({
      name: "",
      description: "",
      duration: main?.defaultDurationMinutes ?? 30,
      capacity: 1,
      free: false,
      priceText: "",
      priceMinor: null,
      currency: defaultCurrency,
    });
  };

  const openEdit = (t: ConsultationType) => {
    const currency = t.currency?.toUpperCase() || defaultCurrency;
    const priced = t.priceMinor != null && t.priceMinor > 0 && !!t.currency;
    setEditing(t.id);
    setTried(false);
    setError(null);
    setNotice(null);
    setDraft({
      name: t.name,
      description: t.description ?? "",
      duration: t.defaultDurationMinutes,
      capacity: t.capacity ?? 1,
      free: !priced,
      priceText: priced ? formatMinorForInput(t.priceMinor as number, { currency }) : "",
      priceMinor: priced ? (t.priceMinor as number) : null,
      currency,
    });
  };

  const close = () => {
    setEditing(null);
    setDraft(null);
    setError(null);
  };

  const issues = draft && tried ? draftIssues(draft) : {};

  const save = async () => {
    if (!draft || saving) return;
    if (Object.keys(draftIssues(draft)).length > 0) {
      setTried(true);
      return;
    }
    setSaving(true);
    setError(null);
    // The API wants a currency with any price, 0 included. Free with no
    // currency: no price at all on create, a cleared one on edit.
    const price: { priceMinor?: number; currency?: string } = !draft.free
      ? { priceMinor: draft.priceMinor as number, currency: draft.currency }
      : draft.currency
        ? { priceMinor: 0, currency: draft.currency }
        : {};
    const common = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      defaultDurationMinutes: draft.duration,
      capacity: draft.capacity,
      ...price,
    };
    const res =
      editing === "new"
        ? await consultationsService.createOwnType({
            ...common,
            // Same buffer and notice as the main session: one diary.
            bufferMinutes: main?.bufferMinutes ?? 0,
            minAdvanceNoticeMinutes: main?.minAdvanceNoticeMinutes ?? 0,
            isActive: true,
          })
        : await consultationsService.updateOwnType(editing as string, {
            ...common,
            // Free with no currency: clear any old price.
            ...(draft.free && !draft.currency ? { priceMinor: null, currency: null } : {}),
          });
    setSaving(false);
    if (!res.success) {
      setError(
        res.code === "CONSULTATION_CAPACITY_BELOW_BOOKED"
          ? (res.message ?? "More people are booked into an upcoming session than that.")
          : res.status === 409
            ? `You already have a session called "${draft.name.trim()}". Pick another name.`
            : writeErrorMessage(res, "Couldn't save the session. Try again."),
      );
      return;
    }
    setNotice(editing === "new" ? `Added "${common.name}". Clients can book it now.` : "Session saved.");
    close();
    await load();
  };

  const archive = (t: ConsultationType) =>
    requestConfirmation({
      title: `Archive "${t.name}"?`,
      description:
        "Clients can no longer book it. Sessions already booked stay as they are. Adding a session with the same name brings it back.",
      confirmLabel: "Archive",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await consultationsService.archiveOwnType(t.id);
        if (!res.success) {
          setError(res.message || "Couldn't archive the session. Try again.");
          return;
        }
        setNotice(`Archived "${t.name}".`);
        if (editing === t.id) close();
        await load();
      },
    });

  const currencyChoices = currencyOptions(currencies, "price", draft?.currency || null).map((o) => {
    const c = currencies?.find((x) => x.code === o.value);
    return c ? { ...o, label: c.symbol && c.symbol !== c.code ? `${c.code} ${c.symbol}` : c.code } : o;
  });

  return (
    <section id="session-types" className="scroll-mt-20 rounded-(--r-3) bg-bg shadow-(--shadow-card)">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-lg font-bold text-fg">Session types</h2>
          <p className="mt-0.5 text-xs text-fg-3">
            Everything clients can book with you, each with its own length and price. All of them use your weekly hours.
          </p>
        </div>
        {main && editing === null && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-9 shrink-0 items-center rounded-(--r-2) bg-signal px-4 text-sm font-semibold text-fg hover:bg-signal/90 transition-colors"
          >
            Add session type
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className="mx-5 mt-4 rounded-(--r-2) bg-signal-soft px-4 py-3 text-sm text-signal-ink">
          {notice}
        </div>
      )}
      {(error || loadError) && (
        <div role="alert" className="mx-5 mt-4 rounded-(--r-2) bg-danger-soft px-4 py-3 text-sm text-danger-ink">
          {error ?? "We couldn't load your session types. Refresh the page and try again."}
        </div>
      )}

      {types === null && !loadError && <p className="p-5 text-sm text-fg-3">Loading session types…</p>}

      {types !== null && !main && (
        <p className="p-5 text-sm text-fg-3">
          Save your Session settings above first. That becomes your main session, and you can add more here.
        </p>
      )}

      {main && (
        <ul className="divide-y divide-border">
          {[main, ...extras].map((t, i) => (
            <li key={t.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {t.name}
                  {i === 0 && (
                    <span className="ml-2 rounded-full bg-bg-2 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
                      Main
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-fg-3">
                  {t.defaultDurationMinutes} min{capacityLabel(t) ? ` · ${capacityLabel(t)}` : ""} · {priceLabel(t)}
                  {i === 0 ? " · edit it in Session settings above" : ""}
                </p>
                {t.description && <p className="mt-1 text-xs text-fg-3">{t.description}</p>}
              </div>
              {i > 0 && editing === null && (
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="btn-ghost-v2 sm" onClick={() => openEdit(t)} aria-label={`Edit ${t.name}`}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    style={{ color: "var(--danger-ink)" }}
                    onClick={() => archive(t)}
                    aria-label={`Archive ${t.name}`}
                  >
                    Archive
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <form
          aria-label={editing === "new" ? "New session type" : "Edit session type"}
          className="flex flex-col gap-4 border-t border-border bg-bg-2/50 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <p className="text-sm font-semibold text-fg">{editing === "new" ? "New session type" : `Edit "${draft.name}"`}</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="st-name" className="mb-1 block text-xs font-semibold text-fg-2">
                Name
              </label>
              <input
                id="st-name"
                value={draft.name}
                maxLength={NAME_MAX}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Small-group session, 30-min check-in"
                aria-invalid={!!issues.name || undefined}
                className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              />
              {issues.name && <p className="mt-1 text-xs text-danger-ink">{issues.name}</p>}
            </div>
            <div>
              <label htmlFor="st-duration" className="mb-1 block text-xs font-semibold text-fg-2">
                Length
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="st-duration"
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={draft.duration}
                  onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value || 0) })}
                  aria-invalid={!!issues.duration || undefined}
                  className="w-24 rounded-(--r-2) border border-border bg-bg px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                />
                <span className="text-sm text-fg-2">minutes</span>
              </div>
              {issues.duration && <p className="mt-1 text-xs text-danger-ink">{issues.duration}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="st-capacity" className="mb-1 block text-xs font-semibold text-fg-2">
              People per slot
            </label>
            <div className="flex items-center gap-2">
              <input
                id="st-capacity"
                type="number"
                min={1}
                max={CAPACITY_MAX}
                step={1}
                value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value || 0) })}
                aria-invalid={!!issues.capacity || undefined}
                aria-describedby="st-capacity-help"
                className="w-24 rounded-(--r-2) border border-border bg-bg px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              />
              <span className="text-sm text-fg-2">{draft.capacity > 1 ? "group session" : "1:1 session"}</span>
            </div>
            <p id="st-capacity-help" className="mt-1 text-xs text-fg-3">
              1 is a 1:1. More lets that many clients book the same time, each paying the session price.
            </p>
            {issues.capacity && <p className="mt-1 text-xs text-danger-ink">{issues.capacity}</p>}
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-fg-2">Price</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-28">
                <SearchableSelect
                  value={draft.currency}
                  onChange={(v) => setDraft({ ...draft, currency: v, priceText: "", priceMinor: null })}
                  options={currencyChoices}
                  placeholder="Currency"
                  disabled={draft.free}
                />
              </div>
              <MoneyInput
                value={draft.free ? "" : draft.priceText}
                onChange={(display, minor) => setDraft({ ...draft, priceText: display, priceMinor: minor })}
                currency={draft.currency || "USD"}
                placeholder={draft.free ? "Free" : "Not set"}
                disabled={draft.free || !draft.currency}
                aria-label="Session type price"
                aria-invalid={!!issues.price || undefined}
                className="w-32 rounded-(--r-2) border border-border bg-bg px-3 py-3 text-sm disabled:opacity-50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              />
              <label className="inline-flex items-center gap-2 text-sm text-fg-2">
                <input
                  type="checkbox"
                  checked={draft.free}
                  onChange={(e) => setDraft({ ...draft, free: e.target.checked })}
                />
                Free
              </label>
            </div>
            {(issues.price || issues.currency) && (
              <p className="mt-1 text-xs text-danger-ink">{issues.price ?? issues.currency}</p>
            )}
          </div>

          <div>
            <label htmlFor="st-description" className="mb-1 block text-xs font-semibold text-fg-2">
              Description <span className="font-normal text-fg-3">(optional, shown to clients)</span>
            </label>
            <textarea
              id="st-description"
              value={draft.description}
              maxLength={DESCRIPTION_MAX}
              rows={2}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center rounded-(--r-2) bg-signal px-4 text-sm font-semibold text-fg hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : editing === "new" ? "Add session type" : "Save session"}
            </button>
            <button type="button" className="btn-ghost-v2 sm" onClick={close} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {confirmationModal}
    </section>
  );
}
