"use client";

import Link from "next/link";
import { useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useChecklistToday, useTickItem } from "@/lib/queries/solo";
import { ChecklistItemKind, type ChecklistTodayItem } from "@/lib/api/checklist";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { AutoTick, CardSkeleton, Row, TickButton, WriteError } from "./parts";
import styles from "./solo.module.css";

/** Meta line under a line on Today: only what is true of it. */
function metaFor(item: ChecklistTodayItem): string {
  if (item.kind === ChecklistItemKind.CUSTOM) return item.done ? "Done" : "Tap to tick";
  return item.done ? "Ticked itself from your data" : "Ticks itself from your data";
}

/**
 * Today's list. Custom lines tick by hand (optimistic, rolled back when the
 * write fails); tool lines tick themselves from real data. No streaks, no
 * "missed": an unticked line is just a line.
 */
export function ChecklistCard() {
  const today = useChecklistToday(true);
  const tick = useTickItem();
  const online = useOnline();
  const [error, setError] = useState<string | null>(null);

  if (today.isLoading) return <CardSkeleton height={220} />;

  const items = today.data?.items ?? [];

  const onToggle = (item: ChecklistTodayItem) => {
    if (!online) {
      setError(OFFLINE_WRITE_MESSAGE);
      return;
    }
    setError(null);
    tick.mutate(
      { id: item.id, done: !item.done },
      { onError: (e) => setError(`We could not save that tick. ${e.message || ""}`.trim()) },
    );
  };

  return (
    <DSCard className="px-5.5 pb-3 pt-3.5">
      <div className="flex items-center justify-between pb-2 pt-1">
        <Eyebrow as="h2">Today&rsquo;s list</Eyebrow>
        <Link href={SOLO_HREFS.todayList} className={styles.link}>
          Edit
        </Link>
      </div>
      {today.isError && !today.data ? (
        <div className="py-3">
          <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
            We could not load your list. Check your connection and try again.
          </p>
          <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void today.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-3">
          <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
            Nothing on your list today. Add a line, or switch on a tool line, and it shows here.
          </p>
          <Link href={SOLO_HREFS.todayList} className="btn-ghost-v2 mt-3" style={{ height: 44 }}>
            Build your list
          </Link>
        </div>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} style={{ listStyle: "none" }}>
              <Row>
                {item.kind === ChecklistItemKind.CUSTOM ? (
                  <TickButton done={item.done} label={item.label} onToggle={() => onToggle(item)} />
                ) : (
                  <AutoTick done={item.done} label={item.label} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)", overflowWrap: "anywhere" }}>
                    {item.label}
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {metaFor(item)}
                  </div>
                </div>
              </Row>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <div className="mb-2 mt-1">
          <WriteError message={error} onDismiss={() => setError(null)} />
        </div>
      )}
    </DSCard>
  );
}
