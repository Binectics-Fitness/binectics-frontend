"use client";

import { useEffect } from "react";
import AdminClientShell from "@/components/AdminClientShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--bg-2)";
    return () => { document.body.style.background = prev; };
  }, []);

  return <AdminClientShell>{children}</AdminClientShell>;
}
