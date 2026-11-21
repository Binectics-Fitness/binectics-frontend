"use client";

import { useEffect, useState } from "react";
import { DSCard } from "@/components/ds/DSCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { ProgramAbout } from "@/components/content/ProgramAbout";
import { myProgramsService, type ProgramAboutText } from "@/lib/api/myPrograms";
import { PROGRAM_ABOUT_COPY as C } from "@/lib/programs/aboutCopy";

/**
 * "About this program" under the member home's program hero (D4; board
 * web-cautions.html W3): the coach's description and cautions for the
 * program the hero shows. The web has no per-program page, so this is where
 * a started program's safety text lives. Renders nothing until it has
 * something to say: a program with neither field, or a failed read, adds no
 * card.
 */
export function ProgramAboutCard({ instanceId }: { instanceId: string }) {
  // Keyed by instance, so a different program never shows the last one's text.
  const [loaded, setLoaded] = useState<{ id: string; about: ProgramAboutText } | null>(null);

  useEffect(() => {
    let live = true;
    void myProgramsService
      .about(instanceId)
      .then((res) => {
        if (live && res.success && res.data) setLoaded({ id: instanceId, about: res.data });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [instanceId]);

  const about = loaded?.id === instanceId ? loaded.about : null;
  if (!about || (!about.description && !about.cautions)) return null;
  return (
    <DSCard className="px-5 py-4.5">
      <section aria-labelledby="program-about-h" data-testid="program-about-card">
        <Eyebrow as="h2" id="program-about-h">
          {C.heading}
        </Eyebrow>
        <ProgramAbout description={about.description} cautions={about.cautions} className="mt-2.5" />
      </section>
    </DSCard>
  );
}
