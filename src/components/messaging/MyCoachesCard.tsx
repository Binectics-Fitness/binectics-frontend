"use client";

import { useQuery } from "@tanstack/react-query";
import { DSCard } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { Avatar } from "./Avatar";
import { StartConversationButton } from "./StartConversationButton";

/**
 * Member home: the trainers and dietitians this member works with, each
 * with a Message button (the web had none; members waited for the provider
 * to write first). The server decides who may be messaged; a refusal shows
 * as a toast from StartConversationButton.
 */
/** Who the signed-in member belongs to (GET /marketplace/my-providers). */
export function useMyProviders(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["marketplace", user?.id ?? "", "my-providers"],
    enabled: enabled && Boolean(user?.id),
    queryFn: async () => {
      const res = await marketplaceService.getMyProviders();
      if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load your providers");
      return res.data;
    },
  });
}

export function MyCoachesCard({ className }: { className?: string }) {
  const { data } = useMyProviders();
  const pros = data?.professionals ?? [];
  if (pros.length === 0) return null;

  return (
    <DSCard className={className}>
      <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)", marginBottom: 14 }}>
        {pros.length === 1 ? "My coach" : "My coaches"}
      </h3>
      <ul className="flex flex-col gap-2">
        {pros.map((p) => {
          const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Your coach";
          return (
            <li
              key={p.professional_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-(--r-2) p-4"
              style={{ background: "var(--bg-2)" }}
            >
              <Avatar name={name} url={p.profile_picture} />
              <div className="min-w-0 flex-1 basis-40">
                <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  {name}
                </div>
                {p.role && (
                  <div className="mt-0.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {p.role}
                  </div>
                )}
              </div>
              <StartConversationButton
                recipientUserId={p.professional_id}
                messagesHref="/dashboard/messages"
                ariaLabel={`Message ${name}`}
              />
            </li>
          );
        })}
      </ul>
    </DSCard>
  );
}
