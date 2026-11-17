"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ds";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { useClientNow } from "@/lib/ui/useClientNow";
import { SoloPage } from "../_components/solo/SoloPage";
import { WaterAimCard } from "../_components/solo/WaterAimCard";
import { WaterCard } from "../_components/solo/WaterCard";
import { ChecklistManager } from "../_components/solo/ChecklistManager";

export default function WaterPage() {
  return (
    <SoloPage activeLabel="Water" flag="water" unavailableTitle="Water is not available yet">
      <WaterContent />
    </SoloPage>
  );
}

function WaterContent() {
  const flags = useSoloFlags();
  const now = useClientNow();
  const dateLine = now ? `Today · ${now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}` : null;
  return (
    <>
      <PageHeader
        eyebrow={dateLine ?? <span aria-hidden="true">&nbsp;</span>}
        title={flags.checklist ? "Water and your daily list" : "Water"}
      />
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <WaterCard variant="full" />
          <WaterAimCard />
        </div>
        {flags.checklist ? (
          <div className="min-w-0">
            <ChecklistManager showFasting={flags.fasting} />
          </div>
        ) : null}
      </div>
      {flags.checklist && (
        <p className="mt-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
          <Link href={SOLO_HREFS.todayList} className="underline underline-offset-2">
            Manage your list on its own page
          </Link>
        </p>
      )}
    </>
  );
}
