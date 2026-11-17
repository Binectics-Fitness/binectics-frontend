"use client";

import { PageHeader, ListRow } from "@/components/ds";
import { SoloPage } from "../_components/solo/SoloPage";

const LOGS = [
  { href: "/dashboard/member/weight-log", title: "Weight", meta: "Weigh in; see what you logged" },
  { href: "/dashboard/member/meal-log", title: "Meals", meta: "Note what you ate" },
  { href: "/dashboard/member/workout-log", title: "Workouts", meta: "Note what you did" },
];

/** The Log hub: a way into the three existing logs. Nothing is stored here. */
export default function LogHubPage() {
  return (
    <SoloPage activeLabel="Log" flag={null} unavailableTitle="Log is not available yet">
      <PageHeader title="Log" subtitle="Write down what you like. Only you can see it." />
      <ul className="flex flex-col gap-2.5" style={{ maxWidth: 720 }}>
        {LOGS.map((l) => (
          <li key={l.href} style={{ listStyle: "none" }}>
            <ListRow href={l.href} title={l.title} meta={l.meta} />
          </li>
        ))}
      </ul>
    </SoloPage>
  );
}
