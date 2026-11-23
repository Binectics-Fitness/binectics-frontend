"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { ChevronRight, History as HistoryIcon } from "lucide-react";
import { ChipGroup, Eyebrow, IconTile, PageHeader } from "@/components/ds";
import type { HistoryItem } from "@/lib/api/memberHistory";
import { useHistory } from "@/lib/queries/ownRecords";
import {
  HISTORY_FILTERS,
  NOTHING_HERE_YET,
  NOTHING_LOGGED_YET,
  groupByDay,
  historyHref,
  rowText,
  type HistoryFilter,
} from "@/lib/records/history";
import { LOG_CATEGORY, LOG_ICON } from "@/lib/ui/categories";
import { categoryTone } from "@/lib/ui/tones";
import { dayKeyOf } from "@/lib/solo/glance";
import { useClientNow } from "@/lib/ui/useClientNow";
import { LoadError, SkeletonRows } from "./parts";
import { RecordsTabs } from "./RecordsTabs";
import styles from "./records.module.css";

/** One entry. It opens the page where it lives; one with no page is read only. */
const Row = memo(function Row({ item, heading, href }: { item: HistoryItem; heading: string; href: string | null }) {
  const t = rowText(item);
  const inner = (
    <>
      {/* What the entry is about: weight and notes stay neutral on purpose. */}
      <IconTile icon={LOG_ICON[item.kind]} tone={categoryTone(LOG_CATEGORY[item.kind])} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{t.title}</span>
        <span className={styles.rowMeta}>{t.meta}</span>
      </span>
      {href && <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />}
    </>
  );
  return (
    <li style={{ listStyle: "none" }} data-testid={`history-${item.kind}-${item.id}`}>
      {href ? (
        <Link href={href} className={styles.row} aria-label={`${t.title}. ${t.meta}. ${heading}.`}>
          {inner}
        </Link>
      ) : (
        <div className={styles.row}>{inner}</div>
      )}
    </li>
  );
});

/**
 * History: one timeline of everything the member logged, newest first under
 * day headings, with a chip per kind. Read only here: an entry is changed on
 * its own page. One read per page of 30; "Show older" reads the next.
 * Mirrors binectics-mobile HistoryView.
 */
export function HistoryPage() {
  const now = useClientNow();
  const [filterKey, setFilterKey] = useState<HistoryFilter["key"]>("all");
  const filter = HISTORY_FILTERS.find((f) => f.key === filterKey) ?? HISTORY_FILTERS[0];
  const history = useHistory(filter.kinds);
  const items = useMemo(() => history.data?.pages.flatMap((p) => p.items) ?? [], [history.data]);
  const sections = useMemo(() => (now ? groupByDay(items, now) : []), [items, now]);
  const today = now ? dayKeyOf(now) : "";

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Log" title="History" />
      <RecordsTabs current="history" />

      {/* The filters carry the same icons and colours as the rows; "All" has none. */}
      <ChipGroup
        label="Show"
        value={filterKey}
        onChange={setFilterKey}
        options={HISTORY_FILTERS.map((f) => {
          const k = f.key === "all" ? null : f.key;
          return { value: f.key, label: f.label, category: k ? LOG_CATEGORY[k] : null, icon: k ? LOG_ICON[k] : undefined };
        })}
      />

      {history.isLoading || !now ? (
        <SkeletonRows count={6} height={56} label="Loading your history" />
      ) : history.isError && items.length === 0 ? (
        <LoadError title="We could not load your history" onRetry={() => void history.refetch()} testId="history-error" />
      ) : items.length === 0 ? (
        <div className={`${styles.empty} ${styles.rise}`} data-testid="history-empty">
          <IconTile icon={HistoryIcon} size="lg" />
          <h2 className={styles.emptyTitle}>{filter.kinds ? NOTHING_HERE_YET : NOTHING_LOGGED_YET}</h2>
        </div>
      ) : (
        <section aria-label="Everything you logged" className={styles.stack}>
          {sections.map((s) => (
            <div key={s.day} className={styles.stack}>
              <Eyebrow as="h2" className={styles.day}>
                {s.heading}
              </Eyebrow>
              <ul className={styles.list}>
                {s.items.map((item) => (
                  <Row key={`${item.kind}:${item.id}`} item={item} heading={s.heading} href={historyHref(item, today)} />
                ))}
              </ul>
            </div>
          ))}
          {history.hasNextPage && (
            <div className={styles.stack}>
              {history.isFetchNextPageError && <p className={styles.small}>Could not load more. Check your connection.</p>}
              <div>
                <button
                  type="button"
                  className={`btn-ghost-v2 ${styles.btn}`}
                  onClick={() => void history.fetchNextPage()}
                  disabled={history.isFetchingNextPage}
                  aria-busy={history.isFetchingNextPage}
                  data-testid="history-more"
                >
                  {history.isFetchingNextPage ? "Loading" : "Show older"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
