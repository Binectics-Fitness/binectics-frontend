"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";

export default function AdminClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Enable auto-logout for admin pages (60 minutes of inactivity)
  useAutoLogout(60);

  useEffect(() => {
    // Don't redirect if we're on the admin login page (/admin) or create-super-admin page
    if (pathname === "/admin" || pathname === "/admin/create-super-admin") {
      return;
    }

    // Redirect non-admin users to login page
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/admin");
      return;
    }

    // Force admins with temporary credentials onto the change-password page
    if (
      !isLoading &&
      user?.must_change_password &&
      pathname !== "/admin/change-password"
    ) {
      router.push("/admin/change-password");
    }
  }, [user, isLoading, router, pathname]);

  // Allow access to login page and create-super-admin without auth
  if (pathname === "/admin" || pathname === "/admin/create-super-admin") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-danger mx-auto"></div>
          <p className="mt-4 text-fg-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return <div className="admin-route">{children}</div>;
}
