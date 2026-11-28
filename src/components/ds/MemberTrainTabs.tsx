"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TRAIN_SEGMENTS, trainSegmentFor } from "@/lib/member/shellV2";

/**
 * Train's sections as links styled like filter pills, shown above the pages
 * that belong to Train (flag `member_shell_v2`): Plan, Starter, Meal plans,
 * Sessions. They are the existing pages, grouped; nothing is rebuilt.
 */
export function MemberTrainTabs() {
  const current = trainSegmentFor(usePathname());
  if (!current) return null;
  return (
    <nav aria-label="Train" className="mb-5 flex flex-wrap gap-2">
      {TRAIN_SEGMENTS.map((s) => {
        const on = s.key === current;
        return (
          <Link
            key={s.key}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className="flex h-7 items-center whitespace-nowrap rounded-(--r-2) px-2.5 font-medium"
            style={{
              fontSize: "12.5px",
              background: on ? "var(--ink)" : "transparent",
              color: on ? "var(--bg)" : "var(--fg-2)",
              border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
              transition: "all var(--motion-fast) var(--ease)",
            }}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
