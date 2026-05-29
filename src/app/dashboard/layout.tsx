"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";

const ALLOWED_ROLES = [UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.DIETITIAN];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--bg-2)";
    return () => { document.body.style.background = prev; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-2)" }}>
        <div className="w-10 h-10 rounded-full border-[3px] border-border-2 border-t-ink animate-spin" />
      </div>
    );
  }

  if (!user || !ALLOWED_ROLES.includes(user.role)) return null;

  return <>{children}</>;
}
