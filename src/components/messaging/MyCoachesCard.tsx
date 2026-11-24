"use client";

import { useQuery } from "@tanstack/react-query";
import { DSCard } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { marketplaceService, type MyProviders } from "@/lib/api/marketplace";
import { useBookHref } from "@/lib/today/useBookHref";
import { Avatar } from "./Avatar";
import { StartConversationButton } from "./StartConversationButton";

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

/**
 * Member home: the trainers and dietitians this member works with, each with
 * Message and, when they have something to book through their listing,
 * "Book" (today-canvas C4; mobile YourPeople rows). Hidden when the coach
 * card on Today already names the only coach (`hidden`).
 */
export function MyCoachesCard({ className, hidden = false }: { className?: string; hidden?: boolean }) {
  const { data } = useMyProviders();
  const pros = data?.professionals ?? [];
  if (hidden || pros.length === 0) return null;

  return (
    <DSCard className={className}>
      <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)", marginBottom: 14 }}>
        {pros.length === 1 ? "My coach" : "My coaches"}
      </h3>
      <ul className="flex flex-col gap-2" data-testid="my-coaches">
        {pros.map((p) => (
          <CoachRow key={p.professional_id} pro={p} />
        ))}
      </ul>
    </DSCard>
  );
}

function CoachRow({ pro: p }: { pro: MyProviders["professionals"][number] }) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Your coach";
  const book = useBookHref({ userId: p.professional_id, listingId: p.listing?._id ?? null });
  return (
    <li
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
      <div className="flex shrink-0 flex-wrap gap-2">
        <StartConversationButton
          recipientUserId={p.professional_id}
          messagesHref="/dashboard/messages"
          ariaLabel={`Message ${name}`}
          className="btn-ghost-v2 min-h-11"
        />
        {book && (
          <Link href={book} className="btn-ghost-v2 min-h-11" aria-label={`Book a session with ${name}`}>
            Book
          </Link>
        )}
      </div>
    </li>
  );
}
