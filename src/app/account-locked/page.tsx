import { Suspense } from "react";
import type { Metadata } from "next";
import LockedNotice from "./LockedNotice";

export const metadata: Metadata = {
  title: "Account Locked",
  description: "Sign-in is paused after too many failed attempts.",
};

export default function AccountLockedPage() {
  return (
    <Suspense fallback={null}>
      <LockedNotice />
    </Suspense>
  );
}
