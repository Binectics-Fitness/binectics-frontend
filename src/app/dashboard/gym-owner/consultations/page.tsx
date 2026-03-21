"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";

export default function GymOwnerConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role="GYM_OWNER"
      sidebar={<GymOwnerSidebar />}
      description="Define consultation availability windows your gym offers for trainer and nutrition sessions."
    />
  );
}
