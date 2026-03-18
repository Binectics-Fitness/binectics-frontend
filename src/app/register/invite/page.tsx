"use client";

import { Suspense } from "react";
import InviteContent from "./InviteContent";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background-secondary">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
