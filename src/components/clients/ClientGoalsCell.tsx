/**
 * A client's goals in a Clients list row: the first two, then "+N" for the
 * rest (all of them in the tooltip). GET /progress/clients returns goals on
 * each row since October 2026; before, every client looked goal-less.
 */
export function ClientGoalsCell({ goals }: { goals?: string[] | null }) {
  const list = (goals ?? []).map((g) => g.trim()).filter(Boolean);
  if (list.length === 0) {
    return (
      <span className="text-[13px] text-fg-3" data-testid="client-goals">
        -
      </span>
    );
  }
  const shown = list.slice(0, 2);
  const more = list.length - shown.length;
  return (
    <span className="text-[13px] text-fg-2" title={list.join(" · ")} data-testid="client-goals">
      {shown.join(" · ")}
      {more > 0 && <span className="ml-1.5 font-mono text-[11px] text-fg-3">+{more}</span>}
    </span>
  );
}
