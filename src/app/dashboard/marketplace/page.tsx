"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLoading from "@/components/DashboardLoading";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  MarketplaceListing,
  MarketplaceAccountType,
} from "@/lib/types";

const ACCOUNT_TYPE_OPTIONS: {
  value: MarketplaceAccountType;
  label: string;
}[] = [
  { value: "gym_owner", label: "Gym" },
  { value: "personal_trainer", label: "Personal Trainer" },
  { value: "dietician", label: "Dietician" },
];

export default function MyMarketplaceListingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasListing, setHasListing] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [accountType, setAccountType] =
    useState<MarketplaceAccountType>("personal_trainer");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [certifications, setCertifications] = useState("");
  const [languages, setLanguages] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [acceptingClients, setAcceptingClients] = useState(true);

  const populateForm = (l: MarketplaceListing) => {
    setAccountType(l.account_type);
    setHeadline(l.headline);
    setBio(l.bio);
    setSpecialties(l.specialties.join(", "));
    setCertifications(l.certifications.join(", "));
    setLanguages(l.languages.join(", "));
    setCity(l.city || "");
    setCountryCode(l.country_code || "");
    setCurrency(l.currency || "USD");
    setPriceFrom(l.price_from != null ? String(l.price_from) : "");
    setPriceLabel(l.price_label || "");
    setAcceptingClients(l.accepting_clients);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function loadListing() {
      const res = await marketplaceService.getMyListing();
      if (res.success && res.data) {
        setListing(res.data);
        setHasListing(true);
        populateForm(res.data);
      } else {
        setHasListing(false);
      }
      setIsLoading(false);
    }
    loadListing();
  }, [authLoading, user, router]);

  const splitComma = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    const res = await marketplaceService.createMyListing({
      account_type: accountType,
      headline,
      bio,
      specialties: splitComma(specialties),
      certifications: splitComma(certifications),
      languages: splitComma(languages),
      city: city || undefined,
      country_code: countryCode || undefined,
      currency,
      price_from: priceFrom ? Number(priceFrom) : undefined,
      price_label: priceLabel || undefined,
      accepting_clients: acceptingClients,
    });

    if (res.success && res.data) {
      setListing(res.data);
      setHasListing(true);
      setIsEditing(false);
      setSuccessMessage("Listing created! You can now publish it.");
    } else {
      setFormError(res.message || "Failed to create listing");
    }
    setIsSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    const res = await marketplaceService.updateMyListing({
      headline,
      bio,
      specialties: splitComma(specialties),
      certifications: splitComma(certifications),
      languages: splitComma(languages),
      city: city || undefined,
      country_code: countryCode || undefined,
      currency,
      price_from: priceFrom ? Number(priceFrom) : undefined,
      price_label: priceLabel || undefined,
      accepting_clients: acceptingClients,
    });

    if (res.success && res.data) {
      setListing(res.data);
      setIsEditing(false);
      setSuccessMessage("Listing updated successfully.");
    } else {
      setFormError(res.message || "Failed to update listing");
    }
    setIsSaving(false);
  };

  const handleTogglePublish = async () => {
    if (!listing) return;
    setIsPublishing(true);

    const res = listing.is_published
      ? await marketplaceService.unpublishMyListing()
      : await marketplaceService.publishMyListing();

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage(
        res.data.is_published
          ? "Listing published! It's now visible in the marketplace."
          : "Listing unpublished.",
      );
    }
    setIsPublishing(false);
  };

  if (authLoading || isLoading) return <DashboardLoading />;

  return (
    <div className="flex-1 overflow-y-auto bg-background-secondary">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              Marketplace Listing
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Manage your public profile in the Binectics marketplace
            </p>
          </div>
          {hasListing && !isEditing && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/marketplace/requests"
                className="rounded-xl border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
              >
                View Requests
              </Link>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl border-2 border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-600 hover:text-green-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* No Listing — Create Form */}
        {!hasListing && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Create Your Marketplace Listing
            </h2>
            <p className="text-sm text-foreground-secondary mb-6">
              Set up your public profile so potential clients can find and
              connect with you.
            </p>
            <ListingForm
              isCreate
              accountType={accountType}
              setAccountType={setAccountType}
              headline={headline}
              setHeadline={setHeadline}
              bio={bio}
              setBio={setBio}
              specialties={specialties}
              setSpecialties={setSpecialties}
              certifications={certifications}
              setCertifications={setCertifications}
              languages={languages}
              setLanguages={setLanguages}
              city={city}
              setCity={setCity}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              currency={currency}
              setCurrency={setCurrency}
              priceFrom={priceFrom}
              setPriceFrom={setPriceFrom}
              priceLabel={priceLabel}
              setPriceLabel={setPriceLabel}
              acceptingClients={acceptingClients}
              setAcceptingClients={setAcceptingClients}
              onSubmit={handleCreate}
              isSaving={isSaving}
              formError={formError}
              onCancel={undefined}
            />
          </div>
        )}

        {/* Has Listing — View or Edit */}
        {hasListing && listing && !isEditing && (
          <div className="space-y-6">
            {/* Status Bar */}
            <div className="rounded-2xl bg-white p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-3 w-3 rounded-full ${listing.is_published ? "bg-green-500" : "bg-neutral-400"}`}
                />
                <span className="text-sm font-medium text-foreground">
                  {listing.is_published ? "Published" : "Draft"}
                </span>
                {listing.is_published && (
                  <Link
                    href={`/marketplace/${listing._id}`}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View public page →
                  </Link>
                )}
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  listing.is_published
                    ? "border-2 border-neutral-300 text-foreground hover:border-red-300 hover:text-red-600"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                {isPublishing
                  ? "..."
                  : listing.is_published
                    ? "Unpublish"
                    : "Publish"}
              </button>
            </div>

            {/* Listing Preview */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card">
              <h2 className="text-2xl font-black text-foreground mb-1">
                {listing.headline}
              </h2>
              <p className="text-foreground-secondary mb-4 whitespace-pre-line">
                {listing.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {listing.specialties.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {listing.specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.certifications.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {listing.certifications.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-foreground-secondary"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-background-secondary p-4">
                <div>
                  <p className="text-xs text-foreground-secondary">Location</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.city || "—"}
                    {listing.country_code
                      ? `, ${listing.country_code.toUpperCase()}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">
                    Starting Price
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.price_from != null
                      ? `${listing.currency} ${listing.price_from}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Rating</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.review_count > 0
                      ? `${listing.average_rating.toFixed(1)} (${listing.review_count})`
                      : "No reviews"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Clients</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.active_client_count} active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editing */}
        {hasListing && isEditing && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Edit Listing
            </h2>
            <ListingForm
              isCreate={false}
              accountType={accountType}
              setAccountType={setAccountType}
              headline={headline}
              setHeadline={setHeadline}
              bio={bio}
              setBio={setBio}
              specialties={specialties}
              setSpecialties={setSpecialties}
              certifications={certifications}
              setCertifications={setCertifications}
              languages={languages}
              setLanguages={setLanguages}
              city={city}
              setCity={setCity}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              currency={currency}
              setCurrency={setCurrency}
              priceFrom={priceFrom}
              setPriceFrom={setPriceFrom}
              priceLabel={priceLabel}
              setPriceLabel={setPriceLabel}
              acceptingClients={acceptingClients}
              setAcceptingClients={setAcceptingClients}
              onSubmit={handleUpdate}
              isSaving={isSaving}
              formError={formError}
              onCancel={() => {
                setIsEditing(false);
                if (listing) populateForm(listing);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Form Component ───

interface ListingFormProps {
  isCreate: boolean;
  accountType: MarketplaceAccountType;
  setAccountType: (v: MarketplaceAccountType) => void;
  headline: string;
  setHeadline: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  specialties: string;
  setSpecialties: (v: string) => void;
  certifications: string;
  setCertifications: (v: string) => void;
  languages: string;
  setLanguages: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  priceFrom: string;
  setPriceFrom: (v: string) => void;
  priceLabel: string;
  setPriceLabel: (v: string) => void;
  acceptingClients: boolean;
  setAcceptingClients: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  formError: string;
  onCancel: (() => void) | undefined;
}

function ListingForm({
  isCreate,
  accountType,
  setAccountType,
  headline,
  setHeadline,
  bio,
  setBio,
  specialties,
  setSpecialties,
  certifications,
  setCertifications,
  languages,
  setLanguages,
  city,
  setCity,
  countryCode,
  setCountryCode,
  currency,
  setCurrency,
  priceFrom,
  setPriceFrom,
  priceLabel,
  setPriceLabel,
  acceptingClients,
  setAcceptingClients,
  onSubmit,
  isSaving,
  formError,
  onCancel,
}: ListingFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {isCreate && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Professional Type *
          </label>
          <select
            value={accountType}
            onChange={(e) =>
              setAccountType(e.target.value as MarketplaceAccountType)
            }
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
          >
            {ACCOUNT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Headline *
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
          placeholder="e.g. Certified Personal Trainer Specializing in Weight Loss"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Bio *
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
          maxLength={3000}
          rows={4}
          className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none resize-none"
          placeholder="Tell potential clients about yourself, your approach, and experience..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Specialties
          </label>
          <input
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="Weight Loss, HIIT, Yoga"
          />
          <p className="text-xs text-foreground-secondary mt-1">
            Comma-separated
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Certifications
          </label>
          <input
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="ACE, NASM, ISSA"
          />
          <p className="text-xs text-foreground-secondary mt-1">
            Comma-separated
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Languages
        </label>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
          placeholder="English, Spanish"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="London"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Country Code
          </label>
          <input
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            maxLength={10}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="GB"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="NGN">NGN</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Starting Price
          </label>
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            min={0}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Price Label
          </label>
          <input
            type="text"
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
            maxLength={50}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="session"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={acceptingClients}
            onChange={(e) => setAcceptingClients(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-neutral-300 peer-checked:bg-primary-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm font-medium text-foreground">
          Accepting new clients
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {isSaving
            ? "Saving..."
            : isCreate
              ? "Create Listing"
              : "Save Changes"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border-2 border-neutral-300 px-6 py-2.5 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
