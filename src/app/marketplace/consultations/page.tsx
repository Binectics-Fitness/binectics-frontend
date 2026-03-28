"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CardSkeleton } from "@/components/CardSkeleton";
import {
  consultationsService,
  ConsultationProviderRole,
  type ConsultationType,
} from "@/lib/api/consultations";

const roleLabels: Record<ConsultationProviderRole, string> = {
  [ConsultationProviderRole.DIETITIAN]: "Dietitian",
  [ConsultationProviderRole.PERSONAL_TRAINER]: "Personal Trainer",
  [ConsultationProviderRole.OTHER]: "Other",
};

const roleColors: Record<ConsultationProviderRole, string> = {
  [ConsultationProviderRole.DIETITIAN]:
    "bg-accent-purple-100 text-accent-purple-700",
  [ConsultationProviderRole.PERSONAL_TRAINER]:
    "bg-accent-yellow-100 text-accent-yellow-700",
  [ConsultationProviderRole.OTHER]: "bg-neutral-100 text-foreground-secondary",
};

const roleBrowseLinks: Record<ConsultationProviderRole, string> = {
  [ConsultationProviderRole.DIETITIAN]: "/search?type=dietitian",
  [ConsultationProviderRole.PERSONAL_TRAINER]: "/search?type=personal_trainer",
  [ConsultationProviderRole.OTHER]: "/search",
};

export default function ConsultationCatalogPage() {
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<
    ConsultationProviderRole | "all"
  >("all");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    const params =
      roleFilter !== "all" ? { providerRole: roleFilter } : undefined;
    const res = await consultationsService.getCatalog(params);

    if (res.success && res.data) {
      setTypes(res.data.types);
    } else {
      const fallback = await consultationsService.getTypes();
      if (fallback.success && fallback.data) {
        setTypes(fallback.data);
      }
    }
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredTypes = useMemo(() => {
    if (roleFilter === "all") return types.filter((t) => t.isActive);
    return types.filter(
      (t) => t.isActive && t.providerRole === roleFilter,
    );
  }, [types, roleFilter]);

  const groupedByRole = useMemo(() => {
    const groups = new Map<ConsultationProviderRole, ConsultationType[]>();
    for (const t of filteredTypes) {
      const existing = groups.get(t.providerRole) ?? [];
      existing.push(t);
      groups.set(t.providerRole, existing);
    }
    return groups;
  }, [filteredTypes]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="gradient-section-green px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Consultation Services
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Explore the types of consultations offered by trainers and
            dietitians on Binectics. Find the right session for your goals.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground-secondary mr-2">
            Filter by:
          </span>
          {(
            [
              { key: "all", label: "All" },
              {
                key: ConsultationProviderRole.PERSONAL_TRAINER,
                label: "Trainers",
              },
              { key: ConsultationProviderRole.DIETITIAN, label: "Dietitians" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setRoleFilter(filter.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                roleFilter === filter.key
                  ? "bg-foreground text-background"
                  : "bg-white text-foreground-secondary hover:bg-neutral-100 shadow-[var(--shadow-card)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <CardSkeleton count={6} columns="3" variant="avatar" />
        ) : filteredTypes.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-[var(--shadow-card)]">
            <svg
              className="mx-auto h-12 w-12 text-foreground-tertiary mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-semibold text-foreground mb-2">
              No consultation types available yet
            </p>
            <p className="text-sm text-foreground-secondary">
              Check back soon — providers are actively setting up their
              consultation offerings.
            </p>
          </div>
        ) : (
          <>
            {Array.from(groupedByRole.entries()).map(([role, roleTypes]) => (
              <div key={role} className="mb-10 last:mb-0">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    {roleLabels[role]} Consultations
                  </h2>
                  <Link
                    href={roleBrowseLinks[role]}
                    className="text-sm font-semibold text-accent-blue-500 hover:underline"
                  >
                    Browse {roleLabels[role]}s &rarr;
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {roleTypes.map((type) => (
                    <div
                      key={type.id}
                      className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`rounded px-2.5 py-1 text-xs font-semibold ${roleColors[type.providerRole]}`}
                        >
                          {roleLabels[type.providerRole]}
                        </span>
                        <span className="rounded bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-foreground-secondary">
                          {type.defaultDurationMinutes} min
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-foreground mb-2">
                        {type.name}
                      </h3>

                      {type.description ? (
                        <p className="text-sm text-foreground-secondary mb-4 line-clamp-3">
                          {type.description}
                        </p>
                      ) : (
                        <p className="text-sm text-foreground-tertiary italic mb-4">
                          No description provided
                        </p>
                      )}

                      <Link
                        href={roleBrowseLinks[type.providerRole]}
                        className="inline-flex items-center text-sm font-semibold text-accent-blue-500 hover:underline"
                      >
                        Find a {roleLabels[type.providerRole].toLowerCase()}{" "}
                        &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="mt-12 rounded-2xl bg-primary-500 p-8 sm:p-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-3">
                Ready to book a session?
              </h2>
              <p className="text-foreground-secondary mb-6 max-w-lg mx-auto">
                Subscribe to a provider to start booking consultation sessions
                directly from your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/search?type=personal_trainer"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
                >
                  Browse Trainers
                </Link>
                <Link
                  href="/search?type=dietitian"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
                >
                  Browse Dietitians
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
