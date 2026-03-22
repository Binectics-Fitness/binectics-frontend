"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { UserRole } from "@/lib/types";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

enum ProviderStatus {
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
}

type AdminProvider = {
  id: number;
  name: string;
  email: string;
  type: UserRole;
  location: string;
  verified: boolean;
  members: number;
  revenue: string;
  joinedDate: string;
  status: ProviderStatus;
};

export default function AdminProvidersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | UserRole>("all");
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  // Mock data
  const providers: AdminProvider[] = [
    {
      id: 1,
      name: "PowerHouse Gym",
      email: "contact@powerhousegym.com",
      type: UserRole.GYM_OWNER,
      location: "Los Angeles, USA",
      verified: true,
      members: 342,
      revenue: "$12,450",
      joinedDate: "2023-06-15",
      status: ProviderStatus.ACTIVE,
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike@trainer.com",
      type: UserRole.TRAINER,
      location: "Hong Kong",
      verified: true,
      members: 28,
      revenue: "$3,200",
      joinedDate: "2023-08-20",
      status: ProviderStatus.ACTIVE,
    },
    {
      id: 3,
      name: "Dr. Maria Garcia",
      email: "maria@nutrition.com",
      type: UserRole.DIETITIAN,
      location: "Barcelona, Spain",
      verified: true,
      members: 45,
      revenue: "$5,600",
      joinedDate: "2023-09-10",
      status: ProviderStatus.ACTIVE,
    },
    {
      id: 4,
      name: "FitCore Studio",
      email: "info@fitcore.uk",
      type: UserRole.GYM_OWNER,
      location: "London, UK",
      verified: true,
      members: 289,
      revenue: "$9,870",
      joinedDate: "2023-07-22",
      status: ProviderStatus.ACTIVE,
    },
    {
      id: 5,
      name: "Sarah Johnson",
      email: "sarah@personaltraining.com",
      type: UserRole.TRAINER,
      location: "Sydney, Australia",
      verified: false,
      members: 12,
      revenue: "$1,400",
      joinedDate: "2024-01-05",
      status: ProviderStatus.ACTIVE,
    },
    {
      id: 6,
      name: "Elite Fitness Center",
      email: "contact@elitefitness.com",
      type: UserRole.GYM_OWNER,
      location: "Dubai, UAE",
      verified: true,
      members: 456,
      revenue: "$18,900",
      joinedDate: "2023-05-10",
      status: ProviderStatus.SUSPENDED,
    },
  ];

  const handleViewProvider = (id: number) => {
    router.push(`/admin/providers/${id}`);
  };

  const handleSuspendProvider = (id: number, name: string) => {
    requestConfirmation({
      title: "Suspend provider?",
      description: `${name}'s services will be temporarily unavailable.`,
      confirmLabel: "Suspend Provider",
      onConfirm: async () => {
        await showAlert("Provider suspended successfully");
      },
    });
  };

  const handleActivateProvider = (id: number, name: string) => {
    requestConfirmation({
      title: "Activate provider?",
      description: `${name} will become available in the platform again.`,
      confirmLabel: "Activate Provider",
      confirmVariant: "primary",
      onConfirm: async () => {
        await showAlert("Provider activated successfully");
      },
    });
  };

  const getTypeBadgeColor = (type: UserRole) => {
    switch (type) {
      case UserRole.GYM_OWNER:
        return "bg-accent-blue-100 text-accent-blue-700";
      case UserRole.TRAINER:
        return "bg-accent-yellow-100 text-accent-yellow-700";
      case UserRole.DIETITIAN:
        return "bg-accent-purple-100 text-accent-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Provider Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-foreground/60">
              Manage gyms, trainers, and dietitians
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-white p-4 sm:p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-blue-100">
                  <svg
                    className="w-5 h-5 text-accent-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Gyms</p>
                  <p className="text-2xl font-black text-foreground">342</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-yellow-100">
                  <svg
                    className="w-5 h-5 text-accent-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  <p className="text-xs sm:text-sm font-medium text-foreground/60">
                    Trainers
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    289
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-purple-100">
                  <svg
                    className="w-5 h-5 text-accent-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/60">
                    Dietitians
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    216
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground/60">
                    Verified
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    789
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 sm:p-6 shadow-card mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Search Providers
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or location..."
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Filter by Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | UserRole)
                  }
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Types</option>
                  <option value={UserRole.GYM_OWNER}>Gyms</option>
                  <option value={UserRole.TRAINER}>Trainers</option>
                  <option value={UserRole.DIETITIAN}>Dietitians</option>
                </select>
              </div>
            </div>
          </div>

          {/* Providers Table - Desktop View */}
          <div className="hidden md:block bg-white shadow-card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {provider.name}
                          </p>
                          {provider.verified && (
                            <span className="text-primary-500" title="Verified">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/60">
                          {provider.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${getTypeBadgeColor(provider.type)}`}
                      >
                        {provider.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {provider.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {provider.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {provider.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${
                          provider.status === ProviderStatus.ACTIVE
                            ? "bg-primary-100 text-primary-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProvider(provider.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          View
                        </button>
                        {provider.status === ProviderStatus.ACTIVE ? (
                          <button
                            onClick={() =>
                              handleSuspendProvider(provider.id, provider.name)
                            }
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleActivateProvider(provider.id, provider.name)
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

          {/* Providers Cards - Mobile View */}
          <div className="md:hidden space-y-3 mb-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white p-4 shadow-card rounded-lg border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {provider.name}
                      </p>
                      {provider.verified && (
                        <span
                          className="text-primary-500 shrink-0"
                          title="Verified"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/60 truncate">
                      {provider.email}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 px-2 py-1 text-xs font-semibold whitespace-nowrap ${getTypeBadgeColor(provider.type)}`}
                  >
                    {provider.type.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-foreground/60">Location: </span>
                    <span className="text-foreground font-medium">
                      {provider.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Members: </span>
                    <span className="text-foreground font-medium">
                      {provider.members}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Revenue: </span>
                    <span className="text-foreground font-medium">
                      {provider.revenue}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold ${
                        provider.status === ProviderStatus.ACTIVE
                          ? "bg-primary-100 text-primary-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {provider.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProvider(provider.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    View
                  </button>
                  {provider.status === ProviderStatus.ACTIVE ? (
                    <button
                      onClick={() =>
                        handleSuspendProvider(provider.id, provider.name)
                      }
                      className="flex-1 px-3 py-2 border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleActivateProvider(provider.id, provider.name)
                      }
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
              Showing 1 to 6 of 847 providers
            </p>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              <button className="px-3 sm:px-4 py-2 border border-gray-200 text-foreground/60 text-sm font-semibold hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 sm:px-4 py-2 bg-red-500 text-white text-sm font-semibold hover:bg-red-600">
                1
              </button>
              <button className="px-3 sm:px-4 py-2 border border-gray-200 text-foreground/60 text-sm font-semibold hover:bg-gray-50">
                2
              </button>
              <button className="px-3 sm:px-4 py-2 border border-gray-200 text-foreground/60 text-sm font-semibold hover:bg-gray-50">
                3
              </button>
              <button className="px-3 sm:px-4 py-2 border border-gray-200 text-foreground/60 text-sm font-semibold hover:bg-gray-50">
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
