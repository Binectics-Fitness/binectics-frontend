/**
 * AsyncStates — two lightweight primitives for consistent async UI across dashboards.
 *
 *  <AsyncSpinner />          — inline 20px spinner, used inside list/section containers
 *  <AsyncSpinner size="page" />  — centred 48px spinner, used as full-area fallback
 *
 *  <EmptySlate message="…" />   — muted empty-state paragraph
 *  <EmptySlate message="…" hint="…" />  — with secondary help text
 *
 * Both are unstyled wrt background — they inherit the parent container's bg.
 */

export interface AsyncSpinnerProps {
  /** "inline" (default): 20px spinner in a flex row. "page": 48px centred full area. */
  size?: "inline" | "page";
  /** Accessible label. Defaults to "Loading". */
  label?: string;
}

export function AsyncSpinner({ size = "inline", label = "Loading" }: AsyncSpinnerProps) {
  const dim = size === "page" ? 40 : 20;
  const borderWidth = size === "page" ? 3 : 2;

  if (size === "page") {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: 240, color: "var(--fg-3)" }}
        role="status"
        aria-label={label}
      >
        <div
          className="animate-spin rounded-full"
          style={{
            width: dim,
            height: dim,
            border: `${borderWidth}px solid var(--border-2)`,
            borderTopColor: "var(--ink)",
          }}
        />
        <p className="mt-3 text-sm" style={{ color: "var(--fg-3)" }}>{label}…</p>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-4 text-sm"
      style={{ color: "var(--fg-3)" }}
      role="status"
      aria-label={label}
    >
      <div
        className="animate-spin rounded-full shrink-0"
        style={{
          width: dim,
          height: dim,
          border: `${borderWidth}px solid var(--border-2)`,
          borderTopColor: "var(--ink)",
        }}
      />
      {label}…
    </div>
  );
}

export interface EmptySlateProps {
  /** Primary message, e.g. "No members found." */
  message: string;
  /** Optional secondary hint shown smaller below the message. */
  hint?: string;
  /** Extra top margin class. Defaults to "mt-4". */
  mt?: string;
}

export function EmptySlate({ message, hint, mt = "mt-4" }: EmptySlateProps) {
  return (
    <div className={mt}>
      <p className="text-sm" style={{ color: "var(--fg-3)" }}>{message}</p>
      {hint && (
        <p className="text-[13px] mt-1" style={{ color: "var(--fg-4)" }}>{hint}</p>
      )}
    </div>
  );
}
