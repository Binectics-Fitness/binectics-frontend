"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Loader2, ExternalLink } from "lucide-react";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceAccountType } from "@/lib/types";

const RESERVED_HINT = new Set([
  "admin",
  "api",
  "marketplace",
  "gyms",
  "trainers",
  "dietitians",
  "dashboard",
  "login",
  "register",
  "settings",
]);

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function slugifyForTyping(input: string): string {
  // Used while the user types — keeps trailing hyphens so spaces don't get
  // eaten between words. The save handler trims them off.
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function slugify(input: string): string {
  return slugifyForTyping(input).replace(/-+$/g, "");
}

function validateClientSide(slug: string): string | null {
  if (!slug) return "Choose a URL for your public page.";
  if (slug.length < 3) return "Must be at least 3 characters.";
  if (slug.length > 80) return "Must be 80 characters or fewer.";
  if (!SLUG_REGEX.test(slug)) {
    return "Only lowercase letters, numbers, and hyphens. No leading/trailing hyphens.";
  }
  if (slug.includes("--")) return "No consecutive hyphens.";
  if (RESERVED_HINT.has(slug)) {
    return "That word is reserved. Try something more specific.";
  }
  return null;
}

function pathFor(accountType: MarketplaceAccountType): string {
  switch (accountType) {
    case "gym_owner":
      return "/gyms/";
    case "personal_trainer":
      return "/trainers/";
    case "dietitian":
      return "/dietitians/";
  }
}

export interface SlugEditorProps {
  listingId: string;
  accountType: MarketplaceAccountType;
  currentSlug?: string;
  /** Used to seed the initial suggestion when no slug exists yet. */
  fallbackBase?: string;
  /** Called after a successful save with the new slug. */
  onSaved?: (newSlug: string) => void;
}

/**
 * Owner-facing editor for the public listing slug. Validates client-side,
 * shows a live URL preview, and saves via marketplaceService.updateMyListingSlug.
 *
 * The save endpoint is the source of truth for collisions and the reserved
 * blocklist — client-side checks are advisory.
 */
export default function SlugEditor({
  listingId,
  accountType,
  currentSlug,
  fallbackBase,
  onSaved,
}: SlugEditorProps) {
  const seed = currentSlug ?? (fallbackBase ? slugify(fallbackBase) : "");
  const [draft, setDraft] = useState(seed);
  const [savedSlug, setSavedSlug] = useState<string | undefined>(currentSlug);
  const [prevPropSlug, setPrevPropSlug] = useState<string | undefined>(
    currentSlug,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Derived sync: when the parent passes a new currentSlug (e.g. after a
  // refetch), update local state during render rather than in an effect.
  if (currentSlug !== prevPropSlug) {
    setPrevPropSlug(currentSlug);
    setSavedSlug(currentSlug);
    setDraft(currentSlug ?? "");
  }

  const trimmedDraft = draft.replace(/-+$/g, "");
  const clientError = useMemo(
    () => validateClientSide(trimmedDraft),
    [trimmedDraft],
  );

  const path = pathFor(accountType);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://binectics.com";
  const previewUrl = `${origin}${path}${trimmedDraft || "your-name-here"}`;
  const liveUrl = savedSlug ? `${origin}${path}${savedSlug}` : null;

  const isDirty = trimmedDraft !== (savedSlug ?? "");
  const canSave = isDirty && !clientError && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setServerError(null);
    const res = await marketplaceService.updateMyListingSlug(
      listingId,
      trimmedDraft,
    );
    setIsSaving(false);
    if (!res.success) {
      setServerError(
        res.message ?? "Couldn't update your URL. Please try again.",
      );
      return;
    }
    const next = res.data?.slug ?? trimmedDraft;
    setSavedSlug(next);
    setDraft(next);
    onSaved?.(next);
  }

  async function handleCopy() {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  return (
    <div className="rounded-xl border-2 border-neutral-200 bg-white p-5">
      <div className="mb-3">
        <label
          htmlFor={`slug-${listingId}`}
          className="block text-sm font-semibold text-foreground"
        >
          Public URL
        </label>
        <p className="mt-1 text-xs text-foreground/60">
          This is the link people see and share. Keep it short and memorable.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 items-stretch overflow-hidden rounded-lg border-2 border-neutral-300 bg-white focus-within:border-primary-500">
          <span className="flex shrink-0 items-center bg-neutral-50 px-3 text-sm text-foreground/60">
            binectics.com{path}
          </span>
          <input
            id={`slug-${listingId}`}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(slugifyForTyping(e.target.value))}
            className="w-full px-3 py-2.5 text-sm text-foreground focus:outline-none"
            placeholder="your-name-here"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-foreground/40"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving" : "Save URL"}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {clientError && isDirty ? (
          <p className="text-xs text-red-600">{clientError}</p>
        ) : (
          <p className="text-xs text-foreground/60">
            Preview:{" "}
            <span className="font-mono text-foreground/80">{previewUrl}</span>
          </p>
        )}
        {serverError ? (
          <p className="text-xs text-red-600">{serverError}</p>
        ) : null}
      </div>

      {liveUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-neutral-50 p-3">
          <span className="text-xs font-medium text-foreground/60">Live:</span>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-accent-blue-600 hover:underline"
          >
            {liveUrl.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-foreground/70 hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
