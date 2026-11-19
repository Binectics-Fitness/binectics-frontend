"use client";

import { IconTile, PageHeader, ListRow } from "@/components/ds";
import { LOG_CATEGORY, LOG_ICON, type LogKind } from "@/lib/ui/categories";
import { categoryTone } from "@/lib/ui/tones";
import { SoloPage } from "../_components/solo/SoloPage";

const LOGS: { href: string; title: string; meta: string; kind: LogKind }[] = [
  { href: "/dashboard/member/weight-log", title: "Weight", meta: "Weigh in; see what you logged", kind: "weight" },
  { href: "/dashboard/member/meal-log", title: "Meals", meta: "Note what you ate", kind: "meal" },
  { href: "/dashboard/member/workout-log", title: "Workouts", meta: "Note what you did", kind: "session" },
];

/** The Log hub: a way into the three existing logs. Nothing is stored here. */
export default function LogHubPage() {
  return (
    <SoloPage activeLabel="Log">
      <PageHeader title="Log" subtitle="Write down what you like. Only you can see it." />
      <ul className="flex flex-col gap-2.5" style={{ maxWidth: 720 }}>
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
    </SoloPage>
  );
}
