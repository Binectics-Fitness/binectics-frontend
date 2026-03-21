"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import DieticianSidebar from "@/components/DieticianSidebar";
import { UserRole } from "@/lib/types";

export default function DieticianConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role={UserRole.DIETICIAN}
      sidebar={<DieticianSidebar />}
      description="Define when clients can book consultation sessions."
    />
  );
}
