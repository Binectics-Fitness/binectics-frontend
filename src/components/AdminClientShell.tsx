"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAdminGuard } from "@/hooks/useRequireAuth";
import { isAdminLoginPath } from "@/lib/routing/adminPaths";

/**
 * Every /admin page except the sign-in page needs a platform admin
 * (is_admin, or the ADMIN role). The API enforces the same rule on every
 * admin endpoint; this keeps non-admins from seeing the admin screens.
 */
export default function AdminClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Sign out after 60 minutes without activity on admin pages.
  useAutoLogout(60);

  if (isAdminLoginPath(pathname)) {
    return <>{children}</>;
  }

  return <AdminGate pathname={pathname}>{children}</AdminGate>;
}

function AdminGate({
  pathname,
  children,
}: {
  pathname: string | null;
  children: React.ReactNode;
}) {
  // Signed out → /login; signed in without admin → their own dashboard.
  const { isAuthorized, isLoading } = useAdminGuard();
  const { user } = useAuth();
  const router = useRouter();

  // Admins with temporary credentials go to the change-password page first.
  useEffect(() => {
    if (isAuthorized && user?.must_change_password && pathname !== "/admin/change-password") {
      router.push("/admin/change-password");
    }
  }, [isAuthorized, user, router, pathname]);

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

  if (!isAuthorized) {
    return null;
  }

  return <div className="admin-route">{children}</div>;
}
