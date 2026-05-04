"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

import { marketplaceService } from "@/lib/api/marketplace";
import type {
  FeaturedListingItem,
  FeaturedListingsResult,
} from "@/lib/api/marketplace";
import { useCountries } from "@/lib/queries/utility";
import SearchableSelect from "@/components/SearchableSelect";

const STORAGE_KEY = "binectics:pricing-country";

const CATEGORY_META: Record<
  "gym_owner" | "personal_trainer" | "dietitian",
  { title: string; subtitle: string; browseHref: string; emptyCta: string }
> = {
  gym_owner: {
    title: "Top Gyms",
    subtitle: "Verified gyms welcoming new members",
    browseHref: "/gyms",
    emptyCta: "Be one of the first gyms here",
  },
  personal_trainer: {
    title: "Top Trainers",
    subtitle: "Personal trainers taking on new clients",
    browseHref: "/trainers",
    emptyCta: "Be one of the first trainers here",
  },
  dietitian: {
    title: "Top Dietitians",
    subtitle: "Dietitians available for online consultations",
    browseHref: "/dietitians",
    emptyCta: "Be one of the first dietitians here",
  },
};

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount}`;
  }
}

function planCadenceLabel(durationDays: number, planType: string): string {
  if (planType === "one_time") return "one-time";
  if (durationDays >= 350) return "/year";
  if (durationDays >= 80) return "/quarter";
  if (durationDays >= 25) return "/month";
  if (durationDays >= 6) return "/week";
  return `/${durationDays}d`;
}

function ratingStars(rating: number): string {
  const r = Math.max(0, Math.min(5, rating));
  return r > 0 ? r.toFixed(1) : "New";
}

function ProviderCard({
  item,
  accent,
  detailHref,
}: {
  item: FeaturedListingItem;
  accent: "primary" | "blue" | "purple";
  detailHref: string;
}) {
  const { listing, plan } = item;
  const accentBg =
    accent === "primary"
      ? "bg-primary-500 hover:bg-primary-600"
      : accent === "blue"
        ? "bg-accent-blue-500 hover:bg-accent-blue-600"
        : "bg-accent-purple-500 hover:bg-accent-purple-600";
  const ringAccent =
    accent === "primary"
      ? "ring-primary-100"
      : accent === "blue"
        ? "ring-accent-blue-100"
        : "ring-accent-purple-100";

  const photo =
    listing.profile_image ||
    (Array.isArray(listing.photos) ? listing.photos[0] : undefined);
  const verified =
    listing.verification_badge && listing.verification_badge !== "none";

  return (
    <article
      className={`flex h-full flex-col rounded-2xl bg-background p-6 shadow-[var(--shadow-card)] ring-1 ${ringAccent} transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]`}
    >
      <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-neutral-100">
        {photo ? (
          <Image
            src={photo}
            alt={listing.headline}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground-tertiary text-sm">
            No photo yet
          </div>
        )}
        {verified && (
          <span className="absolute left-3 top-3 rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-white">
            ✓ Verified
          </span>
        )}
      </div>

      <h3 className="font-display text-xl font-black text-foreground line-clamp-1">
        {listing.headline}
      </h3>
      <p className="mt-1 text-sm text-foreground-secondary">
        {[listing.city, listing.country_code].filter(Boolean).join(", ") ||
          "Location TBA"}
      </p>

      <div className="mt-2 flex items-center gap-2 text-sm text-foreground-secondary">
        <span aria-hidden>★</span>
        <span className="font-semibold text-foreground">
          {ratingStars(listing.average_rating ?? 0)}
        </span>
        {listing.review_count ? (
          <span>· {listing.review_count} reviews</span>
        ) : (
          <span>· No reviews yet</span>
        )}
      </div>

      {Array.isArray(listing.specialties) && listing.specialties.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {listing.specialties.slice(0, 3).map((s) => (
            <li
              key={s}
              className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-foreground-secondary"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-neutral-200 p-4">
        {plan ? (
          <>
            <p className="text-xs uppercase tracking-wide text-foreground-tertiary">
              {plan.name}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">
                {formatPrice(plan.price, plan.currency)}
              </span>
              <span className="text-sm text-foreground-secondary">
                {planCadenceLabel(plan.duration_days, plan.plan_type)}
              </span>
            </div>
            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {plan.features.slice(0, 3).map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground-secondary"
                  >
                    <span aria-hidden className="mt-0.5 text-primary-500">
                      ✓
                    </span>
                    <span className="line-clamp-1">{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-foreground-tertiary">
              Custom pricing
            </p>
            <p className="mt-1 text-sm text-foreground-secondary">
              Contact this provider for plan details.
            </p>
          </>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Link
          href={detailHref}
          className={`flex h-11 items-center justify-center rounded-lg ${accentBg} text-sm font-semibold text-white transition-colors duration-200`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-background p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 h-40 w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-100" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
      <div className="mt-5 h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="mt-5 h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
    </div>
  );
}

function CategorySection({
  data,
  category,
  loading,
  accent,
}: {
  data: FeaturedListingItem[] | undefined;
  category: keyof typeof CATEGORY_META;
  loading: boolean;
  accent: "primary" | "blue" | "purple";
}) {
  const meta = CATEGORY_META[category];
  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              {meta.title}
            </h2>
            <p className="mt-1 text-foreground-secondary">{meta.subtitle}</p>
          </div>
          <Link
            href={meta.browseHref}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Browse all →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <ProviderCard
                key={item.listing._id}
                item={item}
                accent={accent}
                detailHref={`/marketplace/${item.listing._id}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-background p-10 text-center shadow-[var(--shadow-card)]">
            <p className="text-foreground-secondary">{meta.emptyCta}.</p>
            <Link
              href="/register"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Apply as a provider
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function PricingPage() {
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setCountry(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (country) window.localStorage.setItem(STORAGE_KEY, country);
  }, [country]);

  const { data: countries } = useCountries();

  const featuredQuery = useQuery<FeaturedListingsResult | null>({
    queryKey: ["pricing", "featured", country || "global"],
    queryFn: async () => {
      const res = await marketplaceService.getFeatured({
        country: country || undefined,
        limit: 3,
      });
      return res.success && res.data ? res.data : null;
    },
    staleTime: 5 * 60_000,
  });

  const featured = featuredQuery.data;
  const isLoading = featuredQuery.isLoading;

  const categoriesData = useMemo(() => featured?.categories, [featured]);

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Real plans. Real providers.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground-secondary sm:text-xl">
            Browse what gyms, trainers, and dietitians on Binectics are offering
            today. Subscribe directly — pay them in your local currency. Joining
            Binectics is free for members.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="text-sm font-semibold text-foreground-secondary">
              Show providers in
            </span>
            <div className="min-w-[240px]">
              <SearchableSelect
                value={country}
                onChange={setCountry}
                placeholder="Anywhere (global)"
                options={[
                  { label: "Anywhere (global)", value: "" },
                  ...(countries ?? []).map((c) => ({
                    label: c.name,
                    value: c.code,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Top providers per category */}
      <div className="bg-neutral-100">
        <CategorySection
          data={categoriesData?.gym_owner}
          category="gym_owner"
          loading={isLoading}
          accent="primary"
        />
        <CategorySection
          data={categoriesData?.personal_trainer}
          category="personal_trainer"
          loading={isLoading}
          accent="blue"
        />
        <CategorySection
          data={categoriesData?.dietitian}
          category="dietitian"
          loading={isLoading}
          accent="purple"
        />
      </div>

      {/* How pricing works */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            How pricing works
          </h2>
          <ul className="mt-8 space-y-5">
            {[
              {
                title: "Free for members",
                body: "Create an account, browse, and subscribe. We don't charge members a platform fee.",
              },
              {
                title: "Pay providers directly",
                body: "Checkout in your local currency via Stripe, Flutterwave, or Paystack. Every plan shows the exact price you'll pay.",
              },
              {
                title: "Providers set their own prices",
                body: "From single sessions to monthly memberships. No surprise add-ons.",
              },
              {
                title: "Cancel anytime",
                body: "Subscriptions stay active until the end of the billing period — no long-term contracts.",
              },
            ].map((row) => (
              <li
                key={row.title}
                className="flex items-start gap-3 rounded-xl bg-neutral-100 p-4"
              >
                <span
                  aria-hidden
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white"
                >
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-foreground">{row.title}</p>
                  <p className="mt-0.5 text-sm text-foreground-secondary">
                    {row.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Provider banner */}
      <section className="bg-foreground py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
          <div>
            <h2 className="font-display text-2xl font-black text-background sm:text-3xl">
              Run a gym, training practice, or nutrition clinic?
            </h2>
            <p className="mt-2 text-background/80">
              List your plans on Binectics and reach members across 50+
              countries.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Apply as a provider
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "Is Binectics free for members?",
                a: "Yes — always. You can search providers, view plans, and message providers without paying a platform fee.",
              },
              {
                q: "How do I pay a provider?",
                a: "Checkout is processed by Stripe, Flutterwave, or Paystack depending on your country. You're charged the price shown on the plan.",
              },
              {
                q: "Can I cancel a subscription?",
                a: "Yes. Cancel any time from your dashboard — access continues until the end of your current billing period.",
              },
              {
                q: "Do you verify providers?",
                a: "Yes. Verified providers complete an identity and credentials check. Look for the ✓ Verified badge on cards.",
              },
              {
                q: "What countries do you support?",
                a: "50+ countries with currency-aware checkout. Use the country selector above to filter providers near you.",
              },
            ].map((row) => (
              <details
                key={row.q}
                className="group rounded-xl bg-background p-5 shadow-[var(--shadow-card)]"
              >
                <summary className="cursor-pointer list-none font-semibold text-foreground">
                  {row.q}
                  <span
                    aria-hidden
                    className="float-right text-foreground-tertiary group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-foreground-secondary">
                  {row.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-500 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Ready to find your next gym, trainer, or dietitian?
          </h2>
          <p className="mt-3 text-foreground-secondary">
            Free to join. Cancel any subscription anytime.
          </p>
          <div className="mt-8">
            <Link
              href="/register/user"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
