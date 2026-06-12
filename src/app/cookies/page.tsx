import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Learn how Binectics uses cookies and manage your preferences.",
};

export default function CookiesPage() {
  redirect("/privacy?tab=cookies");
}
