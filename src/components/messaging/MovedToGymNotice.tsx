"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ReadOnlyReason } from "@/lib/api/messaging";
import { readOnlyCopy } from "./format";
import { useMyProviders } from "./MyCoachesCard";
import { StartConversationButton } from "./StartConversationButton";

/**
 * A past member↔gym-owner conversation, frozen when the gym inbox opened
 * (owner ruling, Oct 10 2026: that history is not shared with staff). Both
 * people can still read it; neither can write. The member gets a way into
 * the gym's inbox, which starts a new, empty conversation. The owner only
 * sees the notice. When the API can't name one gym (the member was at
 * several of the owner's gyms) there is no action.
 */
export function MovedToGymNotice({ organizationId, title }: { organizationId: string | null; title: string }) {
  const { user } = useAuth();
  const { organizations } = useOrganization();
  const pathname = usePathname();
  const owned = organizationId
    ? organizations.find((o) => o._id === organizationId && String(o.owner_id) === user?.id)
    : undefined;
  const providers = useMyProviders(Boolean(organizationId) && !owned);
  const gymName =
    owned?.name ?? providers.data?.gyms.find((g) => g.organization_id === organizationId)?.name ?? null;

  return (
    <div
      className="flex shrink-0 flex-col items-center gap-3 px-4 py-4 text-center md:px-5"
      role="note"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
    >
      <p className="max-w-[52ch] text-[14px] leading-normal" style={{ color: "var(--fg-2)" }}>
        {readOnlyCopy(ReadOnlyReason.MOVED_TO_GYM_INBOX, title, gymName)}
      </p>
      {organizationId && !owned && (
        <StartConversationButton
          organizationId={organizationId}
          messagesHref={pathname}
          label={gymName ? `Message ${gymName}` : "Message the gym"}
          className="btn-primary-v2 sm"
        />
      )}
    </div>
  );
}
