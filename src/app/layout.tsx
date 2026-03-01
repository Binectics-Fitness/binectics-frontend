import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

export const metadata: Metadata = {
  title: "Binectics - Your Global Fitness Ecosystem",
  description: "Connect with verified gyms, personal trainers, and dieticians worldwide.",
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
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <CookieConsent />
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
