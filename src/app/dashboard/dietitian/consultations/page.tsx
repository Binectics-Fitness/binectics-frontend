"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import DietitianSidebar from "@/components/DietitianSidebar";
import { UserRole } from "@/lib/types";

export default function DietitianConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role={UserRole.DIETITIAN}
      sidebar={<DietitianSidebar />}
      description="Define when clients can book consultation sessions."
    />
  );
}
