"use client";

import { Eye, EyeOff } from "lucide-react";
import { Drawer } from "@/components/ds/Drawer";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { sheetSections, type SheetFacts, type TodayProvider } from "@/lib/today/oneToday";
import { ONLY_YOU_SEE, whatTheySee, type NamedAudience } from "@/lib/today/todayCopy";

/**
 * "What Tunde sees" (today-canvas R4, L3; mobile WhatTheySeeSheet): two plain
 * lists, what the member's providers can read and what only the member sees,
 * and no settings. A side drawer on web, the sheet on the phone.
 */
export function WhatTheySeeDrawer({
  open,
  onClose,
  audience,
  providers,
  facts,
}: {
  open: boolean;
  onClose: () => void;
  audience: NamedAudience;
  providers: readonly TodayProvider[];
  facts: SheetFacts;
}) {
  const { sees, only, foot } = sheetSections(audience, providers, facts);
  return (
    <Drawer open={open} onClose={onClose} title={whatTheySee(audience)} width={420}>
      <div className="flex flex-col gap-5 px-6 py-5" data-testid="what-they-see">
        {sees.map((s) => (
          <SeesList key={s.heading} heading={s.heading} items={s.items} seen />
        ))}
        <SeesList heading={ONLY_YOU_SEE} items={only} seen={false} />
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          {foot}
        </p>
      </div>
    </Drawer>
  );
}

function SeesList({ heading, items, seen }: { heading: string; items: string[]; seen: boolean }) {
  const Icon = seen ? Eye : EyeOff;
  const id = `sees-${heading.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id}>
      <Eyebrow as="h4" id={id}>
        {heading}
      </Eyebrow>
      <ul className="mt-1">
        {items.map((t, i) => (
          <li
            key={t}
            className="flex min-h-11 items-center gap-3 py-2 text-[14px]"
            style={{ color: "var(--ink)", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : undefined }}
          >
            <Icon size={18} aria-hidden="true" style={{ color: "var(--fg-2)", flexShrink: 0 }} />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
