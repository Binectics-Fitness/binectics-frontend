"use client";

// PROTOTYPE MODE: bypass DashboardClientShell (auth hooks)
// TODO: Restore DashboardClientShell when wiring to real API

import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Match prototype: body bg-2 for dashboard pages
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--bg-2)";
    return () => { document.body.style.background = prev; };
  }, []);

  return <>{children}</>;
}
