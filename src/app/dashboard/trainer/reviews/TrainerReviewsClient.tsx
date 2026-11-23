"use client";

import { DSCard, EmptySlate } from "@/components/ds";
import { NoListingYet, ProviderReviews } from "@/components/reviews/ProviderReviews";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { ReviewTargetType } from "@/lib/api/reviews";

/**
 * A solo trainer's reviews. A gym's staff trainer has no listing of their
 * own: members review the gym, and the gym answers on its Reviews page.
 */
export function TrainerReviewsClient() {
  const gym = useCoachingGym();
  if (gym) {
    return (
      <DSCard className="px-6 py-10 text-center">
        <EmptySlate message={`${gym.name} answers reviews of its listing.`} mt="mt-0" />
      </DSCard>
    );
  }
  return (
    <ProviderReviews
      targetType={ReviewTargetType.TRAINER}
      sessionNoun="session"
      noListing={<NoListingYet href="/dashboard/trainer/profile" />}
    />
  );
}
