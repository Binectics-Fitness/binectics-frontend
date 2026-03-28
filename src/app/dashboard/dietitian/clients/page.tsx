"use client";

import { useEffect, useState, useCallback } from "react";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { progressService } from "@/lib/api/progress";
import { UserRole } from "@/lib/types";
import { formatLocal } from "@/utils/format";
import type {
  ClientProfile,
  ProgressSummary,
  AddClientRequest,
  ClientRequestItem,
  ClientInvitation,
  ClientJournalEntry,
  CreateClientJournalEntryRequest,
} from "@/lib/api/progress";
import { ClientJournalMood } from "@/lib/api/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addClientSchema,
  createJournalSchema,
  type AddClientFormData,
  type CreateJournalFormData,
} from "@/lib/schemas/progress";

// ─── Helpers ───────────────────────────────────────────────────────

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Client";
}

function clientEmail(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") return profile.client_id.email;
  return "";
}

function formatDate(iso: string) {
  return formatLocal(iso, "MMM d, yyyy");
}

// ─── Page ──────────────────────────────────────────────────────────

export default function DietitianClientsPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ProgressSummary>>(
    {},
  );
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [sentRequests, setSentRequests] = useState<ClientRequestItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // selected client detail
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [journalEntries, setJournalEntries] = useState<
    Record<string, ClientJournalEntry[]>
  >({});
  const [journalSubmitting, setJournalSubmitting] = useState(false);

  const {
    register: registerAddClient,
    handleSubmit: handleAddClientSubmit,
    reset: resetAddClient,
    formState: { errors: addClientErrors },
  } = useForm<AddClientFormData>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      email: "",
      first_name: "",
      message: "",
      notes: "",
      starting_weight_kg: "",
      target_weight_kg: "",
      height_cm: "",
      goals: "",
    },
  });

  const {
    register: registerJournal,
    handleSubmit: handleJournalSubmit,
    reset: resetJournal,
    formState: { errors: journalErrors },
  } = useForm<CreateJournalFormData>({
    resolver: zodResolver(createJournalSchema),
    defaultValues: {
      notes: "",
      mood: "",
      weight_kg: "",
      adherence_score: "",
    },
  });

  // ─── load client profiles ─────────────────────────────────────

  const loadProfiles = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const res = currentOrg
        ? await progressService.getOrgClientProfiles(currentOrg._id)
        : await progressService.getMyClientProfiles();

      if (res.success && res.data) {
        setProfiles(res.data);
        // Load summaries for each client (latest 30 day snapshot)
        const summaryMap: Record<string, ProgressSummary> = {};
        await Promise.all(
          res.data.map(async (p) => {
            try {
              const s = await progressService.getProgressSummary(p._id, 30);
              if (s.success && s.data) summaryMap[p._id] = s.data;
            } catch {
              // non-critical
            }
          }),
        );
        setSummaries(summaryMap);
      } else {
        setError("Could not load clients.");
      }
    } catch {
      setError("Could not load clients.");
    } finally {
      setLoadingData(false);
    }
  }, [currentOrg]);

  const loadInvitations = useCallback(async () => {
    try {
      const res = await progressService.getMyClientInvitations(currentOrg?._id);
      if (res.success && res.data) setInvitations(res.data);
    } catch {
      // non-critical
    }
    try {
      const res = currentOrg
        ? await progressService.getOrgSentClientRequests(currentOrg._id)
        : await progressService.getSentClientRequests();
      if (res.success && res.data) setSentRequests(res.data);
    } catch {
      // non-critical
    }
  }, [currentOrg]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadProfiles();
    loadInvitations();
  }, [isAuthorized, orgLoading, loadProfiles, loadInvitations]);

  // ─── form handlers ────────────────────────────────────────────

  async function handleAddClient(data: AddClientFormData) {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    const payload: AddClientRequest = {
      email: data.email,
      first_name: data.first_name || undefined,
      message: data.message || undefined,
      notes: data.notes || undefined,
      starting_weight_kg: data.starting_weight_kg
        ? Number(data.starting_weight_kg)
        : undefined,
      target_weight_kg: data.target_weight_kg
        ? Number(data.target_weight_kg)
        : undefined,
      height_cm: data.height_cm ? Number(data.height_cm) : undefined,
      goals: data.goals
        ? data.goals
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : undefined,
    };
    const res = currentOrg
      ? await progressService.addClientInOrg(currentOrg._id, payload)
      : await progressService.addClient(payload);
    setSubmitting(false);
    if (res.success && res.data) {
      setShowAddModal(false);
      resetAddClient();
      setSuccessMessage(res.data.message);
      loadProfiles();
      loadInvitations();
    } else {
      setError(res.message || "Failed to add client.");
    }
  }

  async function handleCancelRequest(requestId: string) {
    try {
      await progressService.cancelClientRequest(requestId);
      loadInvitations();
    } catch {
      setError("Failed to cancel request.");
    }
  }

  // ─── guards ───────────────────────────────────────────────────

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized || !user) return null;

  // ─── selected client detail view ──────────────────────────────

  const selectedProfile = profiles.find((p) => p._id === selectedProfileId);
  const selectedSummary = selectedProfileId
    ? summaries[selectedProfileId]
    : null;
  const selectedJournals = selectedProfileId
    ? (journalEntries[selectedProfileId] ?? [])
    : [];

  const loadJournals = useCallback(async (profileId: string) => {
    try {
      const res = await progressService.getClientJournalEntries(profileId, 20);
      if (res.success && res.data) {
        const entries = res.data ?? [];
        setJournalEntries((prev) => ({ ...prev, [profileId]: entries }));
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!selectedProfileId) return;
    loadJournals(selectedProfileId);
  }, [selectedProfileId, loadJournals]);

  async function handleCreateJournal(data: CreateJournalFormData) {
    if (!selectedProfileId) return;

    setJournalSubmitting(true);
    setError(null);

    const payload: CreateClientJournalEntryRequest = {
      notes: data.notes,
      mood: (data.mood as ClientJournalMood) || undefined,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
      adherence_score: data.adherence_score
        ? Number(data.adherence_score)
        : undefined,
    };

    try {
      const res = await progressService.createClientJournalEntry(
        selectedProfileId,
        payload,
      );
      if (res.success && res.data) {
        const newEntry = res.data;
        setJournalEntries((prev) => ({
          ...prev,
          [selectedProfileId]: [newEntry, ...(prev[selectedProfileId] ?? [])],
        }));
        resetJournal();
      } else {
        setError(res.message || "Failed to add journal entry.");
      }
    } catch {
      setError("Failed to add journal entry.");
    } finally {
      setJournalSubmitting(false);
    }
  }

  async function handleDeleteJournal(entryId: string) {
    if (!selectedProfileId) return;
    try {
      await progressService.deleteClientJournalEntry(entryId);
      setJournalEntries((prev) => ({
        ...prev,
        [selectedProfileId]: (prev[selectedProfileId] ?? []).filter(
          (e) => e._id !== entryId,
        ),
      }));
    } catch {
      setError("Failed to delete journal entry.");
    }
  }

  // ─── render ───────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              My Clients
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Manage client profiles and track their progress.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-accent-purple-500 px-3 sm:px-4 py-2 text-sm font-semibold text-white hover:bg-accent-purple-600 whitespace-nowrap"
          >
            + Add Client
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-500 hover:text-green-700"
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingData && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-purple-500 border-r-transparent" />
          </div>
        )}

        {/* ── Client Detail View ──────────────────────────── */}
        {selectedProfile && selectedSummary && !loadingData && (
          <div className="mb-8">
            <button
              onClick={() => setSelectedProfileId(null)}
              className="mb-4 flex items-center gap-1 text-sm font-medium text-accent-purple-600 hover:text-accent-purple-700"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to all clients
            </button>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {clientName(selectedProfile)}
                  </h2>
                  <p className="text-sm text-foreground-secondary">
                    {clientEmail(selectedProfile)}
                  </p>
                  {selectedProfile.goals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedProfile.goals.map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-accent-purple-100 px-2 py-0.5 text-xs font-medium text-accent-purple-700"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedProfile.is_active ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {selectedProfile.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Summary stats */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat
                  label="Current Weight"
                  value={
                    selectedSummary.weight.latest_kg != null
                      ? `${selectedSummary.weight.latest_kg} kg`
                      : "—"
                  }
                />
                <MiniStat
                  label="Weight Change"
                  value={
                    selectedSummary.weight.change_kg != null
                      ? `${selectedSummary.weight.change_kg > 0 ? "+" : ""}${selectedSummary.weight.change_kg.toFixed(1)} kg`
                      : "—"
                  }
                />
                <MiniStat
                  label="Activities (30d)"
                  value={String(selectedSummary.activities.total_count)}
                />
                <MiniStat
                  label="Meals Logged (30d)"
                  value={String(selectedSummary.meals.total_count)}
                />
              </div>

              {selectedProfile.notes && (
                <div className="mt-4 rounded-lg bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase text-foreground-tertiary">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {selectedProfile.notes}
                  </p>
                </div>
              )}

              {/* Recent weight logs */}
              {selectedSummary.weight.logs.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-foreground-secondary">
                    Recent Weight Logs
                  </h3>
                  <div className="space-y-2">
                    {selectedSummary.weight.logs.slice(0, 5).map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {log.weight_kg} kg
                        </span>
                        <span className="text-sm text-foreground-tertiary">
                          {formatDate(log.recorded_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activities */}
              {selectedSummary.activities.reports.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-foreground-secondary">
                    Recent Activities
                  </h3>
                  <div className="space-y-2">
                    {selectedSummary.activities.reports.slice(0, 5).map((a) => (
                      <div
                        key={a._id}
                        className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2"
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {a.title}
                          </span>
                          <span className="ml-2 text-sm text-foreground-tertiary">
                            {a.duration_minutes} min
                          </span>
                        </div>
                        <span className="text-sm text-foreground-tertiary">
                          {formatDate(a.performed_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client journals */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground-secondary">
                  Client Journal
                </h3>

                <form
                  onSubmit={handleJournalSubmit(handleCreateJournal)}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      {...registerJournal("mood")}
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      defaultValue=""
                    >
                      <option value="">Mood (optional)</option>
                      {Object.values(ClientJournalMood).map((mood) => (
                        <option key={mood} value={mood}>
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      {...registerJournal("weight_kg")}
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Weight (kg)"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <input
                      {...registerJournal("adherence_score")}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Adherence %"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    {...registerJournal("notes")}
                    rows={3}
                    placeholder="Write progress notes for this client..."
                    className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  {journalErrors.notes && (
                    <p className="mt-1 text-xs text-red-500">{journalErrors.notes.message}</p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={journalSubmitting}
                      className="rounded-lg bg-accent-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-purple-600 disabled:opacity-50"
                    >
                      {journalSubmitting ? "Saving..." : "Add Journal Entry"}
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-2">
                  {selectedJournals.length === 0 && (
                    <p className="text-sm text-foreground-tertiary">
                      No journal entries yet.
                    </p>
                  )}
                  {selectedJournals.map((entry) => (
                    <div
                      key={entry._id}
                      className="rounded-lg bg-neutral-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-foreground">
                            {entry.notes}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-foreground-tertiary">
                            <span>{formatDate(entry.entry_date)}</span>
                            {entry.mood && (
                              <span className="rounded-full bg-accent-purple-100 px-2 py-0.5 text-accent-purple-700">
                                {entry.mood}
                              </span>
                            )}
                            {entry.weight_kg != null && (
                              <span>Weight: {entry.weight_kg} kg</span>
                            )}
                            {entry.adherence_score != null && (
                              <span>Adherence: {entry.adherence_score}%</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteJournal(entry._id)}
                          className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Client Cards ────────────────────────────────── */}
        {!selectedProfileId && !loadingData && (
          <>
            {profiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg
                  className="mb-4 h-16 w-16 text-neutral-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-foreground">
                  No Clients Yet
                </h2>
                <p className="mt-2 max-w-md text-foreground-secondary">
                  Add your first client or send an invite link so they can sign
                  up on Binectics.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-6 rounded-lg bg-accent-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-purple-600"
                >
                  + Add Client
                </button>
              </div>
            )}

            {profiles.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((p) => {
                  const s = summaries[p._id];
                  return (
                    <button
                      key={p._id}
                      onClick={() => setSelectedProfileId(p._id)}
                      className="rounded-2xl bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-purple-100">
                            <svg
                              className="h-5 w-5 text-accent-purple-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {clientName(p)}
                            </h3>
                            <p className="text-sm text-foreground-tertiary">
                              {clientEmail(p)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {s && (
                        <div className="mt-4 grid grid-cols-1 gap-2 text-center sm:grid-cols-3 sm:gap-4">
                          <div>
                            <p className="text-sm text-foreground-tertiary">
                              Weight
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {s.weight.latest_kg ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-tertiary">
                              Activities
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {s.activities.total_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-tertiary">
                              Meals
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {s.meals.total_count}
                            </p>
                          </div>
                        </div>
                      )}

                      {p.goals.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {p.goals.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="rounded-full bg-accent-purple-50 px-2 py-0.5 text-xs text-accent-purple-600"
                            >
                              {g}
                            </span>
                          ))}
                          {p.goals.length > 3 && (
                            <span className="text-xs text-foreground-tertiary">
                              +{p.goals.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sent connection requests */}
            {sentRequests.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-foreground">
                  Sent Connection Requests
                </h2>
                <div className="space-y-3">
                  {sentRequests.map((req) => {
                    const clientInfo =
                      typeof req.client_id === "object" ? req.client_id : null;
                    return (
                      <div
                        key={req._id}
                        className="flex flex-col gap-3 rounded-xl bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {clientInfo
                              ? `${clientInfo.first_name} ${clientInfo.last_name}`
                              : "Client"}
                          </p>
                          <p className="text-sm text-foreground-tertiary">
                            {clientInfo?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              req.status === "PENDING"
                                ? "bg-accent-yellow-100 text-accent-yellow-700"
                                : req.status === "ACCEPTED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {req.status}
                          </span>
                          {req.status === "PENDING" && (
                            <button
                              onClick={() => handleCancelRequest(req._id)}
                              className="text-sm font-medium text-red-500 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending invitations (signup invites) */}
            {invitations.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-foreground">
                  Pending Signup Invitations
                </h2>
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv._id || inv.id || inv.email}
                      className="flex flex-col gap-3 rounded-xl bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {inv.email}
                        </p>
                        <p className="text-sm text-foreground-tertiary">
                          Expires {formatDate(inv.expires_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent-yellow-100 px-2.5 py-0.5 text-xs font-medium text-accent-yellow-700">
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Add Client Modal ──────────────────────────────── */}
      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)} title="Add Client">
          <form onSubmit={handleAddClientSubmit(handleAddClient)} className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              Enter the client&apos;s email. If they have a Binectics account, a
              connection request will be sent for their approval. Otherwise,
              they&apos;ll receive a signup invitation.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Email Address *
              </span>
              <input
                {...registerAddClient("email")}
                type="email"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="client@example.com"
              />
              {addClientErrors.email && (
                <p className="mt-1 text-xs text-red-500">{addClientErrors.email.message}</p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                First Name
              </span>
              <input
                {...registerAddClient("first_name")}
                type="text"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Message
              </span>
              <textarea
                {...registerAddClient("message")}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Optional message to the client"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Starting Weight (kg)
                </span>
                <input
                  {...registerAddClient("starting_weight_kg")}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Target Weight (kg)
                </span>
                <input
                  {...registerAddClient("target_weight_kg")}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Height (cm)
              </span>
              <input
                {...registerAddClient("height_cm")}
                type="number"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Goals</span>
              <input
                {...registerAddClient("goals")}
                type="text"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Comma-separated, e.g. Lose weight, Build muscle"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <textarea
                {...registerAddClient("notes")}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Any notes about this client"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent-purple-500 py-2.5 text-sm font-semibold text-white hover:bg-accent-purple-600 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Add Client"}
            </button>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─── Mini Stat ──────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-3">
      <p className="text-sm text-foreground-tertiary">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Modal Overlay ──────────────────────────────────────────────────

function ModalOverlay({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-foreground-tertiary hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
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
        {children}
      </div>
    </div>
  );
}
