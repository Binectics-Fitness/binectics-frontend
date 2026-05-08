"use client";

import SlugAwareListingPage from "@/components/marketplace/SlugAwareListingPage";

export default function GymProfilePage() {
  return (
    <SlugAwareListingPage
      paramKey="gymId"
      backHref="/marketplace?type=gym_owner"
      backLabel="Browse gyms"
    />
  );
}
