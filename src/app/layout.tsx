import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

export const metadata: Metadata = {
  title: {
    default: "Binectics - Your Global Fitness Ecosystem",
    template: "%s | Binectics",
  },
  description:
    "Connect with verified gyms, personal trainers, and dietitians in 50+ countries. Subscribe to fitness plans, book consultations, and track your progress.",
  keywords: [
    "fitness",
    "gym",
    "personal trainer",
    "dietitian",
    "workout",
    "nutrition",
    "fitness marketplace",
    "gym membership",
    "online training",
    "fitness ecosystem",
  ],
  openGraph: {
    type: "website",
    siteName: "Binectics",
    title: "Binectics - Your Global Fitness Ecosystem",
    description:
      "Connect with verified gyms, personal trainers, and dietitians in 50+ countries.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binectics - Your Global Fitness Ecosystem",
    description:
      "Connect with verified gyms, personal trainers, and dietitians in 50+ countries.",
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
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <OrganizationProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <CookieConsent />
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
