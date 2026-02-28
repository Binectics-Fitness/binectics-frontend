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

  // Hide Navbar and Footer for dashboard pages and form submissions
  const isDashboard = pathname?.startsWith("/dashboard");
  const isFormSubmit = pathname?.match(/^\/forms\/[^\/]+\/submit$/);

  if (isDashboard || isFormSubmit) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
