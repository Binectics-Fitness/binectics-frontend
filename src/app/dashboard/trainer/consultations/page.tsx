"use client";

import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import TrainerSidebar from "@/components/TrainerSidebar";

export default function TrainerConsultationsPage() {
  return (
    <ConsultationAvailabilityManager
      role="TRAINER"
      sidebar={<TrainerSidebar />}
      description="Define when clients can book consultation and planning sessions with you."
    />
  );
}
