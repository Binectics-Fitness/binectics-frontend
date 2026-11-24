import { useQuery } from "@tanstack/react-query";
import { verificationService, type MyVerification } from "@/lib/api/verification";

export const MY_VERIFICATION_KEY = ["verification", "me"] as const;

/** The caller's own verification statuses (owner of each workspace, dietitian credentials). */
export function useMyVerification(enabled = true) {
  return useQuery({
    queryKey: MY_VERIFICATION_KEY,
    enabled,
    queryFn: async (): Promise<MyVerification[]> => {
      const res = await verificationService.getMine();
      if (!res.success) throw new Error(res.message || "Couldn't load your verification");
      return res.data ?? [];
    },
    staleTime: 30_000,
  });
}
