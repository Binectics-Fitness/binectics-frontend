"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole, RecommendationCategory } from "@/lib/types";
import {
  progressService,
  ClientJournalMood,
  type MyJournalEntry,
  type Recommendation,
} from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

function getProfessionalName(entry: MyJournalEntry): string {
  if (
    typeof entry.professional_id === "object" &&
    entry.professional_id !== null
  ) {
    return `${entry.professional_id.first_name} ${entry.professional_id.last_name}`;
  }
  return "Professional";
}

function moodBadgeClass(mood?: ClientJournalMood): string {
  switch (mood) {
    case ClientJournalMood.EXCELLENT:
      return "bg-green-100 text-green-700";
    case ClientJournalMood.GOOD:
      return "bg-accent-blue-100 text-accent-blue-700";
    case ClientJournalMood.OKAY:
      return "bg-accent-yellow-100 text-accent-yellow-700";
    case ClientJournalMood.LOW:
    case ClientJournalMood.STRESSED:
      return "bg-accent-purple-100 text-accent-purple-700";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

const categoryColors: Record<string, string> = {
  [RecommendationCategory.RECOVERY]: "bg-blue-100 text-blue-700",
  [RecommendationCategory.HYDRATION]: "bg-cyan-100 text-cyan-700",
  [RecommendationCategory.NUTRITION]: "bg-green-100 text-green-700",
  [RecommendationCategory.LIFESTYLE]: "bg-yellow-100 text-yellow-700",
  [RecommendationCategory.EXERCISE]: "bg-red-100 text-red-700",
  [RecommendationCategory.GENERAL]: "bg-neutral-100 text-neutral-600",
};

export default function MyJournalsPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [entries, setEntries] = useState<MyJournalEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadJournals = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await progressService.getMyJournalEntries(20);
      if (res.success && res.data) {
        setEntries(res.data.entries);
        setNextCursor(res.data.next_cursor);
      } else {
        setError("Could not load journal entries.");
      }
    } catch {
      setError("Could not load journal entries.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await progressService.getMyJournalEntries(20, nextCursor);
      if (res.success && res.data) {
        setEntries((prev) => [...prev, ...res.data!.entries]);
        setNextCursor(res.data.next_cursor);
      }
    } catch {
      // silently swallow — existing entries stay visible
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const res = await progressService.getMyRecommendations();
      if (res.success && res.data) {
        setRecommendations(res.data);
      }
    } catch {
      setRecommendations([]);
    } finally {
      setRecsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    window.setTimeout(() => void loadJournals(), 0);
    loadRecommendations();
  }, [isAuthorized, loadJournals, loadRecommendations]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => {
      const professional = getProfessionalName(entry).toLowerCase();
      const notes = entry.notes.toLowerCase();
      return professional.includes(normalized) || notes.includes(normalized);
    });
  }, [entries, query]);

  if (isLoading || loadingData) return <DashboardLoading />;
  if (!isAuthorized || !user) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-2">
            My Journal Entries
          </h1>
          <p className="text-sm sm:text-base text-foreground-secondary">
            Read-only timeline of notes from your trainer(s) and dietitian(s).
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or professional name..."
            className="w-full md:max-w-xl rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Recommendations
          </h2>
          {recsLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl bg-white border border-neutral-200 p-6 text-center">
              <p className="text-neutral-500 text-sm">
                No recommendations from your professionals yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => {
                const proName =
                  typeof rec.professional_id === "object"
                    ? `${rec.professional_id.first_name} ${rec.professional_id.last_name}`
                    : "Professional";
                return (
                  <Link
                    key={rec._id}
                    href={`/dashboard/journals/recommendations/${rec._id}`}
                    className="block rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {rec.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          categoryColors[rec.category] ??
                          "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                      {rec.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>By {proName}</span>
                      <span>·</span>
                      <span>
                        {new Date(rec.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Journal Entries */}
        <h2 className="text-lg font-bold text-foreground mb-3">
          Journal Entries
        </h2>

        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <p className="text-foreground-secondary">
              {query.trim()
                ? "No journal entries match your search."
                : "No journal entries yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <article key={entry._id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    {getProfessionalName(entry)}
                  </span>
                  <span className="text-xs text-foreground-tertiary">•</span>
                  <span className="text-xs text-foreground-tertiary">
                    {formatLocal(entry.entry_date, "MMM d, yyyy")}
                  </span>
                  {entry.mood && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${moodBadgeClass(
                        entry.mood,
                      )}`}
                    >
                      Mood: {entry.mood}
                    </span>
                  )}
                  {entry.adherence_score != null && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      Adherence: {entry.adherence_score}%
                    </span>
                  )}
                  {entry.weight_kg != null && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      Weight: {entry.weight_kg} kg
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                  {entry.notes}
                </p>
              </article>
            ))}

            {nextCursor && !query && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
