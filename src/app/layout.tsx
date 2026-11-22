import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { fontVariables } from "./fonts";
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
import { PostHogAnalytics } from "@/components/PostHogAnalytics";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: {
    default: "Binectics: run your gym, coaching and payments in one place",
    template: "%s, Binectics",
  },
  description:
    "Memberships, Paystack payments, QR check-in, classes, bookings, training programs and meal plans for gyms, personal trainers and dietitians in Nigeria. Priced per seat, with no cut of your takings.",
  keywords: [
    "fitness marketplace",
    "gym management",
    "personal trainer software",
    "dietitian platform",
    "QR check-in",
    "fitness payments",
    "client management",
    "workout plans",
    "gym software Nigeria",
    "Paystack",
  ],
  openGraph: {
    type: "website",
    siteName: "Binectics",
    title: "Binectics: run your gym, coaching and payments in one place",
    description:
      "Memberships, Paystack payments, QR check-in, classes, bookings, training programs and meal plans for gyms, personal trainers and dietitians in Nigeria. Priced per seat, with no cut of your takings.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binectics: run your gym, coaching and payments in one place",
    description:
      "Memberships, Paystack payments, QR check-in, classes, bookings, training programs and meal plans for gyms, personal trainers and dietitians in Nigeria. Priced per seat, with no cut of your takings.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Resolves the relative canonical paths each public page declares. No
  // canonical here: a layout's is inherited by every page below it, which
  // would declare them all duplicates of the home page.
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <NavigationProgress />
        <GoogleAnalytics />
        <QueryProvider>
          <AuthProvider>
            {/* Loads nothing until the visitor accepts analytics cookies. */}
            <PostHogAnalytics />
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
