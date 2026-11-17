"use client";

import Link from "next/link";
import { DSCard, Eyebrow } from "@/components/ds";
import { useLatestWeight } from "@/lib/queries/solo";
import { formatDate } from "@/utils/format";
import { CardSkeleton } from "./parts";
import styles from "./solo.module.css";

const WEIGHT_LOG = "/dashboard/member/weight-log";

/**
 * Latest weight from the existing weight log. A number and the day it was
 * logged, nothing else: no change, no arrow, no good or bad colour. With
 * nothing logged it says how to start, never a placeholder number.
 */
export function WeightCard() {
  const weight = useLatestWeight(true);
  if (weight.isLoading) return <CardSkeleton height={140} />;
  const latest = weight.data ?? null;
  const failed = weight.isError && !weight.data;

  return (
    <DSCard className="p-5.5">
      <div className="flex items-center justify-between">
        <Eyebrow>Weight</Eyebrow>
        <Link href={WEIGHT_LOG} className={styles.link}>
          Open
        </Link>
      </div>
      {failed ? (
        <p className="mt-2 text-[14px]" style={{ color: "var(--fg-2)" }}>
          We could not load your weight. Try again in a moment.
        </p>
      ) : latest ? (
        <>
          <p className="mt-1 flex items-baseline gap-2" style={{ color: "var(--ink)" }}>
            <span className={styles.count} style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.1 }}>
              {latest.weight_kg}
            </span>
            <span style={{ fontSize: 14, color: "var(--fg-3)" }}>kg</span>
          </p>
          <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            Logged {formatDate(latest.recorded_at, { weekday: "long", day: "numeric", month: "short" })}
          </p>
        </>
      ) : (
        <p className="mt-2 text-[14px]" style={{ color: "var(--fg-2)" }}>
          No weight logged yet. Weigh in when you like; once a week is plenty.
        </p>
      )}
      <Link href={WEIGHT_LOG} className="btn-ghost-v2 mt-3" style={{ height: 44 }}>
        {latest ? "Log today" : "Log your weight"}
      </Link>
    </DSCard>
  );
}
