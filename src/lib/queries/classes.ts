import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classesService,
  type GymClass,
  type CreateGymClassRequest,
  type UpdateGymClassRequest,
} from "@/lib/api/classes";

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
