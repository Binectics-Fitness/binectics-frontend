"use client";

import ConsultationBookingsManager from "@/components/ConsultationBookingsManager";
import TrainerSidebar from "@/components/TrainerSidebar";
import { UserRole } from "@/lib/types";

export default function TrainerBookingsPage() {
  return (
    <ConsultationBookingsManager
      role={UserRole.TRAINER}
      sidebar={<TrainerSidebar />}
      description="Manage your upcoming and past consultation bookings."
    />
  );
}
