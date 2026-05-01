"use client";

import ConsultationBookingsManager from "@/components/ConsultationBookingsManager";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { UserRole } from "@/lib/types";

export default function GymOwnerBookingsPage() {
  return (
    <ConsultationBookingsManager
      role={UserRole.GYM_OWNER}
      sidebar={<GymOwnerSidebar />}
      description="Manage your upcoming and past consultation bookings."
    />
  );
}
