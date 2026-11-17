"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ds";
import { useTargets } from "@/lib/queries/glance";
import { PROGRESS_PAGE_COPY } from "@/lib/solo/glanceCopy";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { FastingGlance } from "./FastingGlance";
import { WaterGlance } from "./WaterGlance";
import { WeightGlance } from "./WeightGlance";

/**
 * Progress: three glances (weight then and now, fasting strip on a band, water
 * sentence and rail), each with its own states. Targets are optional and
 * still work when they cannot be read: every card shows without them.
 */
export function ProgressContent() {
  const targets = useTargets();
  const t = targets.data ?? null;

  return (
    <>
      <PageHeader
        eyebrow={PROGRESS_PAGE_COPY.eyebrow}
        title={PROGRESS_PAGE_COPY.title}
        actions={
          <Link href={SOLO_HREFS.targets} className="btn-ghost-v2" style={{ height: 44 }}>
            {PROGRESS_PAGE_COPY.targetsLink}
          </Link>
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <WeightGlance targets={t} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <FastingGlance window={t?.fasting_window ?? null} />
          <WaterGlance />
        </div>
      </div>
    </>
  );
}
