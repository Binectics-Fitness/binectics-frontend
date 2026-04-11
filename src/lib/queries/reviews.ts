import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  reviewsService,
  type ReviewAggregate,
  type GetTargetReviewsResponse,
} from "@/lib/api/reviews";

export function useTargetAggregate(
  targetType: string,
  targetId: string,
  enabled = true,
) {
  return useQuery<ReviewAggregate | null>({
    queryKey: queryKeys.reviews.targetAggregate(targetType, targetId),
    queryFn: async () => {
      const res = await reviewsService.getTargetAggregate(
        targetType,
        targetId,
      );
      return res.success && res.data ? res.data : null;
    },
    enabled: enabled && !!targetType && !!targetId,
  });
}

export function useTargetReviews(
  targetType: string,
  targetId: string,
  params?: { page?: number; limit?: number; sort?: string },
  enabled = true,
) {
  return useQuery<GetTargetReviewsResponse | null>({
    queryKey: queryKeys.reviews.targetReviews(targetType, targetId, {
      page: params?.page,
      sort: params?.sort,
    }),
    queryFn: async () => {
      const res = await reviewsService.getTargetReviews(
        targetType,
        targetId,
        params,
      );
      return res.success && res.data ? res.data : null;
    },
    enabled: enabled && !!targetType && !!targetId,
  });
}
