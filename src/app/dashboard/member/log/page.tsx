"use client";

import { Goal, History as HistoryIcon } from "lucide-react";
import { Eyebrow, IconTile, PageHeader, ListRow } from "@/components/ds";
import { LOG_CATEGORY, LOG_ICON, type LogKind } from "@/lib/ui/categories";
import { categoryTone } from "@/lib/ui/tones";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { SoloPage } from "../_components/solo/SoloPage";
import { RECORDS_HREFS } from "../_components/records/RecordsTabs";

/** What can be logged, as on the mobile Log sheet: Fast, Water, Weight, Meal, Activity, Note. */
const LOGS: { href: string; title: string; meta: string; kind: LogKind }[] = [
  { href: SOLO_HREFS.fasting, title: "Fast", meta: "Start, end or edit", kind: "fast" },
  { href: SOLO_HREFS.water, title: "Water", meta: "Glasses today", kind: "water" },
  { href: "/dashboard/member/weight-log", title: "Weight", meta: "Weigh in", kind: "weight" },
  { href: "/dashboard/member/meal-log", title: "Meal", meta: "A few words is enough", kind: "meal" },
  { href: "/dashboard/member/workout-log", title: "Activity", meta: "A walk, a workout, a game", kind: "activity" },
  { href: RECORDS_HREFS.journal, title: "Note", meta: "Private to you", kind: "note" },
];

/** Looking back: goals and everything logged. Neutral tiles (no category). */
const LOOK_BACK = [
  { href: RECORDS_HREFS.goals, title: "Goals", meta: "In your own words", icon: Goal },
  { href: RECORDS_HREFS.history, title: "History", meta: "Everything you logged", icon: HistoryIcon },
] as const;

/** The Log hub: a way into each log, the journal, goals and history. Nothing is stored here. */
export default function LogHubPage() {
  return (
    <SoloPage activeLabel="Log">
      <PageHeader title="Log" />
      <div className="flex flex-col gap-6" style={{ maxWidth: 720 }}>
        <section aria-labelledby="log-what" className="flex flex-col gap-2.5">
          <Eyebrow as="h2" id="log-what">
            Add
          </Eyebrow>
          <ul className="flex flex-col gap-2.5">
            {LOGS.map((l) => (
              <li key={l.href} style={{ listStyle: "none" }}>
                <ListRow
                  href={l.href}
                  title={l.title}
                  meta={l.meta}
                  leading={<IconTile icon={LOG_ICON[l.kind]} tone={categoryTone(LOG_CATEGORY[l.kind])} />}
                />
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="log-back" className="flex flex-col gap-2.5">
          <Eyebrow as="h2" id="log-back">
            Look back
          </Eyebrow>
          <ul className="flex flex-col gap-2.5">
            {LOOK_BACK.map((l) => (
              <li key={l.href} style={{ listStyle: "none" }}>
                <ListRow href={l.href} title={l.title} meta={l.meta} leading={<IconTile icon={l.icon} />} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SoloPage>
  );
}
