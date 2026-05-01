"use client";

import { ReactNode } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAutoAcceptInvite } from "@/hooks/useAutoAcceptInvite";
import FeedbackPrompt from "@/components/FeedbackPrompt";

export default function DashboardClientShell({ children }: { children: ReactNode }) {
  // Enable auto-logout for all dashboard pages (60 minutes of inactivity)
  useAutoLogout(60);

  // Auto-accept client invite if token was stored during registration flow
  useAutoAcceptInvite();

  return (
    <div className="dashboard-route">
      {children}
      <FeedbackPrompt />
    </div>
  );
}
