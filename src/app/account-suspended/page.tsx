import type { Metadata } from "next";
import SuspendedNotice from "./SuspendedNotice";

export const metadata: Metadata = {
  title: "Account Suspended",
  description: "Your Binectics account has been suspended.",
};

export default function AccountSuspendedPage() {
  return <SuspendedNotice />;
}
