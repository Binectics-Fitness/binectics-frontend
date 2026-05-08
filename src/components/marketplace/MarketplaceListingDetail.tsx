"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Apple,
  Check,
  Dumbbell,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PhotoGallery from "@/components/PhotoGallery";
import RichTextDisplay from "@/components/RichTextDisplay";
import { ContactProvider } from "@/components/ContactProvider";
import ProviderReviewsSection from "@/components/ProviderReviewsSection";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { ReviewTargetType } from "@/lib/api/reviews";
import { formatPrice } from "@/lib/api/payment";
import {
  marketplaceRequestSchema,
  type MarketplaceRequestFormData,
} from "@/lib/schemas/marketplace";
import {
  MarketplaceVerificationBadge,
  MembershipPlanType,
  type MarketplaceAccountType,
  type MarketplaceListing,
  type MarketplaceMembershipPlan,
} from "@/lib/types";

// ─── Theming ───────────────────────────────────────────────────────────────

interface AccountTypeTheme {
  label: string;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
  accentChip: string;
  badgeChip: string;
  ctaLabel: string;
  sidebarTitle: string;
  facilitiesLabel: string;
  reviewTargetType: ReviewTargetType;
  reviewSectionTitle: string;
}

const THEMES: Record<MarketplaceAccountType, AccountTypeTheme> = {
  gym_owner: {
    label: "Gym",
    icon: Dumbbell,
    accentBg: "bg-accent-blue-100",
    accentText: "text-accent-blue-700",
    accentChip: "bg-accent-blue-100 text-accent-blue-700",
    badgeChip: "bg-accent-blue-50 text-accent-blue-700 ring-accent-blue-200",
    ctaLabel: "Join this gym",
    sidebarTitle: "Membership plans",
    facilitiesLabel: "Facilities",
    reviewTargetType: ReviewTargetType.GYM,
    reviewSectionTitle: "Member reviews",
  },
  personal_trainer: {
    label: "Personal Trainer",
    icon: Dumbbell,
    accentBg: "bg-accent-yellow-100",
    accentText: "text-accent-yellow-700",
    accentChip: "bg-accent-yellow-100 text-accent-yellow-700",
    badgeChip:
      "bg-accent-yellow-50 text-accent-yellow-700 ring-accent-yellow-200",
    ctaLabel: "Book this trainer",
    sidebarTitle: "Training packages",
    facilitiesLabel: "Specialties",
    reviewTargetType: ReviewTargetType.TRAINER,
    reviewSectionTitle: "Client reviews",
  },
  dietitian: {
    label: "Dietitian",
    icon: Apple,
    accentBg: "bg-accent-purple-100",
    accentText: "text-accent-purple-700",
    accentChip: "bg-accent-purple-100 text-accent-purple-700",
    badgeChip:
      "bg-accent-purple-50 text-accent-purple-700 ring-accent-purple-200",
    ctaLabel: "Work with this dietitian",
    sidebarTitle: "Nutrition programs",
    facilitiesLabel: "Specialties",
    reviewTargetType: ReviewTargetType.DIETITIAN,
    reviewSectionTitle: "Client reviews",
  },
};

// ─── Small helpers ─────────────────────────────────────────────────────────

function VerificationBadge({
  badge,
  themeChip,
}: {
  badge: MarketplaceVerificationBadge;
  themeChip: string;
}) {
  if (badge === MarketplaceVerificationBadge.NONE) return null;
  const isFeatured = badge === MarketplaceVerificationBadge.FEATURED;
  const isPremium = badge === MarketplaceVerificationBadge.PREMIUM_VERIFIED;
  const label = isFeatured
    ? "Featured"
    : isPremium
      ? "Premium verified"
      : "Verified";
  const Icon = isFeatured ? Sparkles : ShieldCheck;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${themeChip}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 text-center ring-1 ring-neutral-200">
      <div className="text-xl font-black text-foreground sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-foreground/60">{hint}</div>
      ) : null}
    </div>
  );
}

function PlanCard({
  plan,
  isSelected,
  onSelect,
  accentText,
}: {
  plan: MarketplaceMembershipPlan;
  isSelected: boolean;
  onSelect: () => void;
  accentText: string;
}) {
  const isSubscription = plan.plan_type === MembershipPlanType.SUBSCRIPTION;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        isSelected
          ? "border-foreground bg-neutral-50"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-foreground">{plan.name}</div>
          <div className="mt-0.5 text-xs text-foreground/60">
            {isSubscription
              ? `${plan.duration_days}-day plan`
              : "One-time payment"}
          </div>
        </div>
        <div className={`shrink-0 text-right font-black ${accentText}`}>
          <div className="text-lg leading-none">
            {formatPrice(plan.price, plan.currency)}
          </div>
          {isSubscription ? (
            <div className="mt-0.5 text-xs font-medium text-foreground/50">
              every {plan.duration_days}d
            </div>
          ) : null}
        </div>
      </div>
      {plan.features.length ? (
        <ul className="mt-3 space-y-1">
          {plan.features.slice(0, 3).map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-xs text-foreground/70"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────

const TAB_KEYS = ["about", "plans", "facilities", "reviews"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  about: "About",
  plans: "Plans",
  facilities: "Facilities",
  reviews: "Reviews",
};

// ─── Main component ───────────────────────────────────────────────────────

export interface MarketplaceListingDetailProps {
  listingId: string;
  /** Optional pre-resolved listing to skip the initial fetch. */
  initialListing?: MarketplaceListing | null;
  /** Path used for the back link (defaults to /marketplace). */
  backHref?: string;
  backLabel?: string;
}

export default function MarketplaceListingDetail({
  listingId,
  initialListing = null,
  backHref = "/marketplace",
  backLabel = "Back to marketplace",
}: MarketplaceListingDetailProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<MarketplaceListing | null>(
    initialListing,
  );
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(!initialListing);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [subscribeBusy, setSubscribeBusy] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);

  // Request modal
  const [showRequest, setShowRequest] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    control: requestControl,
    reset: resetRequest,
  } = useForm<MarketplaceRequestFormData>({
    resolver: zodResolver(marketplaceRequestSchema),
    defaultValues: {
      requestType: "connection",
      requestMessage: "",
      requestGoals: "",
    },
  });
  const requestType = useWatch({
    control: requestControl,
    name: "requestType",
  });

  // Fetch listing + plans
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!listingId) return;
      setIsLoading(!initialListing);
      const [listingRes, plansRes] = await Promise.all([
        initialListing
          ? Promise.resolve({ success: true, data: initialListing })
          : marketplaceService.getListingById(listingId),
        marketplaceService.getPublicListingPlans(listingId),
      ]);
      if (cancelled) return;
      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data);
      } else {
        setError("Listing not found");
      }
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.filter((p) => p.is_active && p.is_public));
      }
      setIsLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [listingId, initialListing]);

  const theme: AccountTypeTheme | null = useMemo(
    () => (listing ? THEMES[listing.account_type] : null),
    [listing],
  );

  const ownerName = useMemo(() => {
    if (!listing) return "";
    const org =
      typeof listing.organization_id === "object"
        ? listing.organization_id
        : null;
    if (org?.name) return org.name;
    const pro =
      typeof listing.professional_id === "object"
        ? listing.professional_id
        : null;
    return pro ? `${pro.first_name} ${pro.last_name}`.trim() : listing.headline;
  }, [listing]);

  const reviewOwnerUserId = useMemo(() => {
    if (!listing) return null;
    return typeof listing.professional_id === "object"
      ? listing.professional_id._id
      : listing.professional_id;
  }, [listing]);

  const locationLabel = useMemo(() => {
    if (!listing) return "";
    return [listing.city, listing.country_code?.toUpperCase()]
      .filter(Boolean)
      .join(", ");
  }, [listing]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  async function handleSubscribe() {
    if (!listing || !selectedPlanId) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(backHref)}`);
      return;
    }
    setSubscribeBusy(true);
    setSubscribeError(null);
    setSubscribeSuccess(null);
    const res = await marketplaceService.subscribeToListingPlan(
      listing._id,
      selectedPlanId,
    );
    setSubscribeBusy(false);
    if (res.success) {
      const plan = plans.find((p) => p._id === selectedPlanId);
      setSubscribeSuccess(
        `You're now subscribed to ${plan?.name ?? "this plan"}. View it in your dashboard.`,
      );
      setSelectedPlanId(null);
    } else {
      setSubscribeError(
        res.message ?? "Couldn't subscribe right now. Please try again.",
      );
    }
  }

  async function onRequestSubmit(data: MarketplaceRequestFormData) {
    if (!listing) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(backHref)}`);
      return;
    }
    setRequestBusy(true);
    setRequestError(null);
    const res = await marketplaceService.sendRequest(listing._id, {
      type: data.requestType,
      message: data.requestMessage || undefined,
      goals: data.requestGoals
        ? data.requestGoals
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : undefined,
    });
    setRequestBusy(false);
    if (res.success) {
      setRequestSuccess(true);
      resetRequest();
    } else {
      setRequestError(
        res.message ?? "Couldn't send your message. Please try again.",
      );
    }
  }

  // ─── Render guards ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !listing || !theme) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-foreground">
            Listing not found
          </h1>
          <p className="mt-2 text-foreground/60">
            The page you&apos;re looking for doesn&apos;t exist or is no longer
            available.
          </p>
          <Link
            href={backHref}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const ThemeIcon = theme.icon;
  const hasFacilitiesData = listing.facilities.length || listing.amenities.length;
  const visibleTabs: TabKey[] = TAB_KEYS.filter((t) => {
    if (t === "plans") return plans.length > 0;
    if (t === "facilities") return Boolean(hasFacilitiesData);
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Back nav */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <PhotoGallery
              photos={listing.photos}
              profileImage={listing.profile_image}
              alt={ownerName}
              FallbackIcon={ThemeIcon}
              accentBg={theme.accentBg}
            />

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${theme.accentChip}`}
                >
                  <ThemeIcon className="h-3.5 w-3.5" />
                  {theme.label}
                </span>
                <VerificationBadge
                  badge={listing.verification_badge}
                  themeChip={theme.badgeChip}
                />
                {!listing.accepting_clients ? (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-foreground/60">
                    Not accepting clients
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {ownerName}
              </h1>
              <p className="mt-2 text-base text-foreground/70">
                {listing.headline}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/60">
                {locationLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {locationLabel}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 text-accent-yellow-500" />
                  <span className="font-semibold text-foreground">
                    {listing.average_rating.toFixed(1)}
                  </span>
                  <span>· {listing.review_count} reviews</span>
                </span>
              </div>

              {/* Quick stats — useful for trainers/dietitians */}
              {listing.account_type !== "gym_owner" ? (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  <StatCard
                    label="Rating"
                    value={listing.average_rating.toFixed(1)}
                  />
                  <StatCard
                    label="Reviews"
                    value={String(listing.review_count)}
                  />
                  <StatCard
                    label="Clients"
                    value={String(listing.active_client_count)}
                  />
                </div>
              ) : null}

              <ContactProvider
                phone={listing.contact_phone}
                email={listing.contact_email}
                providerName={ownerName}
                whatsappMessage={`Hi ${ownerName.split(" ")[0]}, I found you on Binectics and would love to connect.`}
                emailSubject={`Inquiry from Binectics — ${ownerName}`}
                variant="compact"
                className="mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + Sidebar */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main column */}
          <div>
            {/* Tab nav */}
            <div className="sticky top-0 z-10 -mx-4 mb-6 overflow-x-auto border-b border-neutral-200 bg-background/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
              <nav className="flex min-w-max items-center gap-1">
                {visibleTabs.map((t) => {
                  const isActive = t === activeTab;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveTab(t)}
                      className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? "text-foreground"
                          : "text-foreground/50 hover:text-foreground/80"
                      }`}
                    >
                      {t === "facilities"
                        ? theme.facilitiesLabel
                        : TAB_LABELS[t]}
                      {isActive ? (
                        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab content */}
            {activeTab === "about" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-foreground">About</h2>
                  <div className="mt-3">
                    <RichTextDisplay html={listing.bio} />
                  </div>
                </div>

                {listing.specialties.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
                      Specialties
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {listing.specialties.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.accentChip}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {listing.certifications.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
                      Certifications
                    </h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {listing.certifications.map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-2 rounded-lg bg-white p-3 ring-1 ring-neutral-200"
                        >
                          <ShieldCheck
                            className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accentText}`}
                          />
                          <span className="text-sm text-foreground">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {listing.languages.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
                      Languages
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {listing.languages.map((l) => (
                        <span
                          key={l}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground/70"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "plans" ? (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">
                  {theme.sidebarTitle}
                </h2>
                <p className="text-sm text-foreground/60">
                  Pick a plan to get started. You can cancel anytime from your
                  dashboard.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      isSelected={selectedPlanId === plan._id}
                      onSelect={() => setSelectedPlanId(plan._id)}
                      accentText={theme.accentText}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "facilities" ? (
              <div className="space-y-6">
                {listing.facilities.length ? (
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {theme.facilitiesLabel}
                    </h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {listing.facilities.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 rounded-lg bg-white p-3 ring-1 ring-neutral-200"
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accentText}`}
                          />
                          <span className="text-sm text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {listing.amenities.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
                      Amenities
                    </h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {listing.amenities.map((a) => (
                        <li
                          key={a}
                          className="flex items-start gap-2 rounded-lg bg-neutral-50 p-3"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
                          <span className="text-sm text-foreground/80">
                            {a}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "reviews" && reviewOwnerUserId ? (
              <ProviderReviewsSection
                targetType={theme.reviewTargetType}
                targetId={listing._id}
                title={theme.reviewSectionTitle}
                accentClassName={theme.accentChip}
                providerOwnerUserId={reviewOwnerUserId}
              />
            ) : null}
          </div>

          {/* Sticky action card */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                  From
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-3xl font-black text-foreground">
                    {listing.price_from
                      ? formatPrice(listing.price_from, listing.currency)
                      : "Contact"}
                  </div>
                  {listing.price_label ? (
                    <div className="text-sm text-foreground/60">
                      / {listing.price_label}
                    </div>
                  ) : null}
                </div>
              </div>

              {plans.length ? (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      {theme.sidebarTitle}
                    </div>
                    <div className="space-y-2">
                      {plans.slice(0, 3).map((plan) => (
                        <PlanCard
                          key={plan._id}
                          plan={plan}
                          isSelected={selectedPlanId === plan._id}
                          onSelect={() => setSelectedPlanId(plan._id)}
                          accentText={theme.accentText}
                        />
                      ))}
                    </div>
                    {plans.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("plans")}
                        className="text-xs font-semibold text-accent-blue-600 hover:underline"
                      >
                        See all {plans.length} plans
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={!selectedPlanId || subscribeBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-foreground/40"
                  >
                    {subscribeBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {subscribeBusy
                      ? "Subscribing"
                      : selectedPlanId
                        ? "Subscribe"
                        : "Pick a plan"}
                  </button>
                  {subscribeError ? (
                    <p className="text-xs text-red-600">{subscribeError}</p>
                  ) : null}
                  {subscribeSuccess ? (
                    <p className="text-xs text-primary-700">
                      {subscribeSuccess}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-foreground/60">
                  No plans listed yet — reach out directly to learn more.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setRequestSuccess(false);
                  setRequestError(null);
                  setShowRequest(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-foreground/10 bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:border-foreground/30"
              >
                <MessageCircle className="h-4 w-4" />
                {theme.ctaLabel}
              </button>

              <ContactProvider
                phone={listing.contact_phone}
                email={listing.contact_email}
                providerName={ownerName}
                variant="full"
              />
            </div>

            {listing.account_type === "gym_owner" ? (
              <div
                className={`mt-4 rounded-2xl p-5 ring-1 ring-accent-blue-200 ${theme.accentBg}`}
              >
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Users className="h-4 w-4" />
                  QR check-in
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  Members scan a QR at the door to check in. Your visit history
                  shows up in the dashboard.
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground/60">From</div>
            <div className="truncate text-base font-bold text-foreground">
              {listing.price_from
                ? formatPrice(listing.price_from, listing.currency)
                : "Contact"}
              {listing.price_label ? (
                <span className="text-xs font-medium text-foreground/60">
                  {" "}
                  / {listing.price_label}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary-600"
          >
            {plans.length ? "View plans" : theme.ctaLabel}
          </button>
        </div>
      </div>

      {/* Request modal */}
      {showRequest ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowRequest(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {requestSuccess ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <Check className="h-6 w-6 text-primary-700" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-foreground">
                  Message sent
                </h3>
                <p className="mt-1 text-sm text-foreground/60">
                  {ownerName} will get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRequest(false)}
                  className="mt-5 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleRequestSubmit(onRequestSubmit)}
                className="space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {theme.ctaLabel}
                    </h3>
                    <p className="text-xs text-foreground/60">
                      Send {ownerName.split(" ")[0]} a message.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRequest(false)}
                    className="text-foreground/40 hover:text-foreground"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    What are you looking for?
                  </label>
                  <select
                    {...registerRequest("requestType")}
                    className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="connection">Start working together</option>
                    <option value="inquiry">Just have a question</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Message
                  </label>
                  <textarea
                    {...registerRequest("requestMessage")}
                    rows={4}
                    placeholder="Introduce yourself and what you're hoping to achieve…"
                    className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {requestType === "connection" ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Goals (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      {...registerRequest("requestGoals")}
                      placeholder="e.g. lose weight, build strength"
                      className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                ) : null}

                {requestError ? (
                  <p className="text-xs text-red-600">{requestError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={requestBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-3 text-sm font-bold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200"
                >
                  {requestBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {requestBusy ? "Sending" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

