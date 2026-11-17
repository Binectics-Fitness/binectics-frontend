"use client";

import Link from "next/link";
import { DSCard, Eyebrow } from "@/components/ds";
import { useActiveStarter } from "@/lib/queries/starter";
import { starterProgressLine } from "@/lib/starter/model";
import styles from "./solo.module.css";

/** The member's live Starter Program, from the existing starter data. Nothing without one. */
export function StarterCard() {
  const starter = useActiveStarter(true);
  const program = starter.data?.program;
  if (!program) return null;
  const line = starterProgressLine(program);
  return (
    <DSCard className="p-5.5">
      <div className="flex items-center justify-between">
        <Eyebrow>Starter Program</Eyebrow>
        <Link href="/dashboard/member/starter" className={styles.link}>
          Open
        </Link>
      </div>
      <p className="mt-1 text-[16px] font-medium" style={{ color: "var(--ink)" }}>
        {program.name}
      </p>
      {line && (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          {line}
        </p>
      )}
    </DSCard>
  );
}
