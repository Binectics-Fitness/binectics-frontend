"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { teamsService, type TeamRole } from "@/lib/api/teams";
import {
  inviteMemberSchema,
  type InviteMemberFormData,
} from "@/lib/schemas/teams";

function findDefaultRoleId(roles: TeamRole[]): string {
  const trainerLikeRole = roles.find((role) => {
    const haystack = `${role.name} ${role.code}`.toLowerCase();
    return (
      haystack.includes("trainer") ||
      haystack.includes("coach") ||
      haystack.includes("instructor")
    );
  });

  return trainerLikeRole?._id ?? roles[0]?._id ?? "";
}

export default function InviteTrainerPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    formState: { errors: formErrors },
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      team_role_id: "",
    },
  });
  const formData = watch();

  useEffect(() => {
    if (authLoading || orgLoading || !isAuthorized) return;
    if (!currentOrg?._id) {
      setRoles([]);
      setIsLoading(false);
      return;
    }
    const organizationId = currentOrg._id;

    let mounted = true;

    async function loadRoles() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await teamsService.getRoles(organizationId);

        if (!mounted) return;

        if (response.success && response.data) {
          const roleData = response.data;
          setRoles(roleData);
          if (!formData.team_role_id) {
            setValue("team_role_id", findDefaultRoleId(roleData));
          }
        } else {
          setRoles([]);
          setError(response.message ?? "Failed to load team roles.");
        }
      } catch {
        if (mounted) {
          setRoles([]);
          setError("Failed to load team roles.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      mounted = false;
    };
  }, [authLoading, currentOrg?._id, isAuthorized, orgLoading]);

  const selectedRole = useMemo(
    () => roles.find((role) => role._id === formData.team_role_id) ?? null,
    [formData.team_role_id, roles],
  );

  async function onSubmit(data: InviteMemberFormData) {
    if (!currentOrg?._id) {
      setError("Select an organization before sending invitations.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await teamsService.inviteMember(currentOrg._id, data);

      if (!response.success) {
        setError(response.message ?? "Failed to send invitation.");
        return;
      }

      setSuccessMessage(
        "Invitation sent successfully. Redirecting back to staff directory...",
      );
      setTimeout(() => {
        router.push("/dashboard/gym-owner/staff");
      }, 900);
    } catch {
      setError("Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <button
            onClick={() => router.push("/dashboard/gym-owner/staff")}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-blue-500 hover:text-accent-blue-700 sm:text-base"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Staff
          </button>

          <div>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">
              Invite Staff Member
            </h1>
            <p className="mt-2 text-sm text-foreground/60">
              Send a real organization invite for{" "}
              {currentOrg?.name ?? "your gym"} using an existing team role.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              {successMessage}
            </div>
          )}

          {!currentOrg ? (
            <div className="rounded-xl bg-white p-8 shadow-card">
              <h2 className="text-xl font-bold text-foreground">
                No organization selected
              </h2>
              <p className="mt-2 text-foreground/60">
                Choose an organization first so the invitation can be linked to
                the correct team.
              </p>
            </div>
          ) : (
            <form
              onSubmit={rhfHandleSubmit(onSubmit)}
              className="rounded-xl bg-white p-4 shadow-card sm:p-6 md:p-8"
            >
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  Invitation Details
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-accent-blue-500 focus:outline-none"
                      placeholder="coach@example.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      Team Role
                    </label>
                    <select
                      {...register("team_role_id")}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-accent-blue-500 focus:outline-none"
                      disabled={roles.length === 0}
                    >
                      {roles.length === 0 ? (
                        <option value="">No roles available</option>
                      ) : (
                        roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-8 rounded-lg border-2 border-accent-blue-200 bg-accent-blue-50 p-4 sm:p-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
                  <svg
                    className="h-5 w-5 text-accent-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Role Preview
                </h3>
                <div className="mt-4 space-y-2 text-sm text-foreground/80">
                  <p>
                    The invite will assign{" "}
                    <strong>{selectedRole?.name ?? "the selected role"}</strong>
                    .
                  </p>
                  <p>
                    Role code: <strong>{selectedRole?.code ?? "N/A"}</strong>
                  </p>
                  <p>
                    Permissions included:{" "}
                    <strong>{selectedRole?.permissions.length ?? 0}</strong>
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-lg bg-gray-50 p-6">
                <h3 className="font-bold text-foreground">
                  What this invite does
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                  <li>
                    Creates a pending organization invitation for the selected
                    email address.
                  </li>
                  <li>
                    Attaches the chosen team role so permissions are ready on
                    acceptance.
                  </li>
                  <li>
                    Shows up immediately in the staff directory under pending
                    invitations.
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/gym-owner/staff")}
                  className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-foreground hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || roles.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-blue-500 px-6 py-3 font-semibold text-white hover:bg-accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
