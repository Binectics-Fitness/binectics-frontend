"use client";

import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import { DSCard, IconTile } from "@/components/ds";
import type { ClientSessionSummary } from "@/lib/api/coachSessions";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { clientRowMeta, coachFirstName, dayLabel } from "@/lib/coachSessions/format";

/**
 * "Your sessions": every coached session the member's coaches logged, newest
 * first, each opening its summary. Built from the client read only.
 */
export function YourSessionsList({ sessions, currentId }: { sessions: ClientSessionSummary[]; currentId?: string }) {
  const { prefs } = useOrgFormat();
  const rows = sessions.filter((s) => s.id !== currentId);
  if (rows.length === 0) return null;
  return (
    <DSCard>
      <ul>
        {rows.map((s, i) => {
          const first = coachFirstName(s);
          return (
            <li key={s.id} style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
              <Link href={`/dashboard/sessions/${s.id}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-2)]">
                <IconTile icon={Dumbbell} tone="move" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {[dayLabel(s.started_at, prefs.timeZone), first ? `with ${first}` : null].filter(Boolean).join(" ")}
                  </span>
                  <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>{clientRowMeta(s)}</span>
                </span>
                <ChevronRight aria-hidden="true" size={14} className="shrink-0" style={{ color: "var(--fg-4)" }} />
              </Link>
            </li>
          );
        })}
      </ul>
    </DSCard>
  );
}
