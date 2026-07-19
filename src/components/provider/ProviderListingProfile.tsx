"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { authService } from "@/lib/api/auth";
import {
  useMyListing,
  useUpdateMyListing,
  usePublishMyListing,
  useCreateMyListing,
  useOrgListing,
  useUpdateOrgListing,
  usePublishOrgListing,
  useCreateOrgListing,
} from "@/lib/queries/marketplace";
import { useCountries } from "@/lib/queries/utility";
import SearchableSelect from "@/components/SearchableSelect";
import type {
  CreateListingRequest,
  UpdateListingRequest,
} from "@/lib/api/marketplace";
import type { MarketplaceListing, MarketplaceAccountType } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { ChipEditor } from "@/components/ds";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-10 rounded-(--r-2) px-3.5 text-[14px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

// ─────────────────────────────────────────────────────────────────────────
// Form model: the listing fields these pages edit, plus the account
// identity fields (saved through a separate endpoint on the same button).
// ─────────────────────────────────────────────────────────────────────────
interface ListingForm {
  headline: string;
  bio: string;
  city: string;
  country_code: string;
  languages: string[];
  specialties: string[];
  certifications: string[];
  accepting_clients: boolean;
}

interface AccountForm {
  first_name: string;
  last_name: string;
  phone_number: string;
}

function roleToAccountType(role?: UserRole): MarketplaceAccountType {
  switch (role) {
    case UserRole.GYM_OWNER:
      return "gym_owner";
    case UserRole.DIETITIAN:
      return "dietitian";
    default:
      return "personal_trainer";
  }
}

function seedListing(l: MarketplaceListing): ListingForm {
  return {
    headline: l.headline ?? "",
    bio: l.bio ?? "",
    city: l.city ?? "",
    country_code: l.country_code ?? "",
    languages: l.languages ?? [],
    specialties: l.specialties ?? [],
    certifications: l.certifications ?? [],
    accepting_clients: l.accepting_clients ?? true,
  };
}

function diffListing(base: ListingForm, next: ListingForm): UpdateListingRequest {
  const out: UpdateListingRequest = {};
  (Object.keys(next) as (keyof ListingForm)[]).forEach((k) => {
    const changed = Array.isArray(next[k])
      ? JSON.stringify(base[k]) !== JSON.stringify(next[k])
      : base[k] !== next[k];
    if (changed) (out as Record<string, unknown>)[k] = next[k];
  });
  return out;
}

/**
 * Shared marketplace-profile editor for provider roles. For gym owners the
 * listing is org-scoped (GET/PATCH /marketplace/organizations/:id/listing);
 * for solo trainers/dietitians it is the caller's own listing
 * (/marketplace/my-listing). Both flows load → edit diffs → publish, and both
 * can create a listing when none exists yet. Rendered by /dashboard/profile-edit
 * and the trainer/dietitian profile routes.
 */
export function ProviderListingProfile() {
  const { user, updateUser } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const isGym = user?.role === UserRole.GYM_OWNER;
  const orgId = currentOrg?._id;

  // Role-aware data source. Only one query runs; the other is disabled.
  const orgListing = useOrgListing(orgId, isGym);
  const myListing = useMyListing(!isGym);
  const listing = (isGym ? orgListing.data : myListing.data) ?? null;
  const listingLoading = isGym ? orgListing.isLoading : myListing.isLoading;
  const isLoading = listingLoading || (isGym && orgLoading);

  // Role-aware mutations.
  const updateSolo = useUpdateMyListing();
  const publishSolo = usePublishMyListing();
  const createSolo = useCreateMyListing();
  const updateOrg = useUpdateOrgListing(orgId);
  const publishOrg = usePublishOrgListing(orgId);
  const createOrg = useCreateOrgListing(orgId);

  const publishBusy = isGym ? publishOrg.isPending : publishSolo.isPending;
  const createBusy = isGym ? createOrg.isPending : createSolo.isPending;

  const { data: countries = [] } = useCountries();

  const [seededId, setSeededId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ListingForm | null>(null);
  const [form, setForm] = useState<ListingForm | null>(null);
  const [accountBase, setAccountBase] = useState<AccountForm | null>(null);
  const [account, setAccount] = useState<AccountForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed on first arrival of the listing (render-time adjustment pattern).
  if (listing && listing._id !== seededId) {
    const seeded = seedListing(listing);
    setSeededId(listing._id);
    setBaseline(seeded);
    setForm(seeded);
  }
  if (user && account === null) {
    const seeded: AccountForm = {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? "",
    };
    setAccountBase(seeded);
    setAccount(seeded);
  }

  const listingPayload = baseline && form ? diffListing(baseline, form) : {};
  const accountDirty =
    accountBase && account
      ? JSON.stringify(accountBase) !== JSON.stringify(account)
      : false;
  const dirty = Object.keys(listingPayload).length > 0 || accountDirty;

  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const setAcc = <K extends keyof AccountForm>(k: K, v: AccountForm[K]) =>
    setAccount((a) => (a ? { ...a, [k]: v } : a));

  const onSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    let ok = true;
    if (Object.keys(listingPayload).length > 0 && form) {
      const res = isGym
        ? await updateOrg.mutateAsync(listingPayload)
        : await updateSolo.mutateAsync(listingPayload);
      if (res.success) setBaseline(form);
      else {
        ok = false;
        setError(res.message || "Couldn't save your profile.");
      }
    }
    if (accountDirty && account) {
      const res = await authService.updateProfile({ ...account });
      if (res.success && res.data) {
        setAccountBase(account);
        updateUser(res.data);
      } else {
        ok = false;
        setError(res.message || "Couldn't save your account details.");
      }
    }
    setSaving(false);
    if (ok) {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  const onTogglePublish = async () => {
    if (!listing) return;
    const res = isGym
      ? await publishOrg.mutateAsync(!listing.is_published)
      : await publishSolo.mutateAsync(!listing.is_published);
    if (!res.success) setError(res.message || "Couldn't change publish state.");
  };

  const onCreate = async (payload: CreateListingRequest) => {
    setError(null);
    const res = isGym
      ? await createOrg.mutateAsync(payload)
      : await createSolo.mutateAsync(payload);
    if (!res.success) {
      setError(res.message || "Couldn't create your listing.");
    }
  };

  const hasListing = !!listing;
  // A gym owner needs their org resolved before we can create/edit its listing.
  const orgReady = !isGym || !!orgId;
  const moreLinks = isGym
    ? [
        { href: "/dashboard/gym-owner/plans", label: "Plans & pricing →" },
        { href: "/dashboard/gym-owner/locations", label: "Locations →" },
        { href: "/dashboard/gym-owner/settings", label: "Settings →" },
      ]
    : [
        { href: "/dashboard/trainer/plans", label: "Packages & pricing →" },
        { href: "/dashboard/consultations", label: "Availability →" },
        { href: "/dashboard/settings", label: "Payouts & settings →" },
      ];

  return (
    <div className="flex flex-col gap-4 max-w-[760px]">
      {/* Save / publish bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] flex items-center gap-1.5" style={{ color: "var(--fg-3)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dirty ? "var(--warn, var(--fg-3))" : "var(--signal)" }} />
          {saving ? "Saving…" : dirty ? "Unsaved changes" : savedFlash ? "Saved" : "All changes saved"}
        </span>
        <div className="flex items-center gap-2">
          {dirty && (
            <button className="btn-primary-v2 sm" disabled={saving} onClick={() => void onSave()}>Save changes</button>
          )}
          {hasListing && (
            <button className="btn-ghost-v2 sm" disabled={publishBusy} onClick={() => void onTogglePublish()}>
              {publishBusy ? "…" : listing?.is_published ? "Unpublish" : "Publish"}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>{error}</p>}

      {/* Account — always editable, listing or not */}
      <Card title="Account" desc="Your name and contact number — used across Binectics, not just the marketplace.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Field label="First name" value={account?.first_name ?? ""} onChange={(v) => setAcc("first_name", v)} disabled={!account} />
          <Field label="Last name" value={account?.last_name ?? ""} onChange={(v) => setAcc("last_name", v)} disabled={!account} />
          <Field label="Phone number" value={account?.phone_number ?? ""} onChange={(v) => setAcc("phone_number", v)} disabled={!account} />
        </div>
      </Card>

      {/* No listing yet → create it (role-aware: org listing for gyms, solo otherwise) */}
      {!isLoading && !hasListing && orgReady && (
        <CreateListingCard
          isGym={isGym}
          accountType={roleToAccountType(user?.role)}
          countries={countries}
          creating={createBusy}
          onCreate={onCreate}
        />
      )}

      {/* Gym owner whose org context hasn't resolved yet */}
      {!isLoading && !hasListing && !orgReady && (
        <div className="p-6 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            Select an organization to manage its marketplace listing.
          </p>
        </div>
      )}

      {hasListing && (
      <>
      {/* Basics */}
      <Card title="Basics" desc="How you appear in search and on your profile card.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Field label="City" value={form?.city ?? ""} onChange={(v) => set("city", v)} disabled={!form} />
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Country</label>
            <SearchableSelect
              value={form?.country_code ?? ""}
              onChange={(v) => set("country_code", v)}
              options={countries.map((c) => ({ label: `${c.name} · ${c.code}`, value: c.code }))}
              placeholder="Select country…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Accepting clients</label>
            <div className="flex items-center gap-2.5 h-10">
              <button type="button" role="switch" aria-checked={form?.accepting_clients ?? true} disabled={!form}
                onClick={() => form && set("accepting_clients", !form.accepting_clients)}
                className="w-[30px] h-[18px] rounded-full relative cursor-pointer disabled:opacity-60"
                style={{ background: form?.accepting_clients ? "var(--ink)" : "var(--border-2)", border: "none", padding: 0 }}>
                <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: form?.accepting_clients ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
              </button>
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{form?.accepting_clients ? "Shown as available" : "Hidden from new clients"}</span>
            </div>
          </div>
        </div>
        <ChipEditor label="Languages" values={form?.languages ?? []} onChange={(v) => set("languages", v)} disabled={!form} placeholder="e.g. English" />
      </Card>

      {/* Bio & headline */}
      <Card title="Bio & headline" desc="Short headline for the listing card. Full bio for your profile page.">
        <Field label="Headline" value={form?.headline ?? ""} maxLength={80} onChange={(v) => set("headline", v)} disabled={!form} />
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Bio</label>
          <textarea value={form?.bio ?? ""} maxLength={1000} disabled={!form} onChange={(e) => set("bio", e.target.value)}
            className="rounded-(--r-2) px-3.5 py-3 text-[14px] resize-y" style={{ ...INPUT_STYLE, minHeight: 120 }} />
          <span className="text-[11px] self-end" style={{ color: "var(--fg-4)" }}>{form?.bio.length ?? 0} / 1000</span>
        </div>
      </Card>

      {/* Specializations */}
      <Card title="Specializations & credentials" desc="Shown as tags on your listing. Credentials appear next to your name.">
        <ChipEditor label="Specialties" values={form?.specialties ?? []} onChange={(v) => set("specialties", v)} disabled={!form} placeholder="e.g. Strength & conditioning" />
        <ChipEditor label="Certifications" values={form?.certifications ?? []} onChange={(v) => set("certifications", v)} disabled={!form} placeholder="e.g. CSCS" />
      </Card>

      {/* Where the rest lives */}
      <Card title="More profile settings" desc="These parts of your public profile are managed in their own sections.">
        <div className="flex flex-wrap gap-2">
          {moreLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost-v2 sm" style={{ textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
      </Card>
      </>
      )}

      {isLoading && <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading your profile…</p>}
    </div>
  );
}

/**
 * Create-listing form shown when the provider has no listing yet. Collects the
 * DTO's required fields (headline, bio) plus city/country, then creates via the
 * role-appropriate endpoint. On success the parent's listing query refetches and
 * this card is replaced by the full editor.
 */
function CreateListingCard({
  isGym,
  accountType,
  countries,
  creating,
  onCreate,
}: {
  isGym: boolean;
  accountType: MarketplaceAccountType;
  countries: { code: string; name: string }[];
  creating: boolean;
  onCreate: (payload: CreateListingRequest) => Promise<void>;
}) {
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = headline.trim().length > 0 && bio.trim().length > 0 && !creating;

  const submit = async () => {
    if (!headline.trim()) return setLocalError("Add a headline.");
    if (!bio.trim()) return setLocalError("Add a short bio.");
    setLocalError(null);
    await onCreate({
      account_type: accountType,
      headline: headline.trim(),
      bio: bio.trim(),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(countryCode ? { country_code: countryCode } : {}),
    });
  };

  return (
    <Card
      title={isGym ? "Create your gym listing" : "Create your marketplace listing"}
      desc={
        isGym
          ? "Publish your gym to the marketplace so members can find and subscribe. You can refine every detail after it's created."
          : "Set up your public profile so clients can find and book you. You can refine every detail after it's created."
      }
    >
      <Field label="Headline" value={headline} maxLength={200} onChange={setHeadline} />
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Bio</label>
        <textarea
          value={bio}
          maxLength={3000}
          onChange={(e) => setBio(e.target.value)}
          placeholder={isGym ? "Tell members what makes your gym worth joining." : "Tell clients how you help them."}
          className="rounded-(--r-2) px-3.5 py-3 text-[14px] resize-y"
          style={{ ...INPUT_STYLE, minHeight: 100 }}
        />
        <span className="text-[11px] self-end" style={{ color: "var(--fg-4)" }}>{bio.length} / 3000</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field label="City" value={city} onChange={setCity} />
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Country</label>
          <SearchableSelect
            value={countryCode}
            onChange={setCountryCode}
            options={countries.map((c) => ({ label: `${c.name} · ${c.code}`, value: c.code }))}
            placeholder="Select country…"
          />
        </div>
      </div>
      {localError && <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>{localError}</p>}
      <div>
        <button className="btn-primary-v2 sm" disabled={!canSubmit} onClick={() => void submit()}>
          {creating ? "Creating…" : isGym ? "Create gym listing" : "Create listing"}
        </button>
      </div>
    </Card>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{title}</h2>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>{desc}</div>
      </div>
      <div className="p-5.5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, disabled, maxLength }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; maxLength?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{label}</label>
      <input value={value} maxLength={maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
    </div>
  );
}
