"use client";

import Link from "next/link";
import { MyTeamInvitations } from "@/components/teams/MyTeamInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";

/**
 * Pending team invitations for whoever is signed in, whatever their role.
 * The team invitation notification opens this page: a trainer or member is
 * bounced off the gym's /dashboard/team, so the invitations can't live only
 * there. The sign-in redirect comes from the middleware (/teams is guarded).
 */
export default function TeamInvitationsPage() {
  const { user } = useAuth();
  const home = getDashboardRoute((user?.role as UserRole) ?? UserRole.USER);
  return (
    <div className="min-h-screen bg-bg-2 flex justify-center px-4 py-10">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <Link href={home} className="text-[13px] self-start min-h-11 inline-flex items-center" style={{ color: "var(--fg-3)" }}>
          &larr; Back to your dashboard
        </Link>
        <h1 className="text-[26px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Team invitations
        </h1>
        <MyTeamInvitations showEmpty />
      </div>
    </div>
  );
}
