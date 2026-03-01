"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";
import {
  teamsService,
  type Organization,
  type CreateOrganizationRequest,
  AccountType,
} from "@/lib/api/teams";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.GYM_OWNER]: "Gym Owner",
  [AccountType.PERSONAL_TRAINER]: "Personal Trainer",
  [AccountType.DIETICIAN]: "Dietician",
  [AccountType.FITNESS_MEMBER]: "Fitness Member",
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  [AccountType.GYM_OWNER]: "bg-blue-100 text-blue-700",
  [AccountType.PERSONAL_TRAINER]: "bg-yellow-100 text-yellow-700",
  [AccountType.DIETICIAN]: "bg-purple-100 text-purple-700",
  [AccountType.FITNESS_MEMBER]: "bg-green-100 text-green-700",
};

const ROLE_TO_ACCOUNT_TYPE: Record<UserRole, AccountType> = {
  GYM_OWNER: AccountType.GYM_OWNER,
  TRAINER: AccountType.PERSONAL_TRAINER,
  DIETICIAN: AccountType.DIETICIAN,
  USER: AccountType.FITNESS_MEMBER,
  ADMIN: AccountType.GYM_OWNER,
};

function getAccountType(role?: UserRole | null): AccountType {
  return role ? ROLE_TO_ACCOUNT_TYPE[role] : AccountType.FITNESS_MEMBER;
}

export default function TeamPage() {
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOrganizationRequest>({
    name: "",
    description: "",
    account_type: AccountType.FITNESS_MEMBER,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canCreateOrganization =
    organizations.length === 0 ||
    user?.role === "GYM_OWNER" ||
    user?.role === "ADMIN" ||
    organizations.some((org) => org.is_owner === true);

  useEffect(() => {
    if (!authLoading && isAuthorized) fetchOrganizations();
  }, [authLoading, isAuthorized]);

  async function fetchOrganizations() {
    setLoading(true);
    setError(null);
    try {
      const res = await teamsService.getMyOrganizations();
      if (res.success && res.data) {
        setOrganizations(res.data);
      } else {
        setError(res.message ?? "Failed to load organizations.");
      }
    } catch {
      setError("Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!canCreateOrganization) {
      setCreateError("Only organization owners can create organizations.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const payload: CreateOrganizationRequest = {
        ...createForm,
        account_type: getAccountType(user?.role),
      };
      const res = await teamsService.createOrganization(payload);
      if (res.success && res.data) {
        setOrganizations((prev) => [
          ...prev,
          {
            ...res.data!,
            is_owner: true,
            can_manage_organization: true,
            my_role_code: "owner",
          },
        ]);
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          description: "",
          account_type: AccountType.FITNESS_MEMBER,
        });
      } else {
        setCreateError(res.message ?? "Failed to create organization.");
      }
    } catch {
      setCreateError("Failed to create organization.");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground">
              Team Management
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Manage your organizations, members, and roles.
            </p>
          </div>
          {canCreateOrganization && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Organization
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg
                className="h-8 w-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No organizations yet
            </h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              Create your first organization to start managing your team.
            </p>
            {canCreateOrganization ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
              >
                Create Organization
              </button>
            ) : (
              <p className="mt-3 text-sm text-foreground-secondary">
                You were added to an organization and cannot create a new one.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Link
                key={org._id}
                href={`/dashboard/team/${org._id}`}
                className="group block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-xl font-black text-foreground">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ACCOUNT_TYPE_COLORS[org.account_type]}`}
                  >
                    {ACCOUNT_TYPE_LABELS[org.account_type]}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-bold text-foreground group-hover:text-accent-blue-500 transition-colors">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="mt-1 text-sm text-foreground-secondary line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${org.is_active ? "text-green-600" : "text-neutral-400"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${org.is_active ? "bg-green-500" : "bg-neutral-300"}`}
                    />
                    {org.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-foreground-secondary">
                    View team →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Organization Modal */}
      {showCreateModal && canCreateOrganization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 p-6">
              <h2 className="text-xl font-bold text-foreground">
                New Organization
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400"
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

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. FitZone Gym"
                  className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Short description of your organization..."
                  className="w-full resize-none rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
