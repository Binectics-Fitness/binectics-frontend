"use client";

// PROTOTYPE MODE: bypass AdminClientShell (auth hooks)
// TODO: Restore:
//   import AdminClientShell from "@/components/AdminClientShell";
//   return <AdminClientShell>{children}</AdminClientShell>;

import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--bg-2)";
    return () => { document.body.style.background = prev; };
  }, []);

  return <>{children}</>;
}
