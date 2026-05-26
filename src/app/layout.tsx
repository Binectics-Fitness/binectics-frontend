import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import CookieConsent from "@/components/CookieConsent";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ToastContainer } from "@/components/Toast";

export const metadata: Metadata = {
  title: {
    default: "Binectics — the operating system for fitness",
    template: "%s — Binectics",
  },
  description:
    "One marketplace, one set of dashboards, one tab. Discovery, payments, check-ins, and client health for gyms, trainers, and dietitians in 50+ countries.",
  keywords: [
    "fitness marketplace",
    "gym management",
    "personal trainer software",
    "dietitian platform",
    "QR check-in",
    "fitness payments",
    "client management",
    "workout plans",
    "multi-currency fitness",
  ],
  openGraph: {
    type: "website",
    siteName: "Binectics",
    title: "Binectics — the operating system for fitness",
    description:
      "One marketplace, one set of dashboards, one tab. Gyms, trainers, and dietitians in 50+ countries.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binectics — the operating system for fitness",
    description:
      "One marketplace, one set of dashboards, one tab. Gyms, trainers, and dietitians in 50+ countries.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://binectics.com",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <OrganizationProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
              <CookieConsent />
              <ToastContainer />
            </OrganizationProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
