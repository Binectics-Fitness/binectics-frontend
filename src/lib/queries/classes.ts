import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classesService,
  type GymClass,
  type CreateGymClassRequest,
  type UpdateGymClassRequest,
} from "@/lib/api/classes";
import { classBookingsService } from "@/lib/api/classBookings";
import type { ClassCancellationPolicy } from "@/lib/classes/cancellationPolicy";

const classesKey = (orgId: string) => ["classes", "list", orgId] as const;
const classKey = (orgId: string, classId: string) =>
  ["classes", "detail", orgId, classId] as const;

export function useGymClasses(orgId: string | undefined, includeInactive = false) {
  return useQuery<GymClass[]>({
    queryKey: [...classesKey(orgId ?? ""), includeInactive],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await classesService.listClasses(orgId, includeInactive);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!orgId,
  });
}

export function useGymClass(orgId: string | undefined, classId: string | undefined) {
  return useQuery<GymClass | null>({
    queryKey: classKey(orgId ?? "", classId ?? ""),
    queryFn: async () => {
      if (!orgId || !classId) return null;
      const res = await classesService.getClass(orgId, classId);
      return res.success && res.data ? res.data : null;
    },
    enabled: !!orgId && !!classId,
  });
}

function useInvalidateClasses(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (orgId)
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
  };
}

export function useCreateGymClass(orgId: string | undefined) {
  const invalidate = useInvalidateClasses(orgId);
  return useMutation({
    mutationFn: (data: CreateGymClassRequest) => {
      if (!orgId) throw new Error("No organization selected");
      return classesService.createClass(orgId, data);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateGymClass(orgId: string | undefined) {
  const invalidate = useInvalidateClasses(orgId);
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: UpdateGymClassRequest }) => {
      if (!orgId) throw new Error("No organization selected");
      return classesService.updateClass(orgId, classId, data);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteGymClass(orgId: string | undefined) {
  const invalidate = useInvalidateClasses(orgId);
  return useMutation({
    mutationFn: (classId: string) => {
      if (!orgId) throw new Error("No organization selected");
      return classesService.deleteClass(orgId, classId);
    },
    onSuccess: invalidate,
  });
}

/** A listing's public weekly timetable and the gym's class cancellation policy. */
export type ListingTimetable = { classes: GymClass[]; policy: ClassCancellationPolicy | null };
export const NO_TIMETABLE: ListingTimetable = { classes: [], policy: null };

/**
 * The public timetable of a listing, one cache entry per listing. Every
 * reader goes through here so the entry always has this one shape: the home
 * "Classes" link and the listing's schedule section share it, and a second
 * shape under the same key crashed the listing page.
 */
export function useListingTimetable(listingId: string | null | undefined) {
  return useQuery<ListingTimetable>({
    queryKey: ["listingClasses", listingId ?? ""],
    queryFn: async () => {
      if (!listingId) return NO_TIMETABLE;
      const res = await classBookingsService.getListingClasses(listingId);
      if (!res.success) return NO_TIMETABLE;
      return { classes: res.data ?? [], policy: res.cancellation_policy ?? null };
    },
    enabled: !!listingId,
  });
}
