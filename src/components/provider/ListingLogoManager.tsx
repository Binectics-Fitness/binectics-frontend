"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "@/lib/api/marketplace";
import { queryKeys } from "@/lib/queries/keys";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";

/** What the API's image upload accepts (imageUploadOptions): no SVG. */
export const LOGO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const LOGO_TYPES = LOGO_ACCEPT.split(",");
const LOGO_MAX_MB = 10;

/**
 * The gym's logo: the listing's profile image, which Explore cards, the gym
 * profile and member screens show beside the name. Upload, replace, remove,
 * through PATCH /marketplace/organizations/:id/listing/profile-image (and
 * /delete). Saved straight away, not with the page's Save button, like the
 * gallery.
 */
export function ListingLogoManager({
  orgId,
  logoUrl,
  name,
}: {
  orgId: string;
  logoUrl?: string | null;
  /** For the placeholder initial and the image's alt text. */
  name?: string;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orgListing(orgId) });

  const onPick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      setError(`The logo must be ${LOGO_MAX_MB} MB or smaller.`);
      return;
    }
    setError(null);
    setBusy("upload");
    try {
      const res = await marketplaceService.uploadOrgListingProfileImage(orgId, file);
      if (!res.success) setError(res.message || "Couldn't upload the logo. Try again.");
      else await refresh();
    } catch {
      setError("Couldn't upload the logo. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const onRemove = () =>
    requestConfirmation({
      title: "Remove logo?",
      description: "Your listing shows your gym's initial until you add another.",
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: async () => {
        setError(null);
        setBusy("remove");
        try {
          const res = await marketplaceService.deleteOrgListingProfileImage(orgId);
          if (!res.success) setError(res.message || "Couldn't remove the logo. Try again.");
          else await refresh();
        } catch {
          setError("Couldn't remove the logo. Try again.");
        } finally {
          setBusy(null);
        }
      },
    });

  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "G";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-(--r-3)"
          style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name ? `${name} logo` : "Gym logo"} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[26px] font-medium" style={{ color: "var(--fg-3)" }} aria-hidden>
              {initial}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost-v2 sm"
              disabled={busy !== null}
              onClick={() => inputRef.current?.click()}
            >
              {busy === "upload" ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={busy !== null}
                onClick={onRemove}
                style={{ color: "var(--danger-ink)" }}
              >
                {busy === "remove" ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
          <p className="text-[12px]" style={{ color: "var(--fg-4)" }}>
            Square works best. JPG, PNG, WebP or GIF, up to {LOGO_MAX_MB} MB.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_ACCEPT}
          className="hidden"
          aria-label="Logo file"
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="text-[12.5px]" style={{ color: "var(--danger-ink)" }} role="alert">
          {error}
        </p>
      )}
      {confirmationModal}
    </div>
  );
}
