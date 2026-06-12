import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Binectics terms of service and acceptable use policy.",
};

export default function TermsPage() {
  redirect("/privacy?tab=terms");
}
