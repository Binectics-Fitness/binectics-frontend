"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { UserRole } from "@/lib/types";

export default function GymOwnerConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role={UserRole.GYM_OWNER}
      sidebar={<GymOwnerSidebar />}
      description="Define consultation availability windows your gym offers for trainer and nutrition sessions."
    />
  );
}
