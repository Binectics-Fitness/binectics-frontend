"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AsyncSpinner } from "@/components/ds/AsyncStates";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useClosedOrganizations } from "@/lib/queries/orgClosure";
import { ClosedGymBanner, CLOSED_GYMS_HREF } from "./ClosedGymBanner";

/**
 * Wraps the gym dashboard's content.
 *  - An owner with a closed gym sees a banner above the page.
 *  - An owner whose ONLY gym is closed has no workspace (a closed gym is not
 *    in the workspace list): they are sent to the Closed gyms page, where the
 *    reopen button and the downloads are.
 *  - Anyone else with no workspace (staff of a gym that has closed lose
 *    access to it) sees a plain "this gym is closed" note instead of a blank
 *    dashboard.
 */
export function GymClosureGate({ isOwner, children }: { isOwner: boolean; children: ReactNode }) {
  const ctx = useOptionalOrganization();
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const router = useRouter();
  const onClosedPage = pathname === CLOSED_GYMS_HREF;

  const loaded = !!ctx && !ctx.isLoading;
  const noWorkspace = loaded && !ctx.currentOrg;
  const { data: closed, isLoading, isFetching } = useClosedOrganizations(loaded && (isOwner || noWorkspace));
  // A refetch right after a close must not flash the note before the redirect.
  const closedLoading = isLoading || (noWorkspace && isFetching);
  const hasClosed = (closed?.length ?? 0) > 0;

  const redirect = noWorkspace && hasClosed && !onClosedPage;
  useEffect(() => {
    if (redirect) router.replace(CLOSED_GYMS_HREF);
  }, [redirect, router]);

  if (!noWorkspace || onClosedPage) {
    return (
      <>
        {isOwner && !onClosedPage && closed && closed.length > 0 && <ClosedGymBanner gyms={closed} />}
        {children}
      </>
    );
  }
  if (closedLoading || redirect) return <AsyncSpinner size="page" label="Opening your closed gyms" />;

  return (
    <div role="status" className="flex flex-col items-start gap-3 max-w-[56ch]">
      <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>No open gym here</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        You are not part of an open gym workspace. If the gym you work for has been closed by its owner, team access
        ends while it is closed. Ask the owner if it is expected to reopen.
      </p>
      <Link href="/dashboard" className="text-[13.5px] font-medium underline" style={{ color: "var(--ink)" }}>
        Back to your dashboard
      </Link>
    </div>
  );
}
