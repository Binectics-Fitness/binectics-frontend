"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ds";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { useTargets } from "@/lib/queries/glance";
import { PROGRESS_PAGE_COPY } from "@/lib/solo/glanceCopy";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { FastingGlance } from "./FastingGlance";
import { WaterGlance } from "./WaterGlance";
import { WeightGlance } from "./WeightGlance";

/**
 * Progress: three glances (weight then and now, fasting strip on a band, water
 * sentence and rail), each with its own states. Targets are optional and
 * only read when `solo_targets` is on; without them every card still works.
 */
export function ProgressContent() {
  const flags = useSoloFlags();
  const targets = useTargets(flags.targets);
  const t = flags.targets ? (targets.data ?? null) : null;

  return (
    <>
      <PageHeader
        eyebrow={PROGRESS_PAGE_COPY.eyebrow}
        title={PROGRESS_PAGE_COPY.title}
        actions={
          flags.targets ? (
            <Link href={SOLO_HREFS.targets} className="btn-ghost-v2" style={{ height: 44 }}>
              {PROGRESS_PAGE_COPY.targetsLink}
            </Link>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <WeightGlance targets={flags.targets ? t : null} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {flags.fasting && <FastingGlance window={t?.fasting_window ?? null} />}
          {flags.water && <WaterGlance />}
        </div>
      </div>
    </>
  );
}
