import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import CookieConsent from "@/components/CookieConsent";
import { PushRegistrar } from "@/components/PushRegistrar";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { RegionProvider } from "@/contexts/RegionContext";
import { ToastContainer } from "@/components/Toast";
import { CommandBar } from "@/components/ds/CommandBar";
import { NavigationProgress } from "@/components/ds/NavigationProgress";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "Binectics — the copilot your fitness business runs on",
    template: "%s — Binectics",
  },
  description:
    "AI-drafted client summaries, weekly reports, and program updates — plus payments in 8 currencies and a verified marketplace. For trainers, dietitians, and gyms in 50+ countries.",
  keywords: [
    "AI fitness copilot",
    "AI client reports",
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
    title: "Binectics — the copilot your fitness business runs on",
    description:
      "AI-drafted client reports, payments in 8 currencies, and a verified marketplace — for trainers, dietitians, and gyms in 50+ countries.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binectics — the copilot your fitness business runs on",
    description:
      "AI-drafted client reports, payments in 8 currencies, and a verified marketplace — for trainers, dietitians, and gyms in 50+ countries.",
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
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <NavigationProgress />
        <GoogleAnalytics />
        <QueryProvider>
          <AuthProvider>
            <OrganizationProvider>
              <RegionProvider>
                <ConditionalLayout>{children}</ConditionalLayout>
                <CookieConsent />
                <PushRegistrar />
                <ToastContainer />
                <CommandBar />
              </RegionProvider>
            </OrganizationProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
