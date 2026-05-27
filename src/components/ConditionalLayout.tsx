"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that handle their own chrome (navbar/footer)
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAdmin = pathname?.startsWith("/admin");
  const isMarketplace = pathname?.startsWith("/marketplace");
  const isAuth = pathname === "/login" || pathname === "/forgot-password" || pathname?.startsWith("/reset-password") || pathname?.startsWith("/verify-email") || pathname === "/2fa-recovery" || pathname === "/magic-link" || pathname === "/account-deleted" || pathname === "/account-suspended" || pathname === "/account-locked" || pathname === "/session-expired";
  const isUtility = pathname === "/offline" || pathname === "/rate-limit" || pathname === "/maintenance";
  const isOnboarding = pathname?.startsWith("/onboarding");
  const isRegister = pathname?.startsWith("/register");
  const isCheckIn = pathname?.startsWith("/check-in");
  const isFormSubmit = pathname?.match(/^\/forms\/[^\/]+\/submit$/);
  const isProvider = pathname?.match(/^\/(gyms|trainers|dietitians)\/[^\/]+$/);
  const isLanding = pathname === "/";
  const isMarketing = ["/about", "/pricing", "/help", "/support", "/privacy", "/terms", "/cookies", "/security", "/careers", "/press", "/partners", "/contact", "/booking", "/legal", "/for-gyms", "/for-trainers", "/for-dietitians", "/for-members", "/case-studies", "/status", "/review", "/blog", "/qr-help", "/features"].some(p => pathname === p || pathname?.startsWith(p + "/"));

  const hideChrome = isDashboard || isAdmin || isFormSubmit || isMarketplace || isProvider || isRegister || isCheckIn || isAuth || isMarketing || isLanding || isUtility || isOnboarding;

  if (hideChrome) {
    return <div id="main-content">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div id="main-content">{children}</div>
      <Footer />
    </>
  );
}
