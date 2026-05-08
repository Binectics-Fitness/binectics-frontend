"use client";

import SlugAwareListingPage from "@/components/marketplace/SlugAwareListingPage";

export default function TrainerProfilePage() {
  return (
    <SlugAwareListingPage
      paramKey="trainerId"
      backHref="/marketplace?type=personal_trainer"
      backLabel="Browse trainers"
    />
  );
}
