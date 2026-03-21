"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import TrainerSidebar from "@/components/TrainerSidebar";
import { UserRole } from "@/lib/types";

export default function TrainerConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role={UserRole.TRAINER}
      sidebar={<TrainerSidebar />}
      description="Define when clients can book consultation and planning sessions with you."
    />
  );
}
