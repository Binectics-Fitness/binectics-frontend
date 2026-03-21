"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import DieticianSidebar from "@/components/DieticianSidebar";

export default function DieticianConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role="DIETICIAN"
      sidebar={<DieticianSidebar />}
      description="Define when clients can book consultation sessions."
    />
  );
}
