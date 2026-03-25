"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

enum AdminSubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  PENDING_PAYMENT = "PENDING_PAYMENT",
}

type AdminSubscription = {
  id: number;
  user: string;
  userEmail: string;
  provider: string;
  plan: string;
  amount: string;
  status: AdminSubscriptionStatus;
  startDate: string;
  nextBilling: string;
  duration: string;
};

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  // Mock data
  const subscriptions: AdminSubscription[] = [
    {
      id: 1,
      user: "John Smith",
      userEmail: "john@example.com",
      provider: "PowerHouse Gym",
      plan: "Premium Monthly",
      amount: "$49.99",
      status: AdminSubscriptionStatus.ACTIVE,
      startDate: "2024-01-15",
      nextBilling: "2024-03-15",
      duration: "1 month",
    },
    {
      id: 2,
      user: "Sarah Johnson",
      userEmail: "sarah@example.com",
      provider: "Mike Chen - Personal Training",
      plan: "Elite Training Package",
      amount: "$199.99",
      status: AdminSubscriptionStatus.ACTIVE,
      startDate: "2024-02-01",
      nextBilling: "2024-03-01",
      duration: "1 month",
    },
    {
      id: 3,
      user: "Emily Davis",
      userEmail: "emily@example.com",
      provider: "Dr. Maria Garcia - Nutrition",
      plan: "Weight Loss Plan",
      amount: "$89.99",
      status: AdminSubscriptionStatus.CANCELLED,
      startDate: "2023-12-10",
      nextBilling: "-",
      duration: "3 months",
    },
    {
      id: 4,
      user: "Mike Wilson",
      userEmail: "mike@example.com",
      provider: "FitCore Studio",
      plan: "Annual Membership",
      amount: "$499.99",
      status: AdminSubscriptionStatus.ACTIVE,
      startDate: "2023-06-01",
      nextBilling: "2024-06-01",
      duration: "12 months",
    },
    {
      id: 5,
      user: "Lisa Anderson",
      userEmail: "lisa@example.com",
      provider: "PowerHouse Gym",
      plan: "Day Pass",
      amount: "$15.00",
      status: AdminSubscriptionStatus.EXPIRED,
      startDate: "2024-02-01",
      nextBilling: "-",
      duration: "1 day",
    },
    {
      id: 6,
      user: "David Kim",
      userEmail: "david@example.com",
      provider: "Mike Chen - Personal Training",
      plan: "Basic Training",
      amount: "$99.99",
      status: AdminSubscriptionStatus.PENDING_PAYMENT,
      startDate: "2024-02-10",
      nextBilling: "2024-03-10",
      duration: "1 month",
    },
  ];

  const getStatusBadgeColor = (status: AdminSubscriptionStatus) => {
    switch (status) {
      case AdminSubscriptionStatus.ACTIVE:
        return "bg-primary-100 text-primary-700";
      case AdminSubscriptionStatus.CANCELLED:
        return "bg-gray-100 text-gray-700";
      case AdminSubscriptionStatus.EXPIRED:
        return "bg-red-100 text-red-700";
      case AdminSubscriptionStatus.PENDING_PAYMENT:
        return "bg-accent-yellow-100 text-accent-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleCancelSubscription = (id: number, user: string) => {
    requestConfirmation({
      title: "Cancel subscription?",
      description: `Cancel ${user}'s subscription immediately? This action cannot be undone.`,
      confirmLabel: "Cancel Subscription",
      onConfirm: async () => {
        await showAlert("Subscription cancelled successfully");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <h1 className="text-3xl font-black text-foreground">
              Subscription Management
            </h1>
            <p className="mt-1 text-foreground/60">
              Monitor and manage all platform subscriptions
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Total Subscriptions
              </p>
              <p className="text-3xl font-black text-foreground mt-2">3,842</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Active</p>
              <p className="text-3xl font-black text-primary-500 mt-2">2,987</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Pending Payment
              </p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">
                156
              </p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Cancelled
              </p>
              <p className="text-3xl font-black text-gray-500 mt-2">423</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Expired</p>
              <p className="text-3xl font-black text-red-500 mt-2">276</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === "all"
                    ? "bg-red-500 text-foreground"
                    : "bg-gray-100 text-foreground/60 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === "active"
                    ? "bg-red-500 text-foreground"
                    : "bg-gray-100 text-foreground/60 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === "pending"
                    ? "bg-red-500 text-foreground"
                    : "bg-gray-100 text-foreground/60 hover:bg-gray-200"
                }`}
              >
                Pending Payment
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === "cancelled"
                    ? "bg-red-500 text-foreground"
                    : "bg-gray-100 text-foreground/60 hover:bg-gray-200"
                }`}
              >
                Cancelled
              </button>
              <button
                onClick={() => setStatusFilter("expired")}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === "expired"
                    ? "bg-red-500 text-foreground"
                    : "bg-gray-100 text-foreground/60 hover:bg-gray-200"
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="mb-6 space-y-3 md:hidden">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-gray-100 bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {sub.user}
                    </p>
                    <p className="truncate text-sm text-foreground/60">
                      {sub.userEmail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(sub.status)}`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground/60">
                      Provider & Plan
                    </p>
                    <p className="font-semibold text-foreground">{sub.plan}</p>
                    <p className="text-sm text-foreground/60">{sub.provider}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/60">Amount</p>
                    <p className="font-semibold text-foreground">
                      {sub.amount}
                    </p>
                    <p className="text-sm text-foreground/60">{sub.duration}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/60">Start Date</p>
                    <p className="text-foreground">{sub.startDate}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/60">
                      Next Billing
                    </p>
                    <p className="text-foreground">{sub.nextBilling}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button className="w-full text-left text-sm font-semibold text-red-500 hover:text-red-700 sm:w-auto">
                    View
                  </button>
                  {sub.status === AdminSubscriptionStatus.ACTIVE && (
                    <button
                      onClick={() => handleCancelSubscription(sub.id, sub.user)}
                      className="w-full text-left text-sm font-semibold text-foreground/60 hover:text-red-600 sm:w-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto bg-white shadow-card md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    User
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Provider & Plan
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Start Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Next Billing
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground lg:px-6 lg:py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-3 lg:px-6 lg:py-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {sub.user}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {sub.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 lg:px-6 lg:py-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {sub.plan}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {sub.provider}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 lg:px-6 lg:py-4">
                      <p className="font-semibold text-foreground">
                        {sub.amount}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {sub.duration}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 lg:px-6 lg:py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(sub.status)}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-foreground lg:px-6 lg:py-4">
                      {sub.startDate}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-foreground lg:px-6 lg:py-4">
                      {sub.nextBilling}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-medium lg:px-6 lg:py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-red-500 hover:text-red-700 font-semibold">
                          View
                        </button>
                        {sub.status === AdminSubscriptionStatus.ACTIVE && (
                          <button
                            onClick={() =>
                              handleCancelSubscription(sub.id, sub.user)
                            }
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground/60">
              Showing 1 to 6 of 3,842 subscriptions
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 bg-red-500 text-foreground font-semibold hover:bg-red-600">
                1
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {confirmationModal}
    </div>
  );
}
