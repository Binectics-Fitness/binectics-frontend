"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";

/**
 * /dashboard has no content of its own — several shells, breadcrumbs, and
 * error pages link here as "the dashboard", so it resolves to the viewer's
 * role dashboard instead of 404ing (the role isn't knowable at build time,
 * hence a client redirect rather than next.config).
 */
export default function DashboardIndexRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? getDashboardRoute(user.role) : "/login");
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-border-2 border-t-ink animate-spin" />
    </div>
  );
}
