"use client";

import ConsultationBookingsManager from "@/components/ConsultationBookingsManager";
import DietitianSidebar from "@/components/DietitianSidebar";
import { UserRole } from "@/lib/types";

export default function DietitianBookingsPage() {
  return (
    <ConsultationBookingsManager
      role={UserRole.DIETITIAN}
      sidebar={<DietitianSidebar />}
      description="Manage your upcoming and past consultation bookings."
    />
  );
}
