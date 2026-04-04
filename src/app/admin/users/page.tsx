"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import SearchableSelect from "@/components/SearchableSelect";
import { UserRole } from "@/lib/types";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

enum AdminUserStatus {
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
}

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  status: AdminUserStatus;
  signupDate: string;
  subscriptions: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  // Mock data
  const users: AdminUser[] = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: UserRole.USER,
      country: "United States",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-01-15",
      subscriptions: 2,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: UserRole.USER,
      country: "United Kingdom",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-01-18",
      subscriptions: 1,
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      role: UserRole.TRAINER,
      country: "Hong Kong",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-01-20",
      subscriptions: 0,
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: UserRole.USER,
      country: "Australia",
      status: AdminUserStatus.SUSPENDED,
      signupDate: "2024-01-22",
      subscriptions: 3,
    },
    {
      id: 5,
      name: "David Kim",
      email: "david@example.com",
      role: UserRole.GYM_OWNER,
      country: "South Korea",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-01-25",
      subscriptions: 0,
    },
    {
      id: 6,
      name: "Maria Garcia",
      email: "maria@example.com",
      role: UserRole.DIETITIAN,
      country: "Spain",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-01-28",
      subscriptions: 0,
    },
    {
      id: 7,
      name: "James Wilson",
      email: "james@example.com",
      role: UserRole.USER,
      country: "Canada",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-02-01",
      subscriptions: 1,
    },
    {
      id: 8,
      name: "Lisa Anderson",
      email: "lisa@example.com",
      role: UserRole.TRAINER,
      country: "United States",
      status: AdminUserStatus.ACTIVE,
      signupDate: "2024-02-03",
      subscriptions: 0,
    },
  ];

  const handleSuspendUser = (userId: number, userName: string) => {
    requestConfirmation({
      title: "Suspend user?",
      description: `${userName} will lose access to the platform until reactivated.`,
      confirmLabel: "Suspend User",
      onConfirm: async () => {
        await showAlert("User suspended successfully");
      },
    });
  };

  const handleActivateUser = (userId: number, userName: string) => {
    requestConfirmation({
      title: "Activate user?",
      description: `${userName} will regain access to the platform.`,
      confirmLabel: "Activate User",
      confirmVariant: "primary",
      onConfirm: async () => {
        await showAlert("User activated successfully");
      },
    });
  };

  const handleViewUser = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.GYM_OWNER:
        return "bg-accent-blue-100 text-accent-blue-700";
      case UserRole.TRAINER:
        return "bg-accent-yellow-100 text-accent-yellow-700";
      case UserRole.DIETITIAN:
        return "bg-accent-purple-100 text-accent-purple-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              User Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-foreground/60">
              View and manage all platform users
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Filters */}
          <div className="bg-white p-4 sm:p-6 shadow-[var(--shadow-card)] mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Filter by Role
                </label>
                <SearchableSelect
                  value={roleFilter}
                  onChange={(val) => setRoleFilter(val as "all" | UserRole)}
                  placeholder="All Roles"
                  options={[
                    { label: "All Roles", value: "all" },
                    { label: "Users", value: UserRole.USER },
                    { label: "Gym Owners", value: UserRole.GYM_OWNER },
                    { label: "Trainers", value: UserRole.TRAINER },
                    { label: "Dietitians", value: UserRole.DIETITIAN },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-white p-4 sm:p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">
                Total Users
              </p>
              <p className="text-2xl sm:text-3xl font-black text-foreground mt-2">
                12,458
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">
                Active
              </p>
              <p className="text-2xl sm:text-3xl font-black text-primary-500 mt-2">
                11,892
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">
                Suspended
              </p>
              <p className="text-2xl sm:text-3xl font-black text-red-500 mt-2">
                566
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">
                New This Week
              </p>
              <p className="text-2xl sm:text-3xl font-black text-foreground mt-2">
                284
              </p>
            </div>
          </div>

          {/* Users Table - Desktop View */}
          <div className="hidden md:block bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Signup Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Subscriptions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-foreground">
                          {user.name}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {user.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${
                          user.status === AdminUserStatus.ACTIVE
                            ? "bg-primary-100 text-primary-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/60">
                      {user.signupDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {user.subscriptions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          View
                        </button>
                        {user.status === AdminUserStatus.ACTIVE ? (
                          <button
                            onClick={() =>
                              handleSuspendUser(user.id, user.name)
                            }
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleActivateUser(user.id, user.name)
                            }
                            className="text-primary-500 hover:text-primary-700 font-semibold"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Users Cards - Mobile View */}
          <div className="md:hidden space-y-3 mb-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white p-4 shadow-[var(--shadow-card)] rounded-lg border border-neutral-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/60 truncate">
                      {user.email}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 px-2 py-1 text-xs font-semibold whitespace-nowrap ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-foreground/60">Country: </span>
                    <span className="text-foreground font-medium">
                      {user.country}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Subscriptions: </span>
                    <span className="text-foreground font-medium">
                      {user.subscriptions}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Joined: </span>
                    <span className="text-foreground font-medium">
                      {user.signupDate}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold ${
                        user.status === AdminUserStatus.ACTIVE
                          ? "bg-primary-100 text-primary-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewUser(user.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    View
                  </button>
                  {user.status === AdminUserStatus.ACTIVE ? (
                    <button
                      onClick={() => handleSuspendUser(user.id, user.name)}
                      className="flex-1 px-3 py-2 border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateUser(user.id, user.name)}
                      className="flex-1 px-3 py-2 border border-primary-300 text-primary-600 text-xs font-semibold hover:bg-primary-50 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-foreground/60 text-center sm:text-left">
              Showing 1 to 8 of 12,458 users
            </p>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              <button className="px-3 sm:px-4 py-2 border border-neutral-200 text-foreground/60 text-sm font-semibold hover:bg-neutral-50">
                Previous
              </button>
              <button className="px-3 sm:px-4 py-2 bg-red-500 text-white text-sm font-semibold hover:bg-red-600">
                1
              </button>
              <button className="px-3 sm:px-4 py-2 border border-neutral-200 text-foreground/60 text-sm font-semibold hover:bg-neutral-50">
                2
              </button>
              <button className="px-3 sm:px-4 py-2 border border-neutral-200 text-foreground/60 text-sm font-semibold hover:bg-neutral-50">
                3
              </button>
              <button className="px-3 sm:px-4 py-2 border border-neutral-200 text-foreground/60 text-sm font-semibold hover:bg-neutral-50">
                Next
              </button>
            </div>
          </div>
          {confirmationModal}
        </div>
      </div>
    </div>
  );
}
