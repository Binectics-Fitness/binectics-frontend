import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";

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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
