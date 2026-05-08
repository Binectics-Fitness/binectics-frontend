"use client";

import SlugAwareListingPage from "@/components/marketplace/SlugAwareListingPage";

export default function DietitianProfilePage() {
  return (
    <SlugAwareListingPage
      paramKey="dietitianId"
      backHref="/marketplace?type=dietitian"
      backLabel="Browse dietitians"
    />
  );
}
