"use client";

import Link from "next/link";
import styles from "./records.module.css";

/** The member's own records: one page each, reached from Log. */
export const RECORDS_HREFS = {
  journal: "/dashboard/member/journal",
  goals: "/dashboard/member/goals",
  history: "/dashboard/member/history",
} as const;

export type RecordsTab = keyof typeof RECORDS_HREFS;

const TABS: { key: RecordsTab; label: string }[] = [
  { key: "journal", label: "Journal" },
  { key: "goals", label: "Goals" },
  { key: "history", label: "History" },
];

/** Journal, Goals, History: links styled as chips, the current one inked. */
export function RecordsTabs({ current }: { current: RecordsTab }) {
  return (
    <nav aria-label="Your records" className={styles.tabs}>
      {TABS.map((t) => {
        const on = t.key === current;
        return (
          <Link
            key={t.key}
            href={RECORDS_HREFS[t.key]}
            className={`bx-chip ${styles.tab}`}
            data-on={on}
            aria-current={on ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
