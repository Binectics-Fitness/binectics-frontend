"use client";

import type { ReactNode } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { DSCard } from "@/components/ds";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { isSoloMemberEnabled } from "@/lib/solo/flag";
import { UserRole } from "@/lib/types";
import { CardSkeleton } from "./parts";

/**
 * The frame every solo page shares. A page shows only when the client switch
 * is on AND its server flag is on; otherwise it says plainly that the tool is
 * not on yet (design "5 · Not turned on"), and its link stays out of the top
 * bar. Members of any other role are sent to their own dashboard by the guard.
 */
export function SoloPage({
  activeLabel,
  flag,
  unavailableTitle,
  children,
}: {
  activeLabel: string;
  /** The server flag this page needs; null when it needs none. */
  flag: "water" | "checklist" | null;
  unavailableTitle: string;
  children: ReactNode;
}) {
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  const flags = useSoloFlags();
  if (!isAuthorized) return null;

  const clientOn = isSoloMemberEnabled();
  const on = clientOn && (flag === null || flags[flag]);

  return (
    <MemberDashboardShell activeLabel={activeLabel}>
      {clientOn && flags.isLoading ? (
        <div role="status" aria-label="Loading">
          <CardSkeleton height={240} />
        </div>
      ) : on ? (
        children
      ) : (
        <DSCard className="p-6">
          <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>
            {unavailableTitle}
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
            This tool is coming to your account soon. Your other tools work as before.
          </p>
        </DSCard>
      )}
    </MemberDashboardShell>
  );
}
